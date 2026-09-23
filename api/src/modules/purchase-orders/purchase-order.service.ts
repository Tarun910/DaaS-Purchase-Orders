import type { Prisma } from "@prisma/client";
import { newId } from "../../db/ids.js";
import { prisma } from "../../db/prisma.js";
import { DomainError, ErrorCodes } from "../../errors.js";
import {
  derivePurchaseOrderStatus,
  type PurchaseOrderStatus,
} from "./purchase-order.status.js";

export interface CreatePurchaseOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreatePurchaseOrderInput {
  poNumber: string;
  vendorId: string;
  items: CreatePurchaseOrderItemInput[];
}

export interface ReceivePurchaseOrderItemInput {
  productId: string;
  quantity: number;
}

export interface ReceivePurchaseOrderInput {
  purchaseOrderId: string;
  locationId: string;
  items: ReceivePurchaseOrderItemInput[];
}

const activePoInclude = {
  vendor: true,
  items: {
    where: { deletedAt: null },
    include: { product: true },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.PurchaseOrderInclude;

type PoWithRelations = Prisma.PurchaseOrderGetPayload<{
  include: typeof activePoInclude;
}>;

function mapPurchaseOrder(po: PoWithRelations) {
  return {
    ...po,
    status: derivePurchaseOrderStatus(po.items),
    items: po.items.map((item) => ({
      ...item,
      remainingQuantity: item.orderedQuantity - item.receivedQuantity,
    })),
  };
}

export async function listPurchaseOrders(status?: PurchaseOrderStatus) {
  const orders = await prisma.purchaseOrder.findMany({
    where: { deletedAt: null },
    include: activePoInclude,
    orderBy: { createdAt: "desc" },
  });

  const mapped = orders.map(mapPurchaseOrder);
  if (!status) {
    return mapped;
  }
  return mapped.filter((order) => order.status === status);
}

export async function getPurchaseOrder(id: string) {
  const po = await prisma.purchaseOrder.findFirst({
    where: { id, deletedAt: null },
    include: activePoInclude,
  });

  if (!po) {
    throw new DomainError(
      ErrorCodes.PO_NOT_FOUND,
      `Purchase order ${id} was not found.`,
      404,
    );
  }

  return mapPurchaseOrder(po);
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput) {
  const poNumber = input.poNumber.trim();
  if (!poNumber) {
    throw new DomainError(
      ErrorCodes.VALIDATION_ERROR,
      "PO number is required.",
    );
  }

  if (!input.items?.length) {
    throw new DomainError(
      ErrorCodes.VALIDATION_ERROR,
      "At least one line item is required.",
    );
  }

  const productIds = input.items.map((item) => item.productId);
  const uniqueProductIds = new Set(productIds);
  if (uniqueProductIds.size !== productIds.length) {
    throw new DomainError(
      ErrorCodes.DUPLICATE_PRODUCT_LINE,
      "Duplicate product lines in the same purchase order are not allowed.",
    );
  }

  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new DomainError(
        ErrorCodes.INVALID_QUANTITY,
        "Ordered quantity must be an integer greater than zero.",
      );
    }
  }

  const vendor = await prisma.vendor.findFirst({
    where: { id: input.vendorId, deletedAt: null },
  });
  if (!vendor) {
    throw new DomainError(
      ErrorCodes.VENDOR_NOT_FOUND,
      `Vendor ${input.vendorId} was not found.`,
      404,
    );
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
  });
  if (products.length !== productIds.length) {
    const found = new Set(products.map((p) => p.id));
    const missing = productIds.find((id) => !found.has(id));
    throw new DomainError(
      ErrorCodes.PRODUCT_NOT_FOUND,
      `Product ${missing} was not found.`,
      404,
    );
  }

  const existingPo = await prisma.purchaseOrder.findFirst({
    where: { poNumber, deletedAt: null },
  });
  if (existingPo) {
    throw new DomainError(
      ErrorCodes.DUPLICATE_PO_NUMBER,
      `PO number ${poNumber} is already in use.`,
    );
  }

  const purchaseOrderId = newId();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.create({
        data: {
          id: purchaseOrderId,
          poNumber,
          vendorId: input.vendorId,
          items: {
            create: input.items.map((item) => ({
              id: newId(),
              productId: item.productId,
              orderedQuantity: item.quantity,
              receivedQuantity: 0,
            })),
          },
        },
      });
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      throw new DomainError(
        ErrorCodes.DUPLICATE_PO_NUMBER,
        `PO number ${poNumber} is already in use.`,
      );
    }
    throw error;
  }

  return getPurchaseOrder(purchaseOrderId);
}

