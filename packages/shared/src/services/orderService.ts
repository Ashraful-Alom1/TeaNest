import {
  Order,
  Product,
  InventoryMovement,
  Sale,
  Invoice,
  InvoiceItem,
  LowStockAlert,
  AuditLog,
  CRMTimelineEvent,
  BusinessSettings,
} from '@tea-nest/types';
import { calculateGstFromBase } from '../tax';
import { amountToWords } from '../formatters';
import { calculateLowStockThreshold, isLowStock } from '../inventory';
import { DEFAULT_BUSINESS_SETTINGS } from '../constants';

export interface DatabaseState {
  products: Record<string, Product>;
  orders: Record<string, Order>;
  sales: Record<string, Sale>;
  invoices: Record<string, Invoice>;
  inventoryMovements: InventoryMovement[];
  lowStockAlerts: Record<string, LowStockAlert>;
  auditLogs: AuditLog[];
  crmTimeline: CRMTimelineEvent[];
  businessSettings: BusinessSettings;
  counters: {
    orderNumber: number;
    invoiceNumber: number;
    saleNumber: number;
  };
}

export class OrderService {
  private state: DatabaseState;
  private mutex: Promise<void> = Promise.resolve();

  constructor(initialState?: Partial<DatabaseState>) {
    this.state = {
      products: {},
      orders: {},
      sales: {},
      invoices: {},
      inventoryMovements: [],
      lowStockAlerts: {},
      auditLogs: [],
      crmTimeline: [],
      businessSettings: DEFAULT_BUSINESS_SETTINGS,
      counters: {
        orderNumber: 1,
        invoiceNumber: 1,
        saleNumber: 1,
      },
      ...initialState,
    };
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public setProduct(product: Product): void {
    this.state.products[product.id] = { ...product };
  }

  public getProduct(id: string): Product | undefined {
    return this.state.products[id];
  }

  public getOrder(id: string): Order | undefined {
    return this.state.orders[id];
  }

  public getOrders(): Order[] {
    return Object.values(this.state.orders).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Generates a new order number: TN-2026-000001
   */
  public generateOrderNumber(): string {
    const num = this.state.counters.orderNumber;
    this.state.counters.orderNumber += 1;
    const prefix = this.state.businessSettings.orderPrefix || 'TN-2026-';
    return `${prefix}${String(num).padStart(6, '0')}`;
  }

  /**
   * Generates a new invoice number: INV-2026-000001
   */
  public generateInvoiceNumber(): string {
    const num = this.state.counters.invoiceNumber;
    this.state.counters.invoiceNumber += 1;
    const prefix = this.state.businessSettings.invoicePrefix || 'INV-2026-';
    return `${prefix}${String(num).padStart(6, '0')}`;
  }

  /**
   * Generates a new sale number: SL-2026-000001
   */
  public generateSaleNumber(): string {
    const num = this.state.counters.saleNumber;
    this.state.counters.saleNumber += 1;
    return `SL-2026-${String(num).padStart(6, '0')}`;
  }

  /**
   * Creates a customer order intent (e.g. WHATSAPP_PENDING).
   * Does NOT deduct stock yet.
   */
  public createOrderIntent(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order {
    const id = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const orderNumber = this.generateOrderNumber();
    const now = new Date().toISOString();

    const order: Order = {
      ...orderData,
      id,
      orderNumber,
      createdAt: now,
      updatedAt: now,
    };

    this.state.orders[id] = order;

    // Record CRM timeline
    this.state.crmTimeline.push({
      id: `crm_${Date.now()}`,
      customerId: order.customerId,
      type: 'ORDER_CREATED',
      description: `Order ${orderNumber} created for ₹${order.grandTotal.toFixed(2)} (${order.status})`,
      metadata: { orderId: id, orderNumber, total: order.grandTotal },
      createdAt: now,
    });

    return order;
  }

  /**
   * CRITICAL ATOMIC BUSINESS LOGIC:
   * Confirms an order, verifies real-time stock, atomically deducts stock,
   * creates inventory movements, sales record, GST tax invoice, and audit log.
   */
  public async confirmOrder(
    orderId: string,
    actor: { uid: string; email: string; role: any }
  ): Promise<{ order: Order; invoice: Invoice; sale: Sale }> {
    // Acquire mutex lock to ensure strict concurrency control and race-condition safety
    let releaseLock: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    const previousLock = this.mutex;
    this.mutex = lockPromise;

    await previousLock;

    try {
      const order = this.state.orders[orderId];
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      if (order.status === 'CONFIRMED') {
        throw new Error(`Order ${order.orderNumber} is already confirmed`);
      }

      if (order.status === 'CANCELLED') {
        throw new Error(`Cannot confirm a cancelled order`);
      }

      // Step 1: Re-read stock and verify sufficiency for ALL items
      for (const item of order.items) {
        const product = this.state.products[item.productId];
        if (!product) {
          throw new Error(`Product not found: ${item.name} (${item.productId})`);
        }

        if (product.stockQuantity < item.quantity) {
          throw new Error(
            `INSUFFICIENT STOCK: Requested ${item.quantity} units of '${product.name}', but only ${product.stockQuantity} available.`
          );
        }
      }

      const now = new Date().toISOString();

      // Step 2: Atomically deduct stock and record inventory movement for each item
      let totalCostOfGoods = 0;

      for (const item of order.items) {
        const product = this.state.products[item.productId];
        const beforeQty = product.stockQuantity;
        const afterQty = beforeQty - item.quantity;

        product.stockQuantity = afterQty;
        product.updatedAt = now;

        totalCostOfGoods += (product.purchasePrice || 0) * item.quantity;

        // Inventory movement record
        const movement: InventoryMovement = {
          movementId: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          productName: product.name,
          type: 'SALE',
          quantity: item.quantity,
          beforeQuantity: beforeQty,
          afterQuantity: afterQty,
          referenceId: order.orderNumber,
          reason: `Customer order confirmation: ${order.orderNumber}`,
          createdBy: actor.email,
          createdAt: now,
        };
        this.state.inventoryMovements.push(movement);

        // Step 3: Low stock check: ceil(stockReferenceQty * lowStockPercent / 100)
        const threshold = calculateLowStockThreshold(
          product.stockReferenceQty,
          product.lowStockPercent || 70
        );
        product.lowStockThresholdQty = threshold;

        if (isLowStock(afterQty, threshold)) {
          // Check if active alert already exists to prevent duplicate spam
          const existingAlert = Object.values(this.state.lowStockAlerts).find(
            (a) => a.productId === product.id && a.status === 'ACTIVE'
          );

          if (!existingAlert) {
            const alertId = `alert_${product.id}_${Date.now()}`;
            this.state.lowStockAlerts[alertId] = {
              alertId,
              productId: product.id,
              productName: product.name,
              currentStock: afterQty,
              threshold,
              status: 'ACTIVE',
              createdAt: now,
            };
          }
        }
      }

      // Step 4: Create Sales Record
      const saleId = `sale_${Date.now()}`;
      const saleNumber = this.generateSaleNumber();
      const grossProfit = order.subtotal - totalCostOfGoods;

      const sale: Sale = {
        saleId,
        saleNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: order.customerName,
        items: [...order.items],
        subtotal: order.subtotal,
        discount: order.discount,
        taxableAmount: order.taxableAmount,
        gst: order.tax,
        cgst: order.cgst,
        sgst: order.sgst,
        igst: order.igst,
        shipping: order.shipping,
        grandTotal: order.grandTotal,
        costOfGoods: totalCostOfGoods,
        profit: grossProfit,
        saleDate: now.substring(0, 10),
        createdAt: now,
      };
      this.state.sales[saleId] = sale;

      // Step 5: Generate GST Tax Invoice
      const invoiceId = `inv_${Date.now()}`;
      const invoiceNumber = this.generateInvoiceNumber();
      const settings = this.state.businessSettings;

      const invoiceItems: InvoiceItem[] = order.items.map((item) => {
        const prod = this.state.products[item.productId];
        const taxRes = calculateGstFromBase(item.taxableAmount, item.gstRate, false);
        return {
          productId: item.productId,
          productName: item.name,
          sku: item.sku,
          hsnCode: prod?.hsnCode || '0902',
          weight: item.weight,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.price,
          taxableValue: item.taxableAmount,
          gstRate: item.gstRate,
          cgst: taxRes.cgst,
          sgst: taxRes.sgst,
          igst: taxRes.igst,
          total: item.total,
        };
      });

      const invoice: Invoice = {
        invoiceId,
        invoiceNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        saleId,
        invoiceDate: now.substring(0, 10),
        dueDate: now.substring(0, 10),
        businessDetails: {
          businessName: settings.businessName,
          brandName: settings.brandName,
          gstin: settings.gstin,
          pan: settings.pan,
          address: settings.address,
          city: settings.city,
          state: settings.state,
          pincode: settings.pincode,
          phone: settings.phone,
          email: settings.email,
        },
        customerDetails: {
          customerId: order.customerId,
          name: order.customerName,
          email: order.customerEmail,
          mobile: order.customerMobile,
          address: order.shippingAddress.street,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          pincode: order.shippingAddress.pincode,
        },
        items: invoiceItems,
        subtotal: order.subtotal,
        taxableAmount: order.taxableAmount,
        gstRate: order.items[0]?.gstRate || 5,
        cgst: order.cgst,
        sgst: order.sgst,
        igst: order.igst,
        shipping: order.shipping,
        grandTotal: order.grandTotal,
        amountInWords: amountToWords(order.grandTotal),
        termsAndConditions: settings.terms,
        bankDetails: {
          bankName: settings.bankName,
          accountNumber: settings.accountNumber,
          ifsc: settings.ifsc,
          upi: settings.upi,
        },
        status: 'ISSUED',
        createdAt: now,
      };
      this.state.invoices[invoiceId] = invoice;

      // Step 6: Update Order Status (Do NOT force paymentStatus to PAID; admin verifies payment manually)
      order.status = 'CONFIRMED';
      order.paymentStatus = order.paymentStatus || 'UNPAID';
      order.invoiceId = invoiceId;
      order.saleId = saleId;
      order.confirmedAt = now;
      order.updatedAt = now;

      // Step 7: Record CRM Timeline
      this.state.crmTimeline.push({
        id: `crm_${Date.now()}`,
        customerId: order.customerId,
        type: 'ORDER_CONFIRMED',
        description: `Order ${order.orderNumber} confirmed. Stock deducted and Invoice ${invoiceNumber} generated.`,
        metadata: { orderId: order.id, invoiceId, saleId },
        createdAt: now,
      });

      // Step 8: Record Audit Log
      this.state.auditLogs.push({
        logId: `log_${Date.now()}`,
        actorUid: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'ORDER_CONFIRMED',
        entityType: 'ORDER',
        entityId: order.id,
        before: { status: 'WHATSAPP_PENDING', paymentStatus: order.paymentStatus || 'UNPAID' },
        after: { status: 'CONFIRMED', paymentStatus: order.paymentStatus || 'UNPAID', invoiceNumber },
        timestamp: now,
      });

      return { order, invoice, sale };
    } finally {
      releaseLock();
    }
  }

  /**
   * Cancels an order atomically.
   * If the order was previously confirmed/processing/shipped:
   * - Restores stock back to inventory
   * - Records a RETURN movement in inventory movements
   * - Voids/removes the sale record from sales so it does not count in gross sales or profit
   * - Marks the invoice as CANCELLED
   * - Ensures paymentStatus is set to UNPAID
   */
  public async cancelOrder(
    orderId: string,
    actor: { uid: string; email: string; role: any }
  ): Promise<Order> {
    let releaseLock: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    const previousLock = this.mutex;
    this.mutex = lockPromise;

    await previousLock;

    try {
      const order = this.state.orders[orderId];
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      if (order.status === 'CANCELLED') {
        return order;
      }

      const wasConfirmed =
        order.status === 'CONFIRMED' ||
        order.status === 'PROCESSING' ||
        order.status === 'SHIPPED';
      const now = new Date().toISOString();
      const beforeStatus = order.status;

      // If stock was deducted, replenish it atomically
      if (wasConfirmed) {
        for (const item of order.items) {
          const product = this.state.products[item.productId];
          if (product) {
            const beforeQty = product.stockQuantity;
            const afterQty = beforeQty + item.quantity;
            product.stockQuantity = afterQty;
            product.updatedAt = now;

            this.state.inventoryMovements.push({
              movementId: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              productId: product.id,
              productName: product.name,
              type: 'RETURN',
              quantity: item.quantity,
              beforeQuantity: beforeQty,
              afterQuantity: afterQty,
              referenceId: order.orderNumber,
              reason: `Order cancelled by admin: ${order.orderNumber}`,
              createdBy: actor.email,
              createdAt: now,
            });

            const threshold = calculateLowStockThreshold(
              product.stockReferenceQty,
              product.lowStockPercent || 70
            );
            if (!isLowStock(afterQty, threshold)) {
              Object.values(this.state.lowStockAlerts).forEach((alert) => {
                if (alert.productId === product.id && alert.status === 'ACTIVE') {
                  alert.status = 'RESOLVED';
                  alert.resolvedAt = now;
                }
              });
            }
          }
        }

        // Remove the sale from state.sales so Gross Sales & Profit do not count cancelled orders!
        if (order.saleId && this.state.sales[order.saleId]) {
          delete this.state.sales[order.saleId];
        }
        Object.keys(this.state.sales).forEach((key) => {
          if (
            this.state.sales[key].orderId === order.id ||
            this.state.sales[key].orderNumber === order.orderNumber
          ) {
            delete this.state.sales[key];
          }
        });

        // Void the invoice
        if (order.invoiceId && this.state.invoices[order.invoiceId]) {
          this.state.invoices[order.invoiceId].status = 'CANCELLED';
        }
      }

      order.status = 'CANCELLED';
      order.paymentStatus = 'UNPAID';
      order.updatedAt = now;

      this.state.crmTimeline.push({
        id: `crm_${Date.now()}`,
        customerId: order.customerId,
        type: 'ORDER_CANCELLED',
        description: `Order ${order.orderNumber} was cancelled.`,
        metadata: { orderId: order.id },
        createdAt: now,
      });

      this.state.auditLogs.push({
        logId: `log_${Date.now()}`,
        actorUid: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'ORDER_CANCELLED',
        entityType: 'ORDER',
        entityId: order.id,
        before: { status: beforeStatus },
        after: { status: 'CANCELLED', paymentStatus: 'UNPAID' },
        timestamp: now,
      });

      return order;
    } finally {
      releaseLock();
    }
  }

  /**
   * Receives purchase items atomically, increasing stock and logging movement.
   */
  public receivePurchase(
    purchaseId: string,
    receivedItems: Array<{ productId: string; quantity: number }>,
    actor: { uid: string; email: string }
  ): void {
    const now = new Date().toISOString();

    for (const item of receivedItems) {
      const product = this.state.products[item.productId];
      if (!product) continue;

      const beforeQty = product.stockQuantity;
      const afterQty = beforeQty + item.quantity;
      product.stockQuantity = afterQty;
      product.updatedAt = now;

      // Record movement
      this.state.inventoryMovements.push({
        movementId: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        productName: product.name,
        type: 'PURCHASE',
        quantity: item.quantity,
        beforeQuantity: beforeQty,
        afterQuantity: afterQty,
        referenceId: purchaseId,
        reason: `Purchase stock received: PO ${purchaseId}`,
        createdBy: actor.email,
        createdAt: now,
      });

      // Check if low stock condition is now resolved
      const threshold = calculateLowStockThreshold(
        product.stockReferenceQty,
        product.lowStockPercent || 70
      );
      if (!isLowStock(afterQty, threshold)) {
        Object.values(this.state.lowStockAlerts).forEach((alert) => {
          if (alert.productId === product.id && alert.status === 'ACTIVE') {
            alert.status = 'RESOLVED';
            alert.resolvedAt = now;
          }
        });
      }
    }
  }
}
