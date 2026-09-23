import type { GraphQLContext } from "../../graphql/context.js";
import { requireRole } from "../../auth/auth.js";
import * as productService from "./product.service.js";

function toIso(value: Date): string {
  return value.toISOString();
}

export const productResolvers = {
  Query: {
    products: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      requireRole(context.user, ["ADMIN", "WAREHOUSE", "VIEWER"]);
      return productService.listProducts();
    },
  },
  Product: {
    createdAt: (parent: { createdAt: Date }) => toIso(parent.createdAt),
  },
};
