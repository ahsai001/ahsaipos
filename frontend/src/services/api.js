const API_BASE = '/api/v1';

export const api = {
  getToken: () => localStorage.getItem('ahsaipos_token'),
  setToken: (token) => localStorage.setItem('ahsaipos_token', token),
  clearToken: () => localStorage.removeItem('ahsaipos_token'),
  
  getActiveStore: () => {
    try {
      return JSON.parse(localStorage.getItem('ahsaipos_active_store'));
    } catch {
      return null;
    }
  },
  setActiveStore: (store) => localStorage.setItem('ahsaipos_active_store', JSON.stringify(store)),

  async request(path, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    if (res.status === 401) {
      this.clearToken();
      window.location.reload();
      throw new Error('Sesi berakhir, silakan login kembali.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Terjadi kesalahan' }));
      throw new Error(err.detail || 'Gagal memproses permintaan');
    }

    return res.json();
  },

  // Auth
  register: (data) => api.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => api.request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  // Stores
  getStores: () => api.request('/stores'),
  createStore: (data) => api.request('/stores', { method: 'POST', body: JSON.stringify(data) }),

  // Products
  getProducts: (storeId, search = '') => 
    api.request(`/stores/${storeId}/products${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createProduct: (storeId, data) => 
    api.request(`/stores/${storeId}/products`, { method: 'POST', body: JSON.stringify(data) }),

  // POS Checkout
  checkout: (storeId, data) => 
    api.request(`/stores/${storeId}/pos/checkout`, { method: 'POST', body: JSON.stringify(data) }),
  getRecentOrders: (storeId) => 
    api.request(`/stores/${storeId}/pos/recent-orders`)
};
