const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const body = await response.json();
      message = body.error || message;
    } catch {
      // Keep the generic message when the response is not JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  health: () => request('/health'),
  getTransactions: () => request('/transactions'),
  getOverview: () => request('/analytics/overview'),
  addTransaction: (transaction) => request('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
  }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),
  clearTransactions: () => request('/transactions', { method: 'DELETE' }),
};
