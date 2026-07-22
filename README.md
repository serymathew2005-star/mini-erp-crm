# Mini ERP + CRM Operations Portal

> Full-stack wholesale and distribution operations portal with role-based access control, inventory locking, customer CRM tracking, sales challan generation, PDF invoice exports, and automated stock movement audit logs.

---

## 🚀 Live Demo & Repository

- **Frontend Application**: `http://localhost:3000` (Local) / Vercel / Render Static
- **Backend REST API**: `http://localhost:5000` (Local) / Render / Railway
- **Postman API Collection**: Included in root as [`postman_collection.json`](./postman_collection.json)

---

## 🔑 Test Login Credentials

| Role | Email | Password | Access & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@minierp.com` | `admin123` | Full access across all modules (Customers, Products, Challans, Analytics) |
| **Sales** | `sales@minierp.com` | `sales123` | Add/Edit Customers, Create/Edit Sales Challans, View Product Prices |
| **Warehouse** | `warehouse@minierp.com` | `wh123` | Manage Inventory, Perform Stock IN/OUT with audit reasons, View Confirmed Challans |
| **Accounts** | `accounts@minierp.com` | `acc123` | View Customer payment histories, View Challans, Export PDF Invoices |

*Note: The frontend includes a top-bar **Quick Role Switcher** for instant evaluator testing without manual re-login.*

---

## 🏗 System Architecture

```
                                  ┌─────────────────────────────┐
                                  │     React 18 + Vite (UI)    │
                                  │   Glassmorphic CSS Theme    │
                                  └──────────────┬──────────────┘
                                                 │
                                                 │ HTTP / REST (JWT Auth Header)
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │  Node.js + Express (TS API) │
                                  │ Middleware Validation & RBAC│
                                  └──────────────┬──────────────┘
                                                 │
                                                 │ Prisma ORM (ACID Transactions)
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │   SQLite (Dev) / Postgres   │
                                  │  Products, Logs, Snapshots  │
                                  └─────────────────────────────┘
```

---

## 💡 Core Business Logic & Features

### 1. Authentication & Role-Based Access Control (RBAC)
- JWT token authentication signed with secret key.
- Express middleware enforcing granular permissions for `ADMIN`, `SALES`, `WAREHOUSE`, and `ACCOUNTS`.

### 2. Customer CRM Module
- Manage lead pipeline: `LEAD`, `ACTIVE`, `INACTIVE`.
- Store business details, mobile numbers, email, address, and GST registration numbers.
- Log historical follow-up notes and schedule next follow-up dates.

### 3. Product & Inventory Module
- Track product SKU, Category, Unit Price, Current Stock, Minimum Alert Limit, and Warehouse location.
- Live **Low Stock Alert Badges** when stock drops below `minStockAlert`.
- **Stock Movement Audit Log**: Every manual adjustment or sales deduction automatically records movement type (`IN` / `OUT`), quantity, reason, timestamp, and user.

### 4. Sales Challan & Invoicing Module
- **Product Snapshotting**: Challan line items save product name, SKU, and unit price at creation time so future inventory edits never alter historical sales records.
- **Stock Guard & ACID Locking**: When a challan is set to `CONFIRMED`, backend verifies `currentStock >= requestedQuantity`. If insufficient, returns standard `HTTP 400 Bad Request`. If valid, deducts stock in an atomic database transaction.
- **PDF Invoice Export**: Built-in print preview optimized for A4 PDF download.

---

## 🛠 Local Setup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Step 1: Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run seed
npm run dev
```
*Backend API will run on `http://localhost:5000`.*

### Step 2: Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Frontend Portal will open on `http://localhost:3000`.*

---

## 🐳 Docker Deployment Setup

You can launch the entire stack using Docker Compose:

```bash
docker-compose up --build
```

Services will start at:
- Frontend Portal: `http://localhost:3000`
- Backend API: `http://localhost:5000`

---

## 🌐 Production Deployment Guide

### Deploying Database (Supabase / Neon Postgres)
1. Create a free PostgreSQL database on Supabase or Neon.
2. In `backend/prisma/schema.prisma`, set `provider = "postgresql"`.
3. Update `DATABASE_URL` in `.env` to your connection string.

### Deploying Backend (Render / Railway)
1. Push repository to GitHub.
2. Link repo on Render / Railway as Web Service.
3. Root directory: `backend`
4. Build command: `npm install && npx prisma generate && npm run build`
5. Start command: `npx prisma db push && npm run seed && npm start`
6. Set environment variables: `PORT=5000`, `JWT_SECRET=your_production_secret`, `DATABASE_URL=...`

### Deploying Frontend (Vercel / Netlify)
1. Create a new site on Vercel linked to the repository.
2. Root directory: `frontend`
3. Framework preset: `Vite`
4. Build command: `npm run build`
5. Output directory: `dist`

---

## 📌 Submission Checklist

- [x] Full source code committed to GitHub repository.
- [x] Complete REST API endpoints implemented & validated.
- [x] Postman collection included (`postman_collection.json`).
- [x] Pre-seeded test credentials provided for all 4 roles.
- [x] Negative stock prevention & ACID transaction logic verified.
- [x] Stock movement audit logs implemented.
- [x] Clean, responsive admin portal UI with PDF invoice export.
- [x] Docker setup (`docker-compose.yml`) included.
