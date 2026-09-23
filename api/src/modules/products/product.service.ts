import { prisma } from "../../db/prisma.js";

export async function listProducts() {
  return prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
}
