import { requireSupabase } from '../supabaseClient.js';
import { requireStripe } from '../stripe.js';

async function updateSubscriptionStatus(userId, status, stripeCustomerId = null) {
  if (!userId) return;
  const supabase = requireSupabase();

  const { data } = await supabase.auth.admin.getUserById(userId);
  const appMetadata = data.user?.app_metadata || {};

  await supabase.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...appMetadata,
      ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
      subscription_status: status
    }
  });
}

export async function handleStripeWebhook(req, res) {
  const stripe = requireStripe();
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).send('Missing STRIPE_WEBHOOK_SECRET');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await updateSubscriptionStatus(
      session.metadata?.user_id || session.client_reference_id,
      'active',
      session.customer
    );
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    await updateSubscriptionStatus(subscription.metadata?.user_id, 'inactive');
  }

  res.json({ received: true });
}
