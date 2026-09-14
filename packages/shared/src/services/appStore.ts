import {
  Product,
  Order,
  InventoryMovement,
  LowStockAlert,
  Supplier,
  Purchase,
  Sale,
  Expense,
  Invoice,
  CustomerProfile,
  AdminUser,
  AuditLog,
  CRMTimelineEvent,
  BusinessSettings,
  Address,
  BlogPost,
} from '@tea-nest/types';
import { OrderService } from './orderService';
import { SEED_ADMIN, SEED_PRODUCT, SEED_SUPPLIER, SEED_BUSINESS_SETTINGS, SEED_BLOGS } from '../seedData';
import { generateWhatsAppOrderUrl } from '../whatsapp';
import { calculateLowStockThreshold, isLowStock } from '../inventory';
import { calculateTaxableFromInclusive } from '../tax';
import { firestoreSync } from './firestoreSync';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AppState {
  products: Product[];
  orders: Order[];
  sales: Sale[];
  invoices: Invoice[];
  inventoryMovements: InventoryMovement[];
  lowStockAlerts: LowStockAlert[];
  suppliers: Supplier[];
  purchases: Purchase[];
  expenses: Expense[];
  customers: CustomerProfile[];
  adminUsers: AdminUser[];
  auditLogs: AuditLog[];
  crmTimeline: CRMTimelineEvent[];
  businessSettings: BusinessSettings;
  blogs: BlogPost[];
  cart: CartItem[];
  currentCustomer: CustomerProfile | null;
  currentAdmin: AdminUser | null;
}

const STORAGE_KEY = 'tea_nest_database_v2';

export class AppStore {
  private state: AppState;
  private listeners: Set<() => void> = new Set();
  private orderService: OrderService;

  private syncUrl = typeof window !== 'undefined' ? '/api/state' : 'http://localhost:5001/api/state';
  private syncInProgress = false;

  constructor() {
    const loaded = this.loadFromStorage();
    if (loaded) {
      this.state = loaded;
    } else {
      this.state = this.getInitialState();
      this.saveToStorage();
    }

    this.orderService = this.createOrderService();

    // Start background sync with real-time SSE & polling fallback
    if (typeof window !== 'undefined') {
      // 1. Live Google Cloud Firestore real-time synchronization
      try {
        firestoreSync.subscribeToUpdates((data) => {
          let hasChanges = false;
          if (data.products && data.products.length > 0) {
            this.state.products = data.products;
            hasChanges = true;
          }
          if (data.businessSettings) {
            this.state.businessSettings = data.businessSettings;
            hasChanges = true;
          }
          if (data.orders && data.orders.length > 0) {
            this.state.orders = data.orders;
            hasChanges = true;
          }
          if (data.inventoryMovements && data.inventoryMovements.length > 0) {
            this.state.inventoryMovements = data.inventoryMovements;
            hasChanges = true;
          }
          if (data.invoices && data.invoices.length > 0) {
            this.state.invoices = data.invoices;
            hasChanges = true;
          }
          if (hasChanges) {
            this.updateOrderServiceFromState();
            this.saveToStorage();
            this.listeners.forEach((l) => l());
          }
        });
      } catch (err) {
        console.warn('[AppStore] Firestore live listener setup:', err);
      }

      // 2. Local fallback sync server (only active during local development)
      const isDev = typeof import.meta !== 'undefined' && Boolean((import.meta as any).env?.DEV);
      if (isDev) {
        this.pullFromServer();
        setInterval(() => {
          this.pullFromServer();
        }, 2500);

        if (typeof window.EventSource !== 'undefined') {
          try {
            const es = new EventSource('/api/events');
            es.onmessage = () => this.pullFromServer();
            es.addEventListener('ORDER_CREATED', () => this.pullFromServer());
            es.addEventListener('ORDER_CONFIRMED', () => this.pullFromServer());
            es.addEventListener('ORDER_UPDATED', () => this.pullFromServer());
            es.addEventListener('INVENTORY_ADJUSTED', () => this.pullFromServer());
            es.addEventListener('STATE_UPDATED', () => this.pullFromServer());
            es.addEventListener('STATE_RESET', () => this.pullFromServer());
          } catch {
            // SSE fallback
          }
        }
      }
    }
  }

