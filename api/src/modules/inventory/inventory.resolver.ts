import type { GraphQLContext } from "../../graphql/context.js";
import { requireRole } from "../../auth/auth.js";
import * as inventoryService from "./inventory.service.js";

export const inventoryResolvers = {
  Query: {
    inventoryStock: async (
      _parent: unknown,
      args: { locationId?: string | null },
      context: GraphQLContext,
    ) => {
      requireRole(context.user, ["ADMIN", "WAREHOUSE", "VIEWER"]);
      return inventoryService.listInventoryStock(args.locationId);
    },
  },
};
