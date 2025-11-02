# Supabase Setup Guide for Clipp

## Project Information
- **Project ID**: `jijhacdgtccfftlangjq`
- **Project URL**: `https://jijhacdgtccfftlangjq.supabase.co`
- **Anon Key**: Already configured in `.env` files

## Setup Steps

### 1. Database Setup

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/jijhacdgtccfftlangjq/editor
2. Open the SQL Editor
3. Copy the contents of `electron/backend/supabase/migrations/20251101_create_tables.sql`
4. Paste and run the SQL script
5. Verify that the following tables were created:
   - `licenses`
   - `edge_function_logs`
   - `contact_submissions`

#### Option B: Using Supabase CLI

```bash
cd electron/backend/supabase
supabase link --project-ref jijhacdgtccfftlangjq
supabase db push
```

### 2. Configure Edge Function Environment Variables

You need to set up secrets for your edge functions. These are different from local .env files.

#### Via Supabase Dashboard:

1. Go to https://supabase.com/dashboard/project/jijhacdgtccfftlangjq/settings/vault
2. Add the following secrets:

**Required Secrets:**

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin operations | Dashboard → Settings → API → service_role key |
| `EDGE_FUNCTION_SECRET` | Secret for authenticating edge function calls | Generate a random string (e.g., `openssl rand -base64 32`) |
| `LICENSE_PRIVATE_KEY` | Ed25519 private key for signing licenses | See "Generating License Keys" section below |
| `STRIPE_SECRET_KEY` | Stripe secret key | Get from Stripe Dashboard |
| `STRIPE_PRICE_ID` | Stripe price ID for subscription | Get from Stripe Dashboard → Products |

#### Via Supabase CLI:

```bash
cd electron/backend/supabase

# Set service role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Generate and set edge function secret
supabase secrets set EDGE_FUNCTION_SECRET=$(openssl rand -base64 32)

# Set license private key (after generating - see below)
supabase secrets set LICENSE_PRIVATE_KEY=your_base64_encoded_private_key

# Set Stripe keys
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
supabase secrets set STRIPE_PRICE_ID=your_stripe_price_id
```

### 3. Generating License Keys (Ed25519)

The app uses Ed25519 cryptographic signatures for license validation. You need to generate a key pair:

```bash
# Generate Ed25519 private key
openssl genpkey -algorithm ED25519 -out private_key.pem

# Convert to PKCS8 format and base64 encode
openssl pkcs8 -topk8 -nocrypt -in private_key.pem -outform DER | base64

# This outputs your LICENSE_PRIVATE_KEY - save it!

# Extract public key
openssl pkey -in private_key.pem -pubout -out public_key.pem

# Convert public key to base64
openssl pkey -pubin -in public_key.pem -outform DER | base64

# This outputs your PUBLIC_LICENSE_KEY - save it!
```

**IMPORTANT**:
- Store the private key in Supabase secrets (for edge functions)
- Store the public key in your Electron app code (for license verification)
- Never commit private keys to git!

### 4. Deploy Edge Functions

```bash
cd electron/backend/supabase

# Link to your project
supabase link --project-ref jijhacdgtccfftlangjq

# Deploy all edge functions
supabase functions deploy

# Or deploy individually:
supabase functions deploy validate_license
supabase functions deploy create_stripe_trial
supabase functions deploy assign_license_to_machine
supabase functions deploy revoke_license_from_machine
supabase functions deploy activate_license
supabase functions deploy create_payment_session
supabase functions deploy create_stripe_user
supabase functions deploy get_latest_release
```

### 5. Test Edge Functions

After deployment, test that everything works:

```bash
# Test validate_license function
curl -i --location --request POST 'https://jijhacdgtccfftlangjq.supabase.co/functions/v1/validate_license' \
  --header 'Authorization: YOUR_EDGE_FUNCTION_SECRET' \
  --header 'Content-Type: application/json' \
  --data '{"key":"test-license-key","machine_id":"test-machine-id"}'
```

### 6. Configure Google OAuth (For Future Auth Migration)

When you're ready to migrate to Google OAuth (per TODO.md):

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:54321`
6. In Supabase Dashboard:
   - Go to Authentication → Providers
   - Enable Google provider
   - Add your Google Client ID and Secret

### 7. Update Electron App Configuration

Update `electron/backend/constants.js` with:

```javascript
const SUPABASE_URL = 'https://jijhacdgtccfftlangjq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppamhhY2RndGNjZmZ0bGFuZ2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjE3NTQsImV4cCI6MjA3NzU5Nzc1NH0.tA9O6xtlU0djnQ6t2G82z-2ANjnnmga9aeizcW9ePUA';
const EDGE_FUNCTION_SECRET = 'YOUR_EDGE_FUNCTION_SECRET'; // Same as in Supabase secrets
```

### 8. Verify Database Tables

Check that all tables were created correctly:

```sql
-- Run this in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Should show:
-- licenses
-- edge_function_logs
-- contact_submissions
```

### 9. Test Database Policies

Verify Row Level Security is working:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## Environment Variables Summary

### Electron App (.env files)
- `website/.env.local`: ✅ Updated
- `electron/backend/.env`: ✅ Updated

### Supabase Edge Functions (Secrets)
These need to be set manually:
- `SUPABASE_SERVICE_ROLE_KEY`
- `EDGE_FUNCTION_SECRET`
- `LICENSE_PRIVATE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`

## Next Steps

1. ✅ Database tables created (SQL migration ready)
2. ✅ Edge functions copied from NarraFlow
3. ✅ Config files updated
4. ⏳ Set Supabase secrets (manual step required)
5. ⏳ Deploy edge functions
6. ⏳ Generate and configure license keys
7. ⏳ Test the complete flow

## Troubleshooting

### Edge Function Errors

Check logs in Supabase Dashboard:
- Go to Functions → Your Function → Logs
- Look for deployment errors or runtime errors

### Database Connection Issues

Verify your connection string:
```bash
supabase status
```

### License Validation Failing

1. Check that `EDGE_FUNCTION_SECRET` matches in both:
   - Supabase secrets
   - Electron app constants
2. Verify license key format in database
3. Check edge function logs for detailed errors

## Resources

- [Supabase Dashboard](https://supabase.com/dashboard/project/jijhacdgtccfftlangjq)
- [Supabase Docs](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
