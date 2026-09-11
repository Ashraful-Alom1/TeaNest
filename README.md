# Tea Nest (Assam Black Tea) — Production D2C Storefront & Admin ERP/CRM

> **Born in Assam • Loved Everywhere**  
> Premium D2C E-Commerce & Enterprise Management System for Tea Nest (Fortunate Ventures, Naharkatia, Dibrugarh, Assam).

---

## 🌟 Overview

**Tea Nest** is a full-stack, enterprise-grade Direct-to-Consumer (D2C) tea commerce platform and administrative ERP/CRM system. The system delivers a luxury shopping experience reflecting the high quality of handpicked single-estate Assam orthodox and CTC black teas, while giving operational staff real-time control over inventory, order fulfillment, automated GST tax billing, supplier management, and financial accounting.

### Key Highlights
- **Luxury Brand Aesthetics**: Custom visual styling matching the Tea Nest packaging—deep forest green (`#0e1e14`), rich gold foil accents (`#c5a059`), dark charcoal base (`#121513`), and editorial typography (Cinzel & Cormorant Garamond).
- **Single-Product Adaptive Commerce**:
  - **Single Product Flow (Current)**: Dynamic authenticated "ORDER ON WHATSAPP" with pre-filled message generator, unique order tracking (`TN-2026-XXXXXX`), and intent status tracking (`WHATSAPP_PENDING`) without immediate inventory deduction.
  - **Multi-Product Ready**: Full cart/checkout pipeline with real-time stock validation and multi-item calculation.
- **Atomic Order Confirmation Engine**: Server-authoritative concurrency-locked transaction that guarantees zero stock race-conditions, sequential GST tax invoice numbering (`INV-2026-XXXXXX`), real-time stock deductions, and ledger tracking.
- **Automated Low-Stock Watchdog**: Dynamically computes threshold using `ceil(stockReferenceQty * lowStockPercent / 100)` (default 70%), triggering automatic restock alerts.
- **GST Tax Invoicing (HSN 0902)**: Compliant with Indian tax legislation, generating CGST 2.5% + SGST 2.5% (or IGST 5%), taxable value extraction from MRP, and Indian amount-in-words conversion.
- **Enterprise ERP Suite**: Complete sales ledger, purchase orders & supplier directory, expense manager, real-time P&L statement, customer CRM timeline, RBAC (Super Admin, Inventory Manager, Sales Operator, Accountant), and security audit logs.

---

## 🏗️ Repository Architecture

This project is organized as a high-performance TypeScript monorepo:

```
d:/Tea Nest/
├── apps/
│   ├── storefront/             # Customer D2C web portal (Vite + React + Tailwind + Framer Motion)
│   └── admin/                  # Administrative ERP & CRM Console (Vite + React + Recharts + Tailwind)
├── packages/
│   ├── types/                  # Authoritative domain TypeScript interfaces & models
│   ├── shared/                 # Business logic: GST math, inventory thresholds, OrderService mutex
│   └── validation/             # Zod runtime verification schemas (Orders, Products, Purchases, etc.)
├── scripts/
│   ├── seedData.ts             # Initial product, supplier, admin, and company data
│   ├── seed.ts                 # Firestore / database seeding runner
│   └── syncServer.ts           # Zero-config cross-origin local state synchronization server
├── data/
│   └── state.json              # Local persistent database state
├── firestore.rules             # Granular role-based Firestore security rules
├── firestore.indexes.json      # Optimized composite database indexes
├── firebase.json               # Firebase hosting, functions, and emulator setup
└── package.json                # Monorepo workspaces definition and root commands
```

---

## 🚀 Quick Start & Development

### 1. Prerequisites
- **Node.js**: v18.x or v20.x+
- **npm**: v9.x+

### 2. Installation
Install all dependencies across the entire monorepo:
```bash
npm install
```

### 3. Run Development Servers
To run the full stack concurrently:

```bash
# Terminal 1: Run State Synchronization Server (Port 5001)
npm run sync:server

# Terminal 2: Run Customer Storefront (Port 5173)
npm run dev:storefront

# Terminal 3: Run Admin Management ERP (Port 5174)
npm run dev:admin
```

- **Customer Storefront**: [http://localhost:5173](http://localhost:5173)
- **Admin Management Portal**: [http://localhost:5174](http://localhost:5174)
- **Sync Server API**: [http://localhost:5001/api/state](http://localhost:5001/api/state)

---

## 🔑 Default Credentials & Access

### Super Admin
- **Email**: `admin@teanest.in`
- **Password**: `SuperAdminPass2026!`
- **Role**: `SUPER_ADMIN` (Full operational, financial, and user management privileges)

### Customer Test Account
- **Mobile**: `9876543210`
- **Email**: `rahul.sharma@example.com`

---

## 🧪 Automated Testing

Execute the comprehensive Vitest test suite covering GST calculations, tax-inclusive extractions, inventory threshold formulas, currency formatting, and multi-threaded order confirmation concurrency protection:

```bash
npm test
```

### Concurrency Stress Test
Located in `packages/shared/src/__tests__/concurrency.test.ts`, verifying that 10 concurrent confirmation attempts against a stock of 3 units reliably confirms exactly 3 and safely rejects 7 with `INSUFFICIENT_STOCK`.

---

## 📦 Production Build

Run type-checking and optimized production bundling for both applications:

```bash
npm run build
```

Built assets are compiled to:
- `apps/storefront/dist/`
- `apps/admin/dist/`

---

## 🏢 Business Identity & Compliance

- **Brand**: Tea Nest
- **Manufacturer / Packer**: Fortunate Ventures
- **Location**: Naharkatia, Dist - Dibrugarh, Assam, PIN - 786610
- **Customer Care Email**: `fortunateventures123@gmail.com`
- **HSN Code**: `0902` (Tea, whether or not flavoured)
- **GST Rate**: 5% (CGST 2.5% + SGST 2.5%)
- **Product Weight**: 500g Net
- **Shelf Life**: Best before 24 months from packaging
