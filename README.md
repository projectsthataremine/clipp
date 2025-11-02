# Clipp - macOS Clipboard History Manager

A professional macOS clipboard history manager with a dual-component architecture consisting of an Electron desktop app and a Next.js marketing website.

## Project Overview

**Clipp** is a native clipboard manager that monitors and stores clipboard history, providing users with quick access to previously copied content including text, images, files, and audio.

---

## Architecture

### 1. Electron Desktop App

A native macOS application that provides clipboard history functionality.

**Core Features:**
- Monitors clipboard every second for text, images, files, and audio
- Stores up to 25 items with favorites support for permanent storage
- Uses native Swift binaries for image capture (ARM64 & x64)
- Global hotkeys and system tray integration
- Cryptographic licensing with Ed25519 signatures
- Auto-updates via GitHub Releases
- SHA-1 hashing for duplicate detection
- Multi-file clipboard support

**Key Files:**
- `electron/backend/main.js` - App entry point and lifecycle management
- `electron/backend/clipboard.js` - Clipboard monitoring logic
- `electron/backend/ClipboardHistoryStore.js` - Data persistence and storage
- `electron/backend/AppStore.js` - License validation & app state management
- `electron/backend/ipc.js` - IPC communication handlers
- `electron/backend/tray.js` - System tray integration
- `electron/backend/hotkeys.js` - Global keyboard shortcuts
- `electron/backend/supabaseClient.js` - Supabase integration
- `electron/frontend/src/` - React renderer process UI

**Native Components:**
- `electron/backend/native/get_clipboard_image.arm64` - ARM64 image capture binary
- `electron/backend/native/get_clipboard_image.x64` - Intel x64 image capture binary
- `electron/scripts/get_clipboard_image.swift` - Swift source for image capture

### 2. Next.js Marketing Website

Modern web presence for promoting and distributing the desktop app.

**Core Features:**
- Marketing pages (homepage, download, how-it-works, updates)
- Authentication system (Supabase Auth)
- Stripe payment integration for licensing
- Protected user dashboard and account management
- Dark/light theme support
- Animated UI with Framer Motion

**Key Directories:**
- `website/src/app/(marketing)/` - Public marketing pages
- `website/src/app/(auth-pages)/` - Sign-in/sign-up flows
- `website/src/app/(protected)/` - Protected user account pages
- `website/src/components/` - Reusable UI components
- `website/src/utils/` - Utility functions (Supabase, Stripe)

### 3. Backend Services

**Supabase Edge Functions:**
- `electron/backend/supabase/functions/activate_license/` - License activation
- `electron/backend/supabase/functions/validate_license/` - License validation
- `electron/backend/supabase/functions/create_stripe_user/` - Stripe user creation
- `electron/backend/supabase/functions/create_payment_session/` - Payment sessions
- `electron/backend/supabase/functions/get_latest_release/` - Release information

---

## Tech Stack

### Desktop App
- **Electron 35.0.1** - Desktop application framework
- **React 18.3.1** - Frontend UI (renderer process)
- **Vite 6.0.5** - Build tool and dev server
- **Radix UI** - Component library
- **Node.js native modules** - robotjs, clipboardy, node-machine-id
- **Swift** - Native binary for clipboard image capture
- **Supabase** - Backend as a service
- **electron-builder** - Build and packaging
- **electron-updater** - Auto-update system

### Website
- **Next.js 15.3.1** - React framework (App Router)
- **React 19.0.0** - Frontend library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4.1.10** - Utility-first CSS
- **PostCSS** - CSS processing
- **Framer Motion** - Animation library
- **Stripe** - Payment processing
- **Supabase** - Authentication and data management
- **next-themes** - Theme management

---

## Project Structure

