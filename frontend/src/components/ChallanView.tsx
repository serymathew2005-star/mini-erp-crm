import React, { useState, useEffect } from 'react';
import { SalesChallan, Customer, Product, User, ChallanStatus } from '../types';
import { api } from '../services/api';
import { Plus, Search, Filter, Printer, FileText, CheckCircle2, XCircle, AlertCircle, Trash2, X, Eye } from 'lucide-react';

interface ChallanViewProps {
  currentUser: User | null;
}

interface DraftLineItem {
  productId: string;
  quantity: number;
}

export const ChallanView: React.FC<ChallanViewProps> = ({ currentUser }) => {
  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingChallan, setViewingChallan] = useState<SalesChallan | null>(null);

  // Challan Creation Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [lineItems, setLineItems] = useState<DraftLineItem[]>([]);
  const [formStatus, setFormStatus] = useState<'DRAFT' | 'CONFIRMED'>('CONFIRMED');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchChallans();
    fetchDropdowns();
  }, [search, statusFilter]);

  const fetchChallans = async () => {
    try {
      setLoading(true);
      const res = await api.getChallans({
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setChallans(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const cRes = await api.getCustomers();
      const pRes = await api.getProducts();
      setCustomers(cRes.data);
      setProducts(pRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedCustomerId(customers.length > 0 ? customers[0].id : '');
    setLineItems([{ productId: products.length > 0 ? products[0].id : '', quantity: 1 }]);
    setFormStatus('CONFIRMED');
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleAddLineItem = () => {
    if (products.length === 0) return;
    setLineItems([...lineItems, { productId: products[0].id, quantity: 1 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: keyof DraftLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => {
      const prod = products.find((p) => p.id === item.productId);
      return sum + (prod ? prod.unitPrice * item.quantity : 0);
    }, 0);
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setFormError('Please select a customer');
      return;
    }
    if (lineItems.length === 0) {
      setFormError('Please add at least one line item');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await api.createChallan({
        customerId: selectedCustomerId,
        items: lineItems,
        status: formStatus,
      });
      setShowCreateModal(false);
      fetchChallans();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create sales challan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, targetStatus: 'CONFIRMED' | 'CANCELLED') => {
    try {
      const res = await api.updateChallanStatus(id, targetStatus);
      alert(res.message);
      fetchChallans();
      if (viewingChallan && viewingChallan.id === id) {
        setViewingChallan(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update challan status');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const canCreate = ['ADMIN', 'SALES'].includes(currentUser?.role || '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Sales Challans & Invoicing</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Generate delivery challans, lock snapshot prices, and track stock allocations</p>
        </div>

        {canCreate && (
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            <Plus size={18} /> Create Sales Challan
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search Challan # or Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '160px' }}>
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Challans Data Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Challan Number</th>
                <th>Customer Name</th>
                <th>Total Items / Qty</th>
                <th>Total Value (₹)</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Loading sales challans...</td></tr>
              ) : challans.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No sales challans generated yet.</td></tr>
              ) : (
                challans.map((ch) => (
                  <tr key={ch.id}>
                    <td><strong style={{ fontFamily: 'monospace', color: '#818cf8', fontSize: '0.95rem' }}>{ch.challanNumber}</strong></td>
                    <td style={{ fontWeight: 700 }}>{ch.customerName}</td>
                    <td>{ch.items ? ch.items.length : 0} item(s) / <span style={{ fontWeight: 700 }}>{ch.totalQuantity} pcs</span></td>
                    <td style={{ fontWeight: 700 }}>₹{ch.totalAmount.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge badge-${ch.status.toLowerCase()}`}>
                        {ch.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(ch.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => setViewingChallan(ch)} className="btn btn-secondary btn-sm" title="View / Print Invoice">
                          <Eye size={14} /> View / Print
                        </button>
                        {ch.status === 'DRAFT' && ['ADMIN', 'SALES', 'WAREHOUSE'].includes(currentUser?.role || '') && (
                          <button onClick={() => handleStatusChange(ch.id, 'CONFIRMED')} className="btn btn-success btn-sm" title="Confirm Challan & Deduct Inventory">
                            <CheckCircle2 size={14} /> Confirm
                          </button>
                        )}
                        {ch.status !== 'CANCELLED' && ['ADMIN', 'SALES'].includes(currentUser?.role || '') && (
                          <button onClick={() => handleStatusChange(ch.id, 'CANCELLED')} className="btn btn-danger btn-sm" title="Cancel Challan">
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Sales Challan Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Generate New Sales Challan</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateChallan}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {formError && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
                    {formError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Select Customer Account *</label>
                    <select className="form-select" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.businessName || c.name} ({c.customerType}) - GST: {c.gstNumber || 'N/A'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Challan Status</label>
                    <select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}>
                      <option value="CONFIRMED">CONFIRMED (Locks & Deducts Stock)</option>
                      <option value="DRAFT">DRAFT (Save Without Deducting)</option>
                    </select>
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Line Items (Product Snapshot Capture)</label>
                    <button type="button" onClick={handleAddLineItem} className="btn btn-secondary btn-sm">
                      <Plus size={14} /> Add Product Line
                    </button>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Product Item</th>
                          <th>Available Stock</th>
                          <th>Unit Price (₹)</th>
                          <th style={{ width: '100px' }}>Quantity</th>
                          <th>Subtotal (₹)</th>
                          <th style={{ width: '50px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item, idx) => {
                          const prod = products.find((p) => p.id === item.productId);
                          const sub = prod ? prod.unitPrice * item.quantity : 0;
                          return (
                            <tr key={idx}>
                              <td>
                                <select
                                  className="form-select"
                                  value={item.productId}
                                  onChange={(e) => handleLineItemChange(idx, 'productId', e.target.value)}
                                >
                                  {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} [{p.sku}]
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                {prod ? (
                                  <span style={{ color: prod.currentStock < item.quantity ? '#f87171' : 'var(--success)', fontWeight: 700 }}>
                                    {prod.currentStock} pcs
                                  </span>
                                ) : '-'}
                              </td>
                              <td style={{ fontWeight: 600 }}>₹{prod ? prod.unitPrice.toLocaleString('en-IN') : 0}</td>
                              <td>
                                <input
                                  type="number"
                                  min="1"
                                  className="form-input"
                                  value={item.quantity}
                                  onChange={(e) => handleLineItemChange(idx, 'quantity', Number(e.target.value))}
                                />
                              </td>
                              <td style={{ fontWeight: 700 }}>₹{sub.toLocaleString('en-IN')}</td>
                              <td>
                                {lineItems.length > 1 && (
                                  <button type="button" onClick={() => handleRemoveLineItem(idx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', background: 'rgba(15,23,42,0.6)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Estimated Grand Total</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                      ₹{calculateSubtotal().toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Generating...' : `Save & Generate (${formStatus})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View & Print PDF Invoice Modal */}
      {viewingChallan && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px', background: '#0f172a' }}>
            <div className="modal-header no-print">
              <h2>Sales Challan / Invoice PDF Preview</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handlePrint} className="btn btn-primary">
                  <Printer size={16} /> Print / Export PDF
                </button>
                <button onClick={() => setViewingChallan(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="modal-body printable-invoice" style={{ padding: '2.5rem', background: 'white', color: '#0f172a', borderRadius: 'var(--radius-md)' }}>
              {/* Printable Invoice Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ color: '#0f172a', fontSize: '1.75rem', marginBottom: '0.25rem' }}>WHOLESALE OPERATIONS INC.</h1>
                  <p style={{ fontSize: '0.85rem', color: '#475569' }}>100 Distribution Highway, Industrial Park</p>
                  <p style={{ fontSize: '0.85rem', color: '#475569' }}>GSTIN: 27AAAAA1234A1Z0 | Contact: info@wholesaleops.com</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ color: '#6366f1', fontSize: '1.25rem' }}>SALES CHALLAN</h2>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'monospace' }}>{viewingChallan.challanNumber}</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>
                    Status: <strong style={{ color: viewingChallan.status === 'CONFIRMED' ? '#059669' : '#d97706' }}>{viewingChallan.status}</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>Date: {new Date(viewingChallan.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Billed To Customer Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>CUSTOMER / DELIVER TO:</div>
                  <strong style={{ fontSize: '1.1rem', display: 'block', margin: '0.25rem 0', color: '#0f172a' }}>{viewingChallan.customerName}</strong>
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>Address: {viewingChallan.customer?.address || 'On File'}</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>Mobile: {viewingChallan.customer?.mobile || 'N/A'}</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>GSTIN: {viewingChallan.customer?.gstNumber || 'Unregistered'}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>DISPATCH DETAILS:</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '0.5rem' }}>Generated By: <strong>{viewingChallan.createdBy}</strong></div>
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>Dispatch Mode: Surface Transport</div>
                  <div style={{ fontSize: '0.85rem', color: '#334155' }}>Payment Terms: Credit 15 Days</div>
                </div>
              </div>

              {/* Snapshot Line Items */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: '#334155' }}>SR #</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: '#334155' }}>PRODUCT SNAPSHOT DESCRIPTION</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', color: '#334155' }}>SKU</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.8rem', color: '#334155' }}>UNIT PRICE</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.8rem', color: '#334155' }}>QTY</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.8rem', color: '#334155' }}>SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingChallan.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#475569' }}>{idx + 1}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: '#0f172a' }}>{item.snapshotProductName}</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#475569' }}>{item.snapshotSKU}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', color: '#0f172a' }}>₹{item.snapshotUnitPrice.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{item.quantity}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{item.subtotal.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Calculation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '350px' }}>
                  <p>Declaration: Received the above goods in good condition & order. Errors and omissions excepted.</p>
                </div>
                <div style={{ minWidth: '240px', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#475569' }}>
                    <span>Total Quantity:</span> <strong>{viewingChallan.totalQuantity} pcs</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #cbd5e1', paddingTop: '0.5rem', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    <span>Grand Total:</span> <span>₹{viewingChallan.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px dashed #cbd5e1' }}>
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                  ______________________<br />Receiver's Stamp & Signature
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                  ______________________<br />For Wholesale Operations Inc.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
