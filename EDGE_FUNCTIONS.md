# Edge Functions - Dev vs Production

## Overview
All edge functions now have separate dev and production versions that use different environment variables.

## Edge Functions List

### Stripe-Related (PRODUCTION)
- `stripe-webhook` - Uses `STRIPE_SECRET_KEY_PROD`, `STRIPE_WEBHOOK_SECRET_PROD`
- `create-checkout-session` - Uses `STRIPE_SECRET_KEY_PROD`, `STRIPE_PRICE_ID_PROD`
- `create-customer-portal` - Uses `STRIPE_SECRET_KEY_PROD`
- `create_stripe_trial` - Uses `STRIPE_SECRET_KEY_PROD`, `STRIPE_PRICE_ID_PROD`

### Stripe-Related (DEVELOPMENT)
- `stripe-webhook-dev` - Uses `STRIPE_SECRET_KEY_DEV`, `STRIPE_WEBHOOK_SECRET_DEV`
- `create-checkout-session-dev` - Uses `STRIPE_SECRET_KEY_DEV`, `STRIPE_PRICE_ID_DEV`
- `create-customer-portal-dev` - Uses `STRIPE_SECRET_KEY_DEV`
- `create_stripe_trial-dev` - Uses `STRIPE_SECRET_KEY_DEV`, `STRIPE_PRICE_ID_DEV`

### License-Related (PRODUCTION)
- `validate_license` - Uses `LICENSE_PRIVATE_KEY_PROD`, `EDGE_FUNCTION_SECRET_PROD`
- `assign_license_to_machine` - Uses `LICENSE_PRIVATE_KEY_PROD`
- `revoke_license_from_machine` - Uses `LICENSE_PRIVATE_KEY_PROD`

### License-Related (DEVELOPMENT)
- `validate_license-dev` - Uses `LICENSE_PRIVATE_KEY_DEV`, `EDGE_FUNCTION_SECRET_DEV`
- `assign_license_to_machine-dev` - Uses `LICENSE_PRIVATE_KEY_DEV`
- `revoke_license_from_machine-dev` - Uses `LICENSE_PRIVATE_KEY_DEV`

## Environment Variables Required

All these must be set in Supabase:

```bash
# Development
STRIPE_SECRET_KEY_DEV
STRIPE_PRICE_ID_DEV
STRIPE_WEBHOOK_SECRET_DEV
LICENSE_PUBLIC_KEY_DEV
LICENSE_PRIVATE_KEY_DEV
EDGE_FUNCTION_SECRET_DEV

# Production
STRIPE_SECRET_KEY_PROD
STRIPE_PRICE_ID_PROD
STRIPE_WEBHOOK_SECRET_PROD
LICENSE_PUBLIC_KEY_PROD
LICENSE_PRIVATE_KEY_PROD
EDGE_FUNCTION_SECRET_PROD
```

## Stripe Webhook Configuration

### Test Webhook (Stripe Test Mode)
- URL: `https://jijhacdgtccfftlangjq.supabase.co/functions/v1/stripe-webhook-dev`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`
- Get signing secret → Set as `STRIPE_WEBHOOK_SECRET_DEV`

### Production Webhook (Stripe Live Mode)
- URL: `https://jijhacdgtccfftlangjq.supabase.co/functions/v1/stripe-webhook`
- Events: Same as above
- Get signing secret → Set as `STRIPE_WEBHOOK_SECRET_PROD`

## Deployment

To deploy all functions:
```bash
supabase functions deploy
```

To deploy specific function:
```bash
supabase functions deploy stripe-webhook-dev
supabase functions deploy stripe-webhook
```
