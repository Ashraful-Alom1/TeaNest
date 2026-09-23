import * as functions from 'firebase-functions/v2';
import { HttpsError } from 'firebase-functions/v2/https';
import { db, Timestamp } from '../firebaseAdmin';
import { assertAdmin } from '../auth';
import { OrderDoc, OrderItemSnapshot, StockMovementDoc, OrderStatus } from '../types';
import { computeGSTBreakdown } from '../invoices/gst';
import { transitionOrderStatus } from './stateMachine';

export const placeOrder = functions.https.onCall(
  { region: 'asia-south1' },
  async (request) => {
    const { items, shippingAddress, billingAddress, paymentMethod, couponCode, customerNote } = request.data || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new HttpsError('invalid-argument', 'Cart cannot be empty.');
    }
    if (!shippingAddress || !shippingAddress.line1 || !shippingAddress.pincode) {
      throw new HttpsError('invalid-argument', 'Valid shipping address is required.');
    }

    const userId = request.auth?.uid || 'guest_' + Date.now();
    const customerEmail = request.auth?.token.email || shippingAddress.email || '';
    const customerName = request.auth?.token.name || shippingAddress.name || 'Customer';
    const customerPhone = shippingAddress.phone || '';

    // Transactional order creation & stock reservation
    const result = await db.runTransaction(async (transaction) => {
      // 1. Fetch live product variants and calculate server-side totals
      const validatedItems: OrderItemSnapshot[] = [];
      let calculatedSubtotal = 0;

      for (const cartItem of items) {
        const { productId, variantId, quantity } = cartItem;
        if (!productId || !variantId || !quantity || quantity <= 0) {
          throw new HttpsError('invalid-argument', 'Invalid product or quantity in cart.');
        }

        const productDocRef = db.collection('products').doc(productId);
        const variantDocRef = productDocRef.collection('variants').doc(variantId);

        const [productDoc, variantDoc] = await Promise.all([
          transaction.get(productDocRef),
          transaction.get(variantDocRef),
        ]);

        if (!productDoc.exists || !variantDoc.exists) {
          throw new HttpsError('not-found', `Product or variant not found (${productId} / ${variantId}).`);
        }

        const product = productDoc.data() as any;
        const variant = variantDoc.data() as any;

        if (variant.isDeleted || !variant.isActive || product.isDeleted || !product.isActive) {
          throw new HttpsError('failed-precondition', `Product '${product.name}' is unavailable.`);
        }

        // Check available stock: available = onHand - reserved
        const onHand = variant.onHand || 0;
        const reserved = variant.reserved || 0;
        const available = onHand - reserved;

        if (available < quantity) {
          throw new HttpsError(
            'resource-exhausted',
            `Insufficient stock for '${product.name} (${variant.name})'. Only ${available} available.`
          );
        }

        // Increment reserved quantity
        transaction.update(variantDocRef, {
          reserved: reserved + quantity,
          updatedAt: Timestamp.now(),
        });

        const unitPricePaise = variant.sellingPricePaise || variant.mrpPaise;
        const lineGross = unitPricePaise * quantity;
        calculatedSubtotal += lineGross;

        validatedItems.push({
          productId,
          variantId,
          sku: variant.sku || 'SKU-TEA',
          productName: product.name,
          variantName: variant.name,
          image: variant.images?.[0] || product.images?.[0],
          hsnCode: variant.hsnCode || product.hsnCode || '0902',
          quantity,
          unitPricePaise,
          discountPaise: 0,
          taxableValuePaise: 0,
          gstRate: variant.gstRate || product.gstRate || 5,
          cgstPaise: 0,
          sgstPaise: 0,
          igstPaise: 0,
          lineTotalPaise: lineGross,
        });
      }

      // 2. Validate Coupon if provided
      let couponDiscountPaise = 0;
      let validCouponCode: string | undefined = undefined;
      if (couponCode) {
        const couponRef = db.collection('coupons').doc(String(couponCode).toUpperCase().trim());
        const couponDoc = await transaction.get(couponRef);
        if (couponDoc.exists) {
          const cData = couponDoc.data() as any;
          if (cData.isActive && (!cData.minOrderPaise || calculatedSubtotal >= cData.minOrderPaise)) {
            validCouponCode = couponDoc.id;
            if (cData.type === 'percent') {
              couponDiscountPaise = Math.round((calculatedSubtotal * (cData.value || 0)) / 100);
              if (cData.maxDiscountPaise) couponDiscountPaise = Math.min(couponDiscountPaise, cData.maxDiscountPaise);
            } else if (cData.type === 'flat') {
              couponDiscountPaise = cData.value || 0;
            }
          }
        }
      }

      // 3. Shipping charges & Free shipping threshold
      const businessSettingsDoc = await transaction.get(db.collection('settings').doc('business'));
      const business = businessSettingsDoc.exists ? (businessSettingsDoc.data() as any) : { stateCode: '18' };
      const freeShippingThreshold = business.freeShippingThresholdPaise || 99900;
      let shippingChargePaise = calculatedSubtotal >= freeShippingThreshold ? 0 : 5000; // Rs 50 shipping
      let codFeePaise = paymentMethod === 'cod' ? (business.codFeePaise || 0) : 0;

      // 4. Compute GST Tax split
      const buyerStateCode = shippingAddress.stateCode || '18';
      const gstCalculation = computeGSTBreakdown(
        validatedItems.map((item) => ({
          variantId: item.variantId,
          sku: item.sku,
          name: `${item.productName} (${item.variantName})`,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          unitPricePaise: item.unitPricePaise,
          discountPaise: item.discountPaise,
          gstRate: item.gstRate,
        })),
        business.stateCode || '18',
        buyerStateCode,
        shippingChargePaise,
        couponDiscountPaise
      );

      // 5. Sequential Order Number from counters/orders
      const orderCounterRef = db.collection('counters').doc('orders');
      const orderCounterDoc = await transaction.get(orderCounterRef);
      const lastOrderNum = orderCounterDoc.exists ? (orderCounterDoc.data()?.last || 0) : 0;
      const nextOrderNum = lastOrderNum + 1;
      transaction.set(orderCounterRef, { last: nextOrderNum }, { merge: true });

      const orderNumber = `TN-${String(nextOrderNum).padStart(6, '0')}`;
      const orderId = `ord_${orderNumber.replace(/-/g, '_')}_${Date.now()}`;
      const now = Timestamp.now();
      const dateObj = now.toDate();
      const dayKey = dateObj.toISOString().slice(0, 10);
      const monthKey = dayKey.slice(0, 7);

      // Reservation expires in 15 mins for unpaid online orders
      const reservationExpiresAt = paymentMethod === 'online'
        ? Timestamp.fromMillis(Date.now() + 15 * 60 * 1000)
        : null;

      const orderDocData: OrderDoc = {
        orderNumber,
        userId,
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        status: 'placed',
        paymentStatus: paymentMethod === 'cod' ? 'cod_pending' : 'pending',
        paymentMethod: paymentMethod === 'cod' ? 'cod' : 'online',
        items: gstCalculation.items.map((it, idx) => ({
          ...validatedItems[idx],
          discountPaise: it.discountPaise,
          taxableValuePaise: it.taxableValuePaise,
          cgstPaise: it.cgstPaise,
          sgstPaise: it.sgstPaise,
          igstPaise: it.igstPaise,
          lineTotalPaise: it.lineTotalPaise,
        })),
        subtotalPaise: gstCalculation.subtotalPaise,
        discountTotalPaise: gstCalculation.discountTotalPaise,
        shippingChargePaise,
        codFeePaise,
        taxTotalPaise: gstCalculation.taxTotalPaise,
        grandTotalPaise: gstCalculation.grandTotalPaise + codFeePaise,
        couponCode: validCouponCode,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        placeOfSupply: gstCalculation.placeOfSupply,
        supplyType: gstCalculation.supplyType,
        customerNote,
        reservationExpiresAt,
        placedAt: now,
        dayKey,
        monthKey,
        createdAt: now,
        updatedAt: now,
      };

      const newOrderRef = db.collection('orders').doc(orderId);
      transaction.set(newOrderRef, orderDocData);

      // Initial Timeline event
      const timelineRef = newOrderRef.collection('timeline').doc();
      transaction.set(timelineRef, {
        fromStatus: null,
        toStatus: 'placed',
        title: 'Order Placed',
        description: `Order #${orderNumber} placed. Inventory reserved.`,
        source: 'customer',
        actorUid: userId,
        createdAt: now,
      });

      // Write Stock Movement Ledger for reservations
      for (const item of validatedItems) {
        const movementRef = db.collection('stockMovements').doc();
        const movement: StockMovementDoc = {
          productId: item.productId,
          variantId: item.variantId,
          type: 'reserve',
          quantity: item.quantity,
          refType: 'order',
          refId: orderId,
          reason: `Stock reserved for checkout order #${orderNumber}`,
          createdBy: userId,
          createdAt: now,
        };
        transaction.set(movementRef, movement);
      }

      return {
        orderId,
        orderNumber,
        grandTotalPaise: orderDocData.grandTotalPaise,
        paymentMethod,
      };
    });

    return result;
  }
);

