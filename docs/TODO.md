# Clipp Pre-Launch TODO

## Epic 1: Website & Marketing

### 1.1 Marketing Site Review
- [x] Review homepage content and design
- [x] Verify pricing page shows correct price
- [x] Test all links work correctly
- [x] Test contact form (if applicable)
- [x] Test CTA buttons (download, subscribe, etc.)
- [x] Verify responsive design on mobile
- [x] Check SEO metadata (title, description, og tags)

### 1.2 Download & Onboarding
- [ ] Test download flow from website
- [x] Verify download links work for all platforms
- [ ] Test installation instructions clarity
- [ ] Review first-time user onboarding experience

## Epic 2: App Build & Distribution Testing

- [ ] Build production version of Electron app
- [ ] Test app download process
- [ ] Test app installation on macOS
- [ ] Verify app launches correctly

## Epic 3: Authentication Testing

### 3.1 Google OAuth
- [x] Test signup with Google account
- [x] Test login with Google account

### 3.2 Email/Password Login
- [x] Test signup with email/password
- [x] Test login with email/password

### 3.3 Auth Edge Cases
- [x] Test switching between accounts
- [x] Test session persistence across app restarts
- [x] Test handling expired sessions
- [x] Test auth error handling

## Epic 4: Stripe Checkout & Payment Testing

- [x] Test local Checkout Flow
- [ ] Test Dev Checkout Flow
- [ ] Test Production Checkout Flow

## Epic 5: App Update System Testing

### 5.1 Database Setup
- [ ] Verify `config` table exists with RLS policy
- [ ] Verify `minimum_app_version` row exists
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
- [ ] Update `minimum_app_version` in `config` table to new version
- [ ] Release new version (e.g., v1.1.0)
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
