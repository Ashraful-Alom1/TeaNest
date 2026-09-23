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
import {
  SEED_ADMIN,
  SEED_BUSINESS_SETTINGS,
  SEED_PRODUCTS,
  SEED_BLOGS,
} from '../seedData';
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

const STORAGE_KEY = 'tea_nest_firestore_live_v1';

function mergeEntities<T extends Record<string, any>>(
  localList: T[] = [],
  serverList: T[] = [],
  idKey: keyof T = 'id' as keyof T,
  onLocalNewer?: (localItem: T) => void
): T[] {
  const map = new Map<string, T>();

  for (const item of localList) {
    const id = String(item[idKey] || '');
    if (id) map.set(id, item);
  }

  for (const serverItem of serverList) {
    const id = String(serverItem[idKey] || '');
    if (!id) continue;
    const localItem = map.get(id);
    if (!localItem) {
      map.set(id, serverItem);
    } else {
      const localTime = new Date(localItem.updatedAt || localItem.createdAt || 0).getTime();
      const serverTime = new Date(serverItem.updatedAt || serverItem.createdAt || 0).getTime();
      if (serverTime >= localTime || isNaN(localTime)) {
        map.set(id, serverItem);
      } else {
        if (onLocalNewer) {
          onLocalNewer(localItem);
        }
      }
    }
  }

  return Array.from(map.values());
}

export class AppStore {
  private state: AppState;
  private listeners: Set<() => void> = new Set();
  private orderService: OrderService;

