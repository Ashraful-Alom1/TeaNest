import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db, Timestamp } from '../firebaseAdmin';
import { transitionOrderStatus } from '../orders/stateMachine';
import { BatchDoc, AlertDoc } from '../types';

/**
 * Releases expired stock reservations for abandoned online checkouts (runs every 15 min)
 */
export const releaseExpiredReservations = onSchedule(
  { schedule: 'every 15 minutes', region: 'asia-south1' },
  async () => {
    const now = Timestamp.now();
    const expiredOrdersSnapshot = await db.collection('orders')
      .where('status', '==', 'placed')
      .where('paymentStatus', '==', 'pending')
      .where('paymentMethod', '==', 'online')
      .where('reservationExpiresAt', '<=', now)
      .limit(50)
      .get();

    for (const doc of expiredOrdersSnapshot.docs) {
      try {
        await transitionOrderStatus(doc.id, 'cancelled', {
          source: 'system',
          reason: 'Stock reservation expired (unpaid after 15 minutes).',
        });
        console.log(`Released expired reservation for order ${doc.id}`);
      } catch (err) {
        console.error(`Failed to cancel expired order ${doc.id}:`, err);
      }
    }
  }
);

/**
 * Nightly low stock alert scanner and digest (runs every day at 8:00 AM IST)
 */
export const lowStockDigest = onSchedule(
  { schedule: '0 8 * * *', timeZone: 'Asia/Kolkata', region: 'asia-south1' },
  async () => {
    const productsSnapshot = await db.collection('products').where('isActive', '==', true).get();
    const now = Timestamp.now();

    for (const pDoc of productsSnapshot.docs) {
      const variantsSnapshot = await pDoc.ref.collection('variants').where('isActive', '==', true).get();
      for (const vDoc of variantsSnapshot.docs) {
        const v = vDoc.data();
        const available = (v.onHand || 0) - (v.reserved || 0);
        const reorderLevel = v.reorderLevel || 10;

        if (available <= reorderLevel) {
          // Check if open alert exists
          const existingAlerts = await db.collection('alerts')
            .where('variantId', '==', vDoc.id)
            .where('type', '==', 'low_stock')
            .where('status', '==', 'open')
            .get();

          if (existingAlerts.empty) {
            const alert: AlertDoc = {
              type: 'low_stock',
              variantId: vDoc.id,
              message: `Low stock alert: '${v.name}' has ${available} packs available (reorder level: ${reorderLevel}).`,
              threshold: reorderLevel,
              currentQty: available,
              status: 'open',
              severity: available <= 0 ? 'critical' : 'high',
              createdAt: now,
            };
            await db.collection('alerts').add(alert);
          }
        }
      }
    }
  }
);

/**
 * Nightly Stock Integrity Check (compares batch sum with variant onHand)
 */
export const stockIntegrityCheck = onSchedule(
  { schedule: '0 3 * * *', timeZone: 'Asia/Kolkata', region: 'asia-south1' },
  async () => {
    const batchesSnapshot = await db.collection('batches').get();
    const batchSums: Record<string, number> = {};

    for (const b of batchesSnapshot.docs) {
      const data = b.data() as BatchDoc;
      if (data.variantId) {
        batchSums[data.variantId] = (batchSums[data.variantId] || 0) + (data.qtyRemaining || 0);
      }
    }

    const productsSnapshot = await db.collection('products').get();
    for (const p of productsSnapshot.docs) {
      const variantsSnapshot = await p.ref.collection('variants').get();
      for (const v of variantsSnapshot.docs) {
        const vData = v.data();
        const batchTotal = batchSums[v.id] || 0;
        const onHand = vData.onHand || 0;

        if (batchTotal !== onHand && onHand > 0) {
          await db.collection('alerts').add({
            type: 'stock_mismatch',
            variantId: v.id,
            message: `Stock mismatch on ${vData.name}: onHand=${onHand}, sum(batches)=${batchTotal}.`,
            status: 'open',
            severity: 'medium',
            createdAt: Timestamp.now(),
          });
        }
      }
    }
  }
);
