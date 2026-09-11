import http from 'http';
import fs from 'fs';
import path from 'path';
import { SEED_ADMIN, SEED_PRODUCT, SEED_SUPPLIER, SEED_BUSINESS_SETTINGS, SEED_BLOGS } from './seedData';
import { Product, Order, Sale, GSTInvoice, InventoryMovement, CustomerProfile, LowStockAlert, BlogPost } from '@tea-nest/types';

const PORT = 5001;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'teanest_db.json');
const LEGACY_STATE_FILE = path.join(DATA_DIR, 'state.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface BackendDatabase {
  products: Product[];
  orders: Order[];
  sales: Sale[];
  invoices: GSTInvoice[];
  inventoryMovements: InventoryMovement[];
  lowStockAlerts: LowStockAlert[];
  suppliers: any[];
  purchases: any[];
  expenses: any[];
  customers: CustomerProfile[];
  adminUsers: any[];
  auditLogs: any[];
  crmTimeline: any[];
  businessSettings: any;
  blogs: BlogPost[];
  counters: {
    orderNumber: number;
    invoiceNumber: number;
    saleNumber: number;
    movementNumber: number;
  };
}

function getInitialDatabase(): BackendDatabase {
  return {
    products: [{ ...SEED_PRODUCT }],
    orders: [],
    sales: [],
    invoices: [],
    blogs: [...SEED_BLOGS],
    inventoryMovements: [
      {
        movementId: 'mov_init_100',
        productId: SEED_PRODUCT.id,
        type: 'PURCHASE_INTAKE',
        quantity: 100,
        balanceAfter: 100,
        referenceType: 'PURCHASE_ORDER',
        referenceId: 'PO-INITIAL',
        batchNumber: 'TN-BATCH-2026-001',
        costPerUnit: 220,
        notes: 'Initial inventory intake from Brahmaputra Organic Tea Estates',
        createdAt: new Date().toISOString(),
        createdBy: 'admin_super_teanest',
      },
    ],
    lowStockAlerts: [],
    suppliers: [{ ...SEED_SUPPLIER }],
    purchases: [],
    expenses: [],
    customers: [],
    adminUsers: [{ ...SEED_ADMIN }],
    auditLogs: [],
    crmTimeline: [],
    businessSettings: { ...SEED_BUSINESS_SETTINGS },
    counters: {
      orderNumber: 1,
      invoiceNumber: 1,
      saleNumber: 1,
      movementNumber: 101,
    },
  };
}

let db: BackendDatabase = getInitialDatabase();
const sseClients: http.ServerResponse[] = [];

