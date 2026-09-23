import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { Functions } from 'firebase/functions';
import { initFirebase, httpsCallable } from '../firebase';
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
  AuditLog,
  CRMTimelineEvent,
  BusinessSettings,
  AdminUser,
  BlogPost,
  Address,
  OrderItem,
  InvoiceItem,
} from '@tea-nest/types';
import {
  SEED_ADMIN,
  SEED_BUSINESS_SETTINGS,
  SEED_PRODUCT,
  SEED_BLOGS,
} from '../seedData';
import { calculateTaxableFromInclusive } from '../tax';
import { calculateLowStockThreshold, isLowStock } from '../inventory';
import { amountToWords } from '../formatters';

export interface FirestoreCollectionsData {
  products?: Product[];
  orders?: Order[];
  sales?: Sale[];
  invoices?: Invoice[];
  inventoryMovements?: InventoryMovement[];
  lowStockAlerts?: LowStockAlert[];
  suppliers?: Supplier[];
  purchases?: Purchase[];
  expenses?: Expense[];
  customers?: CustomerProfile[];
  adminUsers?: AdminUser[];
  auditLogs?: AuditLog[];
  crmTimeline?: CRMTimelineEvent[];
  businessSettings?: BusinessSettings;
  blogs?: BlogPost[];
}

export interface SyncStatus {
  status: 'synced' | 'syncing' | 'error' | 'offline';
  lastError: string | null;
  lastSyncedAt: string | null;
}

