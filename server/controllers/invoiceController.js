import { requireSupabase } from '../supabaseClient.js';

const FREE_PLAN_LIMIT = 3;

function isPaidUser(user) {
  return user.app_metadata?.subscription_status === 'active';
}

export async function createInvoice(req, res) {
  const supabase = requireSupabase();
  const { client, client_id, description, price, vat_rate } = req.body;
  const userId = req.user.id;

  if (!client || !description || price === undefined || price === null) {
    return res.status(400).json({ error: 'Client, description and price are required' });
  }

  const numericPrice = Number(price);
  const numericVatRate = vat_rate === undefined || vat_rate === null ? 20 : Number(vat_rate);

  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return res.status(400).json({ error: 'Price must be a positive number' });
  }

  if (!Number.isFinite(numericVatRate) || numericVatRate < 0) {
    return res.status(400).json({ error: 'VAT rate must be a positive number' });
  }

  if (!isPaidUser(req.user)) {
    const { count, error: countError } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      return res.status(500).json({ error: countError.message });
    }

    if ((count || 0) >= FREE_PLAN_LIMIT) {
      return res.status(403).json({
        error: 'Free plan limit reached',
        code: 'FREE_PLAN_LIMIT'
      });
    }
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      user_id: userId,
      client_id: client_id || null,
      client: client.trim(),
      description: description.trim(),
      price: numericPrice,
      vat_rate: numericVatRate
    })
    .select('*, clients(*)')
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
}

export async function getInvoices(req, res) {
  const supabase = requireSupabase();
  const { user_id } = req.params;

  if (user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only access your own invoices' });
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
}