export const updateOrderStatus = functions.https.onCall(
  { region: 'asia-south1' },
  async (request) => {
    assertAdmin(request);
    const { orderId, toStatus, note, location, metadata } = request.data || {};

    if (!orderId || !toStatus) {
      throw new HttpsError('invalid-argument', 'Order ID and target status are required.');
    }

    try {
      const result = await transitionOrderStatus(orderId, toStatus as OrderStatus, {
        actorUid: request.auth?.uid,
        source: 'admin',
        note,
        location,
        metadata,
      });
      return { success: true, order: result.order, invoiceId: result.invoiceId };
    } catch (err: any) {
      throw new HttpsError('internal', err.message || 'Failed to update order status.');
    }
  }
);

export const cancelOrder = functions.https.onCall(
  { region: 'asia-south1' },
  async (request) => {
    const { orderId, reason } = request.data || {};
    if (!orderId) {
      throw new HttpsError('invalid-argument', 'Order ID is required.');
    }

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new HttpsError('not-found', 'Order not found.');
    }

    const order = orderDoc.data() as OrderDoc;
    const isOwner = request.auth?.uid && request.auth.uid === order.userId;
    const isAdmin = request.auth?.token?.admin === true;

    if (!isOwner && !isAdmin) {
      throw new HttpsError('permission-denied', 'Unauthorized to cancel this order.');
    }

    // Customer cancellation rule: only allowed before packing
    if (isOwner && !isAdmin && !['placed', 'confirmed', 'processing'].includes(order.status)) {
      throw new HttpsError('failed-precondition', 'Order is already packed/shipped and cannot be cancelled directly. Please contact support.');
    }

    const result = await transitionOrderStatus(orderId, 'cancelled', {
      actorUid: request.auth?.uid,
      source: isAdmin ? 'admin' : 'customer',
      reason: reason || 'Cancelled by ' + (isAdmin ? 'Admin' : 'Customer'),
    });

    return { success: true, order: result.order };
  }
);