  private createOrderService(): OrderService {
    const productsMap: Record<string, Product> = {};
    this.state.products.forEach((p) => {
      productsMap[p.id] = p;
    });

    const ordersMap: Record<string, Order> = {};
    this.state.orders.forEach((o) => {
      ordersMap[o.id] = o;
    });

    const salesMap: Record<string, Sale> = {};
    this.state.sales.forEach((s) => {
      salesMap[s.saleId] = s;
    });

    const invoicesMap: Record<string, Invoice> = {};
    this.state.invoices.forEach((i) => {
      invoicesMap[i.invoiceId] = i;
    });

    const alertsMap: Record<string, LowStockAlert> = {};
    this.state.lowStockAlerts.forEach((a) => {
      alertsMap[a.alertId] = a;
    });

    return new OrderService({
      products: productsMap,
      orders: ordersMap,
      sales: salesMap,
      invoices: invoicesMap,
      inventoryMovements: [...this.state.inventoryMovements],
      lowStockAlerts: alertsMap,
      auditLogs: [...this.state.auditLogs],
      crmTimeline: [...this.state.crmTimeline],
      businessSettings: this.state.businessSettings,
      counters: {
        orderNumber: this.state.orders.length + 1,
        invoiceNumber: this.state.invoices.length + 1,
        saleNumber: this.state.sales.length + 1,
      },
    });
  }

  private updateOrderServiceFromState(): void {
    this.orderService = this.createOrderService();
  }

