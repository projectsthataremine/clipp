# Clipp Environments

This document describes the three environments used for developing and testing Clipp.

## Overview

Clipp uses three distinct environments to ensure safe testing and deployment:

1. **SANDBOX** - Local development with Stripe Sandbox
2. **DEV** - Full build testing with Stripe Test mode
3. **PROD** - Production with Stripe Live mode

## Environment Details

### 1. SANDBOX (Local Development)

**Purpose:** Day-to-day development and testing without any real money

**Build:**
- Dev build running in development mode (`npm run dev` or similar)
- Running from source code, not a packaged app

**Stripe:**
- **Stripe Sandbox mode**
- Uses `stripe listen` to forward webhooks locally
- Test cards like `4242 4242 4242 4242`
- No real money involved

**Edge Functions:**
- Uses `-dev` edge functions
- Reads `STRIPE_SECRET_KEY_SANDBOX`
- Determined by passing `environment: 'sandbox'` in requests

**Environment Variable:**
- Set `CLIPP_ENV=sandbox` in Electron app `.env` file

---

### 2. DEV (Testing Environment)

**Purpose:** Test the full production build with real webhooks but minimal cost

**Build:**
- **Full production build** (packaged app)
- Installed locally for testing
- Built with dev flag enabled

**Stripe:**
- **Stripe Test mode** (live webhooks, not Stripe CLI)
- Uses actual Supabase webhook endpoints
- $1 test price to minimize costs
- Real webhook flow end-to-end

**Edge Functions:**
- Uses `-dev` edge functions (deployed to Supabase)
- Reads `STRIPE_SECRET_KEY_DEV`
- Determined by passing `environment: 'dev'` in requests

**Environment Variable:**
- Built with `CLIPP_ENV=dev`

---

### 3. PROD (Production)

**Purpose:** Actual production environment with real customers

**Build:**
- Production build downloaded from the internet
- No dev flags enabled

**Stripe:**
- **Stripe Live mode**
- Production webhooks
- Real pricing ($5/month)

**Edge Functions:**
- Uses production edge functions (no `-dev` suffix)
- Reads `STRIPE_SECRET_KEY_PROD`

**Environment Variable:**
- Built with `CLIPP_ENV=prod` (default)

---

## Testing Strategy

### Initial Production Testing

Before launching to real customers, test production with minimal risk:

1. **Temporarily use $1 test price:**
   - In Supabase secrets, `STRIPE_PRICE_ID_PROD` is already set to the $1 test price initially
   - Complete a real purchase with a real credit card ($1)
   - Verify the entire flow works end-to-end

2. **Switch to real pricing:**
   - Once validated, update `STRIPE_PRICE_ID_PROD` in Supabase to the $5 production price
   - Run: `npx supabase secrets set STRIPE_PRICE_ID_PROD="price_[real_price_id]"`
   - Production is now ready for real customers

### Environment Variable Summary

| Environment | `CLIPP_ENV` | Edge Functions | Stripe Mode | Price |
|-------------|-------------|----------------|-------------|-------|
| SANDBOX | `sandbox` | `-dev` | Sandbox | N/A (test cards) |
| DEV | `dev` | `-dev` | Test | $1 |
| PROD | `prod` | production | Live | $5 (or $1 for initial testing) |

---

## How It Works

### 1. Electron App Determines Environment

The Electron app reads `CLIPP_ENV` and:
- Decides which edge function URLs to call (`-dev` suffix or not)
- For `-dev` functions: Passes the environment flag in API requests
- For production functions: No environment flag (always uses `PROD` credentials)

### 2. Edge Functions Read Environment

**Development Edge Functions (`-dev` suffix):**
- Accept an `environment` parameter in the request body
- If `environment === 'sandbox'` → use `STRIPE_SECRET_KEY_SANDBOX`
- If `environment === 'dev'` or not specified → use `STRIPE_SECRET_KEY_DEV`
- This allows testing both Stripe Sandbox and Test mode with the same edge functions

**Production Edge Functions (no suffix):**
- **DO NOT** accept any environment parameters
- Always use `STRIPE_SECRET_KEY_PROD`
- Hardcoded to production credentials for security
- No way to manipulate them to use different credentials

**Security Note:** Production edge functions are intentionally separate and do not accept environment flags. This prevents any possibility of malicious actors passing flags to access test credentials or manipulate the production payment flow.

### 3. Stripe Processes Payments

Stripe uses the credentials provided:
- **Sandbox:** No real money, test cards only
- **Test mode:** Real webhooks, test prices
- **Live mode:** Real money, real customers

---

## Quick Reference

**Local development (Sandbox):**
```bash
# In Electron app .env
CLIPP_ENV=sandbox

# Start Stripe listener
stripe listen --forward-to https://[your-project].supabase.co/functions/v1/stripe-webhook-dev
```

**Build for testing (Dev):**
```bash
# Build with dev environment
CLIPP_ENV=dev npm run build
```

**Build for production (Prod):**
```bash
# Build with production environment (default)
npm run build
```

---

## Secrets Management

All Stripe secrets are stored in Supabase and managed via `.env.secrets` file (not committed to git).

To upload secrets:
```bash
npx supabase secrets set STRIPE_SECRET_KEY_SANDBOX="..." STRIPE_SECRET_KEY_DEV="..." STRIPE_SECRET_KEY_PROD="..."
```

To view current secrets:
```bash
npx supabase secrets list
```