  constructor() {
    const loaded = this.loadFromStorage();
    if (loaded) {
      this.state = {
        ...this.getInitialState(),
        ...loaded,
        products:
          loaded.products && loaded.products.length > 0
            ? mergeEntities([...SEED_PRODUCTS], loaded.products, 'id')
            : [...SEED_PRODUCTS],
        suppliers:
          loaded.suppliers && loaded.suppliers.length > 0
            ? loaded.suppliers.filter(
                (s: Supplier) =>
                  s.id !== 'sup_naharkatia_estate' &&
                  !s.companyName?.includes('Brahmaputra Organic Tea Estates')
              )
            : [],
        blogs:
          loaded.blogs && loaded.blogs.length > 0
            ? loaded.blogs
            : [...SEED_BLOGS],
        adminUsers:
          loaded.adminUsers && loaded.adminUsers.length > 0
            ? loaded.adminUsers
            : [{ ...SEED_ADMIN }],
        businessSettings: (() => {
          const raw = loaded.businessSettings || SEED_BUSINESS_SETTINGS;
          let num = (raw.whatsappOrderNumber || '918822308551').replace(/\D/g, '');
          if (!num || num.includes('9876543210') || num.includes('1234567890') || num.length < 10) {
            num = '918822308551';
          } else if (num.length === 10) {
            num = `91${num}`;
          }
          return {
            ...SEED_BUSINESS_SETTINGS,
            ...raw,
            whatsappOrderNumber: num,
            phone: raw.phone && !raw.phone.includes('9876543210') ? raw.phone : '+91 88223 08551',
          };
        })(),
        cart: loaded.cart || [],
      };
    } else {
      this.state = this.getInitialState();
      this.saveToStorage();
    }

    this.orderService = this.createOrderService();

    // Start background sync with real-time Google Cloud Firestore
    if (typeof window !== 'undefined') {
      try {
        firestoreSync.subscribeToUpdates((data) => {
          let hasChanges = false;
          if (data.products && data.products.length > 0) {
            this.state.products = mergeEntities(
              this.state.products,
              data.products,
              'id',
              (local) => firestoreSync.saveDocument('products', local.id, local)
            );
            hasChanges = true;
          }
          if (data.businessSettings) {
            const localUpdated = new Date(this.state.businessSettings?.updatedAt || 0).getTime();
            const serverUpdated = new Date(data.businessSettings.updatedAt || 0).getTime();

            if (serverUpdated >= localUpdated || !this.state.businessSettings?.updatedAt) {
              let num = (data.businessSettings.whatsappOrderNumber || '918822308551').replace(/\D/g, '');
              if (!num || num.includes('9876543210') || num.includes('1234567890') || num.length < 10) {
                num = '918822308551';
              } else if (num.length === 10) {
                num = `91${num}`;
              }
              this.state.businessSettings = {
                ...data.businessSettings,
                whatsappOrderNumber: num,
                phone:
                  data.businessSettings.phone && !data.businessSettings.phone.includes('9876543210')
                    ? data.businessSettings.phone
                    : '+91 88223 08551',
              };
              hasChanges = true;
            } else {
              // Local is newer: push back to Firestore
              firestoreSync.saveDocument('settings', 'business', this.state.businessSettings);
            }
          }
          if (data.orders && data.orders.length > 0) {
            this.state.orders = mergeEntities(
              this.state.orders,
              data.orders,
              'id',
              (local) => firestoreSync.saveDocument('orders', local.id, local)
            ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            hasChanges = true;
          }
          if (data.inventoryMovements && data.inventoryMovements.length > 0) {
            this.state.inventoryMovements = mergeEntities(
              this.state.inventoryMovements,
              data.inventoryMovements,
              'movementId'
            ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            hasChanges = true;
          }
          if (data.invoices && data.invoices.length > 0) {
            this.state.invoices = mergeEntities(
              this.state.invoices,
              data.invoices,
              'invoiceId',
              (local) => firestoreSync.saveDocument('invoices', local.invoiceId, local)
            ).sort(
              (a, b) =>
                new Date(b.createdAt || b.invoiceDate).getTime() -
                new Date(a.createdAt || a.invoiceDate).getTime()
            );
            hasChanges = true;
          }
          if (data.lowStockAlerts && data.lowStockAlerts.length > 0) {
            this.state.lowStockAlerts = data.lowStockAlerts;
            hasChanges = true;
          }
          if (data.suppliers && data.suppliers.length > 0) {
            this.state.suppliers = mergeEntities(
              this.state.suppliers,
              data.suppliers,
              'id',
              (local) => firestoreSync.saveDocument('suppliers', local.id, local)
            );
            hasChanges = true;
          }
          if (data.purchases && data.purchases.length > 0) {
            this.state.purchases = mergeEntities(
              this.state.purchases,
              data.purchases,
              'purchaseId',
              (local) => firestoreSync.saveDocument('purchases', local.purchaseId, local)
            ).sort(
              (a, b) =>
                new Date(b.createdAt || b.purchaseDate).getTime() -
                new Date(a.createdAt || a.purchaseDate).getTime()
            );
            hasChanges = true;
          }
          if (data.expenses && data.expenses.length > 0) {
            this.state.expenses = mergeEntities(
              this.state.expenses,
              data.expenses,
              'expenseId',
              (local) => firestoreSync.saveDocument('expenses', local.expenseId, local)
            ).sort(
              (a, b) =>
                new Date(b.createdAt || b.expenseDate).getTime() -
                new Date(a.createdAt || a.expenseDate).getTime()
            );
            hasChanges = true;
          }
          if (data.customers && data.customers.length > 0) {
            this.state.customers = mergeEntities(this.state.customers, data.customers, 'uid');
            hasChanges = true;
          }
          if (data.blogs && data.blogs.length > 0) {
            this.state.blogs = mergeEntities(
              this.state.blogs,
              data.blogs,
              'id',
              (local) => firestoreSync.saveDocument('blogs', local.id, local)
            ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            hasChanges = true;
          }
          if (data.adminUsers && data.adminUsers.length > 0) {
            this.state.adminUsers = mergeEntities(this.state.adminUsers, data.adminUsers, 'uid');
            hasChanges = true;
          }
          if (data.sales && data.sales.length > 0) {
            this.state.sales = mergeEntities(
              this.state.sales,
              data.sales,
              'saleId',
              (local) => firestoreSync.saveDocument('sales', local.saleId, local)
            ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            hasChanges = true;
          }
          if (data.auditLogs && data.auditLogs.length > 0) {
            this.state.auditLogs = mergeEntities(this.state.auditLogs, data.auditLogs, 'logId').sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            hasChanges = true;
          }
          if (data.crmTimeline && data.crmTimeline.length > 0) {
            this.state.crmTimeline = mergeEntities(this.state.crmTimeline, data.crmTimeline, 'id').sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
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

  private getInitialState(): AppState {
    return {
      products: [...SEED_PRODUCTS],
      orders: [],
      sales: [],
      invoices: [],
      inventoryMovements: [],
      lowStockAlerts: [],
      suppliers: [],
      purchases: [],
      expenses: [],
      customers: [],
      adminUsers: [{ ...SEED_ADMIN }],
      auditLogs: [],
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
    this.state = { ...this.state };
    this.saveToStorage();
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
    this.notify();
    return admin;
  }

  public logoutAdmin(): void {
    this.state.currentAdmin = null;
    this.saveToStorage();
    this.notify();
  }

  // ==========================================
  // Cart Operations
  // ==========================================
  public addToCart(product: Product, quantity = 1): void {
    const cart = [...this.state.cart];
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex >= 0) {
      const existing = cart[existingIndex];
      const newQty = Math.min(product.stockQuantity, existing.quantity + quantity);
      cart[existingIndex] = { ...existing, quantity: newQty };
    } else {
      cart.push({
        product: { ...product },
        quantity: Math.min(product.stockQuantity, quantity),
      });
    }
    this.state = {
      ...this.state,
      cart,
    };
    this.notify();
  }

  public updateCartQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    const cart = this.state.cart.map((item) => {
      if (item.product.id === productId) {
        return {
          ...item,
          quantity: Math.min(item.product.stockQuantity, quantity),
        };
      }
      return item;
    });
    this.state = {
      ...this.state,
      cart,
    };
    this.notify();
  }

  public removeFromCart(productId: string): void {
    this.state = {
      ...this.state,
      cart: this.state.cart.filter((i) => i.product.id !== productId),
    };
    this.notify();
  }

  public clearCart(): void {
    this.state = {
      ...this.state,
      cart: [],
    };
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

    this.syncFromOrderService();

    // Update customer stats
    customer.totalOrders += 1;
    customer.lastOrderDate = new Date().toISOString();

    const pendingOrder = this.state.orders.find((o) => o.id === order.id) || order;

    const whatsappUrl = generateWhatsAppOrderUrl({
      phoneNumber: this.state.businessSettings.whatsappOrderNumber,
      orderNumber: pendingOrder.orderNumber,
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
      grandTotal: pendingOrder.grandTotal,
      notes,
    });

    // Execute strict ACID transaction in Cloud Firestore (records order intent without auto-confirming)
    firestoreSync.createOrderACID({
      customer,
      address,
      items: [{ product, quantity }],
      notes,
      isWhatsApp: true,
      autoConfirm: false,
    }).catch((err) => {
      console.warn('[AppStore] Firestore ACID order commit notice:', err);
    });

    this.notify();
    return { order: pendingOrder, whatsappUrl };
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

    this.syncFromOrderService();

    // Update customer stats
    customer.totalOrders += 1;
    customer.lastOrderDate = new Date().toISOString();

    const pendingOrder = this.state.orders.find((o) => o.id === order.id) || order;

    const whatsappUrl = generateWhatsAppOrderUrl({
      phoneNumber: this.state.businessSettings.whatsappOrderNumber,
      orderNumber: pendingOrder.orderNumber,
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
      grandTotal: pendingOrder.grandTotal,
      notes,
    });

    // Clear cart and execute strict ACID transaction in Cloud Firestore (records order intent without auto-confirming)
    const itemsSnapshot = this.state.cart.map(({ product, quantity }) => ({ product, quantity }));
    this.clearCart();

    firestoreSync.createOrderACID({
      customer,
      address,
      items: itemsSnapshot,
      notes,
      isWhatsApp: true,
      autoConfirm: false,
    }).catch((err) => {
      console.warn('[AppStore] Firestore ACID cart order commit notice:', err);
    });

    this.notify();
    return { order: pendingOrder, whatsappUrl };
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

    // Save updated products with deducted stock to Firestore
    for (const item of result.order.items) {
      const prod = this.state.products.find((p) => p.id === item.productId);
      if (prod) {
        firestoreSync.saveDocument('products', prod.id, prod);
      }
    }

    // Save generated inventory movements & alerts to Firestore
    for (const mov of this.state.inventoryMovements) {
      if (mov.referenceId === result.order.orderNumber) {
        firestoreSync.saveDocument('inventoryMovements', mov.movementId, mov);
      }
    }
    for (const alert of this.state.lowStockAlerts) {
      firestoreSync.saveDocument('lowStockAlerts', alert.alertId, alert);
    }

    this.notify();
    return result;
  }

  public async cancelOrder(
    orderId: string,
    actor?: { uid: string; email: string; role: any }
  ): Promise<Order> {
    const admin = actor || this.state.currentAdmin || SEED_ADMIN;
    const result = await this.orderService.cancelOrder(orderId, admin);
    this.syncFromOrderService();
    firestoreSync.saveDocument('orders', orderId, result);

    // Save replenished products to Firestore
    for (const item of result.items) {
      const prod = this.state.products.find((p) => p.id === item.productId);
      if (prod) {
        firestoreSync.saveDocument('products', prod.id, prod);
      }
    }

    // Save return inventory movements & alerts to Firestore
    for (const mov of this.state.inventoryMovements) {
      if (mov.referenceId === result.orderNumber && mov.type === 'RETURN') {
        firestoreSync.saveDocument('inventoryMovements', mov.movementId, mov);
      }
    }
    for (const alert of this.state.lowStockAlerts) {
      firestoreSync.saveDocument('lowStockAlerts', alert.alertId, alert);
    }

    if (result.saleId) {
      firestoreSync.deleteDocument('sales', result.saleId);
    }

    this.notify();
    return result;
  }

  public updateOrderStatus(orderId: string, status: any): void {
    if (status === 'CANCELLED') {
      this.cancelOrder(orderId).catch((err) => {
        console.error('[AppStore] Failed to cancel order:', err);
      });
      return;
    }

    const order = this.state.orders.find((o) => o.id === orderId);
    if (order) {
      const now = new Date().toISOString();
      order.status = status;
      order.updatedAt = now;
      if (status === 'CONFIRMED' && !order.confirmedAt) {
        order.confirmedAt = now;
      } else if (status === 'PROCESSING' && !order.processingAt) {
        order.processingAt = now;
      } else if (status === 'SHIPPED' && !order.shippedAt) {
        order.shippedAt = now;
      } else if (status === 'DELIVERED' && !order.deliveredAt) {
        order.deliveredAt = now;
      }

      const osOrder = this.orderService.getState().orders[orderId];
      if (osOrder) {
        Object.assign(osOrder, order);
      }
      firestoreSync.saveDocument('orders', orderId, order);
      this.notify();
    }
  }

  public shipOrder(
    orderId: string,
    courierName: string,
    trackingNumber: string,
    trackingUrl?: string
  ): void {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const prevStatus = order.status;
    const now = new Date().toISOString();
    order.status = 'SHIPPED';
    order.shippedAt = now;
    order.updatedAt = now;
    order.courierName = courierName;
    order.trackingNumber = trackingNumber;
    order.trackingUrl = trackingUrl;

    const osOrder = this.orderService.getState().orders[orderId];
    if (osOrder) {
      Object.assign(osOrder, order);
    }

    this.state.crmTimeline.unshift({
      id: `crm_${Date.now()}`,
      customerId: order.customerId,
      type: 'ORDER_SHIPPED',
      description: `Order ${order.orderNumber} dispatched via ${courierName} (Tracking: ${trackingNumber})`,
      metadata: { orderId: order.id, courierName, trackingNumber, trackingUrl },
      createdAt: now,
    });

    const logEntry: AuditLog = {
      logId: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actorUid: this.state.currentAdmin?.uid || 'admin',
      actorEmail: this.state.currentAdmin?.email || 'admin@teanest.in',
      actorRole: this.state.currentAdmin?.role || 'SUPER_ADMIN',
      action: 'ORDER_SHIPPED',
      entityType: 'ORDER',
      entityId: order.id,
      before: { status: prevStatus, paymentStatus: order.paymentStatus },
      after: {
        status: 'SHIPPED',
        paymentStatus: order.paymentStatus,
        orderNumber: order.orderNumber,
        courierName,
        trackingNumber,
        trackingUrl,
      },
      timestamp: now,
    };
    this.state.auditLogs.unshift(logEntry);
    if (this.orderService.getState().auditLogs) {
      this.orderService.getState().auditLogs.unshift(logEntry);
    }
    firestoreSync.saveDocument('auditLogs', logEntry.logId, logEntry);

    firestoreSync.saveDocument('orders', orderId, order);
    this.notify();
  }

  public updateOrderPaymentStatus(orderId: string, paymentStatus: 'UNPAID' | 'PAID'): void {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (order) {
      const prevPaymentStatus = order.paymentStatus || 'UNPAID';
      const now = new Date().toISOString();
      order.paymentStatus = paymentStatus;
      order.updatedAt = now;

      const osOrder = this.orderService.getState().orders[orderId];
      if (osOrder) {
        osOrder.paymentStatus = paymentStatus;
        osOrder.updatedAt = now;
      }
      const invoice = this.state.invoices.find((i) => i.orderId === orderId);
      if (invoice) {
        invoice.paymentStatus = paymentStatus;
        firestoreSync.saveDocument('invoices', invoice.invoiceId, invoice);
      }
      const sale = this.state.sales.find((s) => s.orderId === orderId);
      if (sale) {
        sale.paymentStatus = paymentStatus;
        firestoreSync.saveDocument('sales', sale.saleId, sale);
      }
      firestoreSync.saveDocument('orders', orderId, order);

      // Record Audit Log for Payment Status Update
      const logEntry: AuditLog = {
        logId: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        actorUid: this.state.currentAdmin?.uid || 'admin',
        actorEmail: this.state.currentAdmin?.email || 'admin@teanest.in',
        actorRole: this.state.currentAdmin?.role || 'SUPER_ADMIN',
        action: 'ORDER_PAYMENT_UPDATED',
        entityType: 'ORDER',
        entityId: order.id,
        before: { orderNumber: order.orderNumber, paymentStatus: prevPaymentStatus },
        after: { orderNumber: order.orderNumber, paymentStatus },
        timestamp: now,
      };
      this.state.auditLogs.unshift(logEntry);
      if (this.orderService.getState().auditLogs) {
        this.orderService.getState().auditLogs.unshift(logEntry);
      }
      firestoreSync.saveDocument('auditLogs', logEntry.logId, logEntry);

      // Record CRM timeline event
      this.state.crmTimeline.unshift({
        id: `crm_${Date.now()}`,
        customerId: order.customerId,
        type: 'ORDER_CONFIRMED',
        description: `Order ${order.orderNumber} payment marked as ${paymentStatus}.`,
        metadata: { orderId: order.id, orderNumber: order.orderNumber, paymentStatus },
        createdAt: now,
      });

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
    for (const item of purchase.items) {
      const prod = this.state.products.find((p) => p.id === item.productId);
      if (prod) {
        firestoreSync.saveDocument('products', prod.id, prod);
      }
    }
    firestoreSync.saveDocument('purchases', purchase.purchaseId, purchase);
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

    this.state.auditLogs.push({
      logId: `log_${Date.now()}`,
      actorUid: this.state.currentAdmin?.uid || 'admin',
      actorEmail: this.state.currentAdmin?.email || 'admin@teanest.in',
      actorRole: this.state.currentAdmin?.role || 'SUPER_ADMIN',
      action: 'SUPPLIER_CREATED',
      entityType: 'SUPPLIER',
      entityId: supplier.id,
      after: supplier,
      timestamp: new Date().toISOString(),
    });

    this.notify();
    return supplier;
  }

  public updateSupplier(id: string, updates: Partial<Supplier>): Supplier {
    const supplier = this.state.suppliers.find((s) => s.id === id);
    if (!supplier) throw new Error('Supplier not found');

    const before = { ...supplier };
    Object.assign(supplier, updates, { updatedAt: new Date().toISOString() });
    firestoreSync.saveDocument('suppliers', supplier.id, supplier);

    this.state.auditLogs.push({
      logId: `log_${Date.now()}`,
      actorUid: this.state.currentAdmin?.uid || 'admin',
      actorEmail: this.state.currentAdmin?.email || 'admin@teanest.in',
      actorRole: this.state.currentAdmin?.role || 'SUPER_ADMIN',
      action: 'SUPPLIER_UPDATED',
      entityType: 'SUPPLIER',
      entityId: supplier.id,
      before,
      after: supplier,
      timestamp: new Date().toISOString(),
    });

    this.notify();
    return supplier;
  }

  public deleteSupplier(id: string): void {
    const supplier = this.state.suppliers.find((s) => s.id === id);
    if (!supplier) return;

    this.state.suppliers = this.state.suppliers.filter((s) => s.id !== id);
    firestoreSync.deleteDocument('suppliers', id);

    this.state.auditLogs.push({
      logId: `log_${Date.now()}`,
      actorUid: this.state.currentAdmin?.uid || 'admin',
      actorEmail: this.state.currentAdmin?.email || 'admin@teanest.in',
      actorRole: this.state.currentAdmin?.role || 'SUPER_ADMIN',
      action: 'SUPPLIER_DELETED',
      entityType: 'SUPPLIER',
      entityId: id,
      before: supplier,
      timestamp: new Date().toISOString(),
    });

    this.notify();
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

  public async updateBusinessSettings(
    settings: Partial<BusinessSettings>
  ): Promise<{ success: boolean; error?: string }> {
    this.state.businessSettings = {
      ...this.state.businessSettings,
      ...settings,
      updatedAt: new Date().toISOString(),
    };

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
    return await firestoreSync.saveDocument('settings', 'business', this.state.businessSettings);
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
    this.state.orders = Object.values(s.orders).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    this.state.sales = Object.values(s.sales).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    this.state.invoices = Object.values(s.invoices).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    this.state.inventoryMovements = [...s.inventoryMovements].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    this.state.lowStockAlerts = Object.values(s.lowStockAlerts);
    this.state.auditLogs = [...s.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    this.state.crmTimeline = [...s.crmTimeline].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

// Singleton export
export const globalStore = new AppStore();
