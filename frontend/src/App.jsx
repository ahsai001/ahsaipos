import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import AuthPage from './pages/AuthPage';
import StoreSelectPage from './pages/StoreSelectPage';
import PosPage from './pages/PosPage';

export default function App() {
  const [token, setToken] = useState(api.getToken());
  const [activeStore, setActiveStore] = useState(api.getActiveStore());

  const handleLoginSuccess = (data) => {
    setToken(data.access_token);
  };

  const handleSelectStore = (store) => {
    setActiveStore(store);
    api.setActiveStore(store);
  };

  const handleBackToStores = () => {
    setActiveStore(null);
    localStorage.removeItem('ahsaipos_active_store');
  };

  const handleLogout = () => {
    api.clearToken();
    localStorage.removeItem('ahsaipos_active_store');
    setToken(null);
    setActiveStore(null);
  };

  if (!token) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (!activeStore) {
    return <StoreSelectPage onSelectStore={handleSelectStore} onLogout={handleLogout} />;
  }

  return <PosPage store={activeStore} onBackToStores={handleBackToStores} />;
}
