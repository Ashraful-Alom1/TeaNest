import * as functions from 'firebase-functions/v2';
import { onRequest, HttpsError } from 'firebase-functions/v2/https';
import { db, Timestamp } from '../firebaseAdmin';
import { assertAdmin } from '../auth';
import { transitionOrderStatus } from '../orders/stateMachine';
import { OrderStatus } from '../types';

/**
 * Admin creates shipment and assigns AWB
 */
export const createShipment = functions.https.onCall(
  { region: 'asia-south1' },
  async (request) => {
    assertAdmin(request);
    const { orderId, courierName, awb, trackingUrl, expectedDeliveryDate } = request.data || {};

    if (!orderId || !courierName || !awb) {
      throw new HttpsError('invalid-argument', 'Order ID, courier name and AWB tracking number are required.');
    }

    const now = Timestamp.now();
    const shipmentId = `ship_${awb}_${Date.now()}`;

    await db.runTransaction(async (transaction) => {
      const orderRef = db.collection('orders').doc(orderId);
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        throw new HttpsError('not-found', 'Order not found.');
      }

      const orderData = orderDoc.data() as any;

      // Unique AWB check
      const awbRef = db.collection('shipmentsByAwb').doc(awb);
      const awbDoc = await transaction.get(awbRef);
      if (awbDoc.exists) {
        throw new HttpsError('already-exists', `AWB ${awb} is already linked to another shipment.`);
      }

      transaction.set(awbRef, { shipmentId, orderId });

      const shipmentRef = db.collection('shipments').doc(shipmentId);
      transaction.set(shipmentRef, {
        orderId,
        userId: orderData.userId,
        courierName,
        awb,
        trackingUrl: trackingUrl || `https://track.delhivery.com/tracking?awb=${awb}`,
        status: 'ready_to_ship',
        pickupScheduledAt: now,
        expectedDeliveryDate: expectedDeliveryDate ? Timestamp.fromDate(new Date(expectedDeliveryDate)) : null,
        isReturn: false,
        createdAt: now,
        updatedAt: now,
      });

      transaction.update(orderRef, {
        shipmentId,
        awb,
        courierName,
        trackingUrl: trackingUrl || `https://track.delhivery.com/tracking?awb=${awb}`,
        expectedDeliveryDate: expectedDeliveryDate ? Timestamp.fromDate(new Date(expectedDeliveryDate)) : null,
      });
    });

    // Advance status to ready_to_ship
    await transitionOrderStatus(orderId, 'ready_to_ship', {
      actorUid: request.auth?.uid,
      source: 'admin',
      note: `Shipment assigned to ${courierName} (AWB: ${awb}).`,
    });

    return { success: true, shipmentId, awb };
  }
);

/**
 * HTTPS Webhook for Courier Aggregator tracking events (Delhivery/Shiprocket)
 */
export const shippingWebhook = onRequest(
  { region: 'asia-south1' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const payload = req.body || {};
      const externalEventId = payload.id || payload.event_id || `${payload.awb}_${payload.status}_${Date.now()}`;
      const awb = payload.awb || payload.waybill || payload.tracking_number;
      const rawStatus = (payload.status || payload.current_status || '').toLowerCase();
      const location = payload.location || payload.city || '';
      const remarks = payload.remarks || payload.instructions || '';

      if (!awb || !rawStatus) {
        res.status(400).json({ error: 'Missing awb or status in webhook payload' });
        return;
      }

      // 1. Idempotency Check
      const eventRef = db.collection('shipmentEvents').doc(String(externalEventId));
      const eventDoc = await eventRef.get();
      if (eventDoc.exists) {
        res.status(200).json({ status: 'ignored_duplicate' });
        return;
      }

      // 2. Find associated shipment and order by AWB
      const awbLookup = await db.collection('shipmentsByAwb').doc(awb).get();
      if (!awbLookup.exists) {
        res.status(404).json({ error: 'Shipment with AWB not found' });
        return;
      }

      const { shipmentId, orderId } = awbLookup.data() as any;

      // 3. Map courier raw status to internal OrderStatus
      let mappedStatus: OrderStatus | null = null;
      if (rawStatus.includes('picked') || rawStatus.includes('in transit') || rawStatus.includes('dispatched')) {
        mappedStatus = 'shipped';
      } else if (rawStatus.includes('out for delivery') || rawStatus.includes('out_for_delivery')) {
        mappedStatus = 'out_for_delivery';
      } else if (rawStatus.includes('delivered')) {
        mappedStatus = 'delivered';
      } else if (rawStatus.includes('rto') || rawStatus.includes('undelivered') || rawStatus.includes('failed')) {
        mappedStatus = 'failed_delivery';
      }

      // Save shipment event doc
      const now = Timestamp.now();
      await eventRef.set({
        shipmentId,
        rawStatus,
        mappedStatus,
        location,
        remarks,
        eventTime: now,
        payload,
        processedAt: now,
      });

      // If valid state transition, update state machine
      if (mappedStatus && orderId) {
        await transitionOrderStatus(orderId, mappedStatus, {
          source: 'courier',
          note: remarks || `Status update from courier: ${rawStatus}`,
          location,
          metadata: { awb, rawStatus },
        });
      }

      res.status(200).json({ status: 'success', mappedStatus });
    } catch (err: any) {
      console.error('Shipping webhook processing failed:', err);
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }
);
