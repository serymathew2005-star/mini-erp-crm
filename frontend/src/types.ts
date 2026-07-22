export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface CustomerNote {
  id: string;
  customerId: string;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  followUps?: CustomerNote[];
  _count?: {
    followUps: number;
    challans: number;
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockLog {
  id: string;
  productId: string;
  quantityChange: number;
  movementType: 'IN' | 'OUT';
  reason: string;
  createdBy: string;
  createdAt: string;
  product?: {
    name: string;
    sku: string;
  };
}

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface SalesChallanItem {
  id?: string;
  productId: string;
  snapshotProductName: string;
  snapshotSKU: string;
  snapshotUnitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  customerName: string;
  totalQuantity: number;
  totalAmount: number;
  status: ChallanStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  items: SalesChallanItem[];
}

export interface DashboardStats {
  customers: {
    total: number;
    active: number;
    lead: number;
  };
  inventory: {
    totalProducts: number;
    totalStockQuantity: number;
    totalStockValue: number;
    lowStockCount: number;
    lowStockItems: Array<{
      id: string;
      name: string;
      sku: string;
      currentStock: number;
      minStockAlert: number;
    }>;
  };
  sales: {
    totalChallans: number;
    confirmedCount: number;
    totalSalesAmount: number;
  };
  recentLogs: StockLog[];
  recentChallans: SalesChallan[];
}
