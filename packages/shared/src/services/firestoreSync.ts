import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { initFirebase } from '../firebase';
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
} from '@tea-nest/types';
import { SEED_ADMIN, SEED_PRODUCT, SEED_SUPPLIER, SEED_BUSINESS_SETTINGS } from '../seedData';

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
}

export class FirestoreSyncService {
  private db: Firestore | null = null;
  private unsubscribers: Unsubscribe[] = [];
  private isSeeding = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;
    try {
      const { db } = initFirebase();
      this.db = db;
    } catch (err) {
      console.warn('[FirestoreSync] Failed to initialize Firebase client:', err);
    }
  }

  public getDb(): Firestore | null {
    return this.db;
  }

  /**
   * Automatically seed initial data to Cloud Firestore if the database is currently empty
   */
  public async bootstrapInitialDataIfEmpty(): Promise<void> {
    if (!this.db || this.isSeeding) return;
    this.isSeeding = true;

    try {
      const productsRef = collection(this.db, 'products');
      const snapshot = await getDocs(productsRef);

      if (snapshot.empty) {
        console.log('[FirestoreSync] Fresh Firestore detected. Seeding initial Tea Nest catalog...');

        // 1. Initial Product
        await setDoc(doc(this.db, 'products', SEED_PRODUCT.id), SEED_PRODUCT);

        // 2. Business Settings
        await setDoc(doc(this.db, 'businessSettings', 'default'), SEED_BUSINESS_SETTINGS);

        // 3. Verified Tea Estate Supplier
        await setDoc(doc(this.db, 'suppliers', SEED_SUPPLIER.id), SEED_SUPPLIER);

        // 4. Initial Inventory Intake Movement
        const initialMovement: InventoryMovement = {
          movementId: 'mov_init_100',
          productId: SEED_PRODUCT.id,
          productName: SEED_PRODUCT.name,
          type: 'PURCHASE',
          quantity: 100,
          beforeQuantity: 0,
          afterQuantity: 100,
          referenceId: 'PO-INITIAL',
          reason: 'Initial inventory intake from Brahmaputra Organic Tea Estates',
          createdAt: new Date().toISOString(),
          createdBy: 'system_bootstrap',
        };
        await setDoc(doc(this.db, 'inventoryMovements', initialMovement.movementId), initialMovement);

        // 5. Super Admin user records
        const primaryAdmin: AdminUser = {
          ...SEED_ADMIN,
          uid: 'ramdhenu_super_admin',
          email: 'ramdhenudigisolution@gmail.com',
          name: 'Ramdhenu Digi Solution (Owner)',
        };
        await setDoc(doc(this.db, 'adminUsers', primaryAdmin.uid), primaryAdmin);
        await setDoc(doc(this.db, 'adminUsers', SEED_ADMIN.uid), SEED_ADMIN);

        console.log('[FirestoreSync] Initial Tea Nest production data successfully seeded to Cloud Firestore!');
      }
    } catch (err) {
      console.warn('[FirestoreSync] Bootstrap seeding skipped (likely permissions or offline):', err);
    } finally {
      this.isSeeding = false;
    }
  }

  /**
   * Subscribes to real-time updates for all Firestore collections
   */
  public subscribeToUpdates(onData: (data: FirestoreCollectionsData) => void): () => void {
    if (!this.db) return () => {};

    // 1. Products (Public read)
    try {
      const unsubProducts = onSnapshot(
        collection(this.db, 'products'),
        (snapshot) => {
          if (!snapshot.empty) {
            const products: Product[] = [];
            snapshot.forEach((d) => products.push(d.data() as Product));
            onData({ products });
          }
        },
        (err) => console.warn('[FirestoreSync] Products snapshot error:', err)
      );
      this.unsubscribers.push(unsubProducts);
    } catch (e) {
      console.warn('[FirestoreSync] Failed to subscribe to products:', e);
    }

    // 2. Business Settings (Public read)
    try {
      const unsubSettings = onSnapshot(
        collection(this.db, 'businessSettings'),
        (snapshot) => {
          if (!snapshot.empty) {
            const first = snapshot.docs[0].data() as BusinessSettings;
            onData({ businessSettings: first });
          }
        },
        (err) => console.warn('[FirestoreSync] Business settings snapshot error:', err)
      );
      this.unsubscribers.push(unsubSettings);
    } catch (e) {
      console.warn('[FirestoreSync] Failed to subscribe to businessSettings:', e);
    }

    // 3. Orders (Customer & Admin)
    try {
      const unsubOrders = onSnapshot(
        collection(this.db, 'orders'),
        (snapshot) => {
          if (!snapshot.empty) {
            const orders: Order[] = [];
            snapshot.forEach((d) => orders.push(d.data() as Order));
            onData({ orders });
          }
        },
        () => {
          // Normal if unauthenticated guest user doesn't have list-all permissions
        }
      );
      this.unsubscribers.push(unsubOrders);
    } catch (e) {
      // Ignored
    }

    // 4. Inventory Movements (Admin)
    try {
      const unsubMovements = onSnapshot(
        collection(this.db, 'inventoryMovements'),
        (snapshot) => {
          if (!snapshot.empty) {
            const inventoryMovements: InventoryMovement[] = [];
            snapshot.forEach((d) => inventoryMovements.push(d.data() as InventoryMovement));
            onData({ inventoryMovements });
          }
        },
        () => {}
      );
      this.unsubscribers.push(unsubMovements);
    } catch (e) {}

    // 5. Invoices (Admin & Customer)
    try {
      const unsubInvoices = onSnapshot(
        collection(this.db, 'invoices'),
        (snapshot) => {
          if (!snapshot.empty) {
            const invoices: Invoice[] = [];
            snapshot.forEach((d) => invoices.push(d.data() as Invoice));
            onData({ invoices });
          }
        },
        () => {}
      );
      this.unsubscribers.push(unsubInvoices);
    } catch (e) {}

    // Bootstrap seed check in background
    this.bootstrapInitialDataIfEmpty();

    return () => {
      this.unsubscribers.forEach((u) => u());
      this.unsubscribers = [];
    };
  }

  /**
   * Save or update a single document in Cloud Firestore
   */
  public async saveDocument(collectionName: string, id: string, data: any): Promise<void> {
    if (!this.db) return;
    try {
      await setDoc(doc(this.db, collectionName, id), data, { merge: true });
    } catch (err) {
      console.warn(`[FirestoreSync] Failed to save document to ${collectionName}/${id}:`, err);
    }
  }

  /**
   * Delete a single document in Cloud Firestore
   */
  public async deleteDocument(collectionName: string, id: string): Promise<void> {
    if (!this.db) return;
    try {
      await deleteDoc(doc(this.db, collectionName, id));
    } catch (err) {
      console.warn(`[FirestoreSync] Failed to delete document from ${collectionName}/${id}:`, err);
    }
  }
}

export const firestoreSync = new FirestoreSyncService();
