import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { generateLicenseKey } from '@/lib/license-generator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

export async function POST(req: NextRequest) {
  // Initialize Stripe inside function to avoid build-time initialization issues with v17+
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle new subscription creation (including trials)
  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object as Stripe.Subscription;

    try {
      console.log('Processing subscription.created event:', subscription.id);
      console.log('Subscription status:', subscription.status);

      // Only create license if this is a trialing subscription
      if (subscription.status === 'trialing') {
        // Dynamic import Supabase only when needed
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseClient = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if license already exists for this subscription (idempotency)
        const { data: existingLicense } = await supabaseClient
          .from('licenses')
          .select('key')
          .eq('stripe_subscription_id', subscription.id)
          .limit(1);

        if (existingLicense && existingLicense.length > 0) {
          console.log('License already exists for subscription:', subscription.id);
          return NextResponse.json({ received: true, existing: true });
        }

        // Generate UUID license key
        const licenseKey = await retryWithBackoff(() => generateLicenseKey());
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

        // Create license with status='pending' (not activated on machine yet)
        const activateResponse = await retryWithBackoff(async () => {
          return fetch(`${process.env.SUPABASE_URL}/functions/v1/activate_license`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
              'x-edge-function-secret': process.env.EDGE_FUNCTION_SECRET!,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              key: licenseKey,
              user_id: subscription.metadata?.user_id || null,
              customer_email: customerEmail,
              expires_at: expiresAt,
              stripe_session_id: null,
              stripe_customer_id: subscription.customer,
              stripe_subscription_id: subscription.id
            }),
          });
        });

        if (!activateResponse.ok) {
          const errorText = await activateResponse.text();
          console.error('Failed to create license for trial:', errorText);
          return NextResponse.json(
            { error: 'Failed to create license' },
            { status: 500 }
          );
        }

        console.log('License created for trial subscription:', licenseKey);
        return NextResponse.json({ received: true, license_key: licenseKey });
      }

      return NextResponse.json({ received: true });
    } catch (error: any) {
      console.error('Error processing subscription.created:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }

  // Handle subscription updates and cancellation
  if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;

    try {
      console.log('Processing subscription event:', event.type, subscription.id);
      console.log('Subscription status:', subscription.status);
      console.log('Cancel at period end:', subscription.cancel_at_period_end);
      console.log('Canceled at:', subscription.canceled_at);

      // Dynamic import Supabase only when needed
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseClient = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // First, get the current license status to determine what action to take
      const { data: currentLicenses } = await supabaseClient
        .from('licenses')
        .select('status, machine_id')
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

        // Determine the correct status based on whether it's been activated
        const hasBeenActivated = currentLicense?.machine_id !== null;
        const newStatus = hasBeenActivated ? 'active' : 'pending';

        console.log('Reactivation details:', { hasBeenActivated, newStatus });

        // Get current_period_end from subscription
        const subscriptionData = subscription as Stripe.Subscription & { current_period_end?: number };
        let currentPeriodEnd = subscriptionData.current_period_end;
        if (!currentPeriodEnd && subscription.items?.data?.[0]) {
          const item = subscription.items.data[0] as any;
          currentPeriodEnd = item.current_period_end;
        }

        const renewsAtValue = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;

        // Reactivate subscription - clear expires_at and set status based on activation state
        const updateData = {
          stripe_subscription_id: subscription.id,
          stripe_subscription_status: subscription.status,
          status: newStatus,
          expires_at: null,  // Clear expiration date when reactivating
          canceled_at: null,  // Clear canceled timestamp
          renews_at: renewsAtValue
        };

        const { error } = await supabaseClient
          .from('licenses')
          .update(updateData)
          .eq('stripe_customer_id', subscription.customer as string);

        if (error) {
          console.error('Failed to reactivate licenses:', error);
          return NextResponse.json(
            { error: 'Failed to reactivate licenses' },
            { status: 500 }
          );
        }

        console.log('Successfully reactivated licenses for customer:', subscription.customer);
      } else if (shouldCancel) {
        console.log('Canceling licenses for customer:', subscription.customer);

        // Calculate the actual expiration date
        // For immediate cancellations (deleted event), use canceled_at or current time
        // For scheduled cancellations (updated event), use cancel_at or current_period_end
        let expirationDate: string;

        if (event.type === 'customer.subscription.deleted') {
          // Immediate cancellation - set expiration to when it was canceled
          expirationDate = subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : new Date().toISOString();
          console.log('Immediate cancellation - expires_at set to:', expirationDate);
        } else {
          // Scheduled cancellation - use cancel_at or current_period_end
          const subscriptionData = subscription as Stripe.Subscription & { current_period_end?: number };
          expirationDate = subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : subscriptionData.current_period_end
              ? new Date(subscriptionData.current_period_end * 1000).toISOString()
              : new Date().toISOString();
          console.log('Scheduled cancellation - expires_at set to:', expirationDate);
        }

        // Cancel all licenses for this customer
        const updateData: any = {
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          stripe_subscription_status: subscription.status,
          expires_at: expirationDate,
          renews_at: null  // Clear renewal date when canceled
        };

        const { error } = await supabaseClient
          .from('licenses')
          .update(updateData)
          .eq('stripe_customer_id', subscription.customer as string);

        if (error) {
          console.error('Failed to cancel licenses:', error);
          return NextResponse.json(
            { error: 'Failed to cancel licenses' },
            { status: 500 }
          );
        }

        console.log('Successfully canceled licenses for customer:', subscription.customer);
      } else {
        // Neither canceling nor reactivating - just update Stripe metadata and renewal date
        console.log('Updating subscription metadata for customer:', subscription.customer);

        const subscriptionData = subscription as Stripe.Subscription & { current_period_end?: number };
        let currentPeriodEnd = subscriptionData.current_period_end;
        if (!currentPeriodEnd && subscription.items?.data?.[0]) {
          const item = subscription.items.data[0] as any;
          currentPeriodEnd = item.current_period_end;
        }

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
          return NextResponse.json(
            { error: 'Failed to update subscription info' },
            { status: 500 }
          );
        }

        console.log('Updated subscription metadata for customer:', subscription.customer);
      }

      return NextResponse.json({ received: true });
    } catch (error: any) {
      console.error('Error processing subscription event:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      console.log('Processing checkout session:', session.id);

      // Generate UUID license key with retry
      const licenseKey = await retryWithBackoff(() => generateLicenseKey());
      console.log('Generated license key:', licenseKey);

      // Get customer email
      const customerEmail = session.customer_email || session.customer_details?.email || 'test@example.com';

      // Fetch subscription to get current_period_end
      let renewsAt = null;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        const subscriptionData = subscription as Stripe.Subscription & { current_period_end?: number };
        let currentPeriodEnd = subscriptionData.current_period_end;
        if (!currentPeriodEnd && subscription.items?.data?.[0]) {
          const item = subscription.items.data[0] as any;
          currentPeriodEnd = item.current_period_end;
        }

        renewsAt = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;
      }

      // Create license in database with retry
      const activateResponse = await retryWithBackoff(async () => {
        return fetch(`${process.env.SUPABASE_URL}/functions/v1/activate_license`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
            'x-edge-function-secret': process.env.EDGE_FUNCTION_SECRET!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: licenseKey,
            user_id: session.metadata?.user_id || null,
            customer_email: customerEmail,
            expires_at: null,
            renews_at: renewsAt,
            stripe_session_id: session.id,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription
          }),
        });
      });

      if (!activateResponse.ok) {
        const errorText = await activateResponse.text();
        console.error('activate_license failed:', errorText);

        if (activateResponse.status >= 500) {
          return NextResponse.json(
            { error: 'Database error, Stripe will retry' },
            { status: 500 }
          );
        }

        throw new Error(`activate_license failed (${activateResponse.status}): ${errorText}`);
      }

      const activateData = await activateResponse.json();

      if (activateData.duplicate) {
        console.log('License already created for this session (idempotent)');
      } else {
        console.log('License created successfully:', licenseKey);
      }

      return NextResponse.json({ received: true, license_key: licenseKey });

    } catch (error: any) {
      console.error('Error processing webhook:', error);

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('fetch failed')) {
        console.error('Network error - returning 500 so Stripe retries');
        return NextResponse.json(
          { error: 'Network error, Stripe will retry' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        received: true,
        error: error.message,
        manual_review_required: true
      });
    }
  }

  return NextResponse.json({ received: true });
}
