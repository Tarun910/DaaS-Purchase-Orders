"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import {
  useCreatePurchaseOrderMutation,
  useGetProductsQuery,
  useGetVendorsQuery,
} from "@/store/api";
import { useAppSelector } from "@/store/hooks";

const createPoSchema = z.object({
  poNumber: z.string().trim().min(1, "PO number is required"),
  vendorId: z.string().min(1, "Vendor is required"),
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
    .min(1, "At least one line item is required"),
});

type CreatePoFormValues = z.infer<typeof createPoSchema>;

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const role = useAppSelector((state) => state.role.role);
  const { data: vendors = [] } = useGetVendorsQuery();
  const { data: products = [] } = useGetProductsQuery();
  const [createPurchaseOrder, { isLoading, error, isSuccess }] =
    useCreatePurchaseOrderMutation();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePoFormValues>({
    resolver: zodResolver(createPoSchema),
    defaultValues: {
      poNumber: "",
      vendorId: "",
      items: [{ productId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  if (role !== "ADMIN") {
    return (
      <Alert severity="warning">
        Only ADMIN can create purchase orders. Switch the demo role in the
        header.
      </Alert>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = await createPurchaseOrder(values).unwrap();
    router.push(`/purchase-orders/${result.id}`);
  });

  const apiErrorMessage =
    error && "data" in error
      ? (error.data as { message?: string })?.message
      : undefined;

  return (
    <Stack spacing={3} component="form" onSubmit={onSubmit}>
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
          <Typography variant="h4">Create Purchase Order</Typography>
          <Typography color="text.secondary">
            Add a vendor, PO number, and one or more product lines.
          </Typography>
        </Box>
        <Button component={Link} href="/purchase-orders" variant="outlined">
          Back to list
        </Button>
      </Box>

      {apiErrorMessage ? <Alert severity="error">{apiErrorMessage}</Alert> : null}
      {isSuccess ? (
        <Alert severity="success">Purchase order created successfully.</Alert>
      ) : null}

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="PO Number"
            {...register("poNumber")}
            error={Boolean(errors.poNumber)}
            helperText={errors.poNumber?.message}
            fullWidth
          />
          <Controller
            name="vendorId"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="Vendor"
                {...field}
                error={Boolean(errors.vendorId)}
                helperText={errors.vendorId?.message}
                fullWidth
              >
                {vendors.map((vendor) => (
                  <MenuItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Line Items</Typography>
          {errors.items?.root?.message || errors.items?.message ? (
            <Alert severity="error">
              {errors.items.root?.message ?? errors.items.message}
            </Alert>
          ) : null}
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
                    label="Product"
                    {...productField}
                    error={Boolean(errors.items?.[index]?.productId)}
                    helperText={errors.items?.[index]?.productId?.message}
                    fullWidth
                  >
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
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
          <Box>
            <Button
              type="button"
              variant="outlined"
              onClick={() => append({ productId: "", quantity: 1 })}
            >
              Add line item
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Box>
        <Button type="submit" variant="contained" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Purchase Order"}
        </Button>
      </Box>
    </Stack>
  );
}
