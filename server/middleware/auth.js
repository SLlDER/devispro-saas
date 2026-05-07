import { requireSupabase } from '../supabaseClient.js';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  let supabase;

  try {
    supabase = requireSupabase();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid authorization token' });
  }

  req.user = data.user;
  next();
}
