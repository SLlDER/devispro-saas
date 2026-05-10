import { requireSupabase } from '../supabaseClient.js';

export async function exportAccount(req, res) {
  const supabase = requireSupabase();
  const userId = req.user.id;

  const [clients, invoices, profile, usage] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', userId),
    supabase.from('invoices').select('*, clients(*)').eq('user_id', userId),
    supabase.from('business_profiles').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('invoice_usage').select('*').eq('user_id', userId).maybeSingle()
  ]);

  for (const result of [clients, invoices, profile, usage]) {
    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }
  }

  res.json({
    exported_at: new Date().toISOString(),
    user: {
      id: req.user.id,
      email: req.user.email
    },
    business_profile: profile.data,
    clients: clients.data,
    invoices: invoices.data,
    usage: usage.data
  });
}

export async function deleteAccount(req, res) {
  const supabase = requireSupabase();

  const { error } = await supabase.auth.admin.deleteUser(req.user.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(204).send();
}
