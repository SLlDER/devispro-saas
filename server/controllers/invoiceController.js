import { requireSupabase } from '../supabaseClient.js';

const FREE_PLAN_LIMIT = 3;

function isPaidUser(user) {
  return user.app_metadata?.subscription_status === 'active';
}

function sanitizeLineItems(lineItems, fallbackDescription, fallbackPrice, fallbackVatRate) {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return [
      {
        label: fallbackDescription.trim(),
        quantity: 1,
        unit_price: fallbackPrice,
        vat_rate: fallbackVatRate
      }
    ];
  }

  return lineItems.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unit_price);
    const vatRate = item.vat_rate === undefined || item.vat_rate === null ? fallbackVatRate : Number(item.vat_rate);

    if (!item.label || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error('Each line item needs a label, quantity and unit price');
    }

    if (!Number.isFinite(vatRate) || vatRate < 0) {
      throw new Error('Line item VAT rate must be a positive number');
    }

    return {
      label: item.label.trim(),
      quantity,
      unit_price: unitPrice,
      vat_rate: vatRate
    };
  });
}

function calculateTotal(lineItems) {
  return lineItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);
}

async function nextDocumentNumber(supabase, userId, documentType) {
  const year = new Date().getFullYear();
  const prefix = documentType === 'invoice' ? `FAC-${year}-` : `DEV-${year}-`;

  const { count, error } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('document_type', documentType);

  if (error) {
    throw new Error(error.message);
  }

  return `${prefix}${String((count || 0) + 1).padStart(4, '0')}`;
}

async function getInvoiceUsage(supabase, userId) {
  const { data, error } = await supabase
    .from('invoice_usage')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return data;
  }

  const { count, error: countError } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    throw new Error(countError.message);
  }

  const { data: createdUsage, error: createError } = await supabase
    .from('invoice_usage')
    .insert({
      user_id: userId,
      created_count: count || 0
    })
    .select()
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  return createdUsage;
}

async function incrementInvoiceUsage(supabase, userId, currentCount) {
  const { error } = await supabase
    .from('invoice_usage')
    .upsert({
      user_id: userId,
      created_count: currentCount + 1,
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(error.message);
  }
}

export async function createInvoice(req, res) {
  const supabase = requireSupabase();
  const { client, client_id, description, price, vat_rate, line_items } = req.body;
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

  let sanitizedLineItems;

  try {
    sanitizedLineItems = sanitizeLineItems(line_items, description, numericPrice, numericVatRate);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  const totalPrice = calculateTotal(sanitizedLineItems);
  const documentNumber = await nextDocumentNumber(supabase, userId, 'quote');
  const usage = await getInvoiceUsage(supabase, userId);

  if (!isPaidUser(req.user)) {
    if (usage.created_count >= FREE_PLAN_LIMIT) {
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
      price: totalPrice,
      vat_rate: numericVatRate,
      line_items: sanitizedLineItems,
      document_type: 'quote',
      document_number: documentNumber,
      status: 'draft'
    })
    .select('*, clients(*)')
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  await incrementInvoiceUsage(supabase, userId, usage.created_count);

  res.status(201).json(data);
}

export async function updateInvoice(req, res) {
  const supabase = requireSupabase();
  const { id } = req.params;
  const { status, signed_by, document_type } = req.body;

  const updates = {};

  if (status) {
    updates.status = status;
  }

  if (signed_by !== undefined) {
    updates.signed_by = signed_by?.trim() || null;
    updates.accepted_at = signed_by ? new Date().toISOString() : null;
    updates.status = signed_by ? 'accepted' : updates.status;
  }

  if (document_type === 'invoice') {
    updates.document_type = 'invoice';
    updates.status = 'accepted';
    updates.document_number = await nextDocumentNumber(supabase, req.user.id, 'invoice');
    updates.accepted_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select('*, clients(*)')
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
}

export async function deleteInvoice(req, res) {
  const supabase = requireSupabase();
  const { id } = req.params;

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(204).send();
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

export async function getInvoiceUsageForUser(req, res) {
  const supabase = requireSupabase();
  const { user_id } = req.params;

  if (user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only access your own usage' });
  }

  const usage = await getInvoiceUsage(supabase, user_id);

  res.json({
    created_count: usage.created_count,
    free_limit: FREE_PLAN_LIMIT
  });
}