// Broadcast live SSE event to all connected clients
function broadcastEvent(type: string, payload: any) {
  const message = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.write(message);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

function loadDatabase() {
  const targetFile = fs.existsSync(DB_FILE) ? DB_FILE : fs.existsSync(LEGACY_STATE_FILE) ? LEGACY_STATE_FILE : null;
  if (targetFile) {
    try {
      const raw = fs.readFileSync(targetFile, 'utf-8');
      const parsed = JSON.parse(raw);
      db = {
        ...getInitialDatabase(),
        ...parsed,
        counters: parsed.counters || {
          orderNumber: (parsed.orders?.length || 0) + 1,
          invoiceNumber: (parsed.invoices?.length || 0) + 1,
          saleNumber: (parsed.sales?.length || 0) + 1,
          movementNumber: (parsed.inventoryMovements?.length || 0) + 100,
        },
      };
      console.log(`[TeaNest API] Loaded active database from ${targetFile} (${db.orders.length} orders, ${db.products.length} products, stock: ${db.products[0]?.stockQuantity || 0})`);
      saveDatabase();
      return;
    } catch (err) {
      console.error('[TeaNest API] Failed to parse database file, reinitializing', err);
    }
  }
  db = getInitialDatabase();
  saveDatabase();
  console.log(`[TeaNest API] Initialized fresh production database at ${DB_FILE}`);
}

// Atomic file write to guarantee consistency
function saveDatabase() {
  try {
    const tmp = `${DB_FILE}.tmp.${Date.now()}`;
    const payload = JSON.stringify(db, null, 2);
    fs.writeFileSync(tmp, payload, 'utf-8');
    fs.renameSync(tmp, DB_FILE);
    // Keep legacy state.json in sync for backward compatibility
    fs.writeFileSync(LEGACY_STATE_FILE, payload, 'utf-8');
  } catch (err) {
    console.error('[TeaNest API] Failed to save database:', err);
  }
}

loadDatabase();

// Helper to parse JSON body
function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost:5001'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method || 'GET';

  try {
    // -------------------------------------------------------------
    // 1. Server-Sent Events (SSE) Live Stream
    // -------------------------------------------------------------
    if (pathname === '/api/events' && method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(': connected\n\n');
      sseClients.push(res);

      req.on('close', () => {
        const idx = sseClients.indexOf(res);
        if (idx !== -1) sseClients.splice(idx, 1);
      });
      return;
    }

    // -------------------------------------------------------------
    // 2. Full State Synchronization (Backward Compatibility)
    // -------------------------------------------------------------
    if (pathname === '/api/state' && method === 'GET') {
      sendJson(res, 200, db);
      return;
    }

    if (pathname === '/api/state' && method === 'POST') {
      const incoming = await parseJsonBody(req);
      if (incoming && typeof incoming === 'object') {
        db = {
          ...db,
          ...incoming,
          products: incoming.products || db.products,
          orders: incoming.orders || db.orders,
          sales: incoming.sales || db.sales,
          invoices: incoming.invoices || db.invoices,
          inventoryMovements: incoming.inventoryMovements || db.inventoryMovements,
          lowStockAlerts: incoming.lowStockAlerts || db.lowStockAlerts,
          suppliers: incoming.suppliers || db.suppliers,
          purchases: incoming.purchases || db.purchases,
          expenses: incoming.expenses || db.expenses,
          customers: incoming.customers || db.customers,
          auditLogs: incoming.auditLogs || db.auditLogs,
          crmTimeline: incoming.crmTimeline || db.crmTimeline,
          businessSettings: incoming.businessSettings || db.businessSettings,
          blogs: incoming.blogs || db.blogs,
        };
        saveDatabase();
        broadcastEvent('STATE_UPDATED', { timestamp: Date.now() });
        sendJson(res, 200, { ok: true, timestamp: Date.now() });
      } else {
        sendJson(res, 400, { error: 'Invalid state body' });
      }
      return;
    }

    // -------------------------------------------------------------
    // 3. Products Endpoints
    // -------------------------------------------------------------
    if (pathname === '/api/products' && method === 'GET') {
      sendJson(res, 200, db.products);
      return;
    }

    // -------------------------------------------------------------
    // 4. Orders Endpoints
    // -------------------------------------------------------------
    if (pathname === '/api/orders' && method === 'GET') {
      sendJson(res, 200, db.orders);
      return;
    }

    // Create Order Intent (Storefront WhatsApp Flow)
    if (pathname === '/api/orders/intent' && method === 'POST') {
      const { customer, address, product, quantity = 1 } = await parseJsonBody(req);

      if (!customer || !product || !address) {
        sendJson(res, 400, { error: 'Missing required order fields: customer, address, or product' });
        return;
      }

      // Find real product from database
      const liveProduct = db.products.find((p) => p.id === product.id) || db.products[0];
      if (!liveProduct) {
        sendJson(res, 404, { error: 'Product not found' });
        return;
      }

      if (liveProduct.stockQuantity < quantity) {
        sendJson(res, 400, {
          error: `Insufficient stock for ${liveProduct.name}. Requested: ${quantity}, Available: ${liveProduct.stockQuantity}`,
        });
        return;
      }

      // Calculate GST breakdown (5% inclusive on price)
      const unitPrice = liveProduct.sellingPrice;
      const grandTotal = unitPrice * quantity;
      const gstRate = liveProduct.gstRate || 5;
      const taxableAmount = Math.round((grandTotal / (1 + gstRate / 100)) * 100) / 100;
      const taxTotal = Math.round((grandTotal - taxableAmount) * 100) / 100;
      const cgst = Math.round((taxTotal / 2) * 100) / 100;
      const sgst = Math.round((taxTotal - cgst) * 100) / 100;

      const orderNumber = `TN-2026-${String(db.counters.orderNumber).padStart(6, '0')}`;
      db.counters.orderNumber += 1;

      const now = new Date().toISOString();
      const orderId = `ord_${Date.now()}`;

      // Upsert real customer in database
      let existingCustomer = db.customers.find(
        (c) => c.mobile === customer.mobile || (customer.email && c.email === customer.email)
      );
      if (!existingCustomer) {
        existingCustomer = {
          uid: customer.uid || `cust_${Date.now()}`,
          name: customer.name || address.fullName,
          mobile: customer.mobile || address.mobile,
          email: customer.email || '',
          address: `${address.street}, ${address.city}, ${address.state} - ${address.pincode}`,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          createdAt: now,
          updatedAt: now,
          role: 'customer',
          status: 'ACTIVE',
          totalOrders: 1,
          confirmedOrders: 0,
          cancelledOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0,
          lastOrderDate: now,
        };
        db.customers.push(existingCustomer);
      } else {
        existingCustomer.totalOrders += 1;
        existingCustomer.lastOrderDate = now;
        existingCustomer.updatedAt = now;
      }

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        customerId: existingCustomer.uid,
        customerName: existingCustomer.name,
        customerMobile: existingCustomer.mobile,
        customerEmail: existingCustomer.email,
        shippingAddress: {
          fullName: address.fullName || existingCustomer.name,
          mobile: address.mobile || existingCustomer.mobile,
          street: address.street,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        items: [
          {
            productId: liveProduct.id,
            sku: liveProduct.sku,
            name: liveProduct.name,
            weight: liveProduct.weight,
            unit: liveProduct.unit,
            price: unitPrice,
            purchasePrice: liveProduct.purchasePrice,
            quantity,
            gstRate,
            taxableAmount,
            tax: taxTotal,
            subtotal: taxableAmount,
            total: grandTotal,
            image: liveProduct.images[0]?.secureUrl || '/images/tea_nest_front.jpg',
          },
        ],
        subtotal: taxableAmount,
        discount: 0,
        taxableAmount,
        tax: taxTotal,
        cgst,
        sgst,
        igst: 0,
        shipping: 0,
        grandTotal,
        status: 'WHATSAPP_PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod: 'WHATSAPP',
        whatsappMessageSent: true,
        source: 'STOREFRONT',
        createdAt: now,
        updatedAt: now,
      };

      db.orders.unshift(newOrder);

      // Audit Log
      db.auditLogs.unshift({
        logId: `log_${Date.now()}`,
        action: 'ORDER_INTENT_CREATED',
        entityType: 'ORDER',
        entityId: orderId,
        performedBy: existingCustomer.name,
        details: `Customer created WhatsApp order intent ${orderNumber} for ₹${grandTotal}`,
        timestamp: now,
      });

      // WhatsApp URL Construction
      const whatsappNumber = db.businessSettings.whatsappNumber || '916901320430';
      const msg = `*NEW TEA NEST ORDER INTENT*\n` +
        `Order Ref: ${orderNumber}\n` +
        `Product: ${liveProduct.name} (${liveProduct.weight}${liveProduct.unit})\n` +
        `Quantity: ${quantity}\n` +
        `Total: ₹${grandTotal} (Incl. 5% GST & Free Delivery)\n\n` +
        `*Customer Details:*\n` +
        `Name: ${address.fullName}\n` +
        `Phone: ${address.mobile}\n` +
        `Delivery Address: ${address.street}, ${address.city}, ${address.state} - ${address.pincode}\n\n` +
        `_Please confirm dispatch and provide payment link._`;

      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;

      saveDatabase();
      broadcastEvent('ORDER_CREATED', { order: newOrder, timestamp: Date.now() });

      sendJson(res, 201, {
        ok: true,
        order: newOrder,
        whatsappUrl,
      });
      return;
    }

    // Confirm Order (Admin Confirmation Flow)
    const confirmMatch = pathname.match(/^\/api\/orders\/([^/]+)\/confirm$/);
    if (confirmMatch && method === 'POST') {
      const orderIdOrNum = confirmMatch[1];
      const order = db.orders.find((o) => o.id === orderIdOrNum || o.orderNumber === orderIdOrNum);

      if (!order) {
        sendJson(res, 404, { error: `Order ${orderIdOrNum} not found` });
        return;
      }

      if (order.status === 'CONFIRMED') {
        sendJson(res, 400, { error: `Order ${order.orderNumber} is already confirmed` });
        return;
      }

      const now = new Date().toISOString();

      // 1. Verify and atomic decrement stock for all items
      for (const item of order.items) {
        const prod = db.products.find((p) => p.id === item.productId);
        if (!prod) {
          sendJson(res, 404, { error: `Product ${item.name} not found in catalog` });
          return;
        }
        if (prod.stockQuantity < item.quantity) {
          sendJson(res, 400, {
            error: `Insufficient stock for ${prod.name}. Available: ${prod.stockQuantity}, Required: ${item.quantity}`,
          });
          return;
        }
      }

      // Decrement stock & record inventory movement
      for (const item of order.items) {
        const prod = db.products.find((p) => p.id === item.productId)!;
        const beforeQty = prod.stockQuantity;
        prod.stockQuantity -= item.quantity;
        prod.updatedAt = now;

        const movement: InventoryMovement = {
          movementId: `mov_${Date.now()}_${item.sku}`,
          productId: prod.id,
          type: 'OUTBOUND_SALE',
          quantity: -item.quantity,
          balanceAfter: prod.stockQuantity,
          referenceType: 'SALE_INVOICE',
          referenceId: order.orderNumber,
          costPerUnit: prod.purchasePrice,
          notes: `Deducted for confirmed order ${order.orderNumber}`,
          createdAt: now,
          createdBy: 'admin',
        };
        db.inventoryMovements.unshift(movement);

        // Low stock trigger
        if (prod.stockQuantity < prod.lowStockThresholdQty) {
          const existingAlert = db.lowStockAlerts.find(
            (a) => a.productId === prod.id && a.status === 'ACTIVE'
          );
          if (!existingAlert) {
            db.lowStockAlerts.unshift({
              alertId: `alert_${Date.now()}_${prod.id}`,
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              currentStock: prod.stockQuantity,
              thresholdQty: prod.lowStockThresholdQty,
              percentOfReference: Math.round((prod.stockQuantity / prod.stockReferenceQty) * 100),
              status: 'ACTIVE',
              triggeredAt: now,
              severity: prod.stockQuantity <= prod.lowStockThresholdQty * 0.5 ? 'CRITICAL' : 'WARNING',
            });
          }
        }
      }

      // 2. Generate sequential GST Invoice
      const invoiceNumber = `INV-2026-${String(db.counters.invoiceNumber).padStart(6, '0')}`;
      db.counters.invoiceNumber += 1;

      const invoice: GSTInvoice = {
        id: `inv_${Date.now()}`,
        invoiceNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        invoiceDate: now.substring(0, 10),
        sellerDetails: {
          legalName: db.businessSettings.legalName || 'Fortunate Ventures',
          tradeName: db.businessSettings.tradeName || 'Tea Nest',
          gstin: db.businessSettings.gstin || '18AABCF1234F1Z5',
          pan: db.businessSettings.pan || 'AABCF1234F',
          address: db.businessSettings.address || 'Naharkatia, Dibrugarh, Assam - 786610',
          state: 'Assam',
          stateCode: '18',
          fssaiNumber: db.businessSettings.fssaiNumber || '10326999000123',
        },
        customerDetails: {
          name: order.customerName,
          mobile: order.customerMobile,
          email: order.customerEmail,
          shippingAddress: order.shippingAddress,
          placeOfSupply: order.shippingAddress.state,
        },
        items: order.items.map((i) => ({
          sku: i.sku,
          description: `${i.name} (${i.weight}${i.unit})`,
          hsnCode: '0902',
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.price,
          taxableAmount: i.taxableAmount,
          gstRate: i.gstRate,
          cgst: i.taxableAmount * 0.025,
          sgst: i.taxableAmount * 0.025,
          igst: 0,
          total: i.total,
        })),
        taxableAmount: order.taxableAmount,
        cgst: order.cgst,
        sgst: order.sgst,
        igst: order.igst,
        totalTax: order.tax,
        grandTotal: order.grandTotal,
        amountInWords: `Rupees ${order.grandTotal} Only`,
        paymentStatus: 'UNPAID',
        createdAt: now,
      };
      db.invoices.unshift(invoice);

      // 3. Generate Sale record
      const cogs = order.items.reduce((sum, item) => sum + item.purchasePrice * item.quantity, 0);
      const saleNumber = `SALE-2026-${String(db.counters.saleNumber).padStart(6, '0')}`;
      db.counters.saleNumber += 1;

      const sale: Sale = {
        id: `sale_${Date.now()}`,
        saleNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: order.customerId,
        customerName: order.customerName,
        saleDate: now.substring(0, 10),
        taxableAmount: order.taxableAmount,
        gst: order.tax,
        grandTotal: order.grandTotal,
        costOfGoods: cogs,
        profit: order.grandTotal - cogs,
        paymentMethod: order.paymentMethod,
        channel: 'WHATSAPP',
        items: order.items.map((i) => ({
          productId: i.productId,
          sku: i.sku,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          cogs: i.purchasePrice * i.quantity,
          total: i.total,
        })),
        createdAt: now,
      };
      db.sales.unshift(sale);

      // 4. Update order status
      order.status = 'CONFIRMED';
      order.paymentStatus = 'UNPAID';
      order.confirmedAt = now;
      order.invoiceId = invoice.id;
      order.invoiceNumber = invoice.invoiceNumber;
      order.updatedAt = now;

      // 5. Update Customer metrics
      const cust = db.customers.find((c) => c.uid === order.customerId);
      if (cust) {
        cust.confirmedOrders += 1;
        cust.totalSpent += order.grandTotal;
        cust.averageOrderValue = Math.round(cust.totalSpent / cust.confirmedOrders);
        cust.updatedAt = now;
      }

      // Audit Log
      db.auditLogs.unshift({
        logId: `log_${Date.now()}`,
        action: 'ORDER_CONFIRMED',
        entityType: 'ORDER',
        entityId: order.id,
        performedBy: 'admin',
        details: `Confirmed order ${order.orderNumber}. Stock decremented, invoice ${invoice.invoiceNumber} generated.`,
        timestamp: now,
      });

      saveDatabase();
      broadcastEvent('ORDER_CONFIRMED', { order, invoice, sale, timestamp: Date.now() });

      sendJson(res, 200, {
        ok: true,
        order,
        invoice,
        sale,
      });
      return;
    }

    // Update Order Status
    const statusMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/);
    if (statusMatch && method === 'POST') {
      const orderIdOrNum = statusMatch[1];
      const { status } = await parseJsonBody(req);
      const order = db.orders.find((o) => o.id === orderIdOrNum || o.orderNumber === orderIdOrNum);

      if (!order) {
        sendJson(res, 404, { error: `Order ${orderIdOrNum} not found` });
        return;
      }

      const now = new Date().toISOString();
      const prevStatus = order.status;

      // Handle cancellation inventory restock and sale voiding
      if (status === 'CANCELLED') {
        order.paymentStatus = 'UNPAID';
        db.sales = db.sales.filter((s) => s.orderId !== order.id && s.orderNumber !== order.orderNumber);
        const invoice = db.invoices.find((i) => i.orderId === order.id || i.orderNumber === order.orderNumber);
        if (invoice) {
          invoice.paymentStatus = 'UNPAID';
          (invoice as any).status = 'CANCELLED';
        }

        if (prevStatus === 'CONFIRMED') {
          for (const item of order.items) {
            const prod = db.products.find((p) => p.id === item.productId);
            if (prod) {
              prod.stockQuantity += item.quantity;
              prod.updatedAt = now;

              db.inventoryMovements.unshift({
                movementId: `mov_${Date.now()}_restock`,
                productId: prod.id,
                type: 'RETURN_RESTOCK',
                quantity: item.quantity,
                balanceAfter: prod.stockQuantity,
                referenceType: 'ORDER_CANCELLATION',
                referenceId: order.orderNumber,
                costPerUnit: prod.purchasePrice,
                notes: `Stock restored from cancelled order ${order.orderNumber}`,
                createdAt: now,
                createdBy: 'admin',
              });
            }
          }
        }
      }

      order.status = status;
      order.updatedAt = now;

      db.auditLogs.unshift({
        logId: `log_${Date.now()}`,
        action: 'ORDER_STATUS_UPDATED',
        entityType: 'ORDER',
        entityId: order.id,
        performedBy: 'admin',
        details: `Order ${order.orderNumber} status changed from ${prevStatus} to ${status}`,
        timestamp: now,
      });

      saveDatabase();
      broadcastEvent('ORDER_UPDATED', { order, timestamp: Date.now() });

      sendJson(res, 200, {
        ok: true,
        order,
      });
      return;
    }

    // Update Order Payment Status
    const paymentMatch = pathname.match(/^\/api\/orders\/([^/]+)\/payment$/);
    if (paymentMatch && method === 'POST') {
      const orderIdOrNum = paymentMatch[1];
      const { paymentStatus } = await parseJsonBody(req);
      const order = db.orders.find((o) => o.id === orderIdOrNum || o.orderNumber === orderIdOrNum);

      if (!order) {
        sendJson(res, 404, { error: `Order ${orderIdOrNum} not found` });
        return;
      }

      const now = new Date().toISOString();
      order.paymentStatus = paymentStatus;
      order.updatedAt = now;

      const invoice = db.invoices.find((i) => i.orderId === order.id || i.orderNumber === order.orderNumber);
      if (invoice) {
        invoice.paymentStatus = paymentStatus;
      }

      const sale = db.sales.find((s) => s.orderId === order.id || s.orderNumber === order.orderNumber);
      if (sale) {
        (sale as any).paymentStatus = paymentStatus;
      }

      db.auditLogs.unshift({
        logId: `log_${Date.now()}`,
        action: 'ORDER_PAYMENT_STATUS_UPDATED',
        entityType: 'ORDER',
        entityId: order.id,
        performedBy: 'admin',
        details: `Order ${order.orderNumber} payment status updated to ${paymentStatus}`,
        timestamp: now,
      });

      saveDatabase();
      broadcastEvent('ORDER_PAYMENT_UPDATED', { order, paymentStatus, timestamp: Date.now() });

      sendJson(res, 200, {
        ok: true,
        order,
      });
      return;
    }

    // -------------------------------------------------------------
    // 5. Inventory Ledger & Adjustments
    // -------------------------------------------------------------
    if (pathname === '/api/inventory' && method === 'GET') {
      sendJson(res, 200, {
        movements: db.inventoryMovements,
        alerts: db.lowStockAlerts,
        products: db.products,
      });
      return;
    }

    if (pathname === '/api/inventory/adjust' && method === 'POST') {
      const { productId, quantityChange, type = 'MANUAL_ADJUSTMENT', reason = '', notes = '' } = await parseJsonBody(req);
      const prod = db.products.find((p) => p.id === productId);

      if (!prod) {
        sendJson(res, 404, { error: 'Product not found' });
        return;
      }

      const now = new Date().toISOString();
      prod.stockQuantity = Math.max(0, prod.stockQuantity + Number(quantityChange));
      prod.updatedAt = now;

      const movement: InventoryMovement = {
        movementId: `mov_${Date.now()}`,
        productId: prod.id,
        type: type as any,
        quantity: Number(quantityChange),
        balanceAfter: prod.stockQuantity,
        referenceType: 'MANUAL_RECONCILIATION',
        referenceId: reason || 'STOCK_ADJUSTMENT',
        costPerUnit: prod.purchasePrice,
        notes: notes || reason,
        createdAt: now,
        createdBy: 'admin',
      };
      db.inventoryMovements.unshift(movement);

      saveDatabase();
      broadcastEvent('INVENTORY_ADJUSTED', { product: prod, movement, timestamp: Date.now() });
      sendJson(res, 200, { ok: true, product: prod, movement });
      return;
    }

    // -------------------------------------------------------------
    // 6. Customers Endpoint
    // -------------------------------------------------------------
    if (pathname === '/api/customers' && method === 'GET') {
      sendJson(res, 200, db.customers);
      return;
    }

    // -------------------------------------------------------------
    // 7. Dynamic Analytics Endpoint (Zero Dummy Data)
    // -------------------------------------------------------------
    if (pathname === '/api/analytics/dashboard' && method === 'GET') {
      const todayStr = new Date().toISOString().substring(0, 10);

      const todaySales = db.sales
        .filter((s) => s.saleDate === todayStr)
        .reduce((sum, s) => sum + s.grandTotal, 0);

      const totalSalesAmount = db.sales.reduce((sum, s) => sum + s.grandTotal, 0);
      const totalCogs = db.sales.reduce((sum, s) => sum + s.costOfGoods, 0);
      const grossProfit = totalSalesAmount - totalCogs;
      const totalExpenses = db.expenses.reduce((sum, e) => sum + e.amount, 0);
      const netProfit = grossProfit - totalExpenses;

      const pendingOrders = db.orders.filter(
        (o) => o.status === 'WHATSAPP_PENDING' || o.status === 'PENDING_CONFIRMATION'
      );
      const confirmedOrders = db.orders.filter((o) => o.status === 'CONFIRMED');

      // Generate accurate 7-day sales breakdown strictly from recorded sales
      const last7Days: { day: string; date: string; sales: number }[] = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().substring(0, 10);
        const dayLabel = i === 0 ? `${dayNames[d.getDay()]} (Today)` : dayNames[d.getDay()];

        const dayTotal = db.sales
          .filter((s) => s.saleDate === dStr)
          .reduce((sum, s) => sum + s.grandTotal, 0);

        last7Days.push({
          day: dayLabel,
          date: dStr,
          sales: dayTotal,
        });
      }

      // Order counts by actual status
      const orderStatusData = [
        { name: 'Pending WhatsApp', value: pendingOrders.length, color: '#f59e0b' },
        { name: 'Confirmed', value: confirmedOrders.length, color: '#22c55e' },
        {
          name: 'Processing / Shipped',
          value: db.orders.filter((o) => o.status === 'PROCESSING' || o.status === 'SHIPPED').length,
          color: '#3b82f6',
        },
      ];

      sendJson(res, 200, {
        metrics: {
          todaySales,
          totalSalesAmount,
          totalCogs,
          grossProfit,
          totalExpenses,
          netProfit,
          pendingOrdersCount: pendingOrders.length,
          confirmedOrdersCount: confirmedOrders.length,
          totalOrdersCount: db.orders.length,
          activeAlertsCount: db.lowStockAlerts.filter((a) => a.status === 'ACTIVE').length,
          onHandStock: db.products.reduce((sum, p) => sum + p.stockQuantity, 0),
        },
        salesTrend: last7Days,
        orderStatusDistribution: orderStatusData,
        recentOrders: db.orders.slice(0, 5),
        lowStockAlerts: db.lowStockAlerts.filter((a) => a.status === 'ACTIVE'),
      });
      return;
    }

    // -------------------------------------------------------------
    // 8. Blog Management Endpoints (ACID & Real-time)
    // -------------------------------------------------------------
    if (pathname === '/api/blogs' && method === 'GET') {
      sendJson(res, 200, db.blogs || []);
      return;
    }

    const blogSlugMatch = pathname.match(/^\/api\/blogs\/by-slug\/([^/]+)$/);
    if (blogSlugMatch && method === 'GET') {
      const slug = blogSlugMatch[1];
      const blog = (db.blogs || []).find((b) => b.slug === slug);
      if (!blog) {
        sendJson(res, 404, { error: `Blog post with slug '${slug}' not found` });
        return;
      }
      sendJson(res, 200, blog);
      return;
    }

    // Create Blog Post
    if (pathname === '/api/blogs' && method === 'POST') {
      const blogData = await parseJsonBody(req);
      if (!blogData || !blogData.title) {
        sendJson(res, 400, { error: 'Blog title is required' });
        return;
      }

      const now = new Date().toISOString();
      let slug = blogData.slug?.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!slug) {
        slug = blogData.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      if (!db.blogs) db.blogs = [];
      if (db.blogs.some((b) => b.slug === slug)) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }

      const newBlog: BlogPost = {
        id: `blog_${Date.now()}`,
        title: blogData.title,
        slug,
        excerpt: blogData.excerpt || '',
        content: blogData.content || '',
        coverImage: blogData.coverImage || {
          secureUrl: '/images/tea_nest_front.jpg',
          altText: blogData.title,
        },
        author: blogData.author || 'Tea Nest Editorial',
        category: blogData.category || 'Tea Culture',
        tags: Array.isArray(blogData.tags) ? blogData.tags : ['Tea Nest'],
        readTime: blogData.readTime || '4 min read',
        isPublished: Boolean(blogData.isPublished),
        publishedAt: blogData.isPublished ? (blogData.publishedAt || now) : undefined,
        createdAt: now,
        updatedAt: now,
        createdBy: 'admin@teanest.in',
      };

      db.blogs.unshift(newBlog);

      db.auditLogs.unshift({
        logId: `log_${Date.now()}`,
        action: 'BLOG_CREATED',
        entityType: 'BLOG',
        entityId: newBlog.id,
        performedBy: 'admin',
        details: `Created blog article: "${newBlog.title}" (slug: ${newBlog.slug})`,
        timestamp: now,
      });

      saveDatabase();
      broadcastEvent('BLOG_CREATED', { blog: newBlog, timestamp: Date.now() });

      sendJson(res, 201, { ok: true, blog: newBlog });
      return;
    }

    // Update Blog Post
    const blogIdMatch = pathname.match(/^\/api\/blogs\/([^/]+)$/);
    if (blogIdMatch && (method === 'PUT' || method === 'PATCH')) {
      const id = blogIdMatch[1];
      const updates = await parseJsonBody(req);
      if (!db.blogs) db.blogs = [];
      const blog = db.blogs.find((b) => b.id === id);
      if (!blog) {
        sendJson(res, 404, { error: `Blog post ${id} not found` });
        return;
      }

      const now = new Date().toISOString();
      if (updates.slug && updates.slug !== blog.slug) {
        let slug = updates.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (db.blogs.some((b) => b.id !== id && b.slug === slug)) {
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

      db.auditLogs.unshift({
        logId: `log_${Date.now()}`,
        action: 'BLOG_UPDATED',
        entityType: 'BLOG',
        entityId: blog.id,
        performedBy: 'admin',
        details: `Updated blog article: "${blog.title}"`,
        timestamp: now,
      });

      saveDatabase();
      broadcastEvent('BLOG_UPDATED', { blog, timestamp: Date.now() });

      sendJson(res, 200, { ok: true, blog });
      return;
    }

    // Delete Blog Post
    if (blogIdMatch && method === 'DELETE') {
      const id = blogIdMatch[1];
      if (!db.blogs) db.blogs = [];
      const index = db.blogs.findIndex((b) => b.id === id);
      if (index === -1) {
        sendJson(res, 404, { error: `Blog post ${id} not found` });
        return;
      }

      const deletedBlog = db.blogs.splice(index, 1)[0];
      const now = new Date().toISOString();

      db.auditLogs.unshift({
        logId: `log_${Date.now()}`,
        action: 'BLOG_DELETED',
        entityType: 'BLOG',
        entityId: id,
        performedBy: 'admin',
        details: `Deleted blog article: "${deletedBlog.title}"`,
        timestamp: now,
      });

      saveDatabase();
      broadcastEvent('BLOG_DELETED', { id, timestamp: Date.now() });

      sendJson(res, 200, { ok: true, message: `Blog ${id} deleted` });
      return;
    }

    // Direct Image Upload for Blogs (Device upload -> storage)
    if (pathname === '/api/blogs/upload-image' && method === 'POST') {
      const { dataUrl, fileName } = await parseJsonBody(req);
      if (!dataUrl) {
        sendJson(res, 400, { error: 'Image dataUrl is required' });
        return;
      }

      // If it's a base64 dataUrl, save to public/images/blog/ directory
      try {
        const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const extension = matches[1].split('/')[1] || 'jpg';
          const buffer = Buffer.from(matches[2], 'base64');
          const cleanName = `blog_${Date.now()}_${(fileName || 'cover').replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;
          
          const storefrontPublic = path.resolve(process.cwd(), 'apps/storefront/public/images/blog');
          const adminPublic = path.resolve(process.cwd(), 'apps/admin/public/images/blog');

          if (!fs.existsSync(storefrontPublic)) fs.mkdirSync(storefrontPublic, { recursive: true });
          if (!fs.existsSync(adminPublic)) fs.mkdirSync(adminPublic, { recursive: true });

          fs.writeFileSync(path.join(storefrontPublic, cleanName), buffer);
          fs.writeFileSync(path.join(adminPublic, cleanName), buffer);

          const secureUrl = `/images/blog/${cleanName}`;
          sendJson(res, 200, { ok: true, secureUrl });
          return;
        }
      } catch (err) {
        // fallback to using dataUrl directly
      }

      sendJson(res, 200, { ok: true, secureUrl: dataUrl });
      return;
    }

    // -------------------------------------------------------------
    // 9. Database Reset Endpoint
    // -------------------------------------------------------------
    if (pathname === '/api/reset' && method === 'POST') {
      db = getInitialDatabase();
      saveDatabase();
      broadcastEvent('STATE_RESET', { timestamp: Date.now() });
      sendJson(res, 200, { ok: true, message: 'Reset database to clean production seed' });
      return;
    }

    sendJson(res, 404, { error: `Endpoint ${method} ${pathname} not found` });
  } catch (err: any) {
    console.error(`[TeaNest API] Error processing ${method} ${pathname}:`, err);
    sendJson(res, 500, { error: err.message || 'Internal server error' });
  }
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[TeaNest API] Notice: Port ${PORT} already in use. Existing backend process is handling requests.`);
  } else {
    console.error('[TeaNest API] Server error:', err);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[TeaNest API] Production REST API & SSE Server running on http://127.0.0.1:${PORT}`);
});
