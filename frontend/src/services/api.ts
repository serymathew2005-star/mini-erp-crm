const API_BASE_URL = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('erp_auth_token');
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('erp_auth_token', token);
  } else {
    localStorage.removeItem('erp_auth_token');
  }
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.error || `HTTP ${response.status}: Request failed`);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiRequest<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => apiRequest<any>('/auth/me'),

  // Dashboard
  getDashboardStats: () => apiRequest<any>('/dashboard/stats'),

  // Customers CRM
  getCustomers: (params?: { search?: string; status?: string; customerType?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest<any>(`/customers${query ? `?${query}` : ''}`);
  },
  getCustomerById: (id: string) => apiRequest<any>(`/customers/${id}`),
  createCustomer: (customerData: any) =>
    apiRequest<any>('/customers', { method: 'POST', body: JSON.stringify(customerData) }),
  updateCustomer: (id: string, customerData: any) =>
    apiRequest<any>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(customerData) }),
  addCustomerNote: (id: string, note: string) =>
    apiRequest<any>(`/customers/${id}/notes`, { method: 'POST', body: JSON.stringify({ note }) }),

  // Products & Inventory
  getProducts: (params?: { search?: string; category?: string; lowStock?: boolean }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest<any>(`/products${query ? `?${query}` : ''}`);
  },
  getProductById: (id: string) => apiRequest<any>(`/products/${id}`),
  createProduct: (productData: any) =>
    apiRequest<any>('/products', { method: 'POST', body: JSON.stringify(productData) }),
  updateProduct: (id: string, productData: any) =>
    apiRequest<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(productData) }),
  adjustStock: (id: string, payload: { quantityChange: number; movementType: 'IN' | 'OUT'; reason: string }) =>
    apiRequest<any>(`/products/${id}/stock`, { method: 'POST', body: JSON.stringify(payload) }),
  getStockLogs: () => apiRequest<any>('/stock-logs'),

  // Sales Challans
  getChallans: (params?: { search?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest<any>(`/challans${query ? `?${query}` : ''}`);
  },
  getChallanById: (id: string) => apiRequest<any>(`/challans/${id}`),
  createChallan: (payload: { customerId: string; items: any[]; status: 'DRAFT' | 'CONFIRMED' }) =>
    apiRequest<any>('/challans', { method: 'POST', body: JSON.stringify(payload) }),
  updateChallanStatus: (id: string, status: 'CONFIRMED' | 'CANCELLED') =>
    apiRequest<any>(`/challans/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};
