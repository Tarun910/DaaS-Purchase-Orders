import { createApi } from "@reduxjs/toolkit/query/react";
import { graphqlBaseQuery } from "@/lib/graphqlBaseQuery";

export type PurchaseOrderStatus = "OPEN" | "PARTIAL" | "RECEIVED";

export interface Vendor {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
}

export interface Location {
  id: string;
  name: string;
}

export interface PurchaseOrderItem {
  id: string;
  product: Product;
  orderedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: Vendor;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderInput {
  poNumber: string;
  vendorId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface ReceivePurchaseOrderInput {
  purchaseOrderId: string;
  locationId: string;
  items: Array<{ productId: string; quantity: number }>;
}

const PURCHASE_ORDER_FIELDS = `
  id
  poNumber
  status
  createdAt
  updatedAt
  vendor {
    id
    name
  }
  items {
    id
    orderedQuantity
    receivedQuantity
    remainingQuantity
    product {
      id
      name
      sku
    }
  }
`;

export const api = createApi({
  reducerPath: "api",
  baseQuery: graphqlBaseQuery(),
  tagTypes: ["PurchaseOrders", "PurchaseOrder", "Vendors", "Products", "Locations"],
  endpoints: (builder) => ({
    getPurchaseOrders: builder.query<
      PurchaseOrder[],
      { status?: PurchaseOrderStatus | null }
    >({
      query: ({ status }) => ({
        document: `
          query PurchaseOrders($status: PurchaseOrderStatus) {
            purchaseOrders(status: $status) {
              ${PURCHASE_ORDER_FIELDS}
            }
          }
        `,
        variables: { status: status ?? null },
      }),
      transformResponse: (response: { purchaseOrders: PurchaseOrder[] }) =>
        response.purchaseOrders,
      providesTags: (result) =>
        result
          ? [
              { type: "PurchaseOrders", id: "LIST" },
              ...result.map((po) => ({ type: "PurchaseOrder" as const, id: po.id })),
            ]
          : [{ type: "PurchaseOrders", id: "LIST" }],
    }),
    getPurchaseOrder: builder.query<PurchaseOrder | null, string>({
      query: (id) => ({
        document: `
          query PurchaseOrder($id: ID!) {
            purchaseOrder(id: $id) {
              ${PURCHASE_ORDER_FIELDS}
            }
          }
        `,
        variables: { id },
      }),
      transformResponse: (response: { purchaseOrder: PurchaseOrder | null }) =>
        response.purchaseOrder,
      providesTags: (_result, _error, id) => [{ type: "PurchaseOrder", id }],
    }),
    getVendors: builder.query<Vendor[], void>({
      query: () => ({
        document: `
          query Vendors {
            vendors {
              id
              name
            }
          }
        `,
      }),
      transformResponse: (response: { vendors: Vendor[] }) => response.vendors,
      providesTags: [{ type: "Vendors", id: "LIST" }],
    }),
    getProducts: builder.query<Product[], void>({
      query: () => ({
        document: `
          query Products {
            products {
              id
              name
              sku
            }
          }
        `,
      }),
      transformResponse: (response: { products: Product[] }) => response.products,
      providesTags: [{ type: "Products", id: "LIST" }],
    }),
    getLocations: builder.query<Location[], void>({
      query: () => ({
        document: `
          query Locations {
            locations {
              id
              name
            }
          }
        `,
      }),
      transformResponse: (response: { locations: Location[] }) => response.locations,
      providesTags: [{ type: "Locations", id: "LIST" }],
    }),
    createPurchaseOrder: builder.mutation<PurchaseOrder, CreatePurchaseOrderInput>({
      query: (input) => ({
        document: `
          mutation CreatePurchaseOrder($input: CreatePurchaseOrderInput!) {
            createPurchaseOrder(input: $input) {
              ${PURCHASE_ORDER_FIELDS}
            }
          }
        `,
        variables: { input },
      }),
      transformResponse: (response: { createPurchaseOrder: PurchaseOrder }) =>
        response.createPurchaseOrder,
      invalidatesTags: [{ type: "PurchaseOrders", id: "LIST" }],
    }),
    receivePurchaseOrder: builder.mutation<
      PurchaseOrder,
      ReceivePurchaseOrderInput
    >({
      query: (input) => ({
        document: `
          mutation ReceivePurchaseOrder($input: ReceivePurchaseOrderInput!) {
            receivePurchaseOrder(input: $input) {
              purchaseOrder {
                ${PURCHASE_ORDER_FIELDS}
              }
            }
          }
        `,
        variables: { input },
      }),
      transformResponse: (response: {
        receivePurchaseOrder: { purchaseOrder: PurchaseOrder };
      }) => response.receivePurchaseOrder.purchaseOrder,
      invalidatesTags: (_result, _error, arg) => [
        { type: "PurchaseOrders", id: "LIST" },
        { type: "PurchaseOrder", id: arg.purchaseOrderId },
      ],
    }),
  }),
});

export const {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderQuery,
  useGetVendorsQuery,
  useGetProductsQuery,
  useGetLocationsQuery,
  useCreatePurchaseOrderMutation,
  useReceivePurchaseOrderMutation,
} = api;
