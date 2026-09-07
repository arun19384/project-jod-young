const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchSummary() {
  const res = await fetch(`${API_BASE}/summary`);
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
}

export async function fetchTransactions() {
  const res = await fetch(`${API_BASE}/transactions`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function addTransaction(payload) {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to add transaction');
  return res.json();
}

export async function deleteTransaction(id) {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete transaction');
  return res.json();
}

export async function fetchDebts() {
  const res = await fetch(`${API_BASE}/debts`);
  if (!res.ok) throw new Error('Failed to fetch debts');
  return res.json();
}

export async function addDebt(payload) {
  const res = await fetch(`${API_BASE}/debts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to add debt');
  return res.json();
}

export async function toggleDebt(id) {
  const res = await fetch(`${API_BASE}/debts/${id}`, {
    method: 'PUT',
  });
  if (!res.ok) throw new Error('Failed to toggle debt');
  return res.json();
}

export async function deleteDebt(id) {
  const res = await fetch(`${API_BASE}/debts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete debt');
  return res.json();
}

export async function fetchAccounts() {
  const res = await fetch(`${API_BASE}/accounts`);
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}

export async function addAccount(payload) {
  const res = await fetch(`${API_BASE}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to add account');
  return res.json();
}

export async function deleteAccount(id) {
  const res = await fetch(`${API_BASE}/accounts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete account');
  return res.json();
}

export async function updateAccount(id, payload) {
  const res = await fetch(`${API_BASE}/accounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update account');
  return res.json();
}

export async function transferAccount(fromId, toId, amount, note = '') {
  const res = await fetch(`${API_BASE}/accounts/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from_id: fromId, to_id: toId, amount: parseFloat(amount), note }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to transfer account');
  }
  return res.json();
}

export async function addCard(payload) {
  const res = await fetch(`${API_BASE}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to add card');
  return res.json();
}

export async function payCard(cardId, fromAccountId, amount) {
  const res = await fetch(`${API_BASE}/cards/${cardId}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromAccountId, amount }),
  });
  if (!res.ok) throw new Error('Failed to pay credit card');
  return res.json();
}

export async function deleteCard(id) {
  const res = await fetch(`${API_BASE}/cards/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete card');
  return res.json();
}

export async function toggleFixed(id) {
  const res = await fetch(`${API_BASE}/fixed/${id}`, {
    method: 'PUT',
  });
  if (!res.ok) throw new Error('Failed to toggle fixed expense');
  return res.json();
}

export async function addFixed(payload) {
  const res = await fetch(`${API_BASE}/fixed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to add fixed bill');
  return res.json();
}

export async function deleteFixed(id) {
  const res = await fetch(`${API_BASE}/fixed/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete fixed bill');
  return res.json();
}

export async function fetchPlans() {
  const res = await fetch(`${API_BASE}/plans`);
  if (!res.ok) throw new Error('Failed to fetch plans');
  return res.json();
}

export async function addPlan(payload) {
  const res = await fetch(`${API_BASE}/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to add plan');
  return res.json();
}

export async function payPlan(planId, fromAccountId) {
  const res = await fetch(`${API_BASE}/plans/${planId}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromAccountId }),
  });
  if (!res.ok) throw new Error('Failed to pay plan installment');
  return res.json();
}

export async function deletePlan(id) {
  const res = await fetch(`${API_BASE}/plans/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete plan');
  return res.json();
}

export async function updateBudget(budget) {
  const res = await fetch(`${API_BASE}/budget`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ budget }),
  });
  if (!res.ok) throw new Error('Failed to update budget');
  return res.json();
}

export async function resetData(cleanSlate) {
  const res = await fetch(`${API_BASE}/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cleanSlate }),
  });
  if (!res.ok) throw new Error('Failed to reset data');
  return res.json();
}

export async function fetchDBStatus() {
  const res = await fetch(`${API_BASE}/db/status`);
  if (!res.ok) throw new Error('Failed to fetch DB status');
  return res.json();
}

export async function connectDB(databaseUrl) {
  const res = await fetch(`${API_BASE}/db/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ database_url: databaseUrl }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to connect');
  return data;
}

export async function parseText(text, kind) {
  const res = await fetch(`${API_BASE}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, kind }),
  });
  if (!res.ok) throw new Error('Failed to parse text');
  return res.json();
}
