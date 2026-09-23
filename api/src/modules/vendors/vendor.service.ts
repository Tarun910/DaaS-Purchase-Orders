import { prisma } from "../../db/prisma.js";

export async function listVendors() {
  return prisma.vendor.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
}