export const processRefund = functions.https.onCall(
  { region: 'asia-south1' },
  async (request) => {
    assertAdmin(request);
    const { orderId, amountPaise, reason } = request.data || {};

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      throw new HttpsError('not-found', 'Order not found.');
    }

    const now = Timestamp.now();
    const refundRef = db.collection('refunds').doc();
    await refundRef.set({
      orderId,
      amountPaise,
      reason,
      status: 'processed',
      method: 'gateway_refund',
      processedBy: request.auth?.uid,
      createdAt: now,
      processedAt: now,
    });

    await transitionOrderStatus(orderId, 'refunded', {
      actorUid: request.auth?.uid,
      source: 'admin',
      note: `Refund of ₹${((amountPaise || 0) / 100).toFixed(2)} processed. Reason: ${reason || 'N/A'}`,
    });

    return { success: true };
  }
);

export const approveReturn = functions.https.onCall(
  { region: 'asia-south1' },
  async (request) => {
    assertAdmin(request);
    const { orderId, approved, comment } = request.data || {};

    const targetStatus: OrderStatus = approved ? 'return_approved' : 'cancelled';
    await transitionOrderStatus(orderId, targetStatus, {
      actorUid: request.auth?.uid,
      source: 'admin',
      note: comment || (approved ? 'Return request approved by admin.' : 'Return request rejected.'),
    });

    return { success: true };
  }
);
