import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const apiUrl = import.meta.env.VITE_API_URL || '/api';
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        async getSession() {
          return { data: { session: null } };
        },
        onAuthStateChange() {
          return { data: { subscription: { unsubscribe() {} } } };
        },
        async signInWithPassword() {
          return { error: new Error('Missing Supabase environment variables') };
        },
        async signUp() {
          return { error: new Error('Missing Supabase environment variables') };
        },
        async signOut() {
          return { error: null };
        }
      }
    };

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

async function request(path, options = {}) {
  const token = await getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers
    });
  } catch (error) {
    throw new Error('Impossible de joindre le serveur. Verifiez que npm run dev est lance.');
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : {};

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export function fetchInvoices(userId) {
  return request(`/invoices/${userId}`);
}

export function fetchInvoiceUsage(userId) {
  return request(`/invoice-usage/${userId}`);
}

export function fetchClients(userId) {
  return request(`/clients/${userId}`);
}

export function createClient(client) {
  return request('/client', {
    method: 'POST',
    body: JSON.stringify(client)
  });
}

export function updateClient(id, client) {
  return request(`/client/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(client)
  });
}

export function deleteClient(id) {
  return request(`/client/${id}`, {
    method: 'DELETE'
  });
}

export function createInvoice(invoice) {
  return request('/invoice', {
    method: 'POST',
    body: JSON.stringify(invoice)
  });
}

export function updateInvoice(id, invoice) {
  return request(`/invoice/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(invoice)
  });
}

export function deleteInvoice(id) {
  return request(`/invoice/${id}`, {
    method: 'DELETE'
  });
}

export function createCheckoutSession() {
  return request('/create-checkout-session', {
    method: 'POST'
  });
}

export function createPortalSession() {
  return request('/create-portal-session', {
    method: 'POST'
  });
}
