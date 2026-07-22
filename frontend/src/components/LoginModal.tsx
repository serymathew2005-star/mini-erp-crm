import React, { useState } from 'react';
import { Shield, UserCheck, Package, Calculator, Lock, Mail, ArrowRight } from 'lucide-react';
import { api, setAuthToken } from '../services/api';
import { User } from '../types';

interface LoginModalProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@minierp.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      setAuthToken(res.token);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (credEmail: string, credPass: string) => {
    setEmail(credEmail);
    setPassword(credPass);
    setError(null);
  };

  return (
    <div className="modal-overlay" style={{ background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }}>
      <div className="modal-content glass-card" style={{ maxWidth: '480px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'var(--accent-gradient)',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Shield size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Mini ERP + CRM Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Select a test role or enter credentials to sign in
          </p>
        </div>

        {/* Quick Role Selectors for Reviewer */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            ⚡ QUICK DEMO CREDENTIALS (CLICK TO FILL)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickSelect('admin@minierp.com', 'admin123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', background: email === 'admin@minierp.com' ? 'rgba(99,102,241,0.2)' : undefined }}
            >
              <Shield size={14} color="#6366f1" /> Admin
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('sales@minierp.com', 'sales123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', background: email === 'sales@minierp.com' ? 'rgba(99,102,241,0.2)' : undefined }}
            >
              <UserCheck size={14} color="#10b981" /> Sales
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('warehouse@minierp.com', 'wh123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', background: email === 'warehouse@minierp.com' ? 'rgba(99,102,241,0.2)' : undefined }}
            >
              <Package size={14} color="#f59e0b" /> Warehouse
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('accounts@minierp.com', 'acc123')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start', background: email === 'accounts@minierp.com' ? 'rgba(99,102,241,0.2)' : undefined }}
            >
              <Calculator size={14} color="#3b82f6" /> Accounts
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={14} /> Email Address
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'} <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
