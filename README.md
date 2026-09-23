# DaaS Purchase Order Receiving

## Overview

This repository is a take-home implementation of **one** DaaS roadmap feature slice: end-to-end purchase order receiving. It demonstrates relational inventory modelling, transactional stock updates, GraphQL API design, and a typed Next.js UI on the stack used by DaaS.

## Demo

Demo video:
https://drive.google.com/file/d/1aDvTliB_urQEX6WI6EeBoqbS6qYTgWJZ/view?usp=sharing

The demo covers:
- Purchase order creation
- Purchase order list and status filter
- Partial stock receiving
- PO status changing to PARTIAL
- Receiving remaining quantity
- PO status changing to RECEIVED
- Role-based authorization
- GraphQL operations

Detailed written documentation (architecture, folder structure, application/database flows, run commands, and implementation process):

[`docs/DaaS-Purchase-Order-Receiving-Complete-Documentation.docx`](docs/DaaS-Purchase-Order-Receiving-Complete-Documentation.docx)

## Selected Feature

**Option 1 — Sprint 2 — Purchase Order Receiving**

- Create a purchase order with line items
- Receive quantities against a PO into a location
- Each receive validates remaining quantity, inserts a stock movement, updates on-hand stock, updates PO line received quantities, and derives PO status
- Multi-row writes run inside a Prisma transaction
- PO status is **never** stored or manually selected

Derived statuses:

| Status | Rule |
| --- | --- |
| `OPEN` | Every line has `received_quantity = 0` |
| `PARTIAL` | At least one receipt, but not every line is fully received |
| `RECEIVED` | Every line has `received_quantity = ordered_quantity` |

## Architecture

```
Next.js (App Router)
        ↓
   RTK Query
        ↓
     GraphQL
        ↓
  Apollo Server 5
        ↓
  Domain Services
        ↓
      Prisma
        ↓
    PostgreSQL
```

Domain folders under `api/src/modules/` each own their GraphQL schema, resolvers, and service logic. Resolvers validate/authorize and delegate; services own business rules and transactions.

## Project Structure

```
daas-take-home/
├── api/                  # Apollo GraphQL API + Prisma
│   ├── prisma/           # Schema, migrations, seed
│   └── src/
│       ├── auth/         # Bearer token → role
│       ├── db/           # Prisma client + UUIDv7 ids
│       ├── graphql/      # Schema merge + error mapping
│       └── modules/      # purchase-orders, inventory, products, vendors, locations
├── web/                  # Next.js 16 + MUI 9 + RTK Query
│   ├── app/purchase-orders/
│   ├── components/
│   ├── store/
│   └── theme/
├── docker-compose.yml    # PostgreSQL for local development
└── README.md
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 24 LTS |
| API | TypeScript, Apollo Server 5, GraphQL, Express 5 |
| Data | PostgreSQL, Prisma |
| UI | Next.js 16 App Router, MUI 9, Redux Toolkit, RTK Query |
| Forms | react-hook-form + Zod |
| Infra | Docker Compose |

## Requirements

- Node.js 24+
- npm 10+
- Docker (for PostgreSQL)

## Setup

### 1. Start PostgreSQL

```bash
docker compose up -d
```

Stop it later with:

```bash
docker compose down
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp api/.env.example api/.env
cp web/.env.example web/.env.local
```

Defaults assume Compose Postgres on `localhost:5432` with user/password/db `daas`.

### 4. Migrate and seed

```bash
cd api
npx prisma migrate deploy
npx prisma db seed
cd ..
```

### 5. Run the API

```bash
npm run dev:api
```

GraphQL endpoint: `http://localhost:4000/graphql`  
Health check: `http://localhost:4000/health`

### 6. Run the web app

```bash
npm run dev:web
```

UI: `http://localhost:3000`

## Environment Variables

### `api/.env.example`

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | API port (default `4000`) |
| `AUTH_TOKEN_ADMIN` | Bearer token mapped to `ADMIN` |
| `AUTH_TOKEN_WAREHOUSE` | Bearer token mapped to `WAREHOUSE` |
| `AUTH_TOKEN_VIEWER` | Bearer token mapped to `VIEWER` |

