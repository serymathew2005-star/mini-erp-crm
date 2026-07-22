import { Router } from 'express';
import { login, getMe } from '../controllers/authController';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addCustomerNote,
} from '../controllers/customerController';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  getStockLogs,
} from '../controllers/productController';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
} from '../controllers/challanController';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// Auth Routes (Public)
router.post('/auth/login', login);

// Authenticated Routes
router.use(authenticateToken);
router.get('/auth/me', getMe);
router.get('/dashboard/stats', getDashboardStats);

// Customer CRM Routes
// Accessible by ADMIN, SALES, ACCOUNTS
router.get('/customers', requireRoles(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), getCustomers);
router.get('/customers/:id', requireRoles(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), getCustomerById);
router.post('/customers', requireRoles(['ADMIN', 'SALES']), createCustomer);
router.put('/customers/:id', requireRoles(['ADMIN', 'SALES']), updateCustomer);
router.post('/customers/:id/notes', requireRoles(['ADMIN', 'SALES', 'ACCOUNTS']), addCustomerNote);

// Product & Inventory Routes
// Accessible by all roles to view, stock edit by ADMIN & WAREHOUSE
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.post('/products', requireRoles(['ADMIN', 'WAREHOUSE']), createProduct);
router.put('/products/:id', requireRoles(['ADMIN', 'WAREHOUSE']), updateProduct);
router.post('/products/:id/stock', requireRoles(['ADMIN', 'WAREHOUSE']), adjustStock);
router.get('/stock-logs', requireRoles(['ADMIN', 'WAREHOUSE', 'ACCOUNTS']), getStockLogs);

// Sales Challan Routes
router.get('/challans', getChallans);
router.get('/challans/:id', getChallanById);
router.post('/challans', requireRoles(['ADMIN', 'SALES']), createChallan);
router.put('/challans/:id/status', requireRoles(['ADMIN', 'SALES', 'WAREHOUSE']), updateChallanStatus);

export default router;