  private async pullFromServer(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch(this.syncUrl);
      if (!res.ok) return;
      const remote = await res.json();
      if (remote && Array.isArray(remote.products) && remote.products.length > 0) {
        // Exclude local session-specific state when diffing
        const remoteDataToCompare = {
          products: remote.products,
          orders: remote.orders,
          sales: remote.sales,
          invoices: remote.invoices,
          inventoryMovements: remote.inventoryMovements,
          lowStockAlerts: remote.lowStockAlerts,
          suppliers: remote.suppliers,
          purchases: remote.purchases,
          expenses: remote.expenses,
          customers: remote.customers,
          auditLogs: remote.auditLogs,
          crmTimeline: remote.crmTimeline,
          businessSettings: remote.businessSettings,
          blogs: remote.blogs,
        };
        const currentDataToCompare = {
          products: this.state.products,
          orders: this.state.orders,
          sales: this.state.sales,
          invoices: this.state.invoices,
          inventoryMovements: this.state.inventoryMovements,
          lowStockAlerts: this.state.lowStockAlerts,
          suppliers: this.state.suppliers,
          purchases: this.state.purchases,
          expenses: this.state.expenses,
          customers: this.state.customers,
          auditLogs: this.state.auditLogs,
          crmTimeline: this.state.crmTimeline,
          businessSettings: this.state.businessSettings,
          blogs: this.state.blogs,
        };

        const remoteHash = JSON.stringify(remoteDataToCompare);
        const currentHash = JSON.stringify(currentDataToCompare);

        if (remoteHash !== currentHash) {
          const localCustomer = this.state.currentCustomer;
          const localAdmin = this.state.currentAdmin;
          const localCart = this.state.cart;

          this.state = {
            ...this.state,
            ...remote,
            currentCustomer: localCustomer || remote.currentCustomer,
            currentAdmin: localAdmin || remote.currentAdmin,
            cart: localCart,
          };

          this.updateOrderServiceFromState();
          this.saveToStorage();
          this.listeners.forEach((l) => l());
        }
      }
    } catch {
      // offline / backend restarting, seamless fallback
    }
  }

  private async pushToServer(): Promise<void> {
    const isDev = typeof import.meta !== 'undefined' && Boolean((import.meta as any).env?.DEV);
    if (!isDev || typeof window === 'undefined' || this.syncInProgress) return;
    try {
      this.syncInProgress = true;
      await fetch(this.syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.state),
      });
    } catch {
      // fallback
    } finally {
      this.syncInProgress = false;
    }
  }

  private getInitialState(): AppState {
    return {
      products: [{ ...SEED_PRODUCT }],
      orders: [],
      sales: [],
      invoices: [],
      inventoryMovements: [
        {
          movementId: 'mov_initial_seed',
          productId: SEED_PRODUCT.id,
          productName: SEED_PRODUCT.name,
          type: 'PURCHASE',
          quantity: 100,
          beforeQuantity: 0,
          afterQuantity: 100,
          referenceId: 'PO-INITIAL',
          reason: 'Initial stock intake from Brahmaputra Organic Tea Estates',
          createdBy: 'admin@teanest.in',
          createdAt: new Date().toISOString(),
        },
      ],
      lowStockAlerts: [],
      suppliers: [{ ...SEED_SUPPLIER }],
      purchases: [
        {
          purchaseId: 'po_initial_001',
          purchaseNumber: 'PO-2026-000001',
          supplierId: SEED_SUPPLIER.id,
          supplierName: SEED_SUPPLIER.companyName,
          invoiceNumber: 'BOTE-INV-9821',
          purchaseDate: new Date(Date.now() - 86400000 * 7).toISOString().substring(0, 10),
          items: [
            {
              productId: SEED_PRODUCT.id,
              sku: SEED_PRODUCT.sku,
              name: SEED_PRODUCT.name,
              quantity: 100,
              receivedQuantity: 100,
              unitCost: 220,
              gstRate: 5,
              taxableAmount: 22000,
              tax: 1100,
              total: 23100,
            },
          ],
          subtotal: 22000,
          tax: 1100,
          discount: 0,
          shipping: 0,
          grandTotal: 23100,
          paymentStatus: 'PAID',
          purchaseStatus: 'RECEIVED',
          notes: 'First flush organic Assam black tea intake',
          receivedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          createdBy: 'admin@teanest.in',
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
      ],
      expenses: [
        {
          expenseId: 'exp_001',
          category: 'Packaging',
          description: '500g matte stand-up pouches with zip lock & gold foil printing',
          amount: 12500,
          gstAmount: 2250,
          vendor: 'Apex Premium Packagers, Guwahati',
          expenseDate: new Date(Date.now() - 86400000 * 10).toISOString().substring(0, 10),
          paymentMethod: 'UPI',
          status: 'PAID',
          createdBy: 'admin@teanest.in',
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
        {
          expenseId: 'exp_002',
          category: 'Transport',
          description: 'Tea estate batch transit from Naharkatia to Dibrugarh warehouse',
          amount: 3500,
          gstAmount: 175,
          vendor: 'Assam Speed Cargo',
          expenseDate: new Date(Date.now() - 86400000 * 6).toISOString().substring(0, 10),
          paymentMethod: 'Bank Transfer',
          status: 'PAID',
          createdBy: 'admin@teanest.in',
          createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        },
      ],
      customers: [],
      adminUsers: [{ ...SEED_ADMIN }],
      auditLogs: [
        {
          logId: 'log_seed_init',
          actorUid: SEED_ADMIN.uid,
          actorEmail: SEED_ADMIN.email,
          actorRole: 'SUPER_ADMIN',
          action: 'LOGIN',
          entityType: 'SYSTEM',
          entityId: 'SYS',
          timestamp: new Date().toISOString(),
        },
      ],
      crmTimeline: [],
      businessSettings: { ...SEED_BUSINESS_SETTINGS },
      blogs: [...SEED_BLOGS],
      cart: [],
      currentCustomer: null,
      currentAdmin: null,
    };
  }

  private loadFromStorage(): AppState | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist store state to localStorage:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(syncDoc?: { collection: string; id: string; data: any }): void {
    this.saveToStorage();
    this.pushToServer();
    if (syncDoc) {
      firestoreSync.saveDocument(syncDoc.collection, syncDoc.id, syncDoc.data);
    }
    this.listeners.forEach((listener) => listener());
  }

  public getState(): AppState {
    return this.state;
  }

  // ==========================================
  // Auth Operations
  // ==========================================
  public registerCustomer(data: {
    name: string;
    email: string;
    mobile: string;
    password?: string;
  }): CustomerProfile {
    const existing = this.state.customers.find((c) => c.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      this.state.currentCustomer = existing;
      this.notify();
      return existing;
    }

    const newCustomer: CustomerProfile = {
      uid: `cust_${Date.now()}`,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      address: '',
      city: '',
      state: '',
      pincode: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: 'customer',
      status: 'ACTIVE',
      totalOrders: 0,
      confirmedOrders: 0,
      cancelledOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
    };

    this.state.customers.push(newCustomer);
    this.state.currentCustomer = newCustomer;

    this.state.crmTimeline.push({
      id: `crm_${Date.now()}`,
      customerId: newCustomer.uid,
      type: 'REGISTERED',
      description: `New customer registered: ${newCustomer.name} (${newCustomer.mobile})`,
      createdAt: new Date().toISOString(),
    });

    this.notify();
    return newCustomer;
  }

  public loginCustomer(email: string): CustomerProfile {
    let customer = this.state.customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
    if (!customer) {
      // Auto register for seamless onboarding
      customer = this.registerCustomer({
        name: email.split('@')[0],
        email,
        mobile: '9876543210',
      });
    }
    this.state.currentCustomer = customer;
    this.notify();
    return customer;
  }

  public logoutCustomer(): void {
    this.state.currentCustomer = null;
    this.notify();
  }

  public updateCustomerProfile(profile: Partial<CustomerProfile>): void {
    if (!this.state.currentCustomer) return;
    this.state.currentCustomer = {
      ...this.state.currentCustomer,
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    const index = this.state.customers.findIndex((c) => c.uid === this.state.currentCustomer?.uid);
    if (index !== -1) {
      this.state.customers[index] = this.state.currentCustomer;
    }

    this.notify();
  }

  public loginAdmin(loginId: string): AdminUser {
    const cleanInput = loginId.trim();
    const cleanDigits = cleanInput.replace(/\D/g, '');

    const admin = this.state.adminUsers.find((a) => {
      const matchEmail = a.email.toLowerCase() === cleanInput.toLowerCase();
      const matchPhone =
        Boolean(a.phone) &&
        cleanDigits.length >= 10 &&
        a.phone!.replace(/\D/g, '').endsWith(cleanDigits.slice(-10));
      return matchEmail || matchPhone;
    });

    if (!admin) {
      throw new Error('Invalid administrative credentials. Account not found.');
    }

    if (admin.isActive === false) {
      throw new Error('Access denied. This administrative account has been deactivated.');
    }

    this.state.currentAdmin = admin;

    this.state.auditLogs.push({
      logId: `log_${Date.now()}`,
      actorUid: admin.uid,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: 'LOGIN',
      entityType: 'AUTH',
      entityId: admin.uid,
      timestamp: new Date().toISOString(),
    });

    this.saveToStorage();
    this.pushToServer();
    this.notify();
    return admin;
  }

  public logoutAdmin(): void {
    this.state.currentAdmin = null;
    this.saveToStorage();
    this.pushToServer();
    this.notify();
  }

  // ==========================================
  // Cart Operations
  // ==========================================
  public addToCart(product: Product, quantity = 1): void {
    const existing = this.state.cart.find((item) => item.product.id === product.id);
    if (existing) {
      existing.quantity = Math.min(product.stockQuantity, existing.quantity + quantity);
    } else {
      this.state.cart.push({
        product,
        quantity: Math.min(product.stockQuantity, quantity),
      });
    }
    this.notify();
  }

  public updateCartQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    const item = this.state.cart.find((i) => i.product.id === productId);
    if (item) {
      item.quantity = Math.min(item.product.stockQuantity, quantity);
      this.notify();
    }
  }

  public removeFromCart(productId: string): void {
    this.state.cart = this.state.cart.filter((i) => i.product.id !== productId);
    this.notify();
  }

  public clearCart(): void {
    this.state.cart = [];
    this.notify();
  }

  // ==========================================
  // Order Operations (Dynamic WhatsApp & Multi-product)
  // ==========================================
  public createWhatsAppOrder(
    customer: CustomerProfile,
    address: Address,
    product: Product,
    quantity = 1,
    notes = ''
  ): { order: Order; whatsappUrl: string } {
    const taxRes = calculateTaxableFromInclusive(product.sellingPrice * quantity, product.gstRate, false);

    const orderItem = {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      weight: product.weight,
      unit: product.unit,
      price: product.sellingPrice,
      purchasePrice: product.purchasePrice,
      quantity,
      gstRate: product.gstRate,
      taxableAmount: taxRes.taxableAmount,
      tax: taxRes.totalTax,
      subtotal: taxRes.taxableAmount,
      total: product.sellingPrice * quantity,
      image: product.thumbnail?.secureUrl,
    };

    const order = this.orderService.createOrderIntent({
      customerId: customer.uid,
      customerName: customer.name,
      customerMobile: customer.mobile,
      customerEmail: customer.email,
      shippingAddress: address,
      items: [orderItem],
      subtotal: taxRes.taxableAmount,
      discount: 0,
      taxableAmount: taxRes.taxableAmount,
      tax: taxRes.totalTax,
      cgst: taxRes.cgst,
      sgst: taxRes.sgst,
      igst: taxRes.igst,
      shipping: 0,
      grandTotal: product.sellingPrice * quantity,
      status: 'WHATSAPP_PENDING',
      paymentStatus: 'UNPAID',
      paymentMethod: 'WHATSAPP',
      whatsappMessageSent: true,
      isWhatsAppOrder: true,
      notes,
    });

    // Sync state
    this.syncFromOrderService();

    // Update customer stats
    customer.totalOrders += 1;
    customer.lastOrderDate = new Date().toISOString();

    const whatsappUrl = generateWhatsAppOrderUrl({
      phoneNumber: this.state.businessSettings.whatsappOrderNumber,
      orderNumber: order.orderNumber,
      customerName: customer.name,
      customerMobile: customer.mobile,
      customerEmail: customer.email,
      shippingAddress: `${address.street}, ${address.city}, ${address.state} - ${address.pincode}`,
      items: [
        {
          name: product.name,
          weight: product.weight,
          unit: product.unit,
          quantity,
          price: product.sellingPrice,
        },
      ],
      grandTotal: order.grandTotal,
    });

    firestoreSync.saveDocument('orders', order.id, order);
    firestoreSync.saveDocument('customers', customer.uid, customer);
    this.notify();
    return { order, whatsappUrl };
  }

  public createCartOrder(
    customer: CustomerProfile,
    address: Address,
    notes = ''
  ): { order: Order; whatsappUrl: string } {
    if (this.state.cart.length === 0) {
      throw new Error('Cart is empty');
    }

    let subtotalTaxable = 0;
    let totalTax = 0;
    let totalGrand = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    const items = this.state.cart.map(({ product, quantity }) => {
      // Check available stock
      const currentProduct = this.state.products.find((p) => p.id === product.id);
      if (!currentProduct || currentProduct.stockQuantity < quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${currentProduct?.stockQuantity || 0}`
        );
      }

      const totalItemPrice = product.sellingPrice * quantity;
      const taxRes = calculateTaxableFromInclusive(totalItemPrice, product.gstRate, false);

      subtotalTaxable += taxRes.taxableAmount;
      totalTax += taxRes.totalTax;
      totalGrand += totalItemPrice;
      totalCgst += taxRes.cgst;
      totalSgst += taxRes.sgst;

      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        weight: product.weight,
        unit: product.unit,
        price: product.sellingPrice,
        purchasePrice: product.purchasePrice,
        quantity,
        gstRate: product.gstRate,
        taxableAmount: taxRes.taxableAmount,
        tax: taxRes.totalTax,
        subtotal: taxRes.taxableAmount,
        total: totalItemPrice,
        image: product.thumbnail?.secureUrl,
      };
    });

    const order = this.orderService.createOrderIntent({
      customerId: customer.uid,
      customerName: customer.name,
      customerMobile: customer.mobile,
      customerEmail: customer.email,
      shippingAddress: address,
      items,
      subtotal: Math.round(subtotalTaxable * 100) / 100,
      discount: 0,
      taxableAmount: Math.round(subtotalTaxable * 100) / 100,
      tax: Math.round(totalTax * 100) / 100,
      cgst: Math.round(totalCgst * 100) / 100,
      sgst: Math.round(totalSgst * 100) / 100,
      igst: 0,
      shipping: 0,
      grandTotal: Math.round(totalGrand * 100) / 100,
      status: 'WHATSAPP_PENDING',
      paymentStatus: 'UNPAID',
      paymentMethod: 'WHATSAPP',
      whatsappMessageSent: true,
      isWhatsAppOrder: true,
      notes,
    });

    // Update customer stats
    customer.totalOrders += 1;
    customer.lastOrderDate = new Date().toISOString();

    const whatsappUrl = generateWhatsAppOrderUrl({
      phoneNumber: this.state.businessSettings.whatsappOrderNumber,
      orderNumber: order.orderNumber,
      customerName: customer.name,
      customerMobile: customer.mobile,
      customerEmail: customer.email,
      shippingAddress: `${address.street}, ${address.city}, ${address.state} - ${address.pincode}`,
      items: items.map((i) => ({
        name: i.name,
        weight: i.weight,
        unit: i.unit,
        quantity: i.quantity,
        price: i.price,
      })),
      grandTotal: order.grandTotal,
    });

    // Clear cart and sync
    this.clearCart();
    this.syncFromOrderService();
    firestoreSync.saveDocument('orders', order.id, order);
    firestoreSync.saveDocument('customers', customer.uid, customer);
    this.notify();
    return { order, whatsappUrl };
  }

  public async confirmOrder(
    orderId: string,
    actor?: { uid: string; email: string; role: any }
  ): Promise<{ order: Order; invoice: Invoice; sale: Sale }> {
    const admin = actor || this.state.currentAdmin || SEED_ADMIN;
    const result = await this.orderService.confirmOrder(orderId, admin);
    this.syncFromOrderService();
    firestoreSync.saveDocument('orders', orderId, result.order);
    firestoreSync.saveDocument('invoices', result.invoice.invoiceId, result.invoice);
    firestoreSync.saveDocument('sales', result.sale.saleId, result.sale);
    this.notify();
    return result;
  }

  public updateOrderStatus(orderId: string, status: any): void {
    if (status === 'CANCELLED') {
      const admin = this.state.currentAdmin || SEED_ADMIN;
      this.orderService.cancelOrder(orderId, admin);
      this.syncFromOrderService();
      const cancelledOrder = this.state.orders.find((o) => o.id === orderId);
      if (cancelledOrder) {
        firestoreSync.saveDocument('orders', orderId, cancelledOrder);
      }
      this.notify();
      return;
    }

    const order = this.state.orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      const osOrder = this.orderService.getState().orders[orderId];
      if (osOrder) {
        osOrder.status = status;
        osOrder.updatedAt = order.updatedAt;
      }
      firestoreSync.saveDocument('orders', orderId, order);
      this.notify();
    }
  }

  public updateOrderPaymentStatus(orderId: string, paymentStatus: 'UNPAID' | 'PAID'): void {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (order) {
      order.paymentStatus = paymentStatus;
      order.updatedAt = new Date().toISOString();
      const osOrder = this.orderService.getState().orders[orderId];
      if (osOrder) {
        osOrder.paymentStatus = paymentStatus;
        osOrder.updatedAt = order.updatedAt;
      }
      const invoice = this.state.invoices.find((i) => i.orderId === orderId);
      if (invoice) {
        invoice.paymentStatus = paymentStatus;
      }
      const sale = this.state.sales.find((s) => s.orderId === orderId);
      if (sale) {
        sale.paymentStatus = paymentStatus;
      }
      firestoreSync.saveDocument('orders', orderId, order);
      this.notify();
    }
  }

  // ==========================================
  // Inventory & Purchases
  // ==========================================
  public adjustInventory(productId: string, type: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT', quantity: number, reason: string): void {
    const product = this.state.products.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');

    const beforeQty = product.stockQuantity;
    const afterQty = type === 'ADJUSTMENT_IN' ? beforeQty + quantity : Math.max(0, beforeQty - quantity);

    product.stockQuantity = afterQty;
    product.updatedAt = new Date().toISOString();

    const movement: InventoryMovement = {
      movementId: `mov_${Date.now()}`,
      productId: product.id,
      productName: product.name,
      type,
      quantity,
      beforeQuantity: beforeQty,
      afterQuantity: afterQty,
      referenceId: 'MANUAL_ADJUSTMENT',
      reason,
      createdBy: this.state.currentAdmin?.email || 'admin@teanest.in',
      createdAt: new Date().toISOString(),
    };
    this.state.inventoryMovements.push(movement);

    // Check low stock threshold
    const threshold = calculateLowStockThreshold(product.stockReferenceQty, product.lowStockPercent || 70);
    product.lowStockThresholdQty = threshold;

    if (isLowStock(afterQty, threshold)) {
      const existing = this.state.lowStockAlerts.find((a) => a.productId === product.id && a.status === 'ACTIVE');
      if (!existing) {
        this.state.lowStockAlerts.push({
          alertId: `alert_${product.id}_${Date.now()}`,
          productId: product.id,
          productName: product.name,
          currentStock: afterQty,
          threshold,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      // Resolve alert if stock is now sufficient
      this.state.lowStockAlerts.forEach((a) => {
        if (a.productId === product.id && a.status === 'ACTIVE') {
          a.status = 'RESOLVED';
          a.resolvedAt = new Date().toISOString();
        }
      });
    }

    firestoreSync.saveDocument('products', product.id, product);
    firestoreSync.saveDocument('inventoryMovements', movement.movementId, movement);
    this.notify();
  }

  public receivePurchase(purchaseId: string): void {
    const purchase = this.state.purchases.find((p) => p.purchaseId === purchaseId);
    if (!purchase) throw new Error('Purchase order not found');

    if (purchase.purchaseStatus === 'RECEIVED') {
      throw new Error('Purchase is already received');
    }

    const actor = {
      uid: this.state.currentAdmin?.uid || 'admin',
      email: this.state.currentAdmin?.email || 'admin@teanest.in',
    };

    const itemsToReceive = purchase.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity - (i.receivedQuantity || 0),
    }));

    this.orderService.receivePurchase(purchaseId, itemsToReceive, actor);

    // Update purchase item received counts
    purchase.items.forEach((i) => {
      i.receivedQuantity = i.quantity;
    });
    purchase.purchaseStatus = 'RECEIVED';
    purchase.paymentStatus = 'PAID';
    purchase.receivedAt = new Date().toISOString();
    purchase.updatedAt = new Date().toISOString();

    this.syncFromOrderService();
    this.notify();
  }

  // ==========================================
  // Catalog & Product Management
  // ==========================================
  public createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Product {
    const threshold = calculateLowStockThreshold(
      productData.stockReferenceQty,
      productData.lowStockPercent || 70
    );

    const product: Product = {
      ...productData,
      id: `prod_${Date.now()}`,
      lowStockThresholdQty: threshold,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: this.state.currentAdmin?.email || 'admin@teanest.in',
    };

    this.state.products.push(product);
    this.orderService.setProduct(product);
    firestoreSync.saveDocument('products', product.id, product);

    this.state.auditLogs.push({
      logId: `log_${Date.now()}`,
      actorUid: this.state.currentAdmin?.uid || 'admin',
      actorEmail: this.state.currentAdmin?.email || 'admin@teanest.in',
      actorRole: this.state.currentAdmin?.role || 'SUPER_ADMIN',
      action: 'PRODUCT_CREATED',
      entityType: 'PRODUCT',
      entityId: product.id,
      after: product,
      timestamp: new Date().toISOString(),
    });

    this.notify();
    return product;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product {
    const product = this.state.products.find((p) => p.id === id);
    if (!product) throw new Error('Product not found');

    const before = { ...product };

    if (updates.stockReferenceQty !== undefined || updates.lowStockPercent !== undefined) {
      const refQty = updates.stockReferenceQty ?? product.stockReferenceQty;
      const pct = updates.lowStockPercent ?? product.lowStockPercent;
      updates.lowStockThresholdQty = calculateLowStockThreshold(refQty, pct);
    }

    Object.assign(product, updates, { updatedAt: new Date().toISOString() });
    this.orderService.setProduct(product);
    firestoreSync.saveDocument('products', product.id, product);

    this.state.auditLogs.push({
      logId: `log_${Date.now()}`,
      actorUid: this.state.currentAdmin?.uid || 'admin',
      actorEmail: this.state.currentAdmin?.email || 'admin@teanest.in',
      actorRole: this.state.currentAdmin?.role || 'SUPER_ADMIN',
      action: 'PRODUCT_UPDATED',
      entityType: 'PRODUCT',
      entityId: product.id,
      before,
      after: product,
      timestamp: new Date().toISOString(),
    });

    this.notify();
    return product;
  }

  public deleteProduct(id: string): void {
    const product = this.state.products.find((p) => p.id === id);
    if (!product) return;

    this.state.products = this.state.products.filter((p) => p.id !== id);
    firestoreSync.deleteDocument('products', id);

    this.state.auditLogs.push({
      logId: `log_${Date.now()}`,
      actorUid: this.state.currentAdmin?.uid || 'admin',
      actorEmail: this.state.currentAdmin?.email || 'admin@teanest.in',
      actorRole: this.state.currentAdmin?.role || 'SUPER_ADMIN',
      action: 'PRODUCT_DELETED',
      entityType: 'PRODUCT',
      entityId: id,
      before: product,
      timestamp: new Date().toISOString(),
    });

    this.notify();
  }

  // ==========================================
  // Supplier & Expense Management
  // ==========================================
  public createSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier {
    const supplier: Supplier = {
      ...supplierData,
      id: `sup_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.suppliers.push(supplier);
    firestoreSync.saveDocument('suppliers', supplier.id, supplier);
    this.notify();
    return supplier;
  }

  public createPurchase(purchaseData: Omit<Purchase, 'purchaseId' | 'purchaseNumber' | 'createdAt' | 'updatedAt' | 'createdBy'>): Purchase {
    const num = this.state.purchases.length + 1;
    const purchase: Purchase = {
      ...purchaseData,
      purchaseId: `po_${Date.now()}`,
      purchaseNumber: `PO-2026-${String(num).padStart(6, '0')}`,
      createdBy: this.state.currentAdmin?.email || 'admin@teanest.in',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.purchases.push(purchase);
    firestoreSync.saveDocument('purchases', purchase.purchaseId, purchase);
    this.notify();
    return purchase;
  }

  public createExpense(expenseData: Omit<Expense, 'expenseId' | 'createdAt' | 'createdBy'>): Expense {
    const expense: Expense = {
      ...expenseData,
      expenseId: `exp_${Date.now()}`,
      createdBy: this.state.currentAdmin?.email || 'admin@teanest.in',
      createdAt: new Date().toISOString(),
    };
    this.state.expenses.push(expense);
    firestoreSync.saveDocument('expenses', expense.expenseId, expense);

    this.state.auditLogs.push({
      logId: `log_${Date.now()}`,
      actorUid: this.state.currentAdmin?.uid || 'admin',
      actorEmail: this.state.currentAdmin?.email || 'admin@teanest.in',
      actorRole: this.state.currentAdmin?.role || 'SUPER_ADMIN',
      action: 'EXPENSE_CREATED',
      entityType: 'EXPENSE',
      entityId: expense.expenseId,
      after: expense,
      timestamp: new Date().toISOString(),
    });

    this.notify();
    return expense;
  }

  public updateBusinessSettings(settings: Partial<BusinessSettings>): void {
    this.state.businessSettings = {
      ...this.state.businessSettings,
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    firestoreSync.saveDocument('businessSettings', 'default', this.state.businessSettings);

    this.state.auditLogs.push({
      logId: `log_${Date.now()}`,
      actorUid: this.state.currentAdmin?.uid || 'admin',
      actorEmail: this.state.currentAdmin?.email || 'admin@teanest.in',
      actorRole: this.state.currentAdmin?.role || 'SUPER_ADMIN',
      action: 'SETTINGS_UPDATED',
      entityType: 'SETTINGS',
      entityId: 'default',
      timestamp: new Date().toISOString(),
    });

    this.notify();
  }

  // ==========================================
  // Blog Management (ACID & Atomic Auditing)
  // ==========================================
  public createBlog(blogData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): BlogPost {
    const now = new Date().toISOString();
    let slug = blogData.slug?.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!slug) {
      slug = blogData.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (this.state.blogs.some((b) => b.slug === slug)) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const newBlog: BlogPost = {
      ...blogData,
      id: `blog_${Date.now()}`,
      slug,
      createdAt: now,
      updatedAt: now,
      publishedAt: blogData.isPublished ? (blogData.publishedAt || now) : undefined,
      createdBy: this.state.currentAdmin?.email || 'admin@teanest.in',
    };

    this.state.blogs.unshift(newBlog);
    firestoreSync.saveDocument('blogs', newBlog.id, newBlog);

    this.state.auditLogs.unshift({
      logId: `log_${Date.now()}`,
      actorUid: this.state.currentAdmin?.uid || 'admin',
      actorEmail: this.state.currentAdmin?.email || 'admin@teanest.in',
      actorRole: this.state.currentAdmin?.role || 'SUPER_ADMIN',
      action: 'BLOG_CREATED',
      entityType: 'BLOG',
      entityId: newBlog.id,
      after: newBlog,
      timestamp: now,
    });

    this.notify();
    return newBlog;
  }

  public updateBlog(id: string, updates: Partial<BlogPost>): BlogPost {
    const blog = this.state.blogs.find((b) => b.id === id);
    if (!blog) throw new Error('Blog post not found');

    const before = { ...blog };
    const now = new Date().toISOString();

    if (updates.slug && updates.slug !== blog.slug) {
      let slug = updates.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (this.state.blogs.some((b) => b.id !== id && b.slug === slug)) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
      updates.slug = slug;
    }

    if (updates.isPublished !== undefined) {
      if (updates.isPublished && !blog.isPublished && !updates.publishedAt) {
        updates.publishedAt = now;
      }
    }

    Object.assign(blog, updates, { updatedAt: now });
    firestoreSync.saveDocument('blogs', blog.id, blog);

    this.state.auditLogs.unshift({
      logId: `log_${Date.now()}`,
      actorUid: this.state.currentAdmin?.uid || 'admin',
      actorEmail: this.state.currentAdmin?.email || 'admin@teanest.in',
      actorRole: this.state.currentAdmin?.role || 'SUPER_ADMIN',
      action: 'BLOG_UPDATED',
      entityType: 'BLOG',
      entityId: blog.id,
      before,
      after: blog,
      timestamp: now,
    });

    this.notify();
    return blog;
  }

  public deleteBlog(id: string): void {
    const blog = this.state.blogs.find((b) => b.id === id);
    if (!blog) return;

    this.state.blogs = this.state.blogs.filter((b) => b.id !== id);
    firestoreSync.deleteDocument('blogs', id);

    this.state.auditLogs.unshift({
      logId: `log_${Date.now()}`,
      actorUid: this.state.currentAdmin?.uid || 'admin',
      actorEmail: this.state.currentAdmin?.email || 'admin@teanest.in',
      actorRole: this.state.currentAdmin?.role || 'SUPER_ADMIN',
      action: 'BLOG_DELETED',
      entityType: 'BLOG',
      entityId: id,
      before: blog,
      timestamp: new Date().toISOString(),
    });

    this.notify();
  }

  public togglePublishBlog(id: string): BlogPost {
    const blog = this.state.blogs.find((b) => b.id === id);
    if (!blog) throw new Error('Blog post not found');
    return this.updateBlog(id, { isPublished: !blog.isPublished });
  }

  private syncFromOrderService(): void {
    const s = this.orderService.getState();
    this.state.products = Object.values(s.products);
    this.state.orders = Object.values(s.orders);
    this.state.sales = Object.values(s.sales);
    this.state.invoices = Object.values(s.invoices);
    this.state.inventoryMovements = [...s.inventoryMovements];
    this.state.lowStockAlerts = Object.values(s.lowStockAlerts);
    this.state.auditLogs = [...s.auditLogs];
    this.state.crmTimeline = [...s.crmTimeline];
  }
}

// Singleton export
export const globalStore = new AppStore();
