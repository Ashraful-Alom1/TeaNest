export type InventoryMovementType =
  | 'PURCHASE'
  | 'SALE'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'RETURN'
  | 'CANCELLED_ORDER';

export interface InventoryMovement {
  movementId: string;
  productId: string;
  productName: string;
  type: InventoryMovementType;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  referenceId: string; // orderId, purchaseId, or manual reference
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface LowStockAlert {
  alertId: string;
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  status: 'ACTIVE' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string;
}
