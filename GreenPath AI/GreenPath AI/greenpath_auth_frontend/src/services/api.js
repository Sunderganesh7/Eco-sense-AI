/**
 * GreenPath AI — Frontend API Client
 * Manages HTTP communication with the Flask MVC Auth backend.
 */

const BASE_URL = '/api/v1';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('greenpath_access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove Content-Type for FormData uploads
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Authentication
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me', { method: 'GET' }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOtp: (email, otp_code) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp_code }) }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),

  // User Profile
  getProfile: () => request('/users/profile', { method: 'GET' }),
  updateProfile: (body) => request('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),
  uploadProfileImage: (formData) => request('/users/profile-image', { method: 'POST', body: formData }),
  changePassword: (body) => request('/users/change-password', { method: 'PUT', body: JSON.stringify(body) }),

  // Admin Dashboard
  getActivityLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/logs/activity?${query}`, { method: 'GET' });
  },
  getLoginHistory: (limit = 100) => request(`/admin/logs/logins?limit=${limit}`, { method: 'GET' }),
  getRoles: () => request('/admin/roles', { method: 'GET' }),
  getUsers: () => request('/admin/users', { method: 'GET' }),
  assignRole: (userId, role_name) => request(`/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role_name }) }),
  deleteUser: (userId) => request(`/admin/users/${userId}`, { method: 'DELETE' }),
};
