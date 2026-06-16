const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (data.detail?.message) {
        message = `${data.detail.message}: ${(data.detail.errors || []).join('; ')}`;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  getProducts: () => request('/api/products'),
  createProduct: (payload) => request('/api/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id, payload) => request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: 'DELETE' }),
  getProductInventory: (id) => request(`/api/products/${id}/inventory`),

  getCustomers: () => request('/api/customers'),
  createCustomer: (payload) => request('/api/customers', { method: 'POST', body: JSON.stringify(payload) }),
  updateCustomer: (id, payload) => request(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCustomer: (id) => request(`/api/customers/${id}`, { method: 'DELETE' }),

  getOrders: () => request('/api/orders'),
  createOrder: (payload) => request('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),

  getInventoryLogs: () => request('/api/inventory/logs'),
};
