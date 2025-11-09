/**
 * Supabase Edge Function: stripe-webhook
 *
 * Purpose: Handle Stripe webhook events for subscription lifecycle
 * Events handled:
 * - customer.subscription.created (trial subscriptions)
 * - customer.subscription.updated (renewals, cancellations)
 * - customer.subscription.deleted (immediate cancellations)
 * - checkout.session.completed (one-time purchases)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY_SANDBOX') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
});

// Create crypto provider for webhook signature verification in Deno
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature'
};

// Helper: Generate UUID license key
function generateLicenseKey(): string {
  return crypto.randomUUID();
}

// Helper: Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Should not reach here');
}

Deno.serve(async (req) => {
  console.log('=== WEBHOOK RECEIVED (DEV) ===', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - returning 204');
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  console.log('Processing POST request...');
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify webhook signature
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    console.log('Webhook received - signature present:', !!sig);
    console.log('STRIPE_WEBHOOK_SECRET present:', !!Deno.env.get('STRIPE_WEBHOOK_SECRET_SANDBOX'));
    console.log('STRIPE_WEBHOOK_SECRET length:', Deno.env.get('STRIPE_WEBHOOK_SECRET_SANDBOX')?.length || 0);

    if (!sig) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let event: Stripe.Event;

    // Verify webhook signature using Deno's Web Crypto API
    try {
      const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET_SANDBOX') ?? '';
      event = await stripe.webhooks.constructEventAsync(
        body,
        sig,
        webhookSecret,
        undefined,
        cryptoProvider
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle new subscription creation (including trials)
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription;

      console.log('Processing subscription.created event:', subscription.id);
      console.log('Subscription status:', subscription.status);

      // Only create license if this is a trialing subscription
      if (subscription.status === 'trialing') {
        // Check if license already exists for this subscription (idempotency)
        const { data: existingLicense } = await supabaseClient
          .from('licenses')
          .select('key')
          .eq('stripe_subscription_id', subscription.id)
          .limit(1);

        if (existingLicense && existingLicense.length > 0) {
          console.log('License already exists for subscription:', subscription.id);
          return new Response(JSON.stringify({ received: true, existing: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Generate UUID license key
        const licenseKey = await retryWithBackoff(() => {
          const key = generateLicenseKey();
          // Check uniqueness
          return supabaseClient
            .from('licenses')
            .select('key')
            .eq('key', key)
            .maybeSingle()
            .then(({ data }) => {
              if (data) throw new Error('UUID collision');
              return key;
            });
        });

        console.log('Generated license key for trial:', licenseKey);

        // Get customer email from metadata or Stripe customer
        let customerEmail = subscription.metadata?.email;
        if (!customerEmail) {
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          customerEmail = (customer as Stripe.Customer).email || 'unknown@example.com';
        }

        // Calculate expiration date (trial_end)
        const expiresAt = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;

        // Calculate renewal date (current_period_end) - when the subscription will renew
        const renewsAt = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        // Create license with status='pending' (not activated on machine yet)
        const { error } = await supabaseClient
          .from('licenses')
          .insert({
            key: licenseKey,
            user_id: subscription.metadata?.user_id || null,
            customer_email: customerEmail,
            expires_at: expiresAt,
            renews_at: renewsAt,
            stripe_customer_id: subscription.customer,
            stripe_subscription_id: subscription.id,
            stripe_subscription_status: subscription.status,
            status: 'pending'
          });

        if (error) {
          console.error('Failed to create license for trial:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to create license' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('License created for trial subscription:', licenseKey);
        return new Response(JSON.stringify({ received: true, license_key: licenseKey }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle subscription updates and cancellation
    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;

      console.log('Processing subscription event:', event.type, subscription.id);
      console.log('Subscription status:', subscription.status);
      console.log('Cancel at period end:', subscription.cancel_at_period_end);
      console.log('Canceled at:', subscription.canceled_at);

      // First, get the current license status to determine what action to take
      const { data: currentLicenses } = await supabaseClient
        .from('licenses')
        .select('status, metadata')
        .eq('stripe_customer_id', subscription.customer as string)
        .limit(1);

      const currentLicense = currentLicenses?.[0];
      const isCurrentlyCanceled = currentLicense?.status === 'canceled';

      // Check if subscription is cancelled or scheduled for cancellation in Stripe
      const shouldCancel =
        subscription.status === 'canceled' ||
        subscription.status === 'unpaid' ||
        subscription.cancel_at !== null;

      // Detect reactivation: was canceled in our DB, but Stripe now shows active (cancel_at is null)
      const shouldReactivate = isCurrentlyCanceled && !shouldCancel;

      console.log('License state:', {
        isCurrentlyCanceled,
        shouldCancel,
        shouldReactivate,
        stripeCancelAt: subscription.cancel_at,
        stripeStatus: subscription.status
      });

      if (shouldReactivate) {
        console.log('Reactivating previously canceled license for customer:', subscription.customer);

        // Check if license was ever activated on a machine (check metadata.machine_id)
        const hasBeenActivated = currentLicense?.metadata?.machine_id !== undefined && currentLicense?.metadata?.machine_id !== null;
        const newStatus = hasBeenActivated ? 'active' : 'pending';

        console.log('Reactivation details:', { hasBeenActivated, newStatus, metadata: currentLicense?.metadata });

        // Reactivate subscription - clear expires_at and canceled_at, restore status
        const { error } = await supabaseClient
          .from('licenses')
          .update({
            stripe_subscription_id: subscription.id,
            stripe_subscription_status: subscription.status,
            status: newStatus,
            expires_at: null,  // Clear expiration date when reactivating
            canceled_at: null  // Clear canceled timestamp
            // Keep renews_at as is - don't touch it
          })
          .eq('stripe_customer_id', subscription.customer as string);

        if (error) {
          console.error('Failed to reactivate licenses:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to reactivate licenses' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Successfully reactivated licenses for customer:', subscription.customer);
      } else if (shouldCancel) {
        console.log('Canceling licenses for customer:', subscription.customer);

        // Calculate the actual expiration date
        let expirationDate: string;

        if (event.type === 'customer.subscription.deleted') {
          // Immediate cancellation - set expiration to when it was canceled
          expirationDate = subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : new Date().toISOString();
          console.log('Immediate cancellation - expires_at set to:', expirationDate);
        } else {
          // Scheduled cancellation - use cancel_at or current_period_end
          expirationDate = subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : new Date().toISOString();
          console.log('Scheduled cancellation - expires_at set to:', expirationDate);
        }

        // Cancel all licenses for this customer
        const { error } = await supabaseClient
          .from('licenses')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            stripe_subscription_status: subscription.status,
            expires_at: expirationDate
            // Keep renews_at - it stays the same, we just add expires_at
          })
          .eq('stripe_customer_id', subscription.customer as string);

        if (error) {
          console.error('Failed to cancel licenses:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to cancel licenses' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Successfully canceled licenses for customer:', subscription.customer);
      } else {
        // Neither canceling nor reactivating - just update Stripe metadata and renewal date
        console.log('Updating subscription metadata for customer:', subscription.customer);

        const currentPeriodEnd = subscription.current_period_end;

        const { error } = await supabaseClient
          .from('licenses')
          .update({
            stripe_subscription_id: subscription.id,
            stripe_subscription_status: subscription.status,
            renews_at: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null
          })
          .eq('stripe_customer_id', subscription.customer as string);

        if (error) {
          console.error('Failed to update subscription info:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to update subscription info' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Updated subscription metadata for customer:', subscription.customer);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle successful checkout
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log('Processing checkout session:', session.id);

      // Generate UUID license key with retry
      const licenseKey = await retryWithBackoff(() => {
        const key = generateLicenseKey();
        // Check uniqueness
        return supabaseClient
          .from('licenses')
          .select('key')
          .eq('key', key)
          .maybeSingle()
          .then(({ data }) => {
            if (data) throw new Error('UUID collision');
            return key;
          });
      });

      console.log('Generated license key:', licenseKey);

      // Get customer email
      const customerEmail = session.customer_email || session.customer_details?.email || 'test@example.com';

      // Fetch subscription to get current_period_end
      let renewsAt = null;
      console.log('Session subscription ID:', session.subscription);
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        console.log('Subscription current_period_end:', subscription.current_period_end);
        const currentPeriodEnd = subscription.current_period_end;
        renewsAt = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;
        console.log('Calculated renewsAt:', renewsAt);
      } else {
        console.warn('No subscription ID in checkout session');
      }

      // Create license in database with retry
      const { error } = await supabaseClient
        .from('licenses')
        .insert({
          key: licenseKey,
          user_id: session.metadata?.user_id || null,
          customer_email: customerEmail,
          expires_at: null,
          renews_at: renewsAt,
          stripe_session_id: session.id,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: 'pending'
        });

      if (error) {
        console.error('Failed to create license:', error);

        if (error.code === 'PGRST116') { // Duplicate key error
          console.log('License already created for this session (idempotent)');
          return new Response(JSON.stringify({ received: true, duplicate: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(
          JSON.stringify({ error: 'Database error, Stripe will retry' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('License created successfully:', licenseKey);

      return new Response(JSON.stringify({ received: true, license_key: licenseKey }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
