import type { GraphQLContext } from "../../graphql/context.js";
import { requireRole } from "../../auth/auth.js";
import * as locationService from "./location.service.js";

function toIso(value: Date): string {
  return value.toISOString();
}

export const locationResolvers = {
  Query: {
    locations: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      requireRole(context.user, ["ADMIN", "WAREHOUSE", "VIEWER"]);
      return locationService.listLocations();
    },
  },
  Location: {
    createdAt: (parent: { createdAt: Date }) => toIso(parent.createdAt),
  },
};
