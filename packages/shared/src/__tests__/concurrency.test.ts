import { describe, it, expect, beforeEach } from 'vitest';
import { OrderService } from '../services/orderService';
import { Product } from '@tea-nest/types';

describe('CRITICAL BUSINESS TEST: Concurrent Order Confirmation & Stock Deduction', () => {
  let orderService: OrderService;
  const mockProduct: Product = {
    id: 'prod_tea_assam_500g',
    name: 'Assam Black Tea',
    slug: 'assam-black-tea',
    description: 'Rich • Refreshing • Aromatic',
    sku: 'TN-ABT-500G',
    categoryId: 'black-tea',
    weight: 500,
    unit: 'g',
    mrp: 499,
    sellingPrice: 450,
    purchasePrice: 220,
    gstRate: 5,
    hsnCode: '0902',
    stockQuantity: 1, // Only 1 unit remaining in stock!
    stockReferenceQty: 100,
    lowStockPercent: 70,
    lowStockThresholdQty: 70,
    images: [],
    thumbnail: {
      cloudinaryPublicId: 'sample',
      secureUrl: '/images/tea_nest_front.jpg',
      width: 800,
      height: 800,
      altText: 'Tea Nest Assam Black Tea',
      sortOrder: 0,
    },
    isPublished: true,
    isFeatured: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'admin@teanest.in',
  };

  beforeEach(() => {
    orderService = new OrderService();
    orderService.setProduct({ ...mockProduct, stockQuantity: 1 });
  });

  it('allows exactly one order to confirm and safely rejects concurrent order with INSUFFICIENT STOCK', async () => {
    // Create two separate customer orders, each requesting 1 unit
    const order1 = orderService.createOrderIntent({
      customerId: 'cust_1',
      customerName: 'Customer One',
      customerMobile: '9876543210',
      customerEmail: 'cust1@example.com',
      shippingAddress: {
        fullName: 'Customer One',
        mobile: '9876543210',
        street: 'MG Road',
        city: 'Dibrugarh',
        state: 'Assam',
        pincode: '786610',
      },
      items: [
        {
          productId: 'prod_tea_assam_500g',
          sku: 'TN-ABT-500G',
          name: 'Assam Black Tea',
          weight: 500,
          unit: 'g',
          price: 450,
          quantity: 1,
          gstRate: 5,
          taxableAmount: 428.57,
          tax: 21.43,
          subtotal: 428.57,
          total: 450,
        },
      ],
      subtotal: 428.57,
      discount: 0,
      taxableAmount: 428.57,
      tax: 21.43,
      cgst: 10.72,
      sgst: 10.71,
      igst: 0,
      shipping: 0,
      grandTotal: 450,
      status: 'WHATSAPP_PENDING',
      paymentStatus: 'UNPAID',
      paymentMethod: 'WHATSAPP',
      whatsappMessageSent: true,
    });

    const order2 = orderService.createOrderIntent({
      customerId: 'cust_2',
      customerName: 'Customer Two',
      customerMobile: '9876543211',
      customerEmail: 'cust2@example.com',
      shippingAddress: {
        fullName: 'Customer Two',
        mobile: '9876543211',
        street: 'Station Road',
        city: 'Guwahati',
        state: 'Assam',
        pincode: '781001',
      },
      items: [
        {
          productId: 'prod_tea_assam_500g',
          sku: 'TN-ABT-500G',
          name: 'Assam Black Tea',
          weight: 500,
          unit: 'g',
          price: 450,
          quantity: 1,
          gstRate: 5,
          taxableAmount: 428.57,
          tax: 21.43,
          subtotal: 428.57,
          total: 450,
        },
      ],
      subtotal: 428.57,
      discount: 0,
      taxableAmount: 428.57,
      tax: 21.43,
      cgst: 10.72,
      sgst: 10.71,
      igst: 0,
      shipping: 0,
      grandTotal: 450,
      status: 'WHATSAPP_PENDING',
      paymentStatus: 'UNPAID',
      paymentMethod: 'WHATSAPP',
      whatsappMessageSent: true,
    });

    // Simulate two simultaneous admin confirmations
    const admin1 = { uid: 'admin_1', email: 'superadmin@teanest.in', role: 'SUPER_ADMIN' };
    const admin2 = { uid: 'admin_2', email: 'salesmgr@teanest.in', role: 'SALES_MANAGER' };

    const results = await Promise.allSettled([
      orderService.confirmOrder(order1.id, admin1),
      orderService.confirmOrder(order2.id, admin2),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly one should succeed, exactly one must fail
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // The rejected confirmation must state INSUFFICIENT STOCK
    const rejectionReason = (rejected[0] as PromiseRejectedResult).reason.message;
    expect(rejectionReason).toContain('INSUFFICIENT STOCK');

    // Verify stock never drops below zero
    const finalProduct = orderService.getProduct('prod_tea_assam_500g')!;
    expect(finalProduct.stockQuantity).toBe(0);

    // Verify exactly 1 sales record and 1 invoice created
    const state = orderService.getState();
    expect(Object.keys(state.sales).length).toBe(1);
    expect(Object.keys(state.invoices).length).toBe(1);
    expect(state.inventoryMovements.length).toBe(1);
    expect(state.inventoryMovements[0].type).toBe('SALE');
    expect(state.inventoryMovements[0].beforeQuantity).toBe(1);
    expect(state.inventoryMovements[0].afterQuantity).toBe(0);

    // Verify low stock alert was triggered since stock 0 < 70 threshold
    const activeAlerts = Object.values(state.lowStockAlerts).filter((a) => a.status === 'ACTIVE');
    expect(activeAlerts.length).toBe(1);
    expect(activeAlerts[0].productId).toBe('prod_tea_assam_500g');
    expect(activeAlerts[0].currentStock).toBe(0);
  });
});
