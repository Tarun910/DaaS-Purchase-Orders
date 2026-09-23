-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('RECEIPT');

-- CreateTable
CREATE TABLE "vendors" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "po_number" TEXT NOT NULL,
    "vendor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "ordered_quantity" INTEGER NOT NULL,
    "received_quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "purchase_order_items_ordered_quantity_check" CHECK ("ordered_quantity" > 0),
    CONSTRAINT "purchase_order_items_received_quantity_check" CHECK ("received_quantity" >= 0),
    CONSTRAINT "purchase_order_items_received_lte_ordered_check" CHECK ("received_quantity" <= "ordered_quantity")
);

-- CreateTable
CREATE TABLE "inventory_stock" (
    "id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_stock_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inventory_stock_quantity_non_negative_check" CHECK ("quantity" >= 0)
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "movement_type" "StockMovementType" NOT NULL,
    "reference_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "stock_movements_quantity_positive_check" CHECK ("quantity" > 0)
);

-- Indexes
CREATE INDEX "products_sku_deleted_at_idx" ON "products"("sku", "deleted_at");
CREATE UNIQUE INDEX "products_sku_active_unique" ON "products"("sku") WHERE "deleted_at" IS NULL;

CREATE INDEX "purchase_orders_po_number_deleted_at_idx" ON "purchase_orders"("po_number", "deleted_at");
CREATE UNIQUE INDEX "purchase_orders_po_number_active_unique" ON "purchase_orders"("po_number") WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "purchase_order_items_purchase_order_id_product_id_key" ON "purchase_order_items"("purchase_order_id", "product_id");
CREATE UNIQUE INDEX "inventory_stock_location_id_product_id_key" ON "inventory_stock"("location_id", "product_id");
CREATE INDEX "stock_movements_reference_id_idx" ON "stock_movements"("reference_id");

-- ForeignKeys
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_stock" ADD CONSTRAINT "inventory_stock_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_stock" ADD CONSTRAINT "inventory_stock_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
