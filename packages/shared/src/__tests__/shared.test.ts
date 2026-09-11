import { describe, it, expect } from 'vitest';
import {
  calculateLowStockThreshold,
  isLowStock,
} from '../inventory';
import {
  calculateGstFromBase,
  calculateTaxableFromInclusive,
} from '../tax';
import {
  amountToWords,
  formatCurrency,
} from '../formatters';
import {
  generateWhatsAppOrderUrl,
} from '../whatsapp';

describe('Inventory Low-Stock Thresholds', () => {
  it('calculates 70% threshold of 100 correctly', () => {
    // reference = 100, percent = 70 -> ceil(100 * 0.70) = 70
    const threshold = calculateLowStockThreshold(100, 70);
    expect(threshold).toBe(70);
    expect(isLowStock(69, threshold)).toBe(true);
    expect(isLowStock(70, threshold)).toBe(false);
    expect(isLowStock(100, threshold)).toBe(false);
  });

  it('handles ceiling on odd quantities', () => {
    // reference = 75, percent = 70 -> ceil(52.5) = 53
    const threshold = calculateLowStockThreshold(75, 70);
    expect(threshold).toBe(53);
    expect(isLowStock(52, threshold)).toBe(true);
    expect(isLowStock(53, threshold)).toBe(false);
  });
});

describe('GST Calculation Engine', () => {
  it('calculates intra-state 5% GST on base taxable amount', () => {
    // ₹400 base taxable at 5% GST (Intra-state) -> CGST = ₹10 (2.5%), SGST = ₹10 (2.5%)
    const res = calculateGstFromBase(400, 5, false);
    expect(res.taxableAmount).toBe(400);
    expect(res.cgst).toBe(10);
    expect(res.sgst).toBe(10);
    expect(res.igst).toBe(0);
    expect(res.totalTax).toBe(20);
    expect(res.grandTotal).toBe(420);
  });

  it('calculates inter-state 5% GST on base taxable amount', () => {
    // ₹400 base taxable at 5% GST (Inter-state) -> IGST = ₹20 (5%)
    const res = calculateGstFromBase(400, 5, true);
    expect(res.cgst).toBe(0);
    expect(res.sgst).toBe(0);
    expect(res.igst).toBe(20);
    expect(res.totalTax).toBe(20);
    expect(res.grandTotal).toBe(420);
  });

  it('extracts taxable amount from GST-inclusive selling price', () => {
    // Selling price ₹450 with 5% GST included
    const res = calculateTaxableFromInclusive(450, 5, false);
    expect(res.taxableAmount).toBe(428.57);
    expect(res.grandTotal).toBe(450);
  });
});

describe('Formatters & Indian Rupee Words', () => {
  it('formats currency with symbol', () => {
    expect(formatCurrency(450)).toBe('₹450.00');
    expect(formatCurrency(1250.5)).toBe('₹1,250.50');
  });

  it('converts numbers to Indian Rupee Words accurately', () => {
    expect(amountToWords(450)).toBe('Four Hundred Fifty Rupees Only');
    expect(amountToWords(1250)).toBe('One Thousand Two Hundred Fifty Rupees Only');
    expect(amountToWords(450.50)).toBe('Four Hundred Fifty Rupees and Fifty Paise Only');
  });
});

describe('WhatsApp Order Link Generator', () => {
  it('generates a valid wa.me link with encoded order intent', () => {
    const url = generateWhatsAppOrderUrl({
      phoneNumber: '919876543210',
      orderNumber: 'TN-2026-000001',
      customerName: 'Rahul Sharma',
      customerMobile: '9876543210',
      customerEmail: 'rahul@example.com',
      shippingAddress: 'House 12, Guwahati, Assam',
      items: [
        {
          name: 'Assam Black Tea',
          weight: 500,
          unit: 'g',
          quantity: 1,
          price: 450,
        },
      ],
      grandTotal: 450,
    });

    expect(url).toContain('https://wa.me/919876543210');
    expect(url).toContain('TN-2026-000001');
    expect(url).toContain('Rahul%20Sharma');
    expect(url).toContain('Assam%20Black%20Tea');
  });
});
