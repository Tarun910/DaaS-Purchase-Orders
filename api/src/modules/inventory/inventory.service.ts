import { prisma } from "../../db/prisma.js";

export async function listInventoryStock(locationId?: string | null) {
  return prisma.inventoryStock.findMany({
    where: {
      deletedAt: null,
      ...(locationId ? { locationId } : {}),
    },
    include: {
      location: true,
      product: true,
    },
    orderBy: [{ location: { name: "asc" } }, { product: { name: "asc" } }],
  });
}
