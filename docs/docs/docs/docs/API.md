# Mini ERP + CRM API Documentation

## Base URL

Production:
```
https://mini-erp-crm-backend-vsb4.onrender.com/api
```

Local:
```
http://localhost:5000/api
```

---

# Authentication

## Login

**POST** `/auth/login`

### Request Body

```json
{
  "email": "admin@minierp.com",
  "password": "admin123"
}
```

### Success Response

```json
{
  "success": true,
  "token": "<jwt_token>",
  "user": {
    "id": 1,
    "name": "Administrator",
    "email": "admin@minierp.com",
    "role": "ADMIN"
  }
}
```

---

# Customers API

## Get All Customers

**GET** `/customers`

### Response

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "name": "ABC Traders",
      "email": "abc@example.com",
      "phone": "9876543210"
    }
  ]
}
```

---

## Create Customer

**POST** `/customers`

### Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "company": "XYZ Pvt Ltd"
}
```

### Response

```json
{
  "success": true,
  "message": "Customer created successfully"
}
```

---

# Products API

## Get Products

**GET** `/products`

Returns the list of products available in inventory.

---

## Create Product

**POST** `/products`

Example:

```json
{
  "name": "Dell Monitor",
  "sku": "MON001",
  "price": 12000,
  "stock": 20
}
```

---

# Inventory API

## Get Inventory

**GET** `/inventory`

Returns current stock information.

---

## Update Stock

**POST** `/inventory/stock`

Example:

```json
{
  "productId": 1,
  "quantity": 10,
  "type": "IN"
}
```

---

# Sales Challan API

## Get Challans

**GET** `/challans`

Returns all sales challans.

---

## Create Challan

**POST** `/challans`

Example:

```json
{
  "customerId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}
```

---

# User Roles

| Role | Access |
|------|--------|
| ADMIN | Full access |
| SALES | Customer & Sales Management |
| WAREHOUSE | Inventory Management |
| ACCOUNTS | Sales Reports & Billing |

---

# Authentication

Protected APIs require a JWT token.

Example:

```
Authorization: Bearer <your_jwt_token>
```

---

# HTTP Status Codes

| Code | Meaning |
|------|---------|
|200|Success|
|201|Created Successfully|
|400|Bad Request|
|401|Unauthorized|
|404|Not Found|
|500|Internal Server Error|

---

# Technology Stack

- Node.js
- Express.js
- Prisma ORM
- SQLite Database
- React + TypeScript
- Tailwind CSS
- JWT Authentication

---

# Deployment

Frontend:
https://mini-erp-crm-mu.vercel.app

Backend:
https://mini-erp-crm-backend-vsb4.onrender.com

Health Endpoint:
https://mini-erp-crm-backend-vsb4.onrender.com/health

---

**Author:** Sery Mathew

**Project:** Mini ERP + CRM System
