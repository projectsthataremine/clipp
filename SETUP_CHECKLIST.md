# Clipp Supabase Setup Checklist

## ✅ Completed (Automated)

- [x] Updated `website/.env.local` with new Supabase credentials
- [x] Updated `electron/backend/.env` with new Supabase credentials
- [x] Updated `electron/backend/supabase/config.toml` with project ID `jijhacdgtccfftlangjq`
- [x] Created SQL migration file: `electron/backend/supabase/migrations/20251101_create_tables.sql`
- [x] Copied all edge functions from NarraFlow to `electron/backend/supabase/functions/`
- [x] Created `.env` template for edge functions
- [x] Created comprehensive setup guide: `SUPABASE_SETUP.md`

## ⏳ Manual Steps Required

### 1. Create Database Tables

**Option A: Via Supabase Dashboard (Easiest)**
```
1. Open: https://supabase.com/dashboard/project/jijhacdgtccfftlangjq/editor
2. Click "SQL Editor" in left sidebar
3. Copy contents of: electron/backend/supabase/migrations/20251101_create_tables.sql
4. Paste into SQL Editor
5. Click "Run"
6. Verify tables created: licenses, edge_function_logs, contact_submissions
```

**Option B: Via Supabase CLI**
```bash
cd electron/backend/supabase
supabase link --project-ref jijhacdgtccfftlangjq
supabase db push
```

### 2. Get Service Role Key

```
1. Open: https://supabase.com/dashboard/project/jijhacdgtccfftlangjq/settings/api
2. Copy the "service_role" key (under "Project API keys")
3. Save it - you'll need it for secrets
```

### 3. Generate License Keys (Ed25519)

```bash
# Generate private key
openssl genpkey -algorithm ED25519 -out private_key.pem

# Convert to PKCS8 and base64
openssl pkcs8 -topk8 -nocrypt -in private_key.pem -outform DER | base64
# Save output as LICENSE_PRIVATE_KEY

# Generate public key
openssl pkey -in private_key.pem -pubout -outform DER | base64
# Save output as PUBLIC_LICENSE_KEY (for Electron app)

# Clean up
rm private_key.pem
```

### 4. Generate Edge Function Secret

```bash
openssl rand -base64 32
# Save output as EDGE_FUNCTION_SECRET
```

### 5. Set Supabase Secrets

**Via Dashboard:**
```
Go to: https://supabase.com/dashboard/project/jijhacdgtccfftlangjq/settings/vault

Create these secrets:
- SUPABASE_SERVICE_ROLE_KEY = [from step 2]
- EDGE_FUNCTION_SECRET = [from step 4]
- LICENSE_PRIVATE_KEY = [from step 3]
- STRIPE_SECRET_KEY = [get from Stripe dashboard]
- STRIPE_PRICE_ID = [get from Stripe products]
```

**Via CLI:**
```bash
cd electron/backend/supabase

supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_key_here"
supabase secrets set EDGE_FUNCTION_SECRET="your_secret_here"
supabase secrets set LICENSE_PRIVATE_KEY="your_key_here"
supabase secrets set STRIPE_SECRET_KEY="your_stripe_key"
supabase secrets set STRIPE_PRICE_ID="your_price_id"
```

### 6. Deploy Edge Functions

```bash
cd electron/backend/supabase

# Link project (if not done already)
supabase link --project-ref jijhacdgtccfftlangjq

# Deploy all functions
supabase functions deploy

# Verify deployment
supabase functions list
```

### 7. Update Electron App Code

Update `electron/backend/constants.js`:
```javascript
// Find and update these constants:
const SUPABASE_URL = 'https://jijhacdgtccfftlangjq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppamhhY2RndGNjZmZ0bGFuZ2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjE3NTQsImV4cCI6MjA3NzU5Nzc1NH0.tA9O6xtlU0djnQ6t2G82z-2ANjnnmga9aeizcW9ePUA';
const EDGE_FUNCTION_SECRET = 'YOUR_EDGE_FUNCTION_SECRET'; // Same as Supabase secret
const PUBLIC_LICENSE_KEY = 'YOUR_PUBLIC_KEY'; // From step 3
```

### 8. Test Everything

```bash
# Test edge function
curl -X POST 'https://jijhacdgtccfftlangjq.supabase.co/functions/v1/validate_license' \
  -H 'Authorization: YOUR_EDGE_FUNCTION_SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"key":"test","machine_id":"test"}'

# Should get response (might be error, but proves function is working)
```

## 📋 Quick Reference

**Project Details:**
- Project ID: `jijhacdgtccfftlangjq`
- Project URL: `https://jijhacdgtccfftlangjq.supabase.co`
- Dashboard: `https://supabase.com/dashboard/project/jijhacdgtccfftlangjq`

**Files Updated:**
- `website/.env.local`
- `electron/backend/.env`
- `electron/backend/supabase/config.toml`

**Files Created:**
- `electron/backend/supabase/migrations/20251101_create_tables.sql`
- `electron/backend/supabase/.env` (template)
- `SUPABASE_SETUP.md` (detailed guide)
- `SETUP_CHECKLIST.md` (this file)

**Edge Functions Copied:**
- `validate_license`
- `create_stripe_trial`
- `assign_license_to_machine`
- `revoke_license_from_machine`
- `activate_license`
- `create_payment_session`
- `create_stripe_user`
- `get_latest_release`
- `delete_user`

## 🔒 Security Reminders

- ⚠️ Never commit `.env` files with real secrets
- ⚠️ Never commit private keys to git
- ⚠️ Keep service role key secure (has admin access)
- ⚠️ Store all secrets in Supabase Vault, not in code
- ⚠️ Update `.gitignore` to exclude sensitive files

## 📚 Resources

- Full Setup Guide: `SUPABASE_SETUP.md`
- Database Schema Docs: `MikeDetectsTables.md`
- Migration TODO: `TODO.md`
- SQL Migration: `electron/backend/supabase/migrations/20251101_create_tables.sql`

---

**Next Steps After Setup:**
1. Test license validation flow
2. Set up Stripe webhooks
3. Configure Google OAuth (per TODO.md)
4. Test complete user flow from website to app
