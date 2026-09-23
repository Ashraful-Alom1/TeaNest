import { onRequest } from 'firebase-functions/v2/https';
import crypto from 'crypto';
import { db, Timestamp } from '../firebaseAdmin';
import { transitionOrderStatus } from '../orders/stateMachine';

/**
 * HTTPS Webhook for Payment Gateway (Razorpay/Cashfree)
 */
export const paymentWebhook = onRequest(
  { region: 'asia-south1' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const payload = req.body || {};
      const eventId = payload.event_id || payload.id || `evt_${Date.now()}`;

      // 1. Idempotency Check
      const webhookEventRef = db.collection('paymentWebhookEvents').doc(eventId);
      const webhookEventDoc = await webhookEventRef.get();
      if (webhookEventDoc.exists) {
        res.status(200).json({ status: 'ignored_duplicate' });
        return;
      }

      // Optional: Signature verification if secret configured
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (secret) {
        const signature = req.headers['x-razorpay-signature'] as string;
        const shasum = crypto.createHmac('sha256', secret);
        shasum.update(JSON.stringify(payload));
        const digest = shasum.digest('hex');
        if (digest !== signature) {
          res.status(400).json({ error: 'Invalid webhook signature' });
          return;
        }
      }

      const eventType = payload.event || payload.type;
      const paymentEntity = payload.payload?.payment?.entity || payload.payment || {};
      const orderId = paymentEntity.notes?.orderId || payload.order_id || payload.orderId;
      const paymentId = paymentEntity.id || payload.payment_id || `pay_${Date.now()}`;
      const amountPaise = paymentEntity.amount || payload.amount || 0;
      const method = paymentEntity.method || 'upi';

      const now = Timestamp.now();

      // Record webhook event
      await webhookEventRef.set({
        gateway: 'razorpay',
        eventType,
        payload,
        processedAt: now,
      });

      if (orderId) {
        // Record payment document
        const paymentDocRef = db.collection('payments').doc(paymentId);
        await paymentDocRef.set({
          orderId,
          gateway: 'razorpay',
          gatewayPaymentId: paymentId,
          method,
          amountPaise,
          currency: 'INR',
          status: 'paid',
          paidAt: now,
          createdAt: now,
        });

        // Update order status to confirmed
        await transitionOrderStatus(orderId, 'confirmed', {
          source: 'system',
          note: `Payment of ₹${(amountPaise / 100).toFixed(2)} received via ${method.toUpperCase()} (ID: ${paymentId}).`,
          metadata: { paymentId, method },
        });

        await db.collection('orders').doc(orderId).update({
          paymentStatus: 'paid',
          updatedAt: now,
        });
      }

      res.status(200).json({ status: 'success' });
    } catch (err: any) {
      console.error('Payment webhook error:', err);
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }
);
