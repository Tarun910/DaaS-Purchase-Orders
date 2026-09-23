import type { GraphQLContext } from "../../graphql/context.js";
import { requireRole } from "../../auth/auth.js";
import * as vendorService from "./vendor.service.js";

function toIso(value: Date): string {
  return value.toISOString();
}

export const vendorResolvers = {
  Query: {
    vendors: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      requireRole(context.user, ["ADMIN", "WAREHOUSE", "VIEWER"]);
      return vendorService.listVendors();
    },
  },
  Vendor: {
    createdAt: (parent: { createdAt: Date }) => toIso(parent.createdAt),
  },
};
