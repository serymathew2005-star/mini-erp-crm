import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { InventoryView } from './components/InventoryView';
import { ChallanView } from './components/ChallanView';
import { User, UserRole } from './types';
import { api, getAuthToken, setAuthToken } from './services/api';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  useEffect(() => {
    checkCurrentAuth();
  }, []);

  const checkCurrentAuth = async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setCurrentUser(res.user);
      loadLowStockCount();
    } catch (err) {
      setAuthToken(null);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadLowStockCount = async () => {
    try {
      const res = await api.getDashboardStats();
      if (res.data?.inventory?.lowStockCount !== undefined) {
        setLowStockCount(res.data.inventory.lowStockCount);
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
  };

  const handleQuickRoleSwitch = async (targetRole: UserRole) => {
    // Mapping of test emails for each role
    const roleEmails: Record<UserRole, string> = {
      ADMIN: 'admin@minierp.com',
      SALES: 'sales@minierp.com',
      WAREHOUSE: 'warehouse@minierp.com',
      ACCOUNTS: 'accounts@minierp.com',
    };

    const rolePass: Record<UserRole, string> = {
      ADMIN: 'admin123',
      SALES: 'sales123',
      WAREHOUSE: 'wh123',
      ACCOUNTS: 'acc123',
    };

    try {
      const res = await api.login({
        email: roleEmails[targetRole],
        password: rolePass[targetRole],
      });
      setAuthToken(res.token);
      setCurrentUser(res.user);
    } catch (err) {
      alert(`Failed to switch role to ${targetRole}`);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
          <div>Initializing Mini ERP Portal...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginModal onLoginSuccess={(u) => { setCurrentUser(u); loadLowStockCount(); }} />;
  }

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} lowStockCount={lowStockCount} />
      
      <div className="main-content">
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          onQuickRoleSwitch={handleQuickRoleSwitch}
        />

        <main className="page-container">
          {activeTab === 'dashboard' && <DashboardView onNavigateTab={setActiveTab} />}
          {activeTab === 'customers' && <CustomersView currentUser={currentUser} />}
          {activeTab === 'inventory' && <InventoryView currentUser={currentUser} />}
          {activeTab === 'challans' && <ChallanView currentUser={currentUser} />}
        </main>
      </div>
    </div>
  );
}

export default App;
