import React, { useState, useEffect } from 'react';
import { Customer, CustomerType, CustomerStatus, User } from '../types';
import { api } from '../services/api';
import { Plus, Search, Filter, Phone, Mail, Building, MapPin, Calendar, FileText, Edit, MessageSquare, X } from 'lucide-react';

interface CustomersViewProps {
  currentUser: User | null;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ currentUser }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals & Detail State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newNote, setNewNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'WHOLESALE' as CustomerType,
    address: '',
    status: 'LEAD' as CustomerStatus,
    followUpDate: '',
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, typeFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers({
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        customerType: typeFilter !== 'ALL' ? typeFilter : undefined,
      });
      setCustomers(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'WHOLESALE',
      address: '',
      status: 'LEAD',
      followUpDate: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setEditingCustomer(null);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setFormData({
      name: c.name,
      mobile: c.mobile,
      email: c.email,
      businessName: c.businessName,
      gstNumber: c.gstNumber || '',
      customerType: c.customerType,
      address: c.address,
      status: c.status,
      followUpDate: c.followUpDate || '',
      notes: c.notes || '',
    });
    setEditingCustomer(c);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, formData);
      } else {
        await api.createCustomer(formData);
      }
      setShowAddModal(false);
      fetchCustomers();
      if (selectedCustomer) {
        const refreshed = await api.getCustomerById(selectedCustomer.id);
        setSelectedCustomer(refreshed.data);
      }
    } catch (err: any) {
      setFormError(err.message || 'Error saving customer');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newNote.trim()) return;
    setNoteLoading(true);

    try {
      await api.addCustomerNote(selectedCustomer.id, newNote);
      setNewNote('');
      const updated = await api.getCustomerById(selectedCustomer.id);
      setSelectedCustomer(updated.data);
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    } finally {
      setNoteLoading(false);
    }
  };

  const openDetailDrawer = async (c: Customer) => {
    try {
      const res = await api.getCustomerById(c.id);
      setSelectedCustomer(res.data);
    } catch (err) {
      setSelectedCustomer(c);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Customer CRM Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage accounts, track leads, and log follow-up activity</p>
        </div>

        {['ADMIN', 'SALES'].includes(currentUser?.role || '') && (
          <button onClick={handleOpenAddModal} className="btn btn-primary">
            <Plus size={18} /> Add New Customer
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by customer name, business, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '140px' }}>
            <option value="ALL">All Statuses</option>
            <option value="LEAD">Leads</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: '150px' }}>
            <option value="ALL">All Types</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="RETAIL">Retail</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </div>
      </div>

      {/* Main Customers List */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer / Business</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Status</th>
                <th>Follow-up Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading customer list...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No customers found.</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.businessName || c.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Building size={12} /> Contact: {c.name}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}><Phone size={12} style={{ verticalAlign: 'middle' }} /> {c.mobile}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><Mail size={12} style={{ verticalAlign: 'middle' }} /> {c.email}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}>
                        {c.customerType}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      {c.followUpDate ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar size={14} /> {c.followUpDate}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => openDetailDrawer(c)} className="btn btn-secondary btn-sm" title="View Customer Details & Notes">
                          <FileText size={14} /> Detail
                        </button>
                        {['ADMIN', 'SALES'].includes(currentUser?.role || '') && (
                          <button onClick={() => handleOpenEditModal(c)} className="btn btn-secondary btn-sm" title="Edit Customer">
                            <Edit size={14} />
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

      {/* Add / Edit Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveCustomer}>
              <div className="modal-body">
                {formError && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', borderRadius: '6px', marginBottom: '1rem' }}>
                    {formError}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Customer Contact Name *</label>
                    <input type="text" className="form-input" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Business Name *</label>
                    <input type="text" className="form-input" required value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Number *</label>
                    <input type="text" className="form-input" required value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input type="email" className="form-input" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Customer Type</label>
                    <select className="form-select" value={formData.customerType} onChange={(e) => setFormData({ ...formData, customerType: e.target.value as CustomerType })}>
                      <option value="WHOLESALE">Wholesale</option>
                      <option value="RETAIL">Retail</option>
                      <option value="DISTRIBUTOR">Distributor</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">GST Number (Optional)</label>
                    <input type="text" className="form-input" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}>
                      <option value="LEAD">Lead</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Next Follow-up Date</label>
                    <input type="date" className="form-input" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address *</label>
                  <textarea className="form-textarea" required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}></textarea>
                </div>

                {!editingCustomer && (
                  <div className="form-group">
                    <label className="form-label">Initial Notes / CRM Summary</label>
                    <textarea className="form-textarea" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Key requirements, conversation summary..."></textarea>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingCustomer ? 'Save Changes' : 'Create Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Drawer Modal */}
      {selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building size={20} color="#818cf8" /> {selectedCustomer.businessName}
                </h2>
                <span className={`badge badge-${selectedCustomer.status.toLowerCase()}`} style={{ marginTop: '0.3rem' }}>
                  {selectedCustomer.status} ({selectedCustomer.customerType})
                </span>
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Profile Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(15,23,42,0.6)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Contact Name:</span> <strong style={{ display: 'block' }}>{selectedCustomer.name}</strong></div>
                <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Mobile Phone:</span> <strong style={{ display: 'block' }}>{selectedCustomer.mobile}</strong></div>
                <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Email Address:</span> <strong style={{ display: 'block' }}>{selectedCustomer.email}</strong></div>
                <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>GST Registration:</span> <strong style={{ display: 'block' }}>{selectedCustomer.gstNumber || 'N/A'}</strong></div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={12} /> Address:</span>
                  <div style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>{selectedCustomer.address}</div>
                </div>
              </div>

              {/* Follow-up Notes History */}
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <MessageSquare size={18} color="#f59e0b" /> CRM Follow-up Timeline & Notes
                </h3>

                <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Log a call note, meeting update, or reminder..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary" disabled={noteLoading}>
                    {noteLoading ? 'Saving...' : 'Add Note'}
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                  {selectedCustomer.followUps && selectedCustomer.followUps.length > 0 ? (
                    selectedCustomer.followUps.map((n) => (
                      <div key={n.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.875rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                          <span>Logged by: <strong style={{ color: 'var(--text-primary)' }}>{n.createdBy}</strong></span>
                          <span>{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{n.note}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No follow-up notes recorded yet.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedCustomer(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
