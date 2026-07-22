import React from 'react';
import { LayoutDashboard, Users, Package, FileText } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'customers' | 'inventory' | 'challans';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, lowStockCount = 0 }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'customers', label: 'Customer CRM', icon: <Users size={18} /> },
    { id: 'inventory', label: 'Inventory & Stock', icon: <Package size={18} />, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'challans', label: 'Sales Challans', icon: <FileText size={18} /> },
  ];

  return (
    <aside style={{
      width: '240px',
      background: 'rgba(15, 23, 42, 0.95)',
      borderRight: '1px solid var(--border-color)',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', padding: '0 0.75rem 0.5rem', letterSpacing: '0.08em' }}>
        CORE MODULES
      </div>

      {menuItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as ActiveTab)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: isActive ? 'var(--accent-gradient)' : 'transparent',
              color: isActive ? 'white' : 'var(--text-secondary)',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isActive ? 'var(--shadow-glow)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {item.icon}
              {item.label}
            </div>
            {item.badge !== undefined && (
              <span className="badge badge-lowstock" style={{ fontSize: '0.7rem' }}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}

      <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Wholesale ERP v1.0</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Role-based Access & ACID Transactions</div>
      </div>
    </aside>
  );
};
