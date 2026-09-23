import { PrismaClient, StockMovementType } from "@prisma/client";
import { v7 as uuidv7 } from "uuid";

const prisma = new PrismaClient();

const IDS = {
  vendors: {
    abc: "018f0000-0000-7000-8000-000000000001",
    xyz: "018f0000-0000-7000-8000-000000000002",
    global: "018f0000-0000-7000-8000-000000000003",
  },
  products: {
    laptop: "018f0000-0000-7000-8000-000000000011",
    monitor: "018f0000-0000-7000-8000-000000000012",
    keyboard: "018f0000-0000-7000-8000-000000000013",
    switch: "018f0000-0000-7000-8000-000000000014",
    hdmi: "018f0000-0000-7000-8000-000000000015",
  },
  locations: {
    mumbai: "018f0000-0000-7000-8000-000000000021",
    delhi: "018f0000-0000-7000-8000-000000000022",
  },
  purchaseOrders: {
    po1001: "018f0000-0000-7000-8000-000000000031",
    po1002: "018f0000-0000-7000-8000-000000000032",
    po1003: "018f0000-0000-7000-8000-000000000033",
  },
} as const;

async function upsertVendor(id: string, name: string) {
  await prisma.vendor.upsert({
    where: { id },
    create: { id, name },
    update: { name, deletedAt: null },
  });
}

async function upsertProduct(id: string, name: string, sku: string) {
  await prisma.product.upsert({
    where: { id },
    create: { id, name, sku },
    update: { name, sku, deletedAt: null },
  });
}

async function upsertLocation(id: string, name: string) {
  await prisma.location.upsert({
    where: { id },
    create: { id, name },
    update: { name, deletedAt: null },
  });
}

