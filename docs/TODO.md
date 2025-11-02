# Clipp Authentication Migration TODO

## Context
Migrating from machine ID-based licensing to Google OAuth authentication (similar to NarraFlow implementation).

**Goals:**
- User logs in with Google OAuth
- License validated via Supabase database
- Single machine binding (one machine at a time)
- No in-app license management UI (just "Manage Account" button → opens website)
- Support 7-day trial periods
- Initial splash/login screen (blocks app until authenticated)

## Supabase Credentials
- Project ID: `nfrnpxdlbxfwtyjhpfce`
- Supabase URL: `https://nfrnpxdlbxfwtyjhpfce.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcm5weGRsYnhmd3R5amhwZmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTg0OTgsImV4cCI6MjA3NzU5NDQ5OH0.PKC_2xDum9t_QR3ef97qoh-zbI_4jQDXF_M8tuoJFyo`
- Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcm5weGRsYnhmd3R5amhwZmNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjAxODQ5OCwiZXhwIjoyMDc3NTk0NDk4fQ.GNnWIJNVR6tMEMbsYTMbKMsZCbuaur7vBvOifOJY6Tw`

---

## Phase 1: Database Setup (Supabase)

### Task 1.1: Create `licenses` Table
Based on NarraFlow schema (`/Users/joshuaarnold/Dev/NarraFlow/docs/PAYMENT_AND_LICENSING_INTEGRATION.md`)

```sql
CREATE TABLE licenses (
  id BIGSERIAL PRIMARY KEY,

  -- License key (UUID format)
  key TEXT NOT NULL UNIQUE,

  -- Payment tracking
  stripe_session_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  -- User tracking
  user_id UUID REFERENCES auth.users(id),
  customer_email TEXT NOT NULL,

  -- License binding (single machine)
  machine_id TEXT,
  machine_name TEXT,

  -- License lifecycle
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'revoked', 'expired')),
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,

  -- Timestamps
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  renews_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_licenses_key ON licenses(key);
CREATE INDEX idx_licenses_user_id ON licenses(user_id);
CREATE INDEX idx_licenses_machine_id ON licenses(machine_id);
CREATE INDEX idx_licenses_stripe_customer_id ON licenses(stripe_customer_id);
CREATE INDEX idx_licenses_stripe_subscription_id ON licenses(stripe_subscription_id);
```

### Task 1.2: Set Up Row Level Security (RLS)
```sql
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Users can only read their own licenses
CREATE POLICY "Users can read own licenses"
  ON licenses FOR SELECT
  USING (auth.uid() = user_id);
```

### Task 1.3: Verify Supabase MCP Connection
- Ensure MCP tools can connect to Supabase
- Test database queries

---

## Phase 2: Deploy Supabase Edge Functions

Copy these edge functions from NarraFlow (`/Users/joshuaarnold/Dev/NarraFlow/supabase/functions/`):

### Task 2.1: `create_stripe_trial`
- Creates 7-day trial license on first Google OAuth login
- Auto-generates license key
- Sets `expires_at` to 7 days from now

### Task 2.2: `validate_license`
- Validates license status, expiration, machine binding
- Returns whether license is valid for current machine

### Task 2.3: `assign_license_to_machine`
- Binds license to machine ID (first activation or after revoke)
- Updates `machine_id`, `machine_name`, `activated_at`

### Task 2.4: Set Edge Function Environment Variables
```bash
SUPABASE_URL=https://nfrnpxdlbxfwtyjhpfce.supabase.co
SUPABASE_SECRET_KEY=<service_role_key>
EDGE_FUNCTION_SECRET=<generate_new_secret>
STRIPE_SECRET_KEY=<from_stripe>
```

---

## Phase 3: Backend Implementation (Electron Main Process)

### Task 3.1: Install Dependencies
```bash
cd electron
npm install @supabase/supabase-js
# node-machine-id already installed
```

### Task 3.2: Create `electron/backend/supabase-client.js`
- Custom `ElectronStorage` class for session persistence
- Session saved to: `~/Library/Application Support/Clipp/supabase-session.json`
- Supabase client with `persistSession: true`, `autoRefreshToken: true`

Reference: `/Users/joshuaarnold/Dev/NarraFlow/src/main/supabase-client.ts`

### Task 3.3: Create `electron/backend/auth-handler.js`
IPC handlers:
- `START_OAUTH` - Start Google OAuth flow (opens browser, local HTTP server on port 54321)
- `GET_AUTH_STATUS` - Return current user session
- `SIGN_OUT` - Sign out user
- `GET_MACHINE_ID` - Return current machine ID
- `VALIDATE_LICENSE` - Check if user has valid license for this machine

Reference: `/Users/joshuaarnold/Dev/NarraFlow/src/main/auth-handler.ts`

### Task 3.4: Update `electron/backend/AppStore.js`
**REPLACE** current Ed25519 validation with:
- Check Supabase session exists
- Call `validate_license` edge function
- Verify license status, expiration, machine binding
- **REMOVE** all Ed25519 signature code
- **REMOVE** local `license.json` file handling

### Task 3.5: Update `electron/backend/main.js`
- Import and initialize auth handlers: `initAuthHandlers(mainWindow)`
- On app startup, check auth status
- If not authenticated, show login screen
- If authenticated, validate license before starting clipboard polling

### Task 3.6: Update `electron/backend/preload.js`
Expose new IPC methods:
```javascript
{
  startOAuth: () => ipcRenderer.invoke('START_OAUTH'),
  getAuthStatus: () => ipcRenderer.invoke('GET_AUTH_STATUS'),
  signOut: () => ipcRenderer.invoke('SIGN_OUT'),
  validateLicense: () => ipcRenderer.invoke('VALIDATE_LICENSE')
}
```

### Task 3.7: Update `electron/backend/constants.js`
```javascript
// REMOVE old constants
// - PUBLIC_LICENSE_KEY (Ed25519)
// - Old edge function URLs

