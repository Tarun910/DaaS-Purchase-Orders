"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { StatusChip } from "@/components/StatusChip";
import {
  useGetLocationsQuery,
  useGetPurchaseOrderQuery,
  useReceivePurchaseOrderMutation,
} from "@/store/api";
import { useAppSelector } from "@/store/hooks";

const receiveSchema = z.object({
  locationId: z.string().min(1, "Location is required"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        quantity: z
          .number({ error: "Quantity must be a number" })
          .int("Quantity must be an integer")
          .gt(0, "Quantity must be greater than 0"),
      }),
    )
    .min(1, "At least one receive line is required"),
});

type ReceiveFormValues = z.infer<typeof receiveSchema>;

export default function PurchaseOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const role = useAppSelector((state) => state.role.role);
  const canReceive = role === "ADMIN" || role === "WAREHOUSE";

  const { data: po, error, isLoading } = useGetPurchaseOrderQuery(id);
  const { data: locations = [] } = useGetLocationsQuery();
  const [receivePurchaseOrder, receiveState] = useReceivePurchaseOrderMutation();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReceiveFormValues>({
    resolver: zodResolver(receiveSchema),
    defaultValues: {
      locationId: "",
      items: [{ productId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (po?.items.length) {
      const firstOpen = po.items.find((item) => item.remainingQuantity > 0);
      reset({
        locationId: "",
        items: [
          {
            productId: firstOpen?.product.id ?? po.items[0].product.id,
            quantity: 1,
          },
        ],
      });
    }
  }, [po, reset]);

  if (isLoading) {
    return <Alert severity="info">Loading purchase order...</Alert>;
  }

  if (error || !po) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">Unable to load purchase order.</Alert>
        <Button component={Link} href="/purchase-orders" variant="outlined">
          Back to list
        </Button>
      </Stack>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    await receivePurchaseOrder({
      purchaseOrderId: po.id,
      locationId: values.locationId,
      items: values.items,
    }).unwrap();
  });

  const apiErrorMessage =
    receiveState.error && "data" in receiveState.error
      ? (receiveState.error.data as { message?: string })?.message
      : undefined;

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
          <Typography variant="h4">{po.poNumber}</Typography>
          <Typography color="text.secondary">
            Vendor: {po.vendor.name}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <StatusChip status={po.status} />
          <Button component={Link} href="/purchase-orders" variant="outlined">
            Back to list
          </Button>
        </Stack>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell align="right">Ordered</TableCell>
              <TableCell align="right">Received</TableCell>
              <TableCell align="right">Remaining</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {po.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.product.name} ({item.product.sku})
                </TableCell>
                <TableCell align="right">{item.orderedQuantity}</TableCell>
                <TableCell align="right">{item.receivedQuantity}</TableCell>
                <TableCell align="right">{item.remainingQuantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {canReceive && po.status !== "RECEIVED" ? (
        <Paper sx={{ p: 3 }} component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            <Typography variant="h6">Receive Stock</Typography>
            <Typography color="text.secondary">
              Receiving updates inventory, writes a stock movement, and derives
              PO status in one transaction.
            </Typography>

            {apiErrorMessage ? (
              <Alert severity="error">{apiErrorMessage}</Alert>
            ) : null}
            {receiveState.isSuccess ? (
              <Alert severity="success">
                Stock received successfully. Quantities and status were updated.
              </Alert>
            ) : null}

            <Controller
              name="locationId"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  label="Location"
                  {...field}
                  error={Boolean(errors.locationId)}
                  helperText={errors.locationId?.message}
                  fullWidth
                >
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {fields.map((field, index) => (
              <Stack
                key={field.id}
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                sx={{ alignItems: { md: "flex-start" } }}
              >
                <Controller
                  name={`items.${index}.productId`}
                  control={control}
                  render={({ field: productField }) => (
                    <TextField
                      select
                      label="Product / line"
                      {...productField}
                      error={Boolean(errors.items?.[index]?.productId)}
                      helperText={errors.items?.[index]?.productId?.message}
                      fullWidth
                    >
                      {po.items.map((item) => (
                        <MenuItem
                          key={item.id}
                          value={item.product.id}
                          disabled={item.remainingQuantity === 0}
                        >
                          {item.product.name} (remaining {item.remainingQuantity})
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <TextField
                  label="Quantity"
                  type="number"
                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  error={Boolean(errors.items?.[index]?.quantity)}
                  helperText={errors.items?.[index]?.quantity?.message}
                  sx={{ width: { xs: "100%", md: 180 } }}
                />
                <Button
                  type="button"
                  color="inherit"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  sx={{ mt: 1, whiteSpace: "nowrap" }}
                >
                  Remove
                </Button>
              </Stack>
            ))}

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => append({ productId: "", quantity: 1 })}
              >
                Add line
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={receiveState.isLoading}
              >
                {receiveState.isLoading ? "Receiving..." : "Receive Stock"}
              </Button>
            </Box>
          </Stack>
        </Paper>
      ) : null}

      {!canReceive ? (
        <Alert severity="info">
          VIEWER can inspect purchase orders but cannot receive stock. Switch to
          WAREHOUSE or ADMIN to receive.
        </Alert>
      ) : null}

      {po.status === "RECEIVED" ? (
        <Alert severity="success">
          This purchase order is fully received.
        </Alert>
      ) : null}
    </Stack>
  );
}
