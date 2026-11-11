const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Generic request helper with automatic JSON parsing and error wrapping.
 */
async function request(endpoint, options = {}) {
  const { token, body, ...customOptions } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customOptions.headers,
  };

  const config = {
    ...customOptions,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error?.message || data?.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.code = data?.error?.code || 'API_ERROR';
    err.details = data?.error?.details;
    err.status = res.status;
    throw err;
  }

  return data;
}

/**
 * Helper to download binary files (PDFs) directly in the browser.
 */
async function downloadBlob(endpoint, filename, options = {}) {
  const { token, body, method = 'GET' } = options;
  const headers = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.error?.message || 'Failed to download report PDF');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Feasibility API
export const feasibilityApi = {
  evaluate: (payload, token) =>
    request('/feasibility', { method: 'POST', body: payload, token }),

  explain: (payload, token) =>
    request('/feasibility/explain', { method: 'POST', body: payload, token }),

  downloadPdf: (payload, token, filename = 'feasibility-report.pdf') =>
    downloadBlob('/feasibility/pdf', filename, { method: 'POST', body: payload, token }),
};

// Auth API
export const authApi = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),

  register: (name, email, password) =>
    request('/auth/register', { method: 'POST', body: { name, email, password } }),

  getMe: (token) =>
    request('/auth/me', { method: 'GET', token }),
};

// Reports API
export const reportsApi = {
  list: (token, page = 1, limit = 10) =>
    request(`/reports?page=${page}&limit=${limit}`, { method: 'GET', token }),

  getById: (id, token) =>
    request(`/reports/${id}`, { method: 'GET', token }),

  deleteById: (id, token) =>
    request(`/reports/${id}`, { method: 'DELETE', token }),

  downloadPdf: (id, token, filename = `feasibility-report-${id}.pdf`) =>
    downloadBlob(`/reports/${id}/pdf`, filename, { method: 'GET', token }),
};