export class FirestoreSyncService {
  private db: Firestore | null = null;
  private functions: Functions | null = null;
  private unsubscribers: Unsubscribe[] = [];
  private isBootstrapping = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;
    try {
      const { db, functions } = initFirebase();
      this.db = db;
      this.functions = functions;
    } catch (err) {
      console.warn('[FirestoreSync] Failed to initialize Firebase client:', err);
    }
  }

  public getDb(): Firestore | null {
    if (!this.db && typeof window !== 'undefined') {
      try {
        const { db } = initFirebase();
        this.db = db;
      } catch (err) {
        console.warn('[FirestoreSync] Re-init error:', err);
      }
    }
    return this.db;
  }

  public getFunctions(): Functions | null {
    if (!this.functions && typeof window !== 'undefined') {
      try {
        const { functions } = initFirebase();
        this.functions = functions;
      } catch (err) {
        console.warn('[FirestoreSync] Re-init error:', err);
      }
    }
    return this.functions;
  }

  /**
   * Execute a trusted Cloud Function
   */
  public async callFunction<TRequest = any, TResponse = any>(
    functionName: string,
    data?: TRequest
  ): Promise<TResponse> {
    const fns = this.getFunctions();
    if (!fns) {
      throw new Error('Firebase Functions is not initialized.');
    }
    const callable = httpsCallable<TRequest, TResponse>(fns, functionName);
    const result = await callable(data);
    return result.data;
  }

  /**
   * Automatically bootstrap initial production configuration and data in Cloud Firestore if empty.
   * Guarantees all data originates from Firestore database documents.
   */
  public async bootstrapInitialDataIfEmpty(): Promise<void> {
    const db = this.getDb();
    if (!db || this.isBootstrapping) return;
    this.isBootstrapping = true;

    try {
      const settingsDocRef = doc(db, 'settings', 'business');
      const settingsSnap = await getDoc(settingsDocRef);

      if (!settingsSnap.exists()) {
        console.log('[FirestoreSync] Seeding initial database configuration into Cloud Firestore...');

        // 1. Business Settings
        await setDoc(settingsDocRef, {
          ...SEED_BUSINESS_SETTINGS,
          updatedAt: new Date().toISOString(),
        });

        // 2. Verified GST Rates
        await setDoc(doc(db, 'gstRates', '0902'), {
          hsnCode: '0902',
          description: 'Tea, whether or not flavoured',
          rate: 5,
          effectiveFrom: new Date().toISOString(),
        });

        // 3. Expense Categories Master
        const categories = [
          'Packaging',
          'Logistics & Courier',
          'Raw Tea Inventory',
          'Rent & Estate',
          'Marketing',
          'Utilities',
          'Miscellaneous',
        ];
        for (const cat of categories) {
          const catId = cat.toLowerCase().replace(/[^a-z0-9]/g, '_');
          await setDoc(doc(db, 'expenseCategories', catId), {
            id: catId,
            name: cat,
            isActive: true,
          });
        }

        // 4. Sequential Transaction Counters (For ACID Number Generation)
        await setDoc(doc(db, 'counters', 'orders'), { last: 0 }, { merge: true });
        await setDoc(doc(db, 'counters', 'invoices'), { last: 0 }, { merge: true });
        await setDoc(doc(db, 'counters', 'sales'), { last: 0 }, { merge: true });
        await setDoc(doc(db, 'counters', 'po'), { last: 0 }, { merge: true });
        await setDoc(doc(db, 'counters', 'grn'), { last: 0 }, { merge: true });

        // 5. Single Owner Admin Profile
        await setDoc(doc(db, 'adminUsers', SEED_ADMIN.uid), {
          ...SEED_ADMIN,
          updatedAt: new Date().toISOString(),
        });

        // 6. Primary Products
        const productsSnap = await getDocs(collection(db, 'products'));
        if (productsSnap.empty) {
          await setDoc(doc(db, 'products', SEED_PRODUCT.id), {
            ...SEED_PRODUCT,
            updatedAt: new Date().toISOString(),
          });
        }

        // 7. Initial Curated Blog Stories
        const blogsSnap = await getDocs(collection(db, 'blogs'));
        if (blogsSnap.empty) {
          for (const blog of SEED_BLOGS) {
            await setDoc(doc(db, 'blogs', blog.id), blog);
          }
        }

        console.log('[FirestoreSync] Cloud Firestore initialized with verified seed schema.');
      }
    } catch (err) {
      console.warn('[FirestoreSync] Bootstrap configuration notice:', err);
    } finally {
      this.isBootstrapping = false;
    }
  }

  /**
   * Subscribes to real-time live updates for all Cloud Firestore collections
   */
  public subscribeToUpdates(onData: (data: FirestoreCollectionsData) => void): () => void {
    const db = this.getDb();
    if (!db) return () => {};

    // 1. Products (Public read stream)
    try {
      const unsubProducts = onSnapshot(
        collection(db, 'products'),
        (snapshot) => {
          if (!snapshot.empty) {
            const products: Product[] = [];
            snapshot.forEach((d) => products.push(d.data() as Product));
            onData({ products });
          }
        },
        (err) => console.warn('[FirestoreSync] Products snapshot notice:', err)
      );
      this.unsubscribers.push(unsubProducts);
    } catch {
      // Stream registration skipped if client is uninitialized
    }

    // 2. Business Settings (Public read stream)
    try {
      const unsubSettings = onSnapshot(
        collection(db, 'settings'),
        (snapshot) => {
          if (!snapshot.empty) {
            const bizDoc = snapshot.docs.find((d) => d.id === 'business');
            if (bizDoc) {
              onData({ businessSettings: bizDoc.data() as BusinessSettings });
            }
          }
        },
        (err) => console.warn('[FirestoreSync] Business settings snapshot notice:', err)
      );
      this.unsubscribers.push(unsubSettings);
    } catch {
      // Stream registration skipped if client is uninitialized
    }

    // 3. Orders (Live orders stream)
    try {
      const unsubOrders = onSnapshot(
        collection(db, 'orders'),
        (snapshot) => {
          if (!snapshot.empty) {
            const orders: Order[] = [];
            snapshot.forEach((d) => orders.push(d.data() as Order));
            onData({ orders });
          }
        },
        (err) => console.warn('[FirestoreSync] Orders snapshot notice:', err)
      );
      this.unsubscribers.push(unsubOrders);
    } catch {
      // Stream registration skipped if client is uninitialized
    }

    // 4. Invoices (Live invoices stream)
    try {
      const unsubInvoices = onSnapshot(
        collection(db, 'invoices'),
        (snapshot) => {
          if (!snapshot.empty) {
            const invoices: Invoice[] = [];
            snapshot.forEach((d) => invoices.push(d.data() as Invoice));
            onData({ invoices });
          }
        },
        (err) => console.warn('[FirestoreSync] Invoices snapshot notice:', err)
      );
      this.unsubscribers.push(unsubInvoices);
    } catch {
      // Stream registration skipped if client is uninitialized
    }

    // 5. Stock Movements (Live ledger)
    try {
      const unsubMovements = onSnapshot(
        collection(db, 'stockMovements'),
        (snapshot) => {
          if (!snapshot.empty) {
            const inventoryMovements: InventoryMovement[] = [];
            snapshot.forEach((d) => inventoryMovements.push(d.data() as InventoryMovement));
            onData({ inventoryMovements });
          }
        },
        (err) => console.warn('[FirestoreSync] Stock movements snapshot notice:', err)
      );
      this.unsubscribers.push(unsubMovements);
    } catch {
      // Stream registration skipped if client is uninitialized
    }

    // 6. Low Stock Alerts
    try {
      const unsubAlerts = onSnapshot(
        collection(db, 'lowStockAlerts'),
        (snapshot) => {
          if (!snapshot.empty) {
            const lowStockAlerts: LowStockAlert[] = [];
            snapshot.forEach((d) => lowStockAlerts.push(d.data() as LowStockAlert));
            onData({ lowStockAlerts });
          }
        },
        (err) => console.warn('[FirestoreSync] Low stock alerts snapshot notice:', err)
      );
      this.unsubscribers.push(unsubAlerts);
    } catch {
      // Stream registration skipped if client is uninitialized
    }

    // 7. Suppliers
    try {
      const unsubSuppliers = onSnapshot(
        collection(db, 'suppliers'),
        (snapshot) => {
          if (!snapshot.empty) {
            const suppliers: Supplier[] = [];
            snapshot.forEach((d) => suppliers.push(d.data() as Supplier));
            onData({ suppliers });
          }
        },
        (err) => console.warn('[FirestoreSync] Suppliers snapshot notice:', err)
      );
      this.unsubscribers.push(unsubSuppliers);
    } catch {
      // Stream registration skipped if client is uninitialized
    }

    // 8. Purchases
    try {
      const unsubPurchases = onSnapshot(
        collection(db, 'purchases'),
        (snapshot) => {
          if (!snapshot.empty) {
            const purchases: Purchase[] = [];
            snapshot.forEach((d) => purchases.push(d.data() as Purchase));
            onData({ purchases });
          }
        },
        (err) => console.warn('[FirestoreSync] Purchases snapshot notice:', err)
      );
      this.unsubscribers.push(unsubPurchases);
    } catch {
      // Stream registration skipped if client is uninitialized
    }

    // 9. Expenses
    try {
      const unsubExpenses = onSnapshot(
        collection(db, 'expenses'),
        (snapshot) => {
          if (!snapshot.empty) {
            const expenses: Expense[] = [];
            snapshot.forEach((d) => expenses.push(d.data() as Expense));
            onData({ expenses });
          }
        },
        (err) => console.warn('[FirestoreSync] Expenses snapshot notice:', err)
      );
      this.unsubscribers.push(unsubExpenses);
    } catch {
      // Stream registration skipped if client is uninitialized
    }

    // 10. Customers
    try {
      const unsubCustomers = onSnapshot(
        collection(db, 'customers'),
        (snapshot) => {
          if (!snapshot.empty) {
            const customers: CustomerProfile[] = [];
            snapshot.forEach((d) => customers.push(d.data() as CustomerProfile));
            onData({ customers });
          }
        },
        (err) => console.warn('[FirestoreSync] Customers snapshot notice:', err)
      );
      this.unsubscribers.push(unsubCustomers);
    } catch {
      // Stream registration skipped if client is uninitialized
    }

    // 11. Blogs
    try {
      const unsubBlogs = onSnapshot(
        collection(db, 'blogs'),
        (snapshot) => {
          if (!snapshot.empty) {
            const blogs: BlogPost[] = [];
            snapshot.forEach((d) => blogs.push(d.data() as BlogPost));
            onData({ blogs });
          }
        },
        (err) => console.warn('[FirestoreSync] Blogs snapshot notice:', err)
      );
      this.unsubscribers.push(unsubBlogs);
    } catch {
      // Stream registration skipped if client is uninitialized
    }

    // 12. Admin Users
    try {
      const unsubAdmin = onSnapshot(
        collection(db, 'adminUsers'),
        (snapshot) => {
          if (!snapshot.empty) {
            const adminUsers: AdminUser[] = [];
            snapshot.forEach((d) => adminUsers.push(d.data() as AdminUser));
            onData({ adminUsers });
          }
        },
        (err) => console.warn('[FirestoreSync] Admin users snapshot notice:', err)
      );
      this.unsubscribers.push(unsubAdmin);
    } catch {
      // Stream registration skipped if client is uninitialized
    }

    // 13. Sales (Live sales ledger)
    try {
      const unsubSales = onSnapshot(
        collection(db, 'sales'),
        (snapshot) => {
          if (!snapshot.empty) {
            const sales: Sale[] = [];
            snapshot.forEach((d) => sales.push(d.data() as Sale));
            onData({ sales });
          }
        },
        (err) => console.warn('[FirestoreSync] Sales snapshot notice:', err)
      );
      this.unsubscribers.push(unsubSales);
    } catch {
      // Stream registration skipped if client is uninitialized
    }

    // 14. Audit Logs (Live forensic stream)
    try {
      const unsubAudit = onSnapshot(
        collection(db, 'auditLogs'),
        (snapshot) => {
          if (!snapshot.empty) {
            const auditLogs: AuditLog[] = [];
            snapshot.forEach((d) => auditLogs.push(d.data() as AuditLog));
            onData({ auditLogs });
          }
        },
        (err) => console.warn('[FirestoreSync] Audit logs snapshot notice:', err)
      );
      this.unsubscribers.push(unsubAudit);
    } catch {
      // Stream registration skipped if client is uninitialized
    }

    // 15. CRM Timeline (Live event stream)
    try {
      const unsubCrm = onSnapshot(
        collection(db, 'crmTimeline'),
        (snapshot) => {
          if (!snapshot.empty) {
            const crmTimeline: CRMTimelineEvent[] = [];
            snapshot.forEach((d) => crmTimeline.push(d.data() as CRMTimelineEvent));
            onData({ crmTimeline });
          }
        },
        (err) => console.warn('[FirestoreSync] CRM timeline snapshot notice:', err)
      );
      this.unsubscribers.push(unsubCrm);
    } catch {
      // Stream registration skipped if client is uninitialized
    }

    // Bootstrap seed check in background
    this.bootstrapInitialDataIfEmpty();

    return () => {
      this.unsubscribers.forEach((u) => u());
      this.unsubscribers = [];
    };
  }

  // =========================================================================
  // STRICT ACID TRANSACTIONS (Atomicity, Consistency, Isolation, Durability)
  // =========================================================================

  /**
   * Atomically place an order, lock/deduct inventory, assign sequential order number,
   * issue invoice & sale record if confirmed, log stock movements, and update customer CRM.
   */
  public async createOrderACID(params: {
    customer: CustomerProfile;
    address: Address;
    items: Array<{
      product: Product;
      quantity: number;
    }>;
    notes?: string;
    isWhatsApp?: boolean;
    autoConfirm?: boolean;
    actor?: AdminUser;
  }): Promise<{ order: Order; invoice?: Invoice; sale?: Sale }> {
    const db = this.getDb();
    if (!db) {
      throw new Error('Cloud Firestore is offline or uninitialized.');
    }

    return await runTransaction(db, async (transaction) => {
      const now = new Date().toISOString();

      // 1. ISOLATION & CONSISTENCY: Read and validate stock for all products inside the transaction
      const productDocs: { ref: any; data: Product; requestedQty: number }[] = [];
      for (const item of params.items) {
        const prodRef = doc(db, 'products', item.product.id);
        const prodSnap = await transaction.get(prodRef);

        if (!prodSnap.exists()) {
          throw new Error(`Product ${item.product.name} (ID: ${item.product.id}) not found.`);
        }

        const currentProduct = prodSnap.data() as Product;
        if (currentProduct.stockQuantity < item.quantity) {
          throw new Error(
            `Insufficient stock for "${currentProduct.name}". Available: ${currentProduct.stockQuantity}, Requested: ${item.quantity}.`
          );
        }

        productDocs.push({
          ref: prodRef,
          data: currentProduct,
          requestedQty: item.quantity,
        });
      }

      // 2. CONSISTENCY: Read and atomically increment the sequential Order Counter
      const orderCounterRef = doc(db, 'counters', 'orders');
      const orderCounterSnap = await transaction.get(orderCounterRef);
      const lastOrderNum = orderCounterSnap.exists() ? orderCounterSnap.data()?.last || 0 : 0;
      const nextOrderNum = lastOrderNum + 1;
      transaction.set(orderCounterRef, { last: nextOrderNum }, { merge: true });

      const paddedOrderNum = String(nextOrderNum).padStart(6, '0');
      const orderNumber = `TN-2026-${paddedOrderNum}`;
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // 3. ATOMICITY: Calculate GST Breakdown & Order Items
      let subtotalTaxable = 0;
      let totalTax = 0;
      let totalGrand = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalCostOfGoods = 0;

      const orderItems: OrderItem[] = params.items.map(({ product, quantity }) => {
        const lineTotal = product.sellingPrice * quantity;
        const taxRes = calculateTaxableFromInclusive(lineTotal, product.gstRate, false);

        subtotalTaxable += taxRes.taxableAmount;
        totalTax += taxRes.totalTax;
        totalGrand += lineTotal;
        totalCgst += taxRes.cgst;
        totalSgst += taxRes.sgst;
        totalCostOfGoods += (product.purchasePrice || 0) * quantity;

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
          total: lineTotal,
          image: product.thumbnail?.secureUrl,
        };
      });

      const orderStatus = params.autoConfirm ? 'CONFIRMED' : 'WHATSAPP_PENDING';

      const orderDocData: Order = {
        id: orderId,
        orderNumber,
        customerId: params.customer.uid,
        customerName: params.customer.name,
        customerMobile: params.customer.mobile,
        customerEmail: params.customer.email,
        shippingAddress: params.address,
        items: orderItems,
        subtotal: Math.round(subtotalTaxable * 100) / 100,
        discount: 0,
        taxableAmount: Math.round(subtotalTaxable * 100) / 100,
        tax: Math.round(totalTax * 100) / 100,
        cgst: Math.round(totalCgst * 100) / 100,
        sgst: Math.round(totalSgst * 100) / 100,
        igst: 0,
        shipping: 0,
        grandTotal: Math.round(totalGrand * 100) / 100,
        status: orderStatus,
        paymentStatus: 'UNPAID',
        paymentMethod: params.isWhatsApp ? 'WHATSAPP' : 'ONLINE',
        isWhatsAppOrder: Boolean(params.isWhatsApp),
        whatsappMessageSent: Boolean(params.isWhatsApp),
        notes: params.notes || '',
        createdAt: now,
        updatedAt: now,
        confirmedAt: params.autoConfirm ? now : undefined,
      };

      // 4. ATOMICITY: If autoConfirm, deduct inventory & record Stock Movement Ledger inside transaction
      if (params.autoConfirm) {
        for (const p of productDocs) {
          const newQty = p.data.stockQuantity - p.requestedQty;
          const threshold = calculateLowStockThreshold(
            p.data.stockReferenceQty || 100,
            p.data.lowStockPercent || 70
          );

          transaction.update(p.ref, {
            stockQuantity: newQty,
            lowStockThresholdQty: threshold,
            updatedAt: now,
          });

          // Stock Movement Ledger Entry
          const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const movRef = doc(db, 'stockMovements', movId);
          const movement: InventoryMovement = {
            movementId: movId,
            productId: p.data.id,
            productName: p.data.name,
            type: 'SALE',
            quantity: p.requestedQty,
            beforeQuantity: p.data.stockQuantity,
            afterQuantity: newQty,
            referenceId: orderId,
            reason: `Order ${orderNumber} confirmed`,
            createdBy: params.customer.email,
            createdAt: now,
          };
          transaction.set(movRef, movement);

          // Check Low-Stock Alert
          if (isLowStock(newQty, threshold)) {
            const alertId = `alert_${p.data.id}`;
            const alertRef = doc(db, 'lowStockAlerts', alertId);
            transaction.set(
              alertRef,
              {
                alertId,
                productId: p.data.id,
                productName: p.data.name,
                currentStock: newQty,
                threshold,
                status: 'ACTIVE',
                createdAt: now,
              },
              { merge: true }
            );
          }
        }
      }

      // 5. ATOMICITY: If auto-confirmed, atomically generate sequential GST Invoice
      let createdInvoice: Invoice | undefined = undefined;
      let createdSale: Sale | undefined = undefined;

      if (params.autoConfirm) {
        const invoiceCounterRef = doc(db, 'counters', 'invoices');
        const invoiceCounterSnap = await transaction.get(invoiceCounterRef);
        const lastInvNum = invoiceCounterSnap.exists() ? invoiceCounterSnap.data()?.last || 0 : 0;
        const nextInvNum = lastInvNum + 1;
        transaction.set(invoiceCounterRef, { last: nextInvNum }, { merge: true });

        const invoiceNumber = `INV-2026-${String(nextInvNum).padStart(6, '0')}`;
        const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        const saleCounterRef = doc(db, 'counters', 'sales');
        const saleCounterSnap = await transaction.get(saleCounterRef);
        const lastSaleNum = saleCounterSnap.exists() ? saleCounterSnap.data()?.last || 0 : 0;
        const nextSaleNum = lastSaleNum + 1;
        transaction.set(saleCounterRef, { last: nextSaleNum }, { merge: true });

        const saleNumber = `SL-2026-${String(nextSaleNum).padStart(6, '0')}`;
        const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        const settingsRef = doc(db, 'settings', 'business');
        const settingsSnap = await transaction.get(settingsRef);
        const bizSettings = settingsSnap.exists()
          ? (settingsSnap.data() as BusinessSettings)
          : SEED_BUSINESS_SETTINGS;

        const invoiceItems: InvoiceItem[] = orderItems.map((i) => ({
          productId: i.productId,
          productName: i.name,
          sku: i.sku,
          hsnCode: '0902',
          weight: i.weight,
          unit: i.unit,
          quantity: i.quantity,
          unitPrice: i.price,
          taxableValue: i.taxableAmount,
          gstRate: i.gstRate,
          cgst: i.tax / 2,
          sgst: i.tax / 2,
          igst: 0,
          total: i.total,
        }));

        createdInvoice = {
          invoiceId,
          invoiceNumber,
          orderId,
          orderNumber,
          saleId,
          invoiceDate: now,
          dueDate: now,
          businessDetails: {
            businessName: bizSettings.businessName,
            brandName: bizSettings.brandName,
            gstin: bizSettings.gstin,
            pan: bizSettings.pan,
            address: bizSettings.address,
            city: bizSettings.city,
            state: bizSettings.state,
            pincode: bizSettings.pincode,
            phone: bizSettings.phone,
            email: bizSettings.email,
          },
          customerDetails: {
            customerId: params.customer.uid,
            name: params.customer.name,
            email: params.customer.email,
            mobile: params.customer.mobile,
            address: `${params.address.street}, ${params.address.city}`,
            city: params.address.city,
            state: params.address.state,
            pincode: params.address.pincode,
          },
          items: invoiceItems,
          subtotal: orderDocData.subtotal,
          taxableAmount: orderDocData.taxableAmount,
          gstRate: 5,
          cgst: orderDocData.cgst,
          sgst: orderDocData.sgst,
          igst: 0,
          shipping: 0,
          grandTotal: orderDocData.grandTotal,
          amountInWords: amountToWords(orderDocData.grandTotal),
          termsAndConditions: bizSettings.terms || '',
          bankDetails: {
            bankName: bizSettings.bankName,
            accountNumber: bizSettings.accountNumber,
            ifsc: bizSettings.ifsc,
            upi: bizSettings.upi,
          },
          status: 'ISSUED',
          paymentStatus: 'UNPAID',
          createdAt: now,
        };

        createdSale = {
          saleId,
          saleNumber,
          orderId,
          orderNumber,
          customerId: params.customer.uid,
          customerName: params.customer.name,
          items: orderItems,
          subtotal: orderDocData.subtotal,
          discount: 0,
          taxableAmount: orderDocData.taxableAmount,
          gst: orderDocData.tax,
          cgst: orderDocData.cgst,
          sgst: orderDocData.sgst,
          igst: 0,
          shipping: 0,
          grandTotal: orderDocData.grandTotal,
          costOfGoods: totalCostOfGoods,
          profit: orderDocData.grandTotal - totalCostOfGoods,
          paymentStatus: 'UNPAID',
          saleDate: now,
          createdAt: now,
        };

        orderDocData.invoiceId = invoiceId;
        orderDocData.saleId = saleId;

        transaction.set(doc(db, 'invoices', invoiceId), createdInvoice);
        transaction.set(doc(db, 'sales', saleId), createdSale);
      }

      // 6. ATOMICITY: Write Order, Customer CRM & Audit Log
      transaction.set(doc(db, 'orders', orderId), orderDocData);

      // Customer Profile Update
      const custRef = doc(db, 'customers', params.customer.uid);
      const custSnap = await transaction.get(custRef);
      const currentCust = custSnap.exists() ? (custSnap.data() as CustomerProfile) : params.customer;
      transaction.set(
        custRef,
        {
          ...currentCust,
          totalOrders: (currentCust.totalOrders || 0) + 1,
          lastOrderDate: now,
          updatedAt: now,
        },
        { merge: true }
      );

      // CRM Timeline Event
      const crmId = `crm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      transaction.set(doc(db, 'crmTimeline', crmId), {
        id: crmId,
        customerId: params.customer.uid,
        type: params.autoConfirm ? 'ORDER_CONFIRMED' : 'ORDER_INTENT_CREATED',
        description: `Order ${orderNumber} placed (Total: ₹${orderDocData.grandTotal.toFixed(2)})`,
        metadata: { orderId, orderNumber, grandTotal: orderDocData.grandTotal },
        createdAt: now,
      });

      return {
        order: orderDocData,
        invoice: createdInvoice,
        sale: createdSale,
      };
    });
  }

  /**
   * Atomically confirm an order by Admin: verifies stock, deducts inventory,
   * generates sequential GST invoice, creates sales ledger record, and logs audit.
   */
  public async confirmOrderACID(
    orderId: string,
    actor: AdminUser
  ): Promise<{ order: Order; invoice: Invoice; sale: Sale }> {
    const db = this.getDb();
    if (!db) throw new Error('Cloud Firestore is offline or uninitialized.');

    return await runTransaction(db, async (transaction) => {
      const now = new Date().toISOString();
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists()) {
        throw new Error(`Order ${orderId} not found.`);
      }

      const order = orderSnap.data() as Order;

      // Deduct inventory for each item upon Admin Confirmation
      for (const item of order.items) {
        const prodRef = doc(db, 'products', item.productId);
        const prodSnap = await transaction.get(prodRef);
        if (prodSnap.exists()) {
          const pData = prodSnap.data() as Product;
          const newQty = Math.max(0, pData.stockQuantity - item.quantity);
          const threshold = calculateLowStockThreshold(
            pData.stockReferenceQty || 100,
            pData.lowStockPercent || 70
          );

          transaction.update(prodRef, {
            stockQuantity: newQty,
            lowStockThresholdQty: threshold,
            updatedAt: now,
          });

          // Write Stock Movement Ledger
          const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          transaction.set(doc(db, 'stockMovements', movId), {
            movementId: movId,
            productId: pData.id,
            productName: pData.name,
            type: 'SALE',
            quantity: item.quantity,
            beforeQuantity: pData.stockQuantity,
            afterQuantity: newQty,
            referenceId: order.id,
            reason: `Order ${order.orderNumber} confirmed by Admin (${actor.email})`,
            createdBy: actor.email,
            createdAt: now,
          });

          if (isLowStock(newQty, threshold)) {
            transaction.set(
              doc(db, 'lowStockAlerts', `alert_${pData.id}`),
              {
                alertId: `alert_${pData.id}`,
                productId: pData.id,
                productName: pData.name,
                currentStock: newQty,
                threshold,
                status: 'ACTIVE',
                createdAt: now,
              },
              { merge: true }
            );
          }
        }
      }

      // Sequential Invoice & Sale Counters
      const invoiceCounterRef = doc(db, 'counters', 'invoices');
      const invoiceCounterSnap = await transaction.get(invoiceCounterRef);
      const lastInvNum = invoiceCounterSnap.exists() ? invoiceCounterSnap.data()?.last || 0 : 0;
      const nextInvNum = lastInvNum + 1;
      transaction.set(invoiceCounterRef, { last: nextInvNum }, { merge: true });

      const invoiceNumber = `INV-2026-${String(nextInvNum).padStart(6, '0')}`;
      const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const saleCounterRef = doc(db, 'counters', 'sales');
      const saleCounterSnap = await transaction.get(saleCounterRef);
      const lastSaleNum = saleCounterSnap.exists() ? saleCounterSnap.data()?.last || 0 : 0;
      const nextSaleNum = lastSaleNum + 1;
      transaction.set(saleCounterRef, { last: nextSaleNum }, { merge: true });

      const saleNumber = `SL-2026-${String(nextSaleNum).padStart(6, '0')}`;
      const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const settingsRef = doc(db, 'settings', 'business');
      const settingsSnap = await transaction.get(settingsRef);
      const bizSettings = settingsSnap.exists()
        ? (settingsSnap.data() as BusinessSettings)
        : SEED_BUSINESS_SETTINGS;

      const invoiceItems: InvoiceItem[] = order.items.map((i) => ({
        productId: i.productId,
        productName: i.name,
        sku: i.sku,
        hsnCode: '0902',
        weight: i.weight,
        unit: i.unit,
        quantity: i.quantity,
        unitPrice: i.price,
        taxableValue: i.taxableAmount,
        gstRate: i.gstRate,
        cgst: i.tax / 2,
        sgst: i.tax / 2,
        igst: 0,
        total: i.total,
      }));

      const invoice: Invoice = {
        invoiceId,
        invoiceNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        saleId,
        invoiceDate: now,
        dueDate: now,
        businessDetails: {
          businessName: bizSettings.businessName,
          brandName: bizSettings.brandName,
          gstin: bizSettings.gstin,
          pan: bizSettings.pan,
          address: bizSettings.address,
          city: bizSettings.city,
          state: bizSettings.state,
          pincode: bizSettings.pincode,
          phone: bizSettings.phone,
          email: bizSettings.email,
        },
        customerDetails: {
          customerId: order.customerId,
          name: order.customerName,
          email: order.customerEmail,
          mobile: order.customerMobile,
          address: `${order.shippingAddress.street}, ${order.shippingAddress.city}`,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          pincode: order.shippingAddress.pincode,
        },
        items: invoiceItems,
        subtotal: order.subtotal,
        taxableAmount: order.taxableAmount,
        gstRate: 5,
        cgst: order.cgst,
        sgst: order.sgst,
        igst: 0,
        shipping: order.shipping,
        grandTotal: order.grandTotal,
        amountInWords: amountToWords(order.grandTotal),
        termsAndConditions: bizSettings.terms || '',
        bankDetails: {
          bankName: bizSettings.bankName,
          accountNumber: bizSettings.accountNumber,
          ifsc: bizSettings.ifsc,
          upi: bizSettings.upi,
        },
        status: 'ISSUED',
        paymentStatus: order.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID',
        createdAt: now,
      };

      let totalCostOfGoods = 0;
      order.items.forEach((i) => {
        totalCostOfGoods += (i.purchasePrice || 0) * i.quantity;
      });

      const sale: Sale = {
        saleId,
        saleNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: order.customerName,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount || 0,
        taxableAmount: order.taxableAmount,
        gst: order.tax,
        cgst: order.cgst,
        sgst: order.sgst,
        igst: order.igst,
        shipping: order.shipping,
        grandTotal: order.grandTotal,
        costOfGoods: totalCostOfGoods,
        profit: order.grandTotal - totalCostOfGoods,
        paymentStatus: order.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID',
        saleDate: now,
        createdAt: now,
      };

      const updatedOrder: Order = {
        ...order,
        status: 'CONFIRMED',
        confirmedAt: now,
        updatedAt: now,
        invoiceId,
        saleId,
      };

      transaction.set(orderRef, updatedOrder);
      transaction.set(doc(db, 'invoices', invoiceId), invoice);
      transaction.set(doc(db, 'sales', saleId), sale);

      // Audit Log
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      transaction.set(doc(db, 'auditLogs', logId), {
        logId,
        actorUid: actor.uid,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'ORDER_CONFIRMED',
        entityType: 'ORDER',
        entityId: order.id,
        metadata: { invoiceNumber, saleId },
        timestamp: now,
      });

      return { order: updatedOrder, invoice, sale };
    });
  }

  /**
   * Atomically adjust stock with inventory ledger entry and low-stock alerting
   */
  public async adjustStockACID(
    productId: string,
    type: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT',
    quantity: number,
    reason: string,
    actorEmail: string
  ): Promise<{ product: Product; movement: InventoryMovement }> {
    const db = this.getDb();
    if (!db) throw new Error('Cloud Firestore is offline or uninitialized.');

    return await runTransaction(db, async (transaction) => {
      const now = new Date().toISOString();
      const prodRef = doc(db, 'products', productId);
      const prodSnap = await transaction.get(prodRef);

      if (!prodSnap.exists()) {
        throw new Error(`Product ${productId} not found.`);
      }

      const product = prodSnap.data() as Product;
      const beforeQty = product.stockQuantity;
      const afterQty =
        type === 'ADJUSTMENT_IN' ? beforeQty + quantity : Math.max(0, beforeQty - quantity);

      const threshold = calculateLowStockThreshold(
        product.stockReferenceQty || 100,
        product.lowStockPercent || 70
      );

      const updatedProduct: Product = {
        ...product,
        stockQuantity: afterQty,
        lowStockThresholdQty: threshold,
        updatedAt: now,
      };

      const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const movement: InventoryMovement = {
        movementId: movId,
        productId: product.id,
        productName: product.name,
        type,
        quantity,
        beforeQuantity: beforeQty,
        afterQuantity: afterQty,
        referenceId: 'MANUAL_ADJUSTMENT',
        reason,
        createdBy: actorEmail,
        createdAt: now,
      };

      transaction.set(prodRef, updatedProduct);
      transaction.set(doc(db, 'stockMovements', movId), movement);

      if (isLowStock(afterQty, threshold)) {
        transaction.set(
          doc(db, 'lowStockAlerts', `alert_${product.id}`),
          {
            alertId: `alert_${product.id}`,
            productId: product.id,
            productName: product.name,
            currentStock: afterQty,
            threshold,
            status: 'ACTIVE',
            createdAt: now,
          },
          { merge: true }
        );
      } else {
        transaction.set(
          doc(db, 'lowStockAlerts', `alert_${product.id}`),
          {
            status: 'RESOLVED',
            resolvedAt: now,
          },
          { merge: true }
        );
      }

      return { product: updatedProduct, movement };
    });
  }

  private syncStatus: SyncStatus = {
    status: 'synced',
    lastError: null,
    lastSyncedAt: null,
  };
  private statusListeners: Set<(status: SyncStatus) => void> = new Set();

  public getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  public onSyncStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.getSyncStatus());
    return () => this.statusListeners.delete(listener);
  }

  private updateSyncStatus(update: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...update };
    this.statusListeners.forEach((l) => l(this.getSyncStatus()));
  }

  /**
   * Save or update a single document in Cloud Firestore
   */
  public async saveDocument(
    collectionName: string,
    id: string,
    data: any
  ): Promise<{ success: boolean; error?: string }> {
    const db = this.getDb();
    if (!db) {
      this.updateSyncStatus({ status: 'offline', lastError: 'Firestore client not initialized' });
      return { success: false, error: 'Firestore client not initialized' };
    }
    try {
      this.updateSyncStatus({ status: 'syncing' });
      await setDoc(doc(db, collectionName, id), data, { merge: true });
      this.updateSyncStatus({ status: 'synced', lastError: null, lastSyncedAt: new Date().toISOString() });
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.warn(`[FirestoreSync] Failed to save document to ${collectionName}/${id}:`, err);
      this.updateSyncStatus({ status: 'error', lastError: errMsg });
      return { success: false, error: errMsg };
    }
  }

  /**
   * Delete a single document in Cloud Firestore
   */
  public async deleteDocument(
    collectionName: string,
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    const db = this.getDb();
    if (!db) {
      this.updateSyncStatus({ status: 'offline', lastError: 'Firestore client not initialized' });
      return { success: false, error: 'Firestore client not initialized' };
    }
    try {
      this.updateSyncStatus({ status: 'syncing' });
      await deleteDoc(doc(db, collectionName, id));
      this.updateSyncStatus({ status: 'synced', lastError: null, lastSyncedAt: new Date().toISOString() });
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.warn(`[FirestoreSync] Failed to delete document from ${collectionName}/${id}:`, err);
      this.updateSyncStatus({ status: 'error', lastError: errMsg });
      return { success: false, error: errMsg };
    }
  }
}

export const firestoreSync = new FirestoreSyncService();
