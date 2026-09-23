import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inventoryResolvers } from "../modules/inventory/inventory.resolver.js";
import { locationResolvers } from "../modules/locations/location.resolver.js";
import { productResolvers } from "../modules/products/product.resolver.js";
import { purchaseOrderResolvers } from "../modules/purchase-orders/purchase-order.resolver.js";
import { vendorResolvers } from "../modules/vendors/vendor.resolver.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typeDefs = mergeTypeDefs(
  loadFilesSync(path.join(__dirname, "../modules/**/*.graphql")),
);

const resolvers = mergeResolvers([
  purchaseOrderResolvers,
  vendorResolvers,
  productResolvers,
  locationResolvers,
  inventoryResolvers,
]);

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