### `web/.env.example`

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_GRAPHQL_URL` | GraphQL HTTP endpoint |

## Database

- Migrations live in `api/prisma/migrations` and are checked into git
- Use `prisma migrate deploy` (not `db push`) for reviewer setup
- Seed is idempotent and creates:

  - Vendors: ABC Electronics, XYZ AV Supplies, Global Tech
  - Products: Laptop, Monitor, Keyboard, Network Switch, HDMI Cable
  - Locations: Mumbai Warehouse, Delhi Warehouse
  - POs: `PO-1001` (OPEN), `PO-1002` (PARTIAL), `PO-1003` (RECEIVED)

Status is derived from quantities during seed as well — there is no status column.

## Demo Credentials / Tokens

Send a simple bearer token. No login UI is required.

| Role | Header |
| --- | --- |
| ADMIN | `Authorization: Bearer admin-token` |
| WAREHOUSE | `Authorization: Bearer warehouse-token` |
| VIEWER | `Authorization: Bearer viewer-token` |

Permissions:

| Action | ADMIN | WAREHOUSE | VIEWER |
| --- | --- | --- | --- |
| Query POs / catalogs | yes | yes | yes |
| Create PO | yes | no | no |
| Receive stock | yes | yes | no |

The web header has a **Demo role** selector that switches which token RTK Query sends. Authorization is still enforced by the API.

## GraphQL Operations

### Query purchase orders

```graphql
query {
  purchaseOrders {
    id
    poNumber
    vendor {
      id
      name
    }
    status
  }
}
```

Filter by derived status:

```graphql
query {
  purchaseOrders(status: PARTIAL) {
    id
    poNumber
    status
  }
}
```

### Query one purchase order

```graphql
query {
  purchaseOrder(id: "018f0000-0000-7000-8000-000000000031") {
    id
    poNumber
    status
    items {
      product { id name sku }
      orderedQuantity
      receivedQuantity
      remainingQuantity
    }
  }
}
```

### Create purchase order

```graphql
mutation {
  createPurchaseOrder(
    input: {
      poNumber: "PO-2001"
      vendorId: "018f0000-0000-7000-8000-000000000001"
      items: [
        { productId: "018f0000-0000-7000-8000-000000000011", quantity: 10 }
      ]
    }
  ) {
    id
    poNumber
    status
  }
}
```

Requires `ADMIN`.

### Receive stock

```graphql
mutation {
  receivePurchaseOrder(
    input: {
      purchaseOrderId: "018f0000-0000-7000-8000-000000000031"
      locationId: "018f0000-0000-7000-8000-000000000021"
      items: [
        { productId: "018f0000-0000-7000-8000-000000000011", quantity: 5 }
      ]
    }
  ) {
    purchaseOrder {
      id
      poNumber
      status
      items {
        orderedQuantity
        receivedQuantity
        remainingQuantity
      }
    }
  }
}
```

Requires `ADMIN` or `WAREHOUSE`.

## Business Rules

- PO status is derived from line quantities, never persisted as a mutable field
- Ordered quantity must be `> 0`
- Received quantity must stay `>= 0` and `<= ordered_quantity`
- Receive quantity must be `> 0` and cannot exceed remaining
- Duplicate product lines on one PO (or one receive request) are rejected
- PO number is unique among non-deleted rows
- SKU is unique among non-deleted products
- `(location_id, product_id)` stock is unique; quantity cannot go negative
- Soft-deleted rows (`deleted_at IS NOT NULL`) are ignored by normal queries
- `createPurchaseOrder` and `receivePurchaseOrder` use Prisma `$transaction`
- Every receive writes a `RECEIPT` stock movement and upserts inventory for the location

## Architecture Note

**Making stock movements transactional and auditable across adjust, transfer, receive and allocate.**

Stock movements are the audit trail of inventory change. On-hand balances answer “how much is here right now?”; movements answer “what happened, when, and why?” For receiving, that means each accepted quantity must leave three durable facts: the PO line’s received total advanced, a `RECEIPT` movement recorded against the PO as `reference_id`, and location stock increased. If any one of those writes fails, the others must roll back — otherwise you get “PO says five received” with no stock, or stock without an audit row.

A single database transaction is the simplest way to keep those facts atomic. The receive service validates remaining quantity before opening the transaction, then performs line update + movement insert + inventory upsert inside one Prisma `$transaction`. That boundary is intentionally tight: validation stays outside so we fail fast without locking rows; the multi-row write stays inside so partial success is impossible.

The same movement model extends cleanly later:

- **Adjust** — one movement with signed quantity and a reason reference
- **Transfer** — paired out/in movements (or a transfer type) across two locations in one transaction
- **Allocate** — movement or reservation against a project reference, still updating the same stock table

The trade-off is between strict transactional consistency and broader transaction boundaries. Putting Jetbuilt sync, email, or outbox publishing inside the receive transaction would hold locks longer and couple availability of inventory writes to external systems. I would keep the inventory transaction short and push side effects to an outbox/worker.

What I would ship first in production: receive + adjust with mandatory stock movements, derived (or carefully transitioned) workflow state, and role checks on write mutations. Transfer and allocate come next once the movement vocabulary and transaction pattern are proven.

## What Was Cut and Why

To keep one complete slice shipping:

- **No integration tests / Testcontainers** — P0–P2 were prioritized; API receive scenarios were verified manually against real Postgres
- **No activity log table** — stock movements already provide the inventory audit trail for this slice
- **No login/registration/JWT** — assessment allows a simple bearer token carrying a role
- **No PO edit/delete screens** — create, list, detail, and receive cover the feature
- **No Jetbuilt / HubSpot / Smartsheet / drawings / schedules / quoting** — outside the selected sprint slice
- **No EKS / CI deployment** — local Compose + README is the delivery target

## Suggested Demo Flow (1–2 minutes)

1. `docker compose up -d` → migrate → seed → start API and web
2. Open `/purchase-orders` and show seeded OPEN / PARTIAL / RECEIVED
3. Create a new PO as ADMIN
4. Open it and receive part of the quantity → status becomes `PARTIAL`
5. Receive the remainder → status becomes `RECEIVED`
6. Optionally switch demo role to VIEWER and show receive is blocked by the API
