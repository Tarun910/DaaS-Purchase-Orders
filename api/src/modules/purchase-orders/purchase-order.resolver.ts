import { requireRole } from "../../auth/auth.js";
import type { GraphQLContext } from "../../graphql/context.js";
import { DomainError, ErrorCodes } from "../../errors.js";
import type { PurchaseOrderStatus } from "./purchase-order.status.js";
import * as purchaseOrderService from "./purchase-order.service.js";

export type { GraphQLContext };

function toIso(value: Date): string {
  return value.toISOString();
}

export const purchaseOrderResolvers = {
  Query: {
    purchaseOrders: async (
      _parent: unknown,
      args: { status?: PurchaseOrderStatus | null },
      context: GraphQLContext,
    ) => {
      requireRole(context.user, ["ADMIN", "WAREHOUSE", "VIEWER"]);
      return purchaseOrderService.listPurchaseOrders(args.status ?? undefined);
    },
    purchaseOrder: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      requireRole(context.user, ["ADMIN", "WAREHOUSE", "VIEWER"]);
      try {
        return await purchaseOrderService.getPurchaseOrder(args.id);
      } catch (error) {
        if (
          error instanceof DomainError &&
          error.code === ErrorCodes.PO_NOT_FOUND
        ) {
          return null;
        }
        throw error;
      }
    },
  },
  Mutation: {
    createPurchaseOrder: async (
      _parent: unknown,
      args: { input: purchaseOrderService.CreatePurchaseOrderInput },
      context: GraphQLContext,
    ) => {
      requireRole(context.user, ["ADMIN"]);
      return purchaseOrderService.createPurchaseOrder(args.input);
    },
    receivePurchaseOrder: async (
      _parent: unknown,
      args: { input: purchaseOrderService.ReceivePurchaseOrderInput },
      context: GraphQLContext,
    ) => {
      requireRole(context.user, ["ADMIN", "WAREHOUSE"]);
      const purchaseOrder = await purchaseOrderService.receivePurchaseOrder(
        args.input,
      );
      return { purchaseOrder };
    },
  },
  PurchaseOrder: {
    createdAt: (parent: { createdAt: Date }) => toIso(parent.createdAt),
    updatedAt: (parent: { updatedAt: Date }) => toIso(parent.updatedAt),
  },
};
