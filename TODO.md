# Clipp Pre-Launch TODO

## Epic 1: Stripe Checkout & Payment Setup

### 1.1 Stripe Business Account Setup
- [ ] Set up Stripe business account
- [ ] Complete business verification
- [ ] Enable live mode

### 1.2 Stripe Products & Pricing
- [ ] Create main product in Stripe (live mode)
- [ ] Create main price for product (full price)
- [ ] Create test price for product ($1 minimum for testing)
- [ ] Document price IDs for both

### 1.3 Stripe Environment Variables (Production)
- [ ] Add `STRIPE_SECRET_KEY_PROD` (live mode secret key)
- [ ] Add `STRIPE_PRICE_ID_PROD` (use $1 test price initially)
- [ ] Add `STRIPE_WEBHOOK_SECRET_PROD` (live mode webhook secret)
- [ ] Verify all secrets are set in Supabase Dashboard

### 1.4 Stripe Test Environment Setup
- [ ] Create test products in Stripe (test mode)
- [ ] Create test price IDs
- [ ] Add `STRIPE_SECRET_KEY_DEV` (test mode secret key)
- [ ] Add `STRIPE_PRICE_ID_DEV` (test mode price)
- [ ] Add `STRIPE_WEBHOOK_SECRET_DEV` (test mode webhook secret)

### 1.5 Stripe Webhooks
- [ ] Create test webhook in Stripe (test mode) pointing to dev edge function
- [ ] Create production webhook in Stripe (live mode) pointing to prod edge function
- [ ] Verify webhook events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

### 1.6 Test Dev Checkout Flow
- [ ] Deploy dev edge functions
- [ ] Test creating checkout session (dev)
- [ ] Complete test purchase with Stripe test card
- [ ] Verify webhook fires and is received
- [ ] Verify license is created in database
- [ ] Test license activation flow
- [ ] Test license validation
- [ ] Confirm entire dev flow works end-to-end

## Epic 2: App Build & Distribution Testing

### 2.1 Build Testing
- [ ] Build production version of Electron app
- [ ] Test app download process
- [ ] Test app installation on macOS
- [ ] Test app installation on Windows (if applicable)
- [ ] Verify app launches correctly
- [ ] Verify app connects to production backend

### 2.2 Production Checkout Flow Test
- [ ] Update `STRIPE_PRICE_ID_PROD` to $1 test price (if not already)
- [ ] Test creating checkout session (production)
- [ ] Complete real purchase with real credit card ($1)
- [ ] Verify production webhook fires
- [ ] Verify license is created in production database
- [ ] Test license activation in production app
- [ ] Test license validation in production app
- [ ] Confirm entire production flow works end-to-end

### 2.3 Update to Real Pricing
- [ ] Update `STRIPE_PRICE_ID_PROD` to real price (after successful $1 test)
- [ ] Verify checkout shows correct price
- [ ] Document pricing in marketing materials

## Epic 3: App Update System Testing

### 3.1 Database Setup (if not done)
- [ ] Verify `app_config` table exists with RLS policy
- [ ] Verify `minimum_app_version` column exists
- [ ] Insert/update initial config with current version

### 3.2 Normal Update Flow
- [ ] Release initial version (e.g., v1.0.0)
- [ ] Verify version displays correctly in app
- [ ] Verify version displays correctly on website
- [ ] Release new version (e.g., v1.0.1)
- [ ] Verify "Update Available" notification appears in app
- [ ] Test update download and installation
- [ ] Verify app updates successfully

### 3.3 Breaking Change / Urgent Update Flow
- [ ] Release new version (e.g., v1.1.0)
- [ ] Update `minimum_app_version` in `app_config` table to new version
- [ ] Open old version of app
- [ ] Verify "Update Required" screen appears
- [ ] Verify screen blocks all app functionality
- [ ] Verify download link/button works
- [ ] Test updating to required version
- [ ] Verify app works after update

## Epic 4: App Functionality Testing

### 4.1 Clipboard Operations
- [ ] Test copying/pasting text
- [ ] Test copying/pasting single image
- [ ] Test copying/pasting multiple images
- [ ] Test copying/pasting video
- [ ] Test copying/pasting files
- [ ] Verify all clipboard types display correctly in app
- [ ] Verify clipboard history saves correctly
- [ ] Verify clipboard items can be re-copied

### 4.2 Pinning Functionality
- [ ] Test pinning a clipboard item
- [ ] Verify pinned items appear in pinned section
- [ ] Test unpinning a clipboard item
- [ ] Verify unpinned items return to normal history
- [ ] Test pinning multiple items
- [ ] Verify pinned items persist across app restarts

### 4.3 General App Features
- [ ] Test search functionality
- [ ] Test clipboard history scrolling
- [ ] Test clearing clipboard history
- [ ] Test app hotkey/shortcut
- [ ] Test app performance with large clipboard history

## Epic 5: Authentication Testing

### 5.1 Google OAuth Login
- [ ] Test login with Google account
- [ ] Verify user profile loads correctly
- [ ] Verify clipboard syncs after login
- [ ] Test logout with Google account
- [ ] Verify user data clears on logout

### 5.2 Email/Password Login
- [ ] Test signup with email/password
- [ ] Test login with email/password
- [ ] Verify user profile loads correctly
- [ ] Verify clipboard syncs after login
- [ ] Test logout with email/password account
- [ ] Verify user data clears on logout

### 5.3 Auth Edge Cases
- [ ] Test switching between accounts
- [ ] Test session persistence across app restarts
- [ ] Test handling expired sessions
- [ ] Test auth error handling

## Epic 6: Website & Marketing

### 6.1 Marketing Site Review
- [ ] Review homepage content and design
- [ ] Verify pricing page shows correct price
- [ ] Test all links work correctly
- [ ] Test contact form (if applicable)
- [ ] Test CTA buttons (download, subscribe, etc.)
- [ ] Verify responsive design on mobile
- [ ] Check SEO metadata (title, description, og tags)

### 6.2 Download & Onboarding
- [ ] Test download flow from website
- [ ] Verify download links work for all platforms
- [ ] Test installation instructions clarity
- [ ] Review first-time user onboarding experience

## Epic 7: Final Pre-Launch Checklist

- [ ] All edge functions deployed to production
- [ ] All environment variables configured correctly
- [ ] Stripe webhooks configured and tested
- [ ] Production database migrations applied
- [ ] App builds signed and notarized (macOS)
- [ ] Analytics/monitoring set up (if applicable)
- [ ] Support email/contact method set up
- [ ] Terms of Service and Privacy Policy published
- [ ] Refund policy documented
- [ ] Launch announcement prepared
- [ ] Social media accounts ready (if applicable)

---

## Notes

### Completed Items
- [x] Created dev and prod edge function separation
- [x] Created sync script (`sync-dev-to-prod.sh`)
- [x] Created deployment script (`deploy-prod.sh`)
- [x] Documented edge function workflow in `/supabase/README.md`

### Price Testing Strategy
Using a $1 test price in production (live mode) to validate the entire checkout flow before switching to real pricing. This ensures:
- Real Stripe webhooks are tested
- Real license creation is tested
- Real payment processing is tested
- Minimal cost if issues occur (~$0.30 in fees per test)
- High confidence before real launch

### Environment Variable Reference
See `/supabase/README.md` for complete documentation on edge function environment variables.
