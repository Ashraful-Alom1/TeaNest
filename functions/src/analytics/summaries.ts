import * as functions from 'firebase-functions/v2';
import { onDocumentWritten, onDocumentCreated } from 'firebase-functions/v2/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { db, FieldValue, Timestamp } from '../firebaseAdmin';
import { assertAdmin } from '../auth';
import { OrderDoc, DailySummaryDoc } from '../types';

/**
 * Background Trigger: Updates dailySummaries when an order is created or updated
 */
export const onOrderWrite = onDocumentWritten(
  { document: 'orders/{orderId}', region: 'asia-south1' },
  async (event) => {
    const before = event.data?.before?.data() as OrderDoc | undefined;
    const after = event.data?.after?.data() as OrderDoc | undefined;

    if (!after) return; // Order deleted

    const dayKey = after.dayKey || new Date().toISOString().slice(0, 10);
    const summaryRef = db.collection('dailySummaries').doc(dayKey);

    const isNewlyCreated = !before;
    const isNowConfirmed = (!before || before.status !== 'confirmed') && after.status === 'confirmed';
    const isNowDelivered = (!before || before.status !== 'delivered') && after.status === 'delivered';
    const isNowCancelled = (!before || before.status !== 'cancelled') && after.status === 'cancelled';

    const updates: Record<string, any> = {
      date: dayKey,
      updatedAt: Timestamp.now(),
    };

    if (isNewlyCreated) {
      updates.ordersPlaced = FieldValue.increment(1);
      updates.grossSalesPaise = FieldValue.increment(after.grandTotalPaise);
      updates.taxPaise = FieldValue.increment(after.taxTotalPaise);
      updates.discountsPaise = FieldValue.increment(after.discountTotalPaise);
      updates.shippingCollectedPaise = FieldValue.increment(after.shippingChargePaise);

      if (after.paymentMethod === 'online') {
        updates['byPaymentMethod.online.count'] = FieldValue.increment(1);
        updates['byPaymentMethod.online.amountPaise'] = FieldValue.increment(after.grandTotalPaise);
      } else {
        updates['byPaymentMethod.cod.count'] = FieldValue.increment(1);
        updates['byPaymentMethod.cod.amountPaise'] = FieldValue.increment(after.grandTotalPaise);
      }

      // Track by product
      for (const item of after.items) {
        updates[`byProduct.${item.variantId}.name`] = `${item.productName} (${item.variantName})`;
        updates[`byProduct.${item.variantId}.qty`] = FieldValue.increment(item.quantity);
        updates[`byProduct.${item.variantId}.revenuePaise`] = FieldValue.increment(item.lineTotalPaise);
        updates.itemsSold = FieldValue.increment(item.quantity);
      }
    }

    if (isNowConfirmed) {
      updates.ordersConfirmed = FieldValue.increment(1);
    }
    if (isNowDelivered) {
      updates.ordersDelivered = FieldValue.increment(1);
      updates.netSalesPaise = FieldValue.increment(after.grandTotalPaise);
    }
    if (isNowCancelled) {
      updates.ordersCancelled = FieldValue.increment(1);
      updates.refundsPaise = FieldValue.increment(after.grandTotalPaise);
    }

    await summaryRef.set(updates, { merge: true });
  }
);

/**
 * Background Trigger: Updates dailySummaries when an expense is recorded
 */
export const onExpenseWrite = onDocumentWritten(
  { document: 'expenses/{expenseId}', region: 'asia-south1' },
  async (event) => {
    const after = event.data?.after?.data();
    if (!after) return;

    const dayKey = after.dayKey || new Date().toISOString().slice(0, 10);
    const summaryRef = db.collection('dailySummaries').doc(dayKey);

    await summaryRef.set(
      {
        date: dayKey,
        expensesPaise: FieldValue.increment(after.amountPaise || 0),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  }
);

/**
 * Background Trigger: On timeline event creation, queue notifications to outbox
 */
export const onOrderTimelineCreated = onDocumentCreated(
  { document: 'orders/{orderId}/timeline/{eventId}', region: 'asia-south1' },
  async (event) => {
    const orderId = event.params.orderId;
    const timelineData = event.data?.data();
    if (!timelineData) return;

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) return;

    const order = orderDoc.data() as OrderDoc;

    // Create Notification Outbox entry
    const notifRef = db.collection('notifications').doc();
    await notifRef.set({
      userId: order.userId,
      channel: 'email',
      template: `order_${timelineData.toStatus}`,
      payload: {
        orderId,
        orderNumber: order.orderNumber,
        customerName: order.customer.name,
        customerEmail: order.customer.email,
        title: timelineData.title,
        description: timelineData.description,
      },
      status: 'queued',
      attempts: 0,
      createdAt: Timestamp.now(),
    });
  }
);

/**
 * Admin Rebuild Summaries from Transactions
 */
export const rebuildSummaries = functions.https.onCall(
  { region: 'asia-south1' },
  async (request) => {
    assertAdmin(request);
    const ordersSnapshot = await db.collection('orders').get();
    const summariesMap: Record<string, DailySummaryDoc> = {};

    for (const doc of ordersSnapshot.docs) {
      const order = doc.data() as OrderDoc;
      const dayKey = order.dayKey || new Date().toISOString().slice(0, 10);

      if (!summariesMap[dayKey]) {
        summariesMap[dayKey] = {
          date: dayKey,
          ordersPlaced: 0,
          ordersConfirmed: 0,
          ordersDelivered: 0,
          ordersCancelled: 0,
          itemsSold: 0,
          grossSalesPaise: 0,
          discountsPaise: 0,
          taxPaise: 0,
          netSalesPaise: 0,
          shippingCollectedPaise: 0,
          refundsPaise: 0,
          cogsPaise: 0,
          expensesPaise: 0,
          newCustomers: 0,
          byPaymentMethod: {
            online: { count: 0, amountPaise: 0 },
            cod: { count: 0, amountPaise: 0 },
          },
          byProduct: {},
          byCategory: {},
          byState: {},
          byCity: {},
          updatedAt: Timestamp.now(),
        };
      }

      const s = summariesMap[dayKey];
      s.ordersPlaced += 1;
      s.grossSalesPaise += order.grandTotalPaise || 0;
      s.taxPaise += order.taxTotalPaise || 0;
      s.discountsPaise += order.discountTotalPaise || 0;
      s.shippingCollectedPaise += order.shippingChargePaise || 0;

      if (order.status === 'confirmed') s.ordersConfirmed += 1;
      if (order.status === 'delivered') {
        s.ordersDelivered += 1;
        s.netSalesPaise += order.grandTotalPaise || 0;
      }
      if (order.status === 'cancelled') s.ordersCancelled += 1;

      for (const it of order.items || []) {
        s.itemsSold += it.quantity || 1;
        if (!s.byProduct[it.variantId]) {
          s.byProduct[it.variantId] = { name: it.productName, qty: 0, revenuePaise: 0 };
        }
        s.byProduct[it.variantId].qty += it.quantity;
        s.byProduct[it.variantId].revenuePaise += it.lineTotalPaise;
      }
    }

    // Write computed summaries in batches
    const batch = db.batch();
    for (const [dayKey, sumData] of Object.entries(summariesMap)) {
      batch.set(db.collection('dailySummaries').doc(dayKey), sumData, { merge: true });
    }
    await batch.commit();

    return { success: true, count: Object.keys(summariesMap).length };
  }
);
