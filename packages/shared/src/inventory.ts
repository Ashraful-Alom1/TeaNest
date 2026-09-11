/**
 * Calculates the low stock threshold quantity.
 * Formula: ceil(stockReferenceQty * lowStockPercent / 100)
 */
export function calculateLowStockThreshold(
  stockReferenceQty: number,
  lowStockPercent: number = 70
): number {
  if (stockReferenceQty <= 0) return 0;
  const percent = Math.max(0, Math.min(100, lowStockPercent));
  return Math.ceil((stockReferenceQty * percent) / 100);
}

/**
 * Determines if product is in low stock condition.
 */
export function isLowStock(currentStock: number, threshold: number): boolean {
  return currentStock < threshold;
}
