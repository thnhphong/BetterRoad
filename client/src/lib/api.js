const API_URL = import.meta.env.VITE_API_URL;

export const api = {
  // Helper để gọi API với auth token
  async fetch(endpoint, options = {}) {
    const token = localStorage.getItem('access_token');
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      }
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // Token expired
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
      throw new Error(data.message || 'Request failed');
    }

    return data;
  },

  // Auth methods
  register: (data) => api.fetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  login: (data) => api.fetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  logout: () => api.fetch('/auth/logout', { method: 'POST' }),

  getMe: () => api.fetch('/auth/me'),

  // Other methods...
};