async function seed() {
  await upsertVendor(IDS.vendors.abc, "ABC Electronics");
  await upsertVendor(IDS.vendors.xyz, "XYZ AV Supplies");
  await upsertVendor(IDS.vendors.global, "Global Tech");

  await upsertProduct(IDS.products.laptop, "Laptop", "SKU-LAPTOP");
  await upsertProduct(IDS.products.monitor, "Monitor", "SKU-MONITOR");
  await upsertProduct(IDS.products.keyboard, "Keyboard", "SKU-KEYBOARD");
  await upsertProduct(IDS.products.switch, "Network Switch", "SKU-SWITCH");
  await upsertProduct(IDS.products.hdmi, "HDMI Cable", "SKU-HDMI");

  await upsertLocation(IDS.locations.mumbai, "Mumbai Warehouse");
  await upsertLocation(IDS.locations.delhi, "Delhi Warehouse");

  // OPEN: nothing received
  await prisma.purchaseOrder.upsert({
    where: { id: IDS.purchaseOrders.po1001 },
    create: {
      id: IDS.purchaseOrders.po1001,
      poNumber: "PO-1001",
      vendorId: IDS.vendors.abc,
      items: {
        create: [
          {
            id: "018f0000-0000-7000-8000-000000000041",
            productId: IDS.products.laptop,
            orderedQuantity: 10,
            receivedQuantity: 0,
          },
          {
            id: "018f0000-0000-7000-8000-000000000042",
            productId: IDS.products.monitor,
            orderedQuantity: 20,
            receivedQuantity: 0,
          },
        ],
      },
    },
    update: {
      poNumber: "PO-1001",
      vendorId: IDS.vendors.abc,
      deletedAt: null,
    },
  });

  // PARTIAL: some received
  await prisma.purchaseOrder.upsert({
    where: { id: IDS.purchaseOrders.po1002 },
    create: {
      id: IDS.purchaseOrders.po1002,
      poNumber: "PO-1002",
      vendorId: IDS.vendors.xyz,
      items: {
        create: [
          {
            id: "018f0000-0000-7000-8000-000000000043",
            productId: IDS.products.keyboard,
            orderedQuantity: 50,
            receivedQuantity: 20,
          },
          {
            id: "018f0000-0000-7000-8000-000000000044",
            productId: IDS.products.hdmi,
            orderedQuantity: 100,
            receivedQuantity: 100,
          },
        ],
      },
    },
    update: {
      poNumber: "PO-1002",
      vendorId: IDS.vendors.xyz,
      deletedAt: null,
    },
  });

  // RECEIVED: fully received
  await prisma.purchaseOrder.upsert({
    where: { id: IDS.purchaseOrders.po1003 },
    create: {
      id: IDS.purchaseOrders.po1003,
      poNumber: "PO-1003",
      vendorId: IDS.vendors.global,
      items: {
        create: [
          {
            id: "018f0000-0000-7000-8000-000000000045",
            productId: IDS.products.switch,
            orderedQuantity: 5,
            receivedQuantity: 5,
          },
          {
            id: "018f0000-0000-7000-8000-000000000046",
            productId: IDS.products.laptop,
            orderedQuantity: 2,
            receivedQuantity: 2,
          },
        ],
      },
    },
    update: {
      poNumber: "PO-1003",
      vendorId: IDS.vendors.global,
      deletedAt: null,
    },
  });

  // Align item quantities for idempotent re-seeds (upsert update does not recreate nested items)
  await prisma.purchaseOrderItem.updateMany({
    where: { id: "018f0000-0000-7000-8000-000000000041" },
    data: { orderedQuantity: 10, receivedQuantity: 0, deletedAt: null },
  });
  await prisma.purchaseOrderItem.updateMany({
    where: { id: "018f0000-0000-7000-8000-000000000042" },
    data: { orderedQuantity: 20, receivedQuantity: 0, deletedAt: null },
  });
  await prisma.purchaseOrderItem.updateMany({
    where: { id: "018f0000-0000-7000-8000-000000000043" },
    data: { orderedQuantity: 50, receivedQuantity: 20, deletedAt: null },
  });
  await prisma.purchaseOrderItem.updateMany({
    where: { id: "018f0000-0000-7000-8000-000000000044" },
    data: { orderedQuantity: 100, receivedQuantity: 100, deletedAt: null },
  });
  await prisma.purchaseOrderItem.updateMany({
    where: { id: "018f0000-0000-7000-8000-000000000045" },
    data: { orderedQuantity: 5, receivedQuantity: 5, deletedAt: null },
  });
  await prisma.purchaseOrderItem.updateMany({
    where: { id: "018f0000-0000-7000-8000-000000000046" },
    data: { orderedQuantity: 2, receivedQuantity: 2, deletedAt: null },
  });

  // Initial inventory reflecting prior receipts on PO-1002 and PO-1003
  const stockRows = [
    {
      id: "018f0000-0000-7000-8000-000000000051",
      locationId: IDS.locations.mumbai,
      productId: IDS.products.keyboard,
      quantity: 20,
    },
    {
      id: "018f0000-0000-7000-8000-000000000052",
      locationId: IDS.locations.mumbai,
      productId: IDS.products.hdmi,
      quantity: 100,
    },
    {
      id: "018f0000-0000-7000-8000-000000000053",
      locationId: IDS.locations.delhi,
      productId: IDS.products.switch,
      quantity: 5,
    },
    {
      id: "018f0000-0000-7000-8000-000000000054",
      locationId: IDS.locations.delhi,
      productId: IDS.products.laptop,
      quantity: 2,
    },
  ];

  for (const row of stockRows) {
    await prisma.inventoryStock.upsert({
      where: {
        locationId_productId: {
          locationId: row.locationId,
          productId: row.productId,
        },
      },
      create: row,
      update: { quantity: row.quantity, deletedAt: null },
    });
  }

  // Seed audit movements for already-received quantities (idempotent by fixed IDs)
  const movements = [
    {
      id: "018f0000-0000-7000-8000-000000000061",
      productId: IDS.products.keyboard,
      locationId: IDS.locations.mumbai,
      quantity: 20,
      referenceId: IDS.purchaseOrders.po1002,
    },
    {
      id: "018f0000-0000-7000-8000-000000000062",
      productId: IDS.products.hdmi,
      locationId: IDS.locations.mumbai,
      quantity: 100,
      referenceId: IDS.purchaseOrders.po1002,
    },
    {
      id: "018f0000-0000-7000-8000-000000000063",
      productId: IDS.products.switch,
      locationId: IDS.locations.delhi,
      quantity: 5,
      referenceId: IDS.purchaseOrders.po1003,
    },
    {
      id: "018f0000-0000-7000-8000-000000000064",
      productId: IDS.products.laptop,
      locationId: IDS.locations.delhi,
      quantity: 2,
      referenceId: IDS.purchaseOrders.po1003,
    },
  ];

  for (const movement of movements) {
    await prisma.stockMovement.upsert({
      where: { id: movement.id },
      create: {
        ...movement,
        movementType: StockMovementType.RECEIPT,
      },
      update: {
        quantity: movement.quantity,
        movementType: StockMovementType.RECEIPT,
      },
    });
  }

  // Touch uuid helper so the seed stays compatible with runtime UUIDv7 usage
  void uuidv7();

  console.info("Seed completed:");
  console.info("  Vendors: ABC Electronics, XYZ AV Supplies, Global Tech");
  console.info("  Products: Laptop, Monitor, Keyboard, Network Switch, HDMI Cable");
  console.info("  Locations: Mumbai Warehouse, Delhi Warehouse");
  console.info("  POs: PO-1001 (OPEN), PO-1002 (PARTIAL), PO-1003 (RECEIVED)");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
