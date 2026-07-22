import React, { useState, useEffect } from 'react';
import { Product, StockLog, User } from '../types';
import { api } from '../services/api';
import { Plus, Search, Filter, AlertTriangle, ArrowDownRight, ArrowUpRight, History, Edit, ArrowUpDown, X, Package } from 'lucide-react';

interface InventoryViewProps {
  currentUser: User | null;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ currentUser }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'logs'>('catalog');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  // Forms
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 10,
    location: 'Warehouse Main',
    imageUrl: '',
  });

  const [adjustForm, setAdjustForm] = useState({
    quantityChange: 1,
    movementType: 'IN' as 'IN' | 'OUT',
    reason: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    if (activeTab === 'logs') {
      fetchStockLogs();
    }
  }, [search, categoryFilter, lowStockOnly, activeTab]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts({
        search: search || undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        lowStock: lowStockOnly ? true : undefined,
      });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockLogs = async () => {
    try {
      const res = await api.getStockLogs();
      setStockLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddModal = () => {
    setProductForm({
      name: '',
      sku: '',
      category: 'Electronics',
      unitPrice: 1000,
      currentStock: 10,
      minStockAlert: 5,
      location: 'Warehouse Main',
      imageUrl: '',
    });
    setEditingProduct(null);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setProductForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      location: p.location,
      imageUrl: p.imageUrl || '',
    });
    setEditingProduct(p);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productForm);
      } else {
        await api.createProduct(productForm);
      }
      setShowAddModal(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message || 'Error saving product');
    }
  };

  const handleOpenAdjustModal = (p: Product) => {
    setAdjustingProduct(p);
    setAdjustForm({
      quantityChange: 1,
      movementType: 'IN',
      reason: 'Manual warehouse count adjustment',
    });
    setFormError(null);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    setFormError(null);

    try {
      await api.adjustStock(adjustingProduct.id, adjustForm);
      setAdjustingProduct(null);
      fetchProducts();
      if (activeTab === 'logs') fetchStockLogs();
    } catch (err: any) {
      setFormError(err.message || 'Failed to adjust stock');
    }
  };

  const canManageStock = ['ADMIN', 'WAREHOUSE'].includes(currentUser?.role || '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Product & Inventory Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track warehouse stock levels, alert thresholds, and movement audit logs</p>
        </div>

        {canManageStock && (
          <button onClick={handleOpenAddModal} className="btn btn-primary">
            <Plus size={18} /> Add New Product
          </button>
        )}
      </div>

      {/* Tabs & Filters Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15,23,42,0.8)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('catalog')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'catalog' ? 'var(--accent-gradient)' : 'transparent',
              color: activeTab === 'catalog' ? 'white' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Package size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Product Inventory Catalog
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'logs' ? 'var(--accent-gradient)' : 'transparent',
              color: activeTab === 'logs' ? 'white' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <History size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} /> Stock Movement Audit Log
          </button>
        </div>

        {activeTab === 'catalog' && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search SKU or Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.2rem' }}
              />
            </div>

            <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ width: '150px' }}>
              <option value="ALL">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Peripherals">Peripherals</option>
              <option value="Audio">Audio</option>
              <option value="Accessories">Accessories</option>
            </select>

            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`btn ${lowStockOnly ? 'btn-danger' : 'btn-secondary'} btn-sm`}
            >
              <AlertTriangle size={14} /> Low Stock Only
            </button>
          </div>
        )}
      </div>

      {/* View Content */}
      {activeTab === 'catalog' ? (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU Code</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Current Stock</th>
                  <th>Warehouse Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading inventory...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No products found.</td></tr>
                ) : (
                  products.map((p) => {
                    const isLow = p.currentStock <= p.minStockAlert;
                    return (
                      <tr key={p.id}>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#818cf8' }}>{p.sku}</span></td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Min alert threshold: {p.minStockAlert} units</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                            {p.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>₹{p.unitPrice.toLocaleString('en-IN')}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong style={{ fontSize: '1rem', color: isLow ? '#f87171' : 'var(--text-primary)' }}>
                              {p.currentStock}
                            </strong>
                            {isLow && (
                              <span className="badge badge-lowstock" title={`Below alert limit of ${p.minStockAlert}`}>
                                <AlertTriangle size={10} /> LOW STOCK
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.location}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {canManageStock && (
                              <>
                                <button onClick={() => handleOpenAdjustModal(p)} className="btn btn-secondary btn-sm" title="Adjust Stock (IN/OUT)">
                                  <ArrowUpDown size={14} /> Stock IN/OUT
                                </button>
                                <button onClick={() => handleOpenEditModal(p)} className="btn btn-secondary btn-sm" title="Edit Product">
                                  <Edit size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Audit Log Tab */
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Qty Changed</th>
                  <th>Reason / Reference</th>
                  <th>Logged By</th>
                </tr>
              </thead>
              <tbody>
                {stockLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{log.product?.name || 'Product'}</div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#818cf8' }}>{log.product?.sku}</div>
                    </td>
                    <td>
                      <span className={`badge ${log.movementType === 'IN' ? 'badge-active' : 'badge-cancelled'}`}>
                        {log.movementType === 'IN' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                        STOCK {log.movementType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, fontSize: '1rem' }}>{log.quantityChange}</td>
                    <td style={{ fontSize: '0.85rem' }}>{log.reason}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.createdBy}</td>
                  </tr>
                ))}
                {stockLogs.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No stock movement logs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product Details' : 'Add New Product'}</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="modal-body">
                {formError && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', borderRadius: '6px', marginBottom: '1rem' }}>
                    {formError}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input type="text" className="form-input" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">SKU Code *</label>
                    <input type="text" className="form-input" required value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} placeholder="e.g. MON-27-IPS" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input type="text" className="form-input" required value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit Price (₹) *</label>
                    <input type="number" step="0.01" className="form-input" required value={productForm.unitPrice} onChange={(e) => setProductForm({ ...productForm, unitPrice: Number(e.target.value) })} />
                  </div>

                  {!editingProduct && (
                    <div className="form-group">
                      <label className="form-label">Initial Current Stock *</label>
                      <input type="number" className="form-input" required value={productForm.currentStock} onChange={(e) => setProductForm({ ...productForm, currentStock: Number(e.target.value) })} />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Min Stock Alert Quantity</label>
                    <input type="number" className="form-input" required value={productForm.minStockAlert} onChange={(e) => setProductForm({ ...productForm, minStockAlert: Number(e.target.value) })} />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Warehouse Rack / Location</label>
                    <input type="text" className="form-input" value={productForm.location} onChange={(e) => setProductForm({ ...productForm, location: e.target.value })} placeholder="e.g. Warehouse A - Rack 04" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingProduct ? 'Update Product' : 'Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock IN/OUT Modal */}
      {adjustingProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>Adjust Inventory Stock Level</h2>
              <button onClick={() => setAdjustingProduct(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveAdjust}>
              <div className="modal-body">
                <div style={{ background: 'rgba(15,23,42,0.6)', padding: '0.875rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 700 }}>{adjustingProduct.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SKU: {adjustingProduct.sku} | Current Stock: <strong style={{ color: 'var(--accent-primary)' }}>{adjustingProduct.currentStock}</strong></div>
                </div>

                {formError && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', borderRadius: '6px', marginBottom: '1rem' }}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Adjustment Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setAdjustForm({ ...adjustForm, movementType: 'IN' })}
                      className={`btn ${adjustForm.movementType === 'IN' ? 'btn-success' : 'btn-secondary'}`}
                    >
                      <ArrowDownRight size={16} /> Stock IN (+)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustForm({ ...adjustForm, movementType: 'OUT' })}
                      className={`btn ${adjustForm.movementType === 'OUT' ? 'btn-danger' : 'btn-secondary'}`}
                    >
                      <ArrowUpRight size={16} /> Stock OUT (-)
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity to Adjust *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={adjustForm.quantityChange}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantityChange: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason / Audit Trail Explanation *</label>
                  <textarea
                    className="form-textarea"
                    placeholder="e.g. Shipment received, damaged goods write-off, stock audit correction..."
                    value={adjustForm.reason}
                    onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setAdjustingProduct(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
