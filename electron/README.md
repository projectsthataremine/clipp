# Clipp Electron App

## Development vs Production Edge Functions

The app can call either **development** or **production** edge functions depending on the `CLIPP_USE_DEV` environment variable.

### How It Works

- **Default (Production)**: App calls production edge functions (no suffix)
  - `stripe-webhook`, `create-checkout-session`, `validate_license`, etc.
  - Uses `STRIPE_SECRET_KEY_PROD`, `LICENSE_PRIVATE_KEY_PROD` from Supabase

- **Development Mode**: App calls dev edge functions (`-dev` suffix)
  - `stripe-webhook-dev`, `create-checkout-session-dev`, `validate_license-dev`, etc.
  - Uses `STRIPE_SECRET_KEY_DEV`, `LICENSE_PRIVATE_KEY_DEV` from Supabase

### Setting the Environment

#### Option 1: Environment Variable (Recommended)
```bash
# Set before running the app
export CLIPP_USE_DEV=true
npm start
```

Or on Windows:
```bash
set CLIPP_USE_DEV=true
npm start
```

#### Option 2: Hardcode for Testing
Edit `electron/backend/ipc.js` line 12:
```javascript
const USE_DEV_FUNCTIONS = process.env.CLIPP_USE_DEV === 'true' || true; // Change to true
```

Then build the app normally. It will call dev functions even when packaged.

**Remember to set it back to `false` before releasing!**

### Testing Production Build Locally with Test Stripe

1. Set environment variable:
   ```bash
   export CLIPP_USE_DEV=true
   ```

2. Build the app:
   ```bash
   npm run build
   ```

3. Install and run the built app normally

4. App will use dev edge functions with test Stripe keys (no real charges)

### Before Release

**IMPORTANT:** Make sure `CLIPP_USE_DEV` is **not set** (or explicitly `false`) when building for release:

```bash
# Unset the variable
unset CLIPP_USE_DEV

# Or explicitly set to false
export CLIPP_USE_DEV=false

# Then build
npm run build
```

### Affected Files

The following files read the `USE_DEV_FUNCTIONS` flag:
- `electron/backend/ipc.js` - Stripe checkout, customer portal
- `electron/backend/auth-handler.js` - License activation/revocation, trial creation

### Edge Functions Called

| Function Purpose | Production | Development |
|-----------------|------------|-------------|
| Stripe Webhook | `stripe-webhook` | `stripe-webhook-dev` |
| Create Checkout | `create-checkout-session` | `create-checkout-session-dev` |
| Customer Portal | `create-customer-portal` | `create-customer-portal-dev` |
| Create Trial | `create_stripe_trial` | `create_stripe_trial-dev` |
| Assign License | `assign_license_to_machine` | `assign_license_to_machine-dev` |
| Revoke License | `revoke_license_from_machine` | `revoke_license_from_machine-dev` |
| Validate License | `validate_license` | `validate_license-dev` |
