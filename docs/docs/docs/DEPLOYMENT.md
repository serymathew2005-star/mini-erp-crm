# Deployment Guide

This project is deployed as two services:

- Backend API hosted on Render
- Frontend Application hosted on Vercel

---

# Prerequisites

- GitHub repository
- Render account
- Vercel account
- Node.js 18+

---

# Backend Deployment (Render)

1. Push the project to GitHub.
2. Login to Render.
3. Create a New Web Service.
4. Connect the GitHub repository.
5. Select the backend folder as the Root Directory.
6. Configure the following:

Root Directory:
backend

Build Command:
npm install && npx prisma generate && npm run build

Start Command:
npm run seed && npm start

Environment Variables

DATABASE_URL=your_database_url

JWT_SECRET=your_secret_key

PORT=10000

7. Deploy the service.

Backend URL

https://mini-erp-crm-backend-vsb4.onrender.com

Health Check

https://mini-erp-crm-backend-vsb4.onrender.com/health

---

# Frontend Deployment (Vercel)

1. Login to Vercel.
2. Import the GitHub repository.
3. Select the frontend folder.
4. Framework: Vite
5. Build Command

npm run build

6. Output Directory

dist

7. Add Environment Variable

VITE_API_URL=https://mini-erp-crm-backend-vsb4.onrender.com

8. Deploy.

Frontend URL

https://mini-erp-crm-mu.vercel.app

---

# Repository

GitHub Repository

https://github.com/serymathew2005-star/mini-erp-crm

---

# Technology Stack

- React + Vite
- Node.js
- Express
- Prisma ORM
- SQLite
- JWT Authentication
- Render
- Vercel

---

# Deployment Verification

Backend Health Endpoint

GET /health

Expected Response

```json
{
  "status": "ok",
  "service": "Mini ERP+CRM Backend API"
}
```

The frontend communicates with the deployed backend using the configured API URL.
