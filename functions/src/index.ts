// 1. Auth & Access
export { onUserCreate, setAdminClaim } from './auth';

// 2. Orders & Checkout
export {
  placeOrder,
  updateOrderStatus,
  cancelOrder,
  processRefund,
  approveReturn,
} from './orders';

// 3. Invoices & GST
export { getInvoiceUrl } from './invoices';

// 4. Inventory & Purchasing
export {
  adjustStock,
  receiveGoods,
  createPurchaseOrder,
  recordSupplierPayment,
} from './inventory';

// 5. Shipping & Logistics
export { createShipment, shippingWebhook } from './shipping';

// 6. Payment Webhooks
export { paymentWebhook } from './payments';

// 7. Cloudinary Media Signatures
export { getCloudinarySignature } from './cloudinary';

// 8. Analytics & Triggers
export {
  onOrderWrite,
  onExpenseWrite,
  onOrderTimelineCreated,
  rebuildSummaries,
} from './analytics/summaries';

// 9. Scheduled Background Jobs
export {
  releaseExpiredReservations,
  lowStockDigest,
  stockIntegrityCheck,
} from './jobs/scheduled';
