import * as functions from 'firebase-functions/v2';
import { HttpsError } from 'firebase-functions/v2/https';
import { db, Timestamp } from '../firebaseAdmin';
import { assertAdmin } from '../auth';
import { BatchDoc, StockMovementDoc, GoodsReceiptDoc, PurchaseOrderDoc } from '../types';

/**
 * Admin manual stock adjustments with audit trail
 */
export const adjustStock = functions.https.onCall(
  { region: 'asia-south1' },
  async (request) => {
    assertAdmin(request);
    const { productId, variantId, batchId, quantityChange, reason, note } = request.data || {};

    if (!productId || !variantId || quantityChange === undefined || quantityChange === 0) {
      throw new HttpsError('invalid-argument', 'Product ID, variant ID and non-zero quantity change are required.');
    }
    if (!reason) {
      throw new HttpsError('invalid-argument', 'Adjustment reason is required.');
    }

    const now = Timestamp.now();
    await db.runTransaction(async (transaction) => {
      const variantRef = db.collection('products').doc(productId).collection('variants').doc(variantId);
      const variantDoc = await transaction.get(variantRef);

      if (!variantDoc.exists) {
        throw new HttpsError('not-found', 'Variant not found.');
      }

      const variant = variantDoc.data() as any;
      const currentOnHand = variant.onHand || 0;
      const newOnHand = currentOnHand + quantityChange;

      if (newOnHand < 0) {
        throw new HttpsError('failed-precondition', `Cannot reduce stock below zero. Current on-hand: ${currentOnHand}`);
      }

      transaction.update(variantRef, {
        onHand: newOnHand,
        updatedAt: now,
      });

      // If batch is specified, update batch
      if (batchId) {
        const batchRef = db.collection('batches').doc(batchId);
        const batchDoc = await transaction.get(batchRef);
        if (batchDoc.exists) {
          const bData = batchDoc.data() as BatchDoc;
          transaction.update(batchRef, {
            qtyRemaining: Math.max(0, bData.qtyRemaining + quantityChange),
          });
        }
      }

      // Record in Stock Movements Ledger
      const movementRef = db.collection('stockMovements').doc();
      const movement: StockMovementDoc = {
        productId,
        variantId,
        batchId: batchId || undefined,
        type: quantityChange < 0 ? (reason.toLowerCase().includes('damage') ? 'damage' : 'adjustment') : 'adjustment',
        quantity: quantityChange,
        refType: 'adjustment',
        reason: `${reason}${note ? ': ' + note : ''}`,
        createdBy: request.auth?.uid || 'admin',
        createdAt: now,
      };
      transaction.set(movementRef, movement);

      // Low stock check
      const reorderLevel = variant.reorderLevel || 10;
      const available = newOnHand - (variant.reserved || 0);
      if (available <= reorderLevel) {
        const alertRef = db.collection('alerts').doc();
        transaction.set(alertRef, {
          type: 'low_stock',
          variantId,
          message: `Variant '${variant.name}' has low available stock: ${available} left (reorder level: ${reorderLevel}).`,
          threshold: reorderLevel,
          currentQty: available,
          status: 'open',
          severity: available <= 0 ? 'critical' : 'high',
          createdAt: now,
        });
      }
    });

    return { success: true };
  }
);

/**
 * Goods Receipt Note (GRN) intake from supplier
 */
export const receiveGoods = functions.https.onCall(
  { region: 'asia-south1' },
  async (request) => {
    assertAdmin(request);
    const { poId, supplierId, items, notes } = request.data || {};

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      throw new HttpsError('invalid-argument', 'Supplier ID and intake items list are required.');
    }

    const now = Timestamp.now();
    const grnCounterRef = db.collection('counters').doc('grn');

    const result = await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(grnCounterRef);
      const lastGrn = counterDoc.exists ? (counterDoc.data()?.last || 0) : 0;
      const nextGrn = lastGrn + 1;
      transaction.set(grnCounterRef, { last: nextGrn }, { merge: true });

      const grnNumber = `GRN-${String(nextGrn).padStart(6, '0')}`;
      const grnId = `grn_${Date.now()}`;

      for (const item of items) {
        const { productId, variantId, quantity, batchNo, expiryDate, costPricePaise } = item;
        if (!productId || !variantId || !quantity || quantity <= 0) continue;

        // 1. Create Batch
        const batchRef = db.collection('batches').doc();
        const batchDoc: BatchDoc = {
          productId,
          variantId,
          batchNo: batchNo || `BATCH-${Date.now().toString().slice(-6)}`,
          supplierId,
          grnId,
          qtyReceived: quantity,
          qtyRemaining: quantity,
          costPricePaise: costPricePaise || 0,
          expiryDate: expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null,
          receivedAt: now,
        };
        transaction.set(batchRef, batchDoc);

        // 2. Increase onHand in variant
        const variantRef = db.collection('products').doc(productId).collection('variants').doc(variantId);
        const variantDoc = await transaction.get(variantRef);
        if (variantDoc.exists) {
          const vData = variantDoc.data() as any;
          transaction.update(variantRef, {
            onHand: (vData.onHand || 0) + quantity,
            costPricePaise: costPricePaise || vData.costPricePaise || 0,
            updatedAt: now,
          });
        }

        // 3. Write Stock Movement Ledger
        const movementRef = db.collection('stockMovements').doc();
        const movement: StockMovementDoc = {
          productId,
          variantId,
          batchId: batchRef.id,
          type: 'purchase_in',
          quantity,
          refType: 'grn',
          refId: grnId,
          reason: `GRN #${grnNumber} from supplier intake`,
          createdBy: request.auth?.uid || 'admin',
          createdAt: now,
        };
        transaction.set(movementRef, movement);
      }

      // 4. Save GRN document
      const grnDocRef = db.collection('goodsReceipts').doc(grnId);
      const grnData: GoodsReceiptDoc = {
        grnNumber,
        poId: poId || undefined,
        supplierId,
        receivedDate: now,
        items,
        notes,
        createdAt: now,
      };
      transaction.set(grnDocRef, grnData);

      // If tied to a PO, update PO status
      if (poId) {
        const poRef = db.collection('purchaseOrders').doc(poId);
        transaction.update(poRef, {
          status: 'received',
          updatedAt: now,
        });
      }

      return { grnId, grnNumber };
    });

    return result;
  }
);

