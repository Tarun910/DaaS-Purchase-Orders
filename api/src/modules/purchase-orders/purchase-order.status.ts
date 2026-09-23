export type PurchaseOrderStatus = "OPEN" | "PARTIAL" | "RECEIVED";

export interface QuantityLine {
  orderedQuantity: number;
  receivedQuantity: number;
}

/**
 * Derives PO status from line quantities. Never stored as a mutable DB field.
 * - OPEN: every line has received_quantity = 0
 * - RECEIVED: every line has received_quantity = ordered_quantity
 * - PARTIAL: otherwise (at least one receipt, not fully complete)
 */
export function derivePurchaseOrderStatus(
  items: QuantityLine[],
): PurchaseOrderStatus {
  if (items.length === 0) {
    return "OPEN";
  }

  const allUnreceived = items.every((item) => item.receivedQuantity === 0);
  if (allUnreceived) {
    return "OPEN";
  }

  const allFullyReceived = items.every(
    (item) => item.receivedQuantity === item.orderedQuantity,
  );
  if (allFullyReceived) {
    return "RECEIVED";
  }

  return "PARTIAL";
}

export function remainingQuantity(item: QuantityLine): number {
  return item.orderedQuantity - item.receivedQuantity;
}
