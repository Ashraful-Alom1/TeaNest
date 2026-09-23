import { db, Timestamp } from '../firebaseAdmin';
import { OrderStatus, OrderDoc, TimelineEventDoc, InvoiceDoc, InvoiceItemSnapshot, BatchDoc, StockMovementDoc } from '../types';
import { computeGSTBreakdown } from '../invoices/gst';

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['ready_to_ship', 'cancelled'],
  ready_to_ship: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'failed_delivery'],
  failed_delivery: ['out_for_delivery', 'rto'],
  delivered: ['return_requested'],
  rto: ['refunded', 'return_received'],
  return_requested: ['return_approved', 'cancelled'],
  return_approved: ['return_picked'],
  return_picked: ['return_received'],
  return_received: ['refunded'],
  cancelled: [],
  refunded: [],
};

export interface TransitionOptions {
  actorUid?: string;
  source: 'system' | 'admin' | 'courier' | 'customer';
  note?: string;
  location?: string;
  metadata?: Record<string, any>;
  reason?: string;
}

/**
 * Execute order status transition with all ACID side-effects
 */
export async function transitionOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  options: TransitionOptions
): Promise<{ order: OrderDoc; eventId: string; invoiceId?: string }> {
  return await db.runTransaction(async (transaction) => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await transaction.get(orderRef);

    if (!orderDoc.exists) {
      throw new Error(`Order ${orderId} not found.`);
    }

    const order = orderDoc.data() as OrderDoc;
    const fromStatus = order.status;

    // Validate transition
    const allowed = VALID_TRANSITIONS[fromStatus] || [];
    if (!allowed.includes(toStatus) && fromStatus !== toStatus) {
      throw new Error(`Invalid order transition from '${fromStatus}' to '${toStatus}'.`);
    }

    const now = Timestamp.now();
    const updateData: Partial<OrderDoc> = {
      status: toStatus,
      updatedAt: now,
    };

    // Handle timestamps
    if (toStatus === 'confirmed') updateData.confirmedAt = now;
    if (toStatus === 'packed') updateData.packedAt = now;
    if (toStatus === 'shipped') updateData.shippedAt = now;
    if (toStatus === 'delivered') {
      updateData.deliveredAt = now;
      if (order.paymentMethod === 'cod' && order.paymentStatus === 'cod_pending') {
        updateData.paymentStatus = 'cod_collected';
      }
    }
    if (toStatus === 'cancelled') {
      updateData.cancelledAt = now;
      updateData.cancelReason = options.reason || options.note || 'Cancelled by ' + options.source;
      updateData.cancelledBy = options.actorUid || options.source;
    }

    let generatedInvoiceId: string | undefined = undefined;

    // Side Effect: PACKED -> Deduct stock (FEFO batches) & Generate GST Invoice
    if (toStatus === 'packed' && fromStatus !== 'packed') {
      // 1. Deduct stock for each item
      for (const item of order.items) {
        const variantRef = db.collection('products').doc(item.productId).collection('variants').doc(item.variantId);
        const variantDoc = await transaction.get(variantRef);
        if (variantDoc.exists) {
          const variantData = variantDoc.data() as any;
          const currentOnHand = variantData.onHand || 0;
          const currentReserved = variantData.reserved || 0;

          const newOnHand = Math.max(0, currentOnHand - item.quantity);
          const newReserved = Math.max(0, currentReserved - item.quantity);

          transaction.update(variantRef, {
            onHand: newOnHand,
            reserved: newReserved,
            updatedAt: now,
          });

          // FEFO Batch Allocation
          const batchesQuery = await db.collection('batches')
            .where('variantId', '==', item.variantId)
            .where('qtyRemaining', '>', 0)
            .orderBy('expiryDate', 'asc')
            .get();

          let remainingQtyToDeduct = item.quantity;
          for (const bDoc of batchesQuery.docs) {
            if (remainingQtyToDeduct <= 0) break;
            const bData = bDoc.data() as BatchDoc;
            const deduct = Math.min(bData.qtyRemaining, remainingQtyToDeduct);
            transaction.update(bDoc.ref, {
              qtyRemaining: bData.qtyRemaining - deduct,
            });
            remainingQtyToDeduct -= deduct;
          }

          // Write Stock Movement Ledger
          const movementRef = db.collection('stockMovements').doc();
          const movement: StockMovementDoc = {
            productId: item.productId,
            variantId: item.variantId,
            type: 'sale_out',
            quantity: -item.quantity,
            refType: 'order',
            refId: orderId,
            reason: `Dispatched order #${order.orderNumber}`,
            createdBy: options.actorUid || 'system',
            createdAt: now,
          };
          transaction.set(movementRef, movement);
        }
      }

      // 2. Generate Sequential GST Invoice
      const businessSettingsDoc = await db.collection('settings').doc('business').get();
      const business = businessSettingsDoc.exists ? businessSettingsDoc.data() as any : {
        legalName: 'Tea Nest Private Limited',
        tradeName: 'Tea Nest',
        gstin: '18AABCT1234F1Z5',
        pan: 'AABCT1234F',
        address: 'Brahmaputra Organic Valley, Dibrugarh, Assam',
        stateCode: '18',
        pincode: '786610',
        phone: '+91 88223 08551',
        email: 'billing@teanest.in',
        invoicePrefix: 'TN',
        financialYearStartMonth: 4,
      };

      const dateObj = now.toDate();
      const currentYear = dateObj.getFullYear();
      const currentMonth = dateObj.getMonth() + 1;
      const startYear = currentMonth >= 4 ? currentYear : currentYear - 1;
      const endYearShort = String(startYear + 1).slice(2);
      const fyStr = `${startYear}-${endYearShort}`;

      const counterRef = db.collection('counters').doc(`invoice_${fyStr}`);
      const counterDoc = await transaction.get(counterRef);
      const lastNumber = counterDoc.exists ? (counterDoc.data()?.last || 0) : 0;
      const nextNumber = lastNumber + 1;
      transaction.set(counterRef, { last: nextNumber }, { merge: true });

      const paddedNumber = String(nextNumber).padStart(6, '0');
      const invoiceNumber = `${business.invoicePrefix || 'TN'}/${fyStr}/${paddedNumber}`;
      const invoiceId = invoiceNumber.replace(/\//g, '-');
      generatedInvoiceId = invoiceId;

      const gstCalculation = computeGSTBreakdown(
        order.items.map((i) => ({
          variantId: i.variantId,
          sku: i.sku,
          name: `${i.productName} (${i.variantName})`,
          hsnCode: i.hsnCode || '0902',
          quantity: i.quantity,
          unitPricePaise: i.unitPricePaise,
          discountPaise: i.discountPaise,
          gstRate: i.gstRate,
        })),
        business.stateCode,
        order.shippingAddress.stateCode || '18',
        order.shippingChargePaise,
        order.discountTotalPaise
      );

      const invoiceItems: InvoiceItemSnapshot[] = gstCalculation.items.map((i) => ({
        description: i.name,
        hsnCode: i.hsnCode,
        quantity: i.quantity,
        unit: 'pack',
        ratePaise: i.unitPricePaise,
        discountPaise: i.discountPaise,
        taxableValuePaise: i.taxableValuePaise,
        gstRate: i.gstRate,
        cgstPaise: i.cgstPaise,
        sgstPaise: i.sgstPaise,
        igstPaise: i.igstPaise,
        totalPaise: i.lineTotalPaise,
      }));

      const invoiceDocData: InvoiceDoc = {
        invoiceNumber,
        financialYear: fyStr,
        orderId,
        userId: order.userId,
        invoiceDate: now,
        seller: {
          legalName: business.legalName,
          tradeName: business.tradeName,
          gstin: business.gstin,
          pan: business.pan,
          address: business.address,
          stateCode: business.stateCode,
          pincode: business.pincode,
          phone: business.phone,
          email: business.email,
        },
        buyer: {
          name: order.customer.name,
          phone: order.customer.phone,
          email: order.customer.email,
          address: `${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
          stateCode: order.shippingAddress.stateCode,
          pincode: order.shippingAddress.pincode,
        },
        placeOfSupply: gstCalculation.placeOfSupply,
        supplyType: gstCalculation.supplyType,
        items: invoiceItems,
        taxableTotalPaise: gstCalculation.taxableTotalPaise,
        cgstTotalPaise: gstCalculation.cgstTotalPaise,
        sgstTotalPaise: gstCalculation.sgstTotalPaise,
        igstTotalPaise: gstCalculation.igstTotalPaise,
        shippingTaxablePaise: gstCalculation.shippingTaxablePaise,
        roundOffPaise: gstCalculation.roundOffPaise,
        grandTotalPaise: gstCalculation.grandTotalPaise,
        amountInWords: gstCalculation.amountInWords,
        pdf: {
          publicId: `tea-nest/invoices/${invoiceId}`,
          type: 'authenticated',
          resourceType: 'raw',
        },
        status: 'issued',
        createdAt: now,
      };

      transaction.set(db.collection('invoices').doc(invoiceId), invoiceDocData);
      updateData.invoiceId = invoiceId;
      updateData.invoiceNumber = invoiceNumber;
    }

    // Side Effect: CANCELLED -> Release reserved stock or return stock if already deducted
    if (toStatus === 'cancelled' && fromStatus !== 'cancelled') {
      const wasStockDeducted = ['packed', 'ready_to_ship', 'shipped', 'out_for_delivery'].includes(fromStatus);

      for (const item of order.items) {
        const variantRef = db.collection('products').doc(item.productId).collection('variants').doc(item.variantId);
        const variantDoc = await transaction.get(variantRef);
        if (variantDoc.exists) {
          const variantData = variantDoc.data() as any;
          if (wasStockDeducted) {
            // Restore onHand
            transaction.update(variantRef, {
              onHand: (variantData.onHand || 0) + item.quantity,
              updatedAt: now,
            });
            // Write movement
            const movementRef = db.collection('stockMovements').doc();
            transaction.set(movementRef, {
              productId: item.productId,
              variantId: item.variantId,
              type: 'return_in',
              quantity: item.quantity,
              refType: 'order',
              refId: orderId,
              reason: `Stock restored from cancelled order #${order.orderNumber}`,
              createdBy: options.actorUid || 'system',
              createdAt: now,
            });
          } else {
            // Simply release reservation
            transaction.update(variantRef, {
              reserved: Math.max(0, (variantData.reserved || 0) - item.quantity),
              updatedAt: now,
            });
            const movementRef = db.collection('stockMovements').doc();
            transaction.set(movementRef, {
              productId: item.productId,
              variantId: item.variantId,
              type: 'release',
              quantity: -item.quantity,
              refType: 'order',
              refId: orderId,
              reason: `Released reservation for cancelled order #${order.orderNumber}`,
              createdBy: options.actorUid || 'system',
              createdAt: now,
            });
          }
        }
      }
    }

    // Update order document
    transaction.update(orderRef, updateData);

    // Append to Timeline
    const timelineRef = orderRef.collection('timeline').doc();
    const event: TimelineEventDoc = {
      fromStatus: fromStatus || null,
      toStatus,
      title: formatStatusTitle(toStatus),
      description: options.note || formatDefaultStatusDescription(toStatus, order),
      location: options.location,
      source: options.source,
      actorUid: options.actorUid,
      metadata: options.metadata,
      createdAt: now,
    };
    transaction.set(timelineRef, event);

    return {
      order: { ...order, ...updateData },
      eventId: timelineRef.id,
      invoiceId: generatedInvoiceId,
    };
  });
}