/**
 * Create Purchase Order
 */
export const createPurchaseOrder = functions.https.onCall(
  { region: 'asia-south1' },
  async (request) => {
    assertAdmin(request);
    const { supplierId, supplierName, items, expectedDate, notes } = request.data || {};

    if (!supplierId || !items || items.length === 0) {
      throw new HttpsError('invalid-argument', 'Supplier and items are required.');
    }

    const now = Timestamp.now();
    const poCounterRef = db.collection('counters').doc('po');

    const result = await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(poCounterRef);
      const lastPo = counterDoc.exists ? (counterDoc.data()?.last || 0) : 0;
      const nextPo = lastPo + 1;
      transaction.set(poCounterRef, { last: nextPo }, { merge: true });

      const poNumber = `PO-${String(nextPo).padStart(6, '0')}`;
      const poId = `po_${Date.now()}`;

      let subtotalPaise = 0;
      let taxTotalPaise = 0;

      const poItems = items.map((it: any) => {
        const lineTotal = it.ratePaise * it.qtyOrdered;
        const lineTax = Math.round((lineTotal * (it.gstRate || 5)) / 100);
        subtotalPaise += lineTotal;
        taxTotalPaise += lineTax;
        return {
          ...it,
          qtyReceived: 0,
          totalPaise: lineTotal + lineTax,
        };
      });

      const poDoc: PurchaseOrderDoc = {
        poNumber,
        supplierId,
        supplierName: supplierName || 'Supplier',
        status: 'draft',
        orderDate: now,
        expectedDate: expectedDate ? Timestamp.fromDate(new Date(expectedDate)) : null,
        items: poItems,
        subtotalPaise,
        taxTotalPaise,
        totalPaise: subtotalPaise + taxTotalPaise,
        notes,
        createdBy: request.auth?.uid || 'admin',
        createdAt: now,
        updatedAt: now,
      };

      transaction.set(db.collection('purchaseOrders').doc(poId), poDoc);
      return { poId, poNumber };
    });

    return result;
  }
);

/**
 * Record Supplier Payment & update outstanding balance
 */
export const recordSupplierPayment = functions.https.onCall(
  { region: 'asia-south1' },
  async (request) => {
    assertAdmin(request);
    const { supplierId, billId, amountPaise, mode, referenceNo, notes } = request.data || {};

    if (!supplierId || !amountPaise || amountPaise <= 0) {
      throw new HttpsError('invalid-argument', 'Supplier ID and positive payment amount are required.');
    }

    const now = Timestamp.now();
    await db.runTransaction(async (transaction) => {
      const supplierRef = db.collection('suppliers').doc(supplierId);
      const supplierDoc = await transaction.get(supplierRef);

      if (supplierDoc.exists) {
        const sData = supplierDoc.data() as any;
        const currentOutstanding = sData.outstandingPaise || 0;
        transaction.update(supplierRef, {
          outstandingPaise: Math.max(0, currentOutstanding - amountPaise),
          updatedAt: now,
        });
      }

      const paymentRef = db.collection('supplierPayments').doc();
      transaction.set(paymentRef, {
        supplierId,
        billId: billId || undefined,
        amountPaise,
        mode: mode || 'bank_transfer',
        referenceNo: referenceNo || '',
        notes,
        paidOn: now,
        createdBy: request.auth?.uid || 'admin',
      });
    });

    return { success: true };
  }
);
