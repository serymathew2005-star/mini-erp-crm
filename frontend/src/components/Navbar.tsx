import React from 'react';
import { User, UserRole } from '../types';
import { LogOut, UserCheck, Shield, Building2, Package, Calculator } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onQuickRoleSwitch: (role: UserRole) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onLogout, onQuickRoleSwitch }) => {
  const getRoleIcon = (role?: UserRole) => {
    switch (role) {
      case 'ADMIN': return <Shield size={16} />;
      case 'SALES': return <UserCheck size={16} />;
      case 'WAREHOUSE': return <Package size={16} />;
      case 'ACCOUNTS': return <Calculator size={16} />;
      default: return <Building2 size={16} />;
    }
  };

  return (
    <header style={{
      height: '64px',
      background: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          <Building2 size={24} color="#6366f1" /> Mini ERP + CRM Portal
        </h2>
      </div>

      {currentUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Quick Role Switcher for Case Study Testing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginRight: '0.2rem' }}>EVAL ROLE:</span>
            {(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => onQuickRoleSwitch(r)}
                style={{
                  background: currentUser.role === r ? 'var(--accent-primary)' : 'transparent',
                  color: currentUser.role === r ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="badge-role" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {getRoleIcon(currentUser.role)} {currentUser.role}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{currentUser.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentUser.email}</div>
            </div>
            <button
              onClick={onLogout}
              className="btn btn-secondary btn-sm"
              title="Logout"
              style={{ marginLeft: '0.5rem' }}
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