```
/
├── electron/                      # Desktop application
│   ├── backend/                   # Electron main process
│   │   ├── main.js               # App entry point
│   │   ├── clipboard.js          # Clipboard monitoring
│   │   ├── ClipboardHistoryStore.js  # Data persistence
│   │   ├── AppStore.js           # App state & license validation
│   │   ├── ipc.js                # IPC handlers
│   │   ├── preload.js            # Security preload script
│   │   ├── tray.js               # System tray
│   │   ├── hotkeys.js            # Global shortcuts
│   │   ├── setupWindow.js        # Window configuration
│   │   ├── supabaseClient.js     # Supabase client
│   │   ├── constants.js          # App constants
│   │   ├── native/               # Native Swift binaries
│   │   └── supabase/functions/   # Edge functions
│   ├── frontend/                 # React renderer process
│   │   ├── src/
│   │   │   ├── App.jsx
│   │   │   └── components/
│   │   ├── dist/                 # Built frontend
│   │   └── vite.config.js
│   ├── scripts/                  # Build scripts
│   ├── build/icons/              # App icons
│   ├── dist/                     # Built packages
│   └── electron-builder.config.js
│
├── website/                      # Marketing website
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   │   ├── (marketing)/     # Public pages
│   │   │   ├── (auth-pages)/    # Auth routes
│   │   │   └── (protected)/     # Protected routes
│   │   ├── components/          # UI components
│   │   └── utils/               # Utilities
│   ├── public/                  # Static assets
│   └── next.config.ts
│
├── assets/                       # Shared assets
├── test-files/                   # Test files for clipboard
├── APP_PACKAGING_AND_UPDATES.md  # Packaging documentation
└── PAYMENT_AND_LICENSING_INTEGRATION.md  # License docs
```

---

## Development Setup

### Desktop App Development

**Prerequisites:**
- Node.js and npm
- Xcode (for Swift compilation on macOS)

**Commands:**
```bash
cd electron
npm install
npm start              # Run dev server + electron
npm run build          # Build both ARM64 and x64
npm run publish        # Build and publish to GitHub
```

**Development Mode:**
- Frontend runs on Vite dev server (localhost:4000)
- Custom user data path for dev isolation
- Hot module reloading enabled

### Website Development

**Prerequisites:**
- Node.js and npm/yarn

**Commands:**
```bash
cd website
npm install
npm run dev            # Start development server (port 3000)
npm run build          # Production build
npm run lint           # Lint code
```

---

## Architecture Highlights

### Desktop App Patterns

1. **Singleton Pattern** - ClipboardHistoryStore and AppStore are singletons
2. **IPC Communication** - Secure renderer-main process communication via contextBridge
3. **Multi-Architecture Support** - Separate builds for ARM64 and Intel Macs
4. **Native Binary Integration** - Swift binaries for clipboard access with fallback
5. **Content-Based Deduplication** - SHA-1 hashing prevents duplicate entries
6. **Layered Security** - Multiple validation layers for license checking
7. **Offline-First** - Local license validation with periodic server checks
8. **File Organization** - Clipboard files stored in app-specific storage with unique IDs
9. **Automatic Cleanup** - Removes file storage for items that age out
10. **State Management** - Centralized AppStore manages app-wide state

### Website Patterns

1. **App Router** - Next.js 15 App Router with route groups
2. **Server Components** - Leverages RSC for performance
3. **Route Groups** - Organized by purpose: (marketing), (auth-pages), (protected)
4. **Server Actions** - TypeScript server actions for mutations
5. **Modern CSS** - Tailwind CSS 4.x with PostCSS
6. **Animation** - Framer Motion for smooth UI transitions
7. **Type Safety** - Full TypeScript implementation
8. **Theme Support** - Dark/light mode via next-themes

### Backend Architecture

1. **Serverless Functions** - Supabase Edge Functions (Deno-based)
2. **BaaS Pattern** - Backend-as-a-Service via Supabase
3. **Cryptographic Security** - Ed25519 for license signatures
4. **Environment Separation** - Dev vs. production configs

---

## Key Features

### Clipboard Management
- Real-time clipboard monitoring (1-second intervals)
- Support for multiple content types: text, images, files, audio
- SHA-1 hashing for duplicate detection
- Favorites system for permanent storage
- Maximum 25 non-favorite items stored
- Automatic file storage cleanup

### License System
- Machine-locked licensing with Ed25519 cryptographic signatures
- Offline validation with periodic online verification
- Stripe payment integration
- License activation and validation via Supabase Edge Functions

### Auto-Updates
- GitHub Releases integration
- Silent background downloads
- Update checks every 30 minutes
- User notifications for available updates

### User Interface
- Global keyboard shortcuts
- System tray integration
- Dark/light theme support (website)
- Animated interactions (Framer Motion)
- Responsive design

