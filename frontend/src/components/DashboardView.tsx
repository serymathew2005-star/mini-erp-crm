import React, { useEffect, useState } from 'react';
import { DashboardStats } from '../types';
import { api } from '../services/api';
import { Users, Package, AlertTriangle, FileCheck, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      setStats(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Dashboard KPIs...</div>;
  }

  if (error || !stats) {
    return <div style={{ padding: '2rem', color: '#f87171' }}>Error loading dashboard: {error}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Operations Overview</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Real-time business telemetry for wholesale distribution
          </p>
        </div>
        <button onClick={loadStats} className="btn btn-secondary btn-sm">
          Refresh Analytics
        </button>
      </div>

      {/* Low Stock Banner Alert */}
      {stats.inventory.lowStockCount > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fca5a5' }}>
            <AlertTriangle size={20} />
            <div>
              <strong style={{ display: 'block' }}>Low Stock Alert!</strong>
              <span style={{ fontSize: '0.85rem' }}>
                {stats.inventory.lowStockCount} product(s) are below minimum reorder alert quantity.
              </span>
            </div>
          </div>
          <button onClick={() => onNavigateTab('inventory')} className="btn btn-danger btn-sm">
            View Inventory Alerts
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: Customer CRM */}
        <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('customers')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>CUSTOMER CRM</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem' }}>{stats.customers.total}</h2>
            </div>
            <div style={{ padding: '0.6rem', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '12px', color: '#818cf8' }}>
              <Users size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div><span style={{ color: '#34d399', fontWeight: 700 }}>{stats.customers.active}</span> Active</div>
            <div><span style={{ color: '#fbbf24', fontWeight: 700 }}>{stats.customers.lead}</span> Leads</div>
          </div>
        </div>

        {/* Card 2: Stock Units */}
        <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('inventory')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL STOCK UNITS</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem' }}>{stats.inventory.totalStockQuantity.toLocaleString()}</h2>
            </div>
            <div style={{ padding: '0.6rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: '#34d399' }}>
              <Package size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div>SKUs: <span style={{ fontWeight: 700 }}>{stats.inventory.totalProducts}</span></div>
            <div>Low Stock: <span style={{ color: '#f87171', fontWeight: 700 }}>{stats.inventory.lowStockCount}</span></div>
          </div>
        </div>

        {/* Card 3: Inventory Valuation */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>INVENTORY VALUE</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem' }}>₹{stats.inventory.totalStockValue.toLocaleString('en-IN')}</h2>
            </div>
            <div style={{ padding: '0.6rem', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '12px', color: '#fbbf24' }}>
              <Package size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            Calculated at current product unit prices
          </div>
        </div>

        {/* Card 4: Total Revenue (Confirmed Challans) */}
        <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => onNavigateTab('challans')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>CONFIRMED SALES</span>
              <h2 style={{ fontSize: '1.75rem', marginTop: '0.2rem' }}>₹{stats.sales.totalSalesAmount.toLocaleString('en-IN')}</h2>
            </div>
            <div style={{ padding: '0.6rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: '#60a5fa' }}>
              <FileCheck size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div>Confirmed: <span style={{ color: '#34d399', fontWeight: 700 }}>{stats.sales.confirmedCount}</span></div>
            <div>Total Challans: <span style={{ fontWeight: 700 }}>{stats.sales.totalChallans}</span></div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Stock Movement Logs & Recent Sales Challans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Stock Movements */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3><Clock size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Recent Stock Logs</h3>
            <button onClick={() => onNavigateTab('inventory')} className="btn btn-secondary btn-sm">View All</button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{log.product?.name || 'Product'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.product?.sku}</div>
                    </td>
                    <td>
                      <span className={`badge ${log.movementType === 'IN' ? 'badge-active' : 'badge-cancelled'}`}>
                        {log.movementType === 'IN' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                        {log.movementType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{log.quantityChange}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.reason}</td>
                  </tr>
                ))}
                {stats.recentLogs.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No stock movement logs recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sales Challans */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3><FileCheck size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Recent Sales Challans</h3>
            <button onClick={() => onNavigateTab('challans')} className="btn btn-secondary btn-sm">View All</button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Challan #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentChallans.map((ch) => (
                  <tr key={ch.id}>
                    <td style={{ fontWeight: 700, color: '#818cf8' }}>{ch.challanNumber}</td>
                    <td>{ch.customerName}</td>
                    <td style={{ fontWeight: 700 }}>₹{ch.totalAmount.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge badge-${ch.status.toLowerCase()}`}>
                        {ch.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {stats.recentChallans.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No sales challans generated yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