// ADD new constants
const SUPABASE_URL = 'https://nfrnpxdlbxfwtyjhpfce.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const EDGE_FUNCTION_SECRET = '<from_supabase_secrets>';
```

---

## Phase 4: Frontend Implementation (Electron Renderer)

### Task 4.1: Create Login/Splash Screen Component
- Shows on app launch if not authenticated
- "Sign in with Google" button
- Calls `window.electron.startOAuth()`
- Handles OAuth callback

Reference: `/Users/joshuaarnold/Dev/NarraFlow/src/settings/settings.tsx` (AccountSection)

### Task 4.2: Add License Status Check
After login:
- Call `window.electron.validateLicense()`
- If valid → show main app
- If invalid/expired → show message: "Your trial/subscription has expired. Manage your account to continue."
- "Manage Account" button → opens website in browser

### Task 4.3: Add "Manage Account" Button
- In tray menu or settings icon (bottom right)
- Opens `https://yourwebsite.com/account` in default browser
- Uses `shell.openExternal()`

### Task 4.4: Remove Old License UI
- Remove manual license key input components
- Remove activation success/failure messages

---

## Phase 5: OAuth Flow Implementation

### Task 5.1: Implement Local HTTP Server (Port 54321)
In `auth-handler.js`:
```javascript
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:54321');
  const accessToken = url.searchParams.get('access_token');
  const refreshToken = url.searchParams.get('refresh_token');

  // Set Supabase session
  await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });

  // Create 7-day trial if first login
  // (call edge function)

  // Close server
  server.close();

  // Notify renderer
  mainWindow.webContents.send('AUTH_SUCCESS');
});
```

Reference: `/Users/joshuaarnold/Dev/NarraFlow/src/main/auth-handler.ts` (lines ~100-200)

### Task 5.2: Configure Google OAuth
- Set up Google OAuth credentials in Google Cloud Console
- Configure redirect URI: `http://localhost:54321`
- Add OAuth provider to Supabase Auth settings

---

## Phase 6: Cleanup & Migration

### Task 6.1: Remove Old Licensing Code
Files to clean up:
- `electron/backend/AppStore.js` - Remove Ed25519 functions (`verifySignature`, etc.)
- Remove `electron/backend/license.json` (if exists)
- Remove old `addLicenseKey()` method
- Remove old `pingValidateLicense()` that uses Ed25519

### Task 6.2: Update Documentation
- Update `PAYMENT_AND_LICENSING_INTEGRATION.md` with new flow
- Document Google OAuth setup process
- Document migration from old system

### Task 6.3: Test Complete Flow
1. Fresh install → Login with Google
2. Verify 7-day trial created
3. Test app after trial expires
4. Test subscription purchase on website
5. Test "Manage Account" button
6. Test logout/login on same machine
7. Test login on different machine (should fail if already bound)

---

## Reference Files from NarraFlow
- `/Users/joshuaarnold/Dev/NarraFlow/src/main/auth-handler.ts`
- `/Users/joshuaarnold/Dev/NarraFlow/src/main/supabase-client.ts`
- `/Users/joshuaarnold/Dev/NarraFlow/src/main/AppStore.ts`
- `/Users/joshuaarnold/Dev/NarraFlow/src/settings/settings.tsx`
- `/Users/joshuaarnold/Dev/NarraFlow/supabase/functions/`
- `/Users/joshuaarnold/Dev/NarraFlow/docs/PAYMENT_AND_LICENSING_INTEGRATION.md`

---

## Notes
- Keep `node-machine-id` for single machine binding
- Session persistence ensures user stays logged in across app restarts
- All license management happens on website, not in app
- Simple UI: Login screen → Main app (or "Subscribe" message)
