# Payment and Licensing Integration Guide

This document describes the complete payment and licensing system implemented in this application. It covers Stripe integration, Supabase edge functions, and machine-locked license validation with cryptographic signatures.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Stripe Integration](#stripe-integration)
4. [License Key System](#license-key-system)
5. [Supabase Edge Functions](#supabase-edge-functions)
6. [Client-Side Implementation (Electron)](#client-side-implementation-electron)
7. [Database Schema](#database-schema)
8. [Security Measures](#security-measures)
9. [Implementation Steps](#implementation-steps)
10. [Code Examples](#code-examples)

---

## System Overview

This application implements a **subscription-based payment system** using Stripe combined with a **machine-locked license validation system**. The license keys are cryptographically signed using Ed25519 signatures and bound to specific machines using their hardware ID.

### Key Features

- Stripe customer creation and subscription management
- License keys tied to machine IDs (using `node-machine-id`)
- Ed25519 cryptographic signatures for license validation
- Offline license validation with periodic online checks
- Supabase edge functions for secure server-side operations

---

## Architecture

### Data Flow

```
┌─────────────┐
│   Website   │  (User purchases subscription)
│  (Next.js)  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Stripe API     │  (Checkout session)
└──────┬──────────┘
       │
       ▼
┌───────────────────────────────────────┐
│  Supabase Edge Functions              │
│  • create_stripe_user                 │
│  • create_payment_session             │
│  • activate_license                   │
│  • validate_license                   │
└──────┬────────────────────────────────┘
       │
       ▼
┌─────────────────┐
│  Supabase DB    │  (licenses table)
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Electron App   │  (License validation)
│  (Client)       │
└─────────────────┘
```

### Components

1. **Website (Next.js)** - Handles user signup and payment UI
2. **Stripe** - Payment processing and subscription management
3. **Supabase Edge Functions** - Server-side business logic
4. **Supabase Database** - Stores licenses and user data
5. **Electron App** - Validates licenses locally and remotely

---

## Stripe Integration

### Dependencies

```json
{
  "@stripe/stripe-js": "^7.2.0",
  "stripe": "^18.1.0"
}
```

### 1. Create Stripe Customer

**Edge Function:** `create_stripe_user/index.ts`

```typescript
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

// Check if user exists in Stripe
const userExists = async (userEmail) => {
  const response = await stripe.customers.search({
    query: `email:'${userEmail}'`,
  });

  if (response.data.length > 0) {
    return { exists: true, id: response.data[0].id };
  }

  return { exists: false };
};

// Create customer if doesn't exist, otherwise return existing
Deno.serve(async (req) => {
  const supabaseClient = createClient(req);
  const { email } = await req.json();

  const { data: { user } } = await supabaseClient.auth.getUser();

  let customer = await userExists(email);

  if (!customer.exists) {
    customer = await stripe.customers.create({ email });
  }

  // Store Stripe customer ID in user metadata
  await supabaseClient.auth.updateUser({
    data: { stripe_customer_id: customer.id },
  });

  return new Response(JSON.stringify({ stripeCustomerId: customer.id }));
});
```

### 2. Create Payment Session

**Edge Function:** `create_payment_session/index.ts`

```typescript
const session = await stripe.checkout.sessions.create({
  customer: stripeCustomerId,
  line_items: [
    {
      price: "price_1OaJIgDOHn5DqTwQ9FdCVSIB", // Your Stripe price ID
      quantity: 1,
    },
  ],
  mode: "subscription",
  success_url: `${SITE_URL}/pricing/success`,
  cancel_url: `${SITE_URL}/pricing/cancel`,
});
```

### Payment Flow

1. User clicks "Subscribe" on website
2. System checks if user has Stripe customer ID
3. If not, calls `create_stripe_user` edge function
4. Calls `create_payment_session` to create Stripe checkout
5. Redirects user to Stripe checkout page
6. After successful payment, Stripe webhook triggers license creation
7. User receives license key

---

## License Key System

### Machine ID Binding

The system uses the `node-machine-id` package to generate a unique, persistent hardware ID for each machine. This ensures:

- License keys only work on the machine they're activated on
- Users can't share licenses across multiple devices
- Machine ID persists across app reinstalls

```javascript
const { machineIdSync } = require("node-machine-id");
const machineId = machineIdSync(); // e.g., "9c0f7c5e8a4d3b2c1a0f9e8d7c6b5a4"
```

### Ed25519 Cryptographic Signatures

The system uses **Ed25519** digital signatures to ensure license authenticity:

- **Private Key** (server-only): Signs license payloads
- **Public Key** (embedded in app): Verifies signatures

#### Key Generation

```javascript
// Generate Ed25519 key pair (one-time setup)
const { subtle } = require("crypto").webcrypto;

async function generateKeys() {
  const keyPair = await subtle.generateKey(
    "Ed25519",
    true,
    ["sign", "verify"]
  );

  const privateKey = await subtle.exportKey("pkcs8", keyPair.privateKey);
  const publicKey = await subtle.exportKey("spki", keyPair.publicKey);

  const privateKeyBase64 = Buffer.from(privateKey).toString("base64");
  const publicKeyBase64 = Buffer.from(publicKey).toString("base64");

  console.log("Private Key (store in .env):", privateKeyBase64);
  console.log("Public Key (embed in app):", publicKeyBase64);
}
```

#### Signature Verification Flow

```
┌──────────────────┐
│  Server          │
│  Signs payload   │
│  with private    │
│  key             │
└────────┬─────────┘
         │
         ▼
    { payload + signature }
         │
         ▼
┌──────────────────┐
│  Client          │
│  Verifies        │
│  signature with  │
│  public key      │
└──────────────────┘
```

---

## Supabase Edge Functions

All edge functions are Deno-based and deployed to Supabase.

### 1. activate_license

**Purpose:** Create a new license entry in the database

**Location:** `electron/backend/supabase/functions/activate_license/index.ts`

```typescript
Deno.serve(async (req: Request) => {
  const { key, user_id, expires_at } = await req.json();

  await supabaseClient.from("licenses").insert({
    key,
    user_id,
    expires_at: expires_at ? new Date(expires_at).toISOString() : null,
    machine_id: null, // Will be set on first activation
    created_at: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ success: true }));
});
```

**Authentication:** Uses `EDGE_FUNCTION_SECRET` header

### 2. validate_license

**Purpose:** Validate license key and bind to machine ID

**Location:** `electron/backend/supabase/functions/validate_license/index.ts`

**Key Logic:**

```typescript
// 1. Fetch license from database
const { data: license } = await supabaseClient
  .from("licenses")
  .select("*")
  .eq("key", key)
  .maybeSingle();

// 2. If machine_id is null, this is first activation - bind it
if (!license.machine_id) {
  await supabaseClient
    .from("licenses")
    .update({ machine_id })
    .eq("key", key);

  // Sign the license payload
  const licensePayload = {
    license_key: license.key,
    machine_id,
    expires_at: license.expires_at,
  };

  const signature = await signLicensePayload(licensePayload);

  return new Response(JSON.stringify({
    valid: true,
    payload: licensePayload,
    signature,
  }));
}

// 3. If machine_id is already set, verify it matches
if (license.machine_id !== machine_id) {
  return new Response(JSON.stringify({ valid: false }));
}

return new Response(JSON.stringify({ valid: true }));
```

**Ed25519 Signing Function:**

```typescript
async function signLicensePayload(payload) {
  const LICENSE_PRIVATE_KEY = Deno.env.get("LICENSE_PRIVATE_KEY") ?? "";

  const privateKeyBytes = Uint8Array.from(atob(LICENSE_PRIVATE_KEY), (c) =>
    c.charCodeAt(0)
  );

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes.buffer,
    { name: "Ed25519" },
    false,
    ["sign"]
  );

  const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign("Ed25519", cryptoKey, encodedPayload);

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
```

### 3. create_stripe_user

See [Stripe Integration](#stripe-integration) section above.

### 4. create_payment_session

See [Stripe Integration](#stripe-integration) section above.

---

## Client-Side Implementation (Electron)

### Key Files

1. `electron/backend/AppStore.js` - License validation logic
2. `electron/backend/ipc.js` - IPC handlers for license submission
3. `electron/backend/main.js` - App initialization with machine ID
4. `electron/backend/constants.js` - Public key and secrets

### AppStore.js - Core License Validation

```javascript
const { machineIdSync } = require("node-machine-id");
const { subtle } = require("crypto").webcrypto;
const path = require("path");
const fs = require("fs");

class AppStore {
  constructor() {
    this.isLicenseValid = false;
    this.validateLicense(); // Validate on startup
  }

  async validateLicense() {
    try {
      const licensePath = path.join(__dirname, "license.json");
      const data = JSON.parse(fs.readFileSync(licensePath, "utf-8"));

      const { license_key, machine_id, expires_at, signature } = data;

      // 1. Check machine ID matches
      const currentMachineId = machineIdSync();
      if (currentMachineId !== machine_id) {
        this.updateLicenseStatus(false);
        return;
      }

      // 2. Check expiration
      const now = new Date();
      const expiresAt = new Date(expires_at);
      if (now >= expiresAt) {
        this.updateLicenseStatus(false);
        return;
      }

      // 3. Verify cryptographic signature
      const payload = { license_key, machine_id, expires_at };
      const signatureValid = await this.verifySignature(payload, signature);

      if (!signatureValid) {
        this.updateLicenseStatus(false);
        return;
      }

      // 4. Ping server for validation
      const { valid } = await this.pingValidateLicense({
        license_key,
        machine_id,
      });

      if (!valid) {
        this.updateLicenseStatus(false);
        return;
      }

      console.log("✅ License is valid.");
      this.updateLicenseStatus(true);
      this.startLicenseValidationTimer(); // Re-validate every 5 hours
    } catch (error) {
      console.error("License validation failed:", error);
      this.updateLicenseStatus(false);
    }
  }

  async verifySignature(payload, signatureBase64) {
    const PUBLIC_LICENSE_KEY = "MCowBQYDK2VwAyEAjy7TatpOOgdFPoRJcB39id2+f8AoPyFe/SPUz47T3kQ=";

    const publicKeyBytes = Uint8Array.from(Buffer.from(PUBLIC_LICENSE_KEY, "base64"));

    const cryptoKey = await subtle.importKey(
      "spki",
      publicKeyBytes.buffer,
      { name: "Ed25519" },
      false,
      ["verify"]
    );

    const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));
    const signatureBytes = Uint8Array.from(Buffer.from(signatureBase64, "base64"));

    return await subtle.verify("Ed25519", cryptoKey, signatureBytes, encodedPayload);
  }

  async pingValidateLicense({ license_key, machine_id, return_signed_license = false }) {
    try {
      const response = await fetch(
        "https://gmzwsqjmqakjijnnfxbf.supabase.co/functions/v1/validate_license",
        {
          method: "POST",
          headers: {
            Authorization: EDGE_FUNCTION_SECRET,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ key: +license_key, machine_id, return_signed_license }),
        }
      );

      return await response.json(); // { valid: true/false, payload?, signature? }
    } catch (err) {
      // Fallback to local validation if network fails
      console.error("Network validation failed, falling back to local license:", err);
      return { valid: true };
    }
  }

  async addLicenseKey(license_key) {
    const { valid, payload, signature } = await this.pingValidateLicense({
      license_key,
      machine_id: machineIdSync(),
      return_signed_license: true,
    });

    if (!valid) {
      throw new Error("Invalid license key.");
    }

    // Save license locally
    const licensePath = path.join(__dirname, "license.json");
    fs.writeFileSync(
      licensePath,
      JSON.stringify({ ...payload, signature }, null, 2),
      "utf-8"
    );

    await this.validateLicense();
  }
}

module.exports = new AppStore();
```

### IPC Handlers

```javascript
// electron/backend/ipc.js
ipcMain.handle("get-license-valid", () => {
  return appStore.getLicenseValid();
});

ipcMain.handle("submit-license-key", async (event, licenseKey) => {
  try {
    return await appStore.addLicenseKey(licenseKey);
  } catch (error) {
    return { success: false, message: error?.message };
  }
});
```

### License Storage Format

**File:** `electron/backend/license.json`

```json
{
  "license_key": "12345",
  "machine_id": "9c0f7c5e8a4d3b2c1a0f9e8d7c6b5a4",
  "expires_at": "2025-12-31T23:59:59.000Z",
  "signature": "hY8fG3kL2mN9pQ5rS8tV1wX4zB6cD..."
}
```

---

## Database Schema

### licenses Table

```sql
CREATE TABLE licenses (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  machine_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_licenses_key ON licenses(key);
CREATE INDEX idx_licenses_machine_id ON licenses(machine_id);
```

**Fields:**

- `id` - Auto-incrementing primary key
- `key` - License key (unique)
- `user_id` - Reference to Supabase auth user
- `machine_id` - Bound machine ID (null until first activation)
- `expires_at` - License expiration date
- `created_at` - License creation timestamp

---

## Security Measures

### 1. Machine ID Binding

- License keys are permanently bound to the first machine that activates them
- Uses hardware-based ID that persists across app reinstalls
- Prevents license sharing across multiple devices

### 2. Ed25519 Cryptographic Signatures

- Server signs license payloads with private key
- Client verifies signatures with public key (embedded in app)
- Ensures licenses can't be forged or tampered with
- Ed25519 is fast, secure, and widely supported

### 3. Multi-Layer Validation

```
1. Machine ID Check (local)
   ↓
2. Expiration Check (local)
   ↓
3. Signature Verification (local, cryptographic)
   ↓
4. Server Validation (remote, with fallback)
   ↓
5. Periodic Re-validation (every 5 hours)
```

### 4. Edge Function Authentication

All edge functions use secret header authentication:

```typescript
const authHeader = req.headers.get("Authorization");
const secret = Deno.env.get("EDGE_FUNCTION_SECRET");

if (secret && authHeader !== secret) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
  });
}
```

### 5. Offline License Support

If network validation fails, the app falls back to local validation:

- Checks machine ID
- Verifies expiration date
- Validates cryptographic signature

This ensures the app works offline while maintaining security.

---

## Implementation Steps

### Step 1: Set Up Stripe

1. Create a Stripe account
2. Create a product and subscription price
3. Note down the price ID (e.g., `price_1OaJIgDOHn5DqTwQ9FdCVSIB`)
4. Add Stripe secret key to environment variables

### Step 2: Generate Ed25519 Key Pair

```javascript
const { subtle } = require("crypto").webcrypto;

async function generateKeys() {
  const keyPair = await subtle.generateKey("Ed25519", true, ["sign", "verify"]);

  const privateKey = await subtle.exportKey("pkcs8", keyPair.privateKey);
  const publicKey = await subtle.exportKey("spki", keyPair.publicKey);

  const privateKeyBase64 = Buffer.from(privateKey).toString("base64");
  const publicKeyBase64 = Buffer.from(publicKey).toString("base64");

  console.log("Private Key:", privateKeyBase64);
  console.log("Public Key:", publicKeyBase64);
}

generateKeys();
```

Store:
- **Private key** in Supabase edge function secrets
- **Public key** in your Electron app constants

### Step 3: Create Database Tables

```sql
CREATE TABLE licenses (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  machine_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_licenses_key ON licenses(key);
CREATE INDEX idx_licenses_machine_id ON licenses(machine_id);
```

### Step 4: Deploy Supabase Edge Functions

```bash
cd electron/backend/supabase
supabase functions deploy activate_license
supabase functions deploy validate_license
supabase functions deploy create_stripe_user
supabase functions deploy create_payment_session
```

Set environment variables:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set LICENSE_PRIVATE_KEY=MC4CAQ...
supabase secrets set EDGE_FUNCTION_SECRET=e3b7f7a2-...
```

### Step 5: Install Electron Dependencies

```bash
npm install node-machine-id @supabase/supabase-js
```

### Step 6: Implement AppStore License Validation

Copy the `AppStore.js` implementation (see above).

### Step 7: Add IPC Handlers

Add license-related IPC handlers to communicate between renderer and main process.

### Step 8: Create License Activation UI

Create a form in your Electron app where users can:
1. Enter their license key
2. Submit to activate
3. See validation status

### Step 9: Test the Flow

1. Create a test license in database
2. Activate it in your app
3. Verify machine ID binding
4. Test signature verification
5. Test offline mode
6. Test license expiration

---

## Code Examples

### Frontend: Submit License Key (Renderer Process)

```javascript
// In your React/renderer code
async function submitLicense(licenseKey) {
  const result = await window.electron.ipcRenderer.invoke(
    "submit-license-key",
    licenseKey
  );

  if (result.success) {
    console.log("License activated successfully!");
  } else {
    console.error("License activation failed:", result.message);
  }
}
```

### Frontend: Check License Status

```javascript
async function checkLicenseStatus() {
  const isValid = await window.electron.ipcRenderer.invoke("get-license-valid");

  if (!isValid) {
    // Show license activation screen
  }
}
```

### Backend: Stripe Webhook Handler (Next.js API Route)

```typescript
// pages/api/webhooks/stripe.ts
import Stripe from "stripe";
import { buffer } from "micro";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"]!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful checkout
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Generate license key
    const licenseKey = generateLicenseKey();

    // Create license in database via edge function
    await fetch("https://your-project.supabase.co/functions/v1/activate_license", {
      method: "POST",
      headers: {
        Authorization: process.env.EDGE_FUNCTION_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: licenseKey,
        user_id: session.metadata.user_id,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      }),
    });

    // Email license key to user
    await sendLicenseEmail(session.customer_email, licenseKey);
  }

  res.json({ received: true });
}
```

---

## Environment Variables

### Supabase Edge Functions

```bash
STRIPE_SECRET_KEY=sk_live_...
LICENSE_PRIVATE_KEY=MC4CAQAwBQYDK2VwBCIEIOlkUwzLe4jG...
EDGE_FUNCTION_SECRET=e3b7f7a2-49e2-41e2-bb99-5f6e2f4294d3
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SITE_URL=https://yourwebsite.com
```

### Electron App

```bash
# .env in electron/backend/
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### Constants (Electron)

```javascript
// electron/backend/constants.js
const EDGE_FUNCTION_SECRET = "e3b7f7a2-49e2-41e2-bb99-5f6e2f4294d3";
const PUBLIC_LICENSE_KEY = "MCowBQYDK2VwAyEAjy7TatpOOgdFPoRJcB39id2+f8AoPyFe/SPUz47T3kQ=";

module.exports = {
  EDGE_FUNCTION_SECRET,
  PUBLIC_LICENSE_KEY,
};
```

---

## Summary

This system provides:

- Secure payment processing via Stripe
- Machine-locked license validation
- Cryptographic signature verification (Ed25519)
- Multi-layer security checks
- Offline support with fallback validation
- Periodic license re-validation

The pattern is highly portable and can be adapted to any Electron or desktop application requiring license management.
