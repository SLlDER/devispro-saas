import { requireSupabase } from '../supabaseClient.js';

export async function createClient(req, res) {
  const supabase = requireSupabase();
  const { name, email, phone, address } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Client name is required' });
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: req.user.id,
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
}

export async function getClients(req, res) {
  const supabase = requireSupabase();
  const { user_id } = req.params;

  if (user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only access your own clients' });
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user_id)
    .order('name', { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
}
