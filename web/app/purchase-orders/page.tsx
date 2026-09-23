"use client";

import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusChip } from "@/components/StatusChip";
import {
  useGetPurchaseOrdersQuery,
  type PurchaseOrderStatus,
} from "@/store/api";
import { useAppSelector } from "@/store/hooks";

type StatusFilter = "ALL" | PurchaseOrderStatus;

function formatDate(value: string): string {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}

export default function PurchaseOrdersPage() {
  const role = useAppSelector((state) => state.role.role);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const queryStatus = statusFilter === "ALL" ? null : statusFilter;
  const { data, error, isLoading } = useGetPurchaseOrdersQuery({
    status: queryStatus,
  });

  const rows = useMemo(() => data ?? [], [data]);

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h4">Purchase Orders</Typography>
          <Typography color="text.secondary">
            Receive stock against open and partial purchase orders.
          </Typography>
        </Box>
        {role === "ADMIN" ? (
          <Button component={Link} href="/purchase-orders/new" variant="contained">
            Create Purchase Order
          </Button>
        ) : null}
      </Box>

      <Paper sx={{ p: 2 }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            label="Status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
          >
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="OPEN">Open</MenuItem>
            <MenuItem value="PARTIAL">Partial</MenuItem>
            <MenuItem value="RECEIVED">Received</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {isLoading ? (
        <Alert severity="info">Loading purchase orders...</Alert>
      ) : null}

      {error ? (
        <Alert severity="error">Unable to load purchase orders.</Alert>
      ) : null}

      {!isLoading && !error && rows.length === 0 ? (
        <Alert severity="warning">No purchase orders found.</Alert>
      ) : null}

      {!isLoading && !error && rows.length > 0 ? (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PO Number</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((po) => (
                <TableRow key={po.id} hover>
                  <TableCell>{po.poNumber}</TableCell>
                  <TableCell>{po.vendor.name}</TableCell>
                  <TableCell>
                    <StatusChip status={po.status} />
                  </TableCell>
                  <TableCell>{formatDate(po.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Button
                      component={Link}
                      href={`/purchase-orders/${po.id}`}
                      size="small"
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      ) : null}
    </Stack>
  );
}