function formatStatusTitle(status: OrderStatus): string {
  const titles: Record<OrderStatus, string> = {
    placed: 'Order Placed',
    confirmed: 'Order Confirmed',
    processing: 'Processing',
    packed: 'Packed & Invoiced',
    ready_to_ship: 'Ready to Ship',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Order Cancelled',
    failed_delivery: 'Delivery Failed',
    rto: 'Returned to Origin (RTO)',
    return_requested: 'Return Requested',
    return_approved: 'Return Approved',
    return_picked: 'Return Picked Up',
    return_received: 'Return Received',
    refunded: 'Refunded',
  };
  return titles[status] || status.toUpperCase();
}

function formatDefaultStatusDescription(status: OrderStatus, order: OrderDoc): string {
  switch (status) {
    case 'placed':
      return `Order #${order.orderNumber} placed successfully. Stock reserved.`;
    case 'confirmed':
      return 'Payment verified and order confirmed for processing.';
    case 'processing':
      return 'Items sent to tea estate packing station.';
    case 'packed':
      return 'Order packed in fresh airtight foil and GST invoice generated.';
    case 'ready_to_ship':
      return 'AWB assigned and courier pickup scheduled.';
    case 'shipped':
      return `Package in transit via ${order.courierName || 'Courier'}${order.awb ? ' - AWB: ' + order.awb : ''}.`;
    case 'out_for_delivery':
      return 'Courier executive is out for delivery today.';
    case 'delivered':
      return 'Package delivered successfully to customer.';
    case 'cancelled':
      return 'Order has been cancelled.';
    case 'refunded':
      return 'Refund processed to original payment method.';
    default:
      return `Order status updated to ${status}.`;
  }
}
