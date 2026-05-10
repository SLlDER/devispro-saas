import { requireSupabase } from '../supabaseClient.js';

function cleanProfile(body, userId) {
  const requiredFields = ['business_name', 'siret', 'address', 'email'];

  for (const field of requiredFields) {
    if (!body[field]?.trim()) {
      throw new Error('Nom entreprise, SIRET, adresse et email sont obligatoires');
    }
  }

  return {
    user_id: userId,
    business_name: body.business_name.trim(),
    owner_name: body.owner_name?.trim() || null,
    legal_form: body.legal_form?.trim() || null,
    siret: body.siret.trim(),
    vat_number: body.vat_number?.trim() || null,
    address: body.address.trim(),
    email: body.email.trim(),
    phone: body.phone?.trim() || null,
    insurance: body.insurance?.trim() || null,
    default_payment_terms: body.default_payment_terms?.trim() || 'Paiement a reception de facture',
    default_late_fee: body.default_late_fee?.trim() || 'Penalites de retard exigibles sans rappel prealable',
    vat_exemption: Boolean(body.vat_exemption),
    updated_at: new Date().toISOString()
  };
}

export async function getBusinessProfile(req, res) {
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
}

export async function upsertBusinessProfile(req, res) {
  const supabase = requireSupabase();
  let profile;

  try {
    profile = cleanProfile(req.body, req.user.id);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const { data, error } = await supabase
    .from('business_profiles')
    .upsert(profile)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
}