---

## Deployment

### Desktop App
- **Platform:** macOS (ARM64 and x64)
- **Distribution:** GitHub Releases
- **Code Signing:** Supports Apple Developer certificates
- **Auto-Updates:** electron-updater with GitHub Releases

### Website
- **Platform:** Vercel (recommended for Next.js)
- **Edge Functions:** Supabase cloud
- **CDN:** Vercel Edge Network
- **Database:** Supabase PostgreSQL

---

## Documentation

- `APP_PACKAGING_AND_UPDATES.md` - Detailed guide for building and distributing the app
- `PAYMENT_AND_LICENSING_INTEGRATION.md` - License system implementation details

---

## Security Considerations

- **License Validation:** Ed25519 cryptographic signatures prevent tampering
- **IPC Security:** contextBridge isolates renderer process
- **Environment Variables:** Sensitive keys stored in environment variables
- **Supabase RLS:** Row-level security for database access
- **HTTPS:** All network communication encrypted

---

## Payment & Integration Workflow Pattern

**IMPORTANT:** The payment integration, license management, and machine assignment workflow follows the **exact same pattern as NarraFlow** (located at `/Users/joshuaarnold/Dev/NarraFlow`). While the UI can be different, the underlying plumbing must be identical.

### NarraFlow Pattern Reference

#### License Management Flow:
1. **User Authentication** - Google OAuth via Supabase Auth
2. **License Fetching** - `GET_LICENSES` IPC call retrieves all licenses for authenticated user
3. **Machine Assignment** - Licenses can be activated on specific machines via `ACTIVATE_LICENSE`
4. **License States**:
   - `pending` - Trial license (with `expires_at`)
   - `active` - Active subscription (with `renews_at`)
   - Not assigned - License exists but not activated on any machine

#### Account Page Components:
1. **User Profile Display**:
   - User avatar (from `user_metadata.avatar_url`)
   - Email address
   - Provider (Google)

2. **License List** - Shows all licenses with:
   - License key (formatted, monospaced)
   - Machine name (editable inline with pencil icon on hover)
   - Status badge (Trial/Active)
   - Billing information (next billing date, price)
   - Action buttons based on state:
     - **"Use on this machine"** - If not activated (`!license.metadata?.machine_id`)
     - **"Revoke from this machine"** - If activated on current machine (`isActiveOnThisMachine`)
     - **"Cancel subscription"** - Opens website account page for cancellation

3. **IPC Handlers Required**:
   - `GET_MACHINE_ID` - Returns current machine identifier
   - `GET_LICENSES` - Fetches all licenses for user
   - `ACTIVATE_LICENSE` - Assigns license to current machine
   - `REVOKE_LICENSE` - Removes license from current machine
   - `RENAME_MACHINE` - Updates machine display name
   - `START_OAUTH` - Initiates Google OAuth flow
   - `SIGN_OUT` - Signs out user
   - `DELETE_ACCOUNT` - Deletes user account

4. **State Management**:
   - Track current machine ID on component mount
   - Compare `license.metadata.machine_id` with `currentMachineId` to determine activation state
   - Reload licenses after any mutation (activate, revoke, rename)
   - Loading states for async operations (activatingLicense, revokingLicense, etc.)

5. **Subscription Status Detection**:
   - Based on first license in array
   - Active subscription: `license.status === 'active' && license.renews_at`
   - Trial: `license.status === 'pending' && license.expires_at`
   - Calculate days remaining for trial: `Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))`

#### Key Implementation Details:
- **Machine ID Comparison**: Use exact string comparison between license metadata and current machine
- **Inline Editing**: Machine names editable on hover with save-on-blur pattern
- **Confirmation Dialogs**: Use native `confirm()` for destructive actions (revoke, delete)
- **Error Handling**: Display error messages to user via `alert()` with details
- **Button States**: Disable buttons during async operations, show loading text
- **Account Management**: Cancellation redirects to website with `?openAccount=true` param

---

## Notes

- The application focuses on simplicity - clipboard history without excessive features
- Multi-architecture binaries ensure compatibility across all modern Macs
- Offline-first approach ensures the app works without internet connectivity
- Clean separation between desktop and web codebases for maintainability
- **Payment and license management follows NarraFlow pattern exactly** - see section above