export async function receivePurchaseOrder(input: ReceivePurchaseOrderInput) {
  if (!input.items?.length) {
    throw new DomainError(
      ErrorCodes.VALIDATION_ERROR,
      "At least one receive line is required.",
    );
  }

  const productIds = input.items.map((item) => item.productId);
  const uniqueProductIds = new Set(productIds);
  if (uniqueProductIds.size !== productIds.length) {
    throw new DomainError(
      ErrorCodes.DUPLICATE_PRODUCT_LINE,
      "Duplicate product lines in the same receive request are not allowed.",
    );
  }

  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new DomainError(
        ErrorCodes.INVALID_QUANTITY,
        "Receive quantity must be an integer greater than zero.",
      );
    }
  }

  const location = await prisma.location.findFirst({
    where: { id: input.locationId, deletedAt: null },
  });
  if (!location) {
    throw new DomainError(
      ErrorCodes.LOCATION_NOT_FOUND,
      `Location ${input.locationId} was not found.`,
      404,
    );
  }

  const purchaseOrder = await prisma.purchaseOrder.findFirst({
    where: { id: input.purchaseOrderId, deletedAt: null },
    include: {
      items: { where: { deletedAt: null } },
    },
  });
  if (!purchaseOrder) {
    throw new DomainError(
      ErrorCodes.PO_NOT_FOUND,
      `Purchase order ${input.purchaseOrderId} was not found.`,
      404,
    );
  }

  const itemsByProduct = new Map(
    purchaseOrder.items.map((item) => [item.productId, item]),
  );

  for (const receiveItem of input.items) {
    const poItem = itemsByProduct.get(receiveItem.productId);
    if (!poItem) {
      throw new DomainError(
        ErrorCodes.INVALID_PO_ITEM,
        `Product ${receiveItem.productId} is not on purchase order ${purchaseOrder.poNumber}.`,
      );
    }

    const remaining = poItem.orderedQuantity - poItem.receivedQuantity;
    if (receiveItem.quantity > remaining) {
      throw new DomainError(
        ErrorCodes.QUANTITY_EXCEEDS_REMAINING,
        `Requested quantity ${receiveItem.quantity} exceeds remaining ${remaining} for product ${receiveItem.productId}.`,
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const receiveItem of input.items) {
      const poItem = itemsByProduct.get(receiveItem.productId)!;

      await tx.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: {
          receivedQuantity: poItem.receivedQuantity + receiveItem.quantity,
        },
      });

      await tx.stockMovement.create({
        data: {
          id: newId(),
          productId: receiveItem.productId,
          locationId: input.locationId,
          quantity: receiveItem.quantity,
          movementType: "RECEIPT",
          referenceId: purchaseOrder.id,
        },
      });

      const existingStock = await tx.inventoryStock.findUnique({
        where: {
          locationId_productId: {
            locationId: input.locationId,
            productId: receiveItem.productId,
          },
        },
      });

      if (existingStock && existingStock.deletedAt === null) {
        await tx.inventoryStock.update({
          where: { id: existingStock.id },
          data: { quantity: existingStock.quantity + receiveItem.quantity },
        });
      } else if (existingStock && existingStock.deletedAt !== null) {
        await tx.inventoryStock.update({
          where: { id: existingStock.id },
          data: {
            quantity: receiveItem.quantity,
            deletedAt: null,
          },
        });
      } else {
        await tx.inventoryStock.create({
          data: {
            id: newId(),
            locationId: input.locationId,
            productId: receiveItem.productId,
            quantity: receiveItem.quantity,
          },
        });
      }
    }
  });

  return getPurchaseOrder(purchaseOrder.id);
}
