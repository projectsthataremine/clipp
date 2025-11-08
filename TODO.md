# Clipp Pre-Launch TODO

## Epic 1: Website & Marketing

### 1.1 Marketing Site Review
- [ ] Review homepage content and design
- [ ] Verify pricing page shows correct price
- [ ] Test all links work correctly
- [ ] Test contact form (if applicable)
- [ ] Test CTA buttons (download, subscribe, etc.)
- [ ] Verify responsive design on mobile
- [ ] Check SEO metadata (title, description, og tags)

### 1.2 Download & Onboarding
- [ ] Test download flow from website
- [ ] Verify download links work for all platforms
- [ ] Test installation instructions clarity
- [ ] Review first-time user onboarding experience

## Epic 2: App Build & Distribution Testing

- [ ] Build production version of Electron app
- [ ] Test app download process
- [ ] Test app installation on macOS
- [ ] Verify app launches correctly

## Epic 3: Authentication Testing

### 3.1 Google OAuth
- [ ] Test signup with Google account
- [ ] Test login with Google account

### 3.2 Email/Password Login
- [ ] Test signup with email/password
- [ ] Test login with email/password

### 3.3 Auth Edge Cases
- [ ] Test switching between accounts
- [ ] Test session persistence across app restarts
- [ ] Test handling expired sessions
- [ ] Test auth error handling

## Epic 4: Stripe Checkout & Payment Testing

### 4.1 Test Sandbox Checkout Flow
- [ ] Deploy sandbox edge functions
- [ ] Test creating checkout session (sandbox)
- [ ] Complete test purchase with Stripe test card
- [ ] Verify webhook fires and is received
- [ ] Verify license is created in database
- [ ] Test license activation flow
- [ ] Test license validation
- [ ] Confirm entire sandbox flow works end-to-end

### 4.2 Test Prod Dev Checkout Flow
- [ ] Deploy prod-dev edge functions
- [ ] Test creating checkout session (prod-dev)
- [ ] Complete real purchase with real credit card ($1)
- [ ] Verify production webhook fires
- [ ] Verify license is created in production database
- [ ] Test license activation in prod-dev
- [ ] Test license validation in prod-dev
- [ ] Confirm entire prod-dev flow works end-to-end

### 4.3 Test Production Checkout Flow
- [ ] Test creating checkout session (production)
- [ ] Complete real purchase with real credit card ($5)
- [ ] Verify production webhook fires
- [ ] Verify license is created in production database
- [ ] Test license activation in production app
- [ ] Test license validation in production app
- [ ] Confirm entire production flow works end-to-end

## Epic 5: App Update System Testing

### 5.1 Database Setup
- [ ] Verify `app_config` table exists with RLS policy
- [ ] Verify `minimum_app_version` column exists
- [ ] Insert/update initial config with current version

### 5.2 Normal Update Flow
- [ ] Release initial version (e.g., v1.0.0)
- [ ] Verify version displays correctly in app
- [ ] Verify version displays correctly on website
- [ ] Release new version (e.g., v1.0.1)
- [ ] Verify "Update Available" notification appears in app
- [ ] Test update download and installation
- [ ] Verify app updates successfully

### 5.3 Breaking Change / Urgent Update Flow
- [ ] Release new version (e.g., v1.1.0)
- [ ] Update `minimum_app_version` in `app_config` table to new version
- [ ] Open old version of app
- [ ] Verify "Update Required" screen appears
- [ ] Verify screen blocks all app functionality
- [ ] Verify download link/button works
- [ ] Test updating to required version
- [ ] Verify app works after update

## Epic 6: App Functionality Testing

### 6.1 Clipboard Operations
- [ ] Test copying/pasting text
- [ ] Test copying/pasting single image
- [ ] Test copying/pasting multiple images
- [ ] Test copying/pasting video
- [ ] Test copying/pasting files
- [ ] Verify all clipboard types display correctly in app
- [ ] Verify clipboard history saves correctly
- [ ] Verify clipboard items can be re-copied

### 6.2 Pinning Functionality
- [ ] Test pinning a clipboard item
- [ ] Verify pinned items appear in pinned section
- [ ] Test unpinning a clipboard item
- [ ] Verify unpinned items return to normal history
- [ ] Test pinning multiple items
- [ ] Verify pinned items persist across app restarts
