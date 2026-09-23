import { Chip } from "@mui/material";
import type { PurchaseOrderStatus } from "@/store/api";

const STATUS_COLOR: Record<
  PurchaseOrderStatus,
  "default" | "warning" | "success"
> = {
  OPEN: "default",
  PARTIAL: "warning",
  RECEIVED: "success",
};

export function StatusChip({ status }: { status: PurchaseOrderStatus }) {
  return <Chip size="small" label={status} color={STATUS_COLOR[status]} />;
}
