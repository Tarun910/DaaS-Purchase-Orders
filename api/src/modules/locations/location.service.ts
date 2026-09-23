import { prisma } from "../../db/prisma.js";

export async function listLocations() {
  return prisma.location.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
}
