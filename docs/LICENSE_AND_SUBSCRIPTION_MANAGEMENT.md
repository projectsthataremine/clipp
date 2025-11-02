# License and Subscription Management

**Last Updated:** 2025-11-02
**Project:** Clipp
**Based on:** NarraFlow Payment & Licensing Integration

---

## 📋 Overview

This document explains how licenses and subscription renewals/cancellations work in Clipp, particularly focusing on the `expires_at` and `renews_at` logic.

---

## 🔑 Key Database Fields

### licenses Table Schema

```sql
CREATE TABLE licenses (
  id BIGSERIAL PRIMARY KEY,

  -- License identification
  key TEXT NOT NULL UNIQUE,

  -- Stripe integration
  stripe_session_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_subscription_status TEXT,

  -- User tracking
  user_id UUID REFERENCES auth.users(id),
  customer_email TEXT NOT NULL,

  -- Machine binding
  machine_id TEXT,
  machine_name TEXT,
  machine_os TEXT,

  -- License lifecycle
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'canceled', 'revoked', 'expired')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,     -- Only set when subscription is canceled
  renews_at TIMESTAMPTZ,       -- Set from Stripe current_period_end
  activated_at TIMESTAMPTZ,    -- When user first activated
  canceled_at TIMESTAMPTZ,     -- When subscription was canceled
  last_validated_at TIMESTAMPTZ
);
```

---

## 🎯 Important Field Distinctions

### `expires_at` vs `renews_at`

| Field | Purpose | When Set | Example |
|-------|---------|----------|---------|
| `expires_at` | Final expiration date when subscription is canceled | Only when `status='canceled'` | User cancels on Nov 1, but paid until Nov 30 → `expires_at = Nov 30` |
| `renews_at` | Next billing/renewal date for active subscriptions | Set from Stripe's `current_period_end` | Active subscription renews monthly → `renews_at = Dec 1` |

**Key Concept:**
- **Active subscription:** `expires_at = null`, `renews_at = <next billing date>`
- **Canceled subscription:** `expires_at = <end of paid period>`, `renews_at = null`

---

## 📊 License Status Lifecycle

```
pending → active → canceled → expired
   ↓        ↓         ↓
   └────────┴─────────┴──→ revoked (admin action)
```

### Status Definitions

1. **`pending`** - License created but not yet activated on a machine
2. **`active`** - License activated and subscription is active
3. **`canceled`** - User canceled but still has access until `expires_at`
4. **`expired`** - The `expires_at` date has passed
5. **`revoked`** - Manually revoked by admin (chargeback, fraud, etc.)

---

## 🔄 Subscription Webhook Logic

### 1. New Subscription (`checkout.session.completed`)

```typescript
// When user successfully pays
{
  key: "<uuid>",
  customer_email: "user@example.com",
  expires_at: null,                    // ✅ Not canceled yet
  renews_at: "<current_period_end>",   // ✅ Next billing date
  stripe_subscription_id: "sub_xxx",
  status: 'pending'                    // ✅ Not activated on machine yet
}
```

**Logic:**
- `expires_at` is `null` because subscription is active
- `renews_at` is set from Stripe's `subscription.current_period_end`
- Status starts as `pending` until user activates in the app

---

### 2. User Cancels Mid-Period (`customer.subscription.updated` or `customer.subscription.deleted`)

When a user cancels their subscription, Stripe sets `subscription.cancel_at` to the end of the current billing period.

**Example Timeline:**
- User pays for November on Nov 1
- User cancels on Nov 15
- Stripe sets `cancel_at = Nov 30 23:59:59` (end of paid period)
- License should work until Nov 30, then expire

**Webhook Logic:**

```typescript
// Determine if should cancel
const shouldCancel =
  subscription.status === 'canceled' ||
  subscription.status === 'unpaid' ||
  subscription.cancel_at !== null;

if (shouldCancel) {
  // Calculate expiration date
  const expirationDate = subscription.cancel_at
    ? new Date(subscription.cancel_at * 1000).toISOString()
    : subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

  // Update license
  await supabase
    .from('licenses')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      expires_at: expirationDate,        // ✅ Set expiration
      renews_at: null,                   // ✅ Clear renewal (no longer renewing)
      stripe_subscription_status: subscription.status
    })
    .eq('stripe_customer_id', subscription.customer);
}
```

**Result in Database:**
```json
{
  "status": "canceled",
  "canceled_at": "2025-11-15T10:30:00Z",
  "expires_at": "2025-11-30T23:59:59Z",  // ✅ Can use until this date
  "renews_at": null,                     // ✅ Won't renew
  "stripe_subscription_status": "canceled"
}
```

---

### 3. User Reactivates Subscription (`customer.subscription.updated`)

When a user reactivates (e.g., via Stripe Customer Portal), Stripe clears `cancel_at`.

**Webhook Logic:**

```typescript
// Detect reactivation
const isCurrentlyCanceled = currentLicense?.status === 'canceled';
const shouldCancel = /* ... check cancel_at, status ... */;
const shouldReactivate = isCurrentlyCanceled && !shouldCancel;

if (shouldReactivate) {
  // Determine status based on whether it was activated on a machine
  const hasBeenActivated = currentLicense?.machine_id !== null;
  const newStatus = hasBeenActivated ? 'active' : 'pending';

  await supabase
    .from('licenses')
    .update({
      status: newStatus,
      expires_at: null,                              // ✅ Clear expiration
      canceled_at: null,                             // ✅ Clear cancel timestamp
      renews_at: new Date(subscription.current_period_end * 1000).toISOString(),
      stripe_subscription_status: subscription.status
    })
    .eq('stripe_customer_id', subscription.customer);
}
```

**Result in Database:**
```json
{
  "status": "active",
  "canceled_at": null,
  "expires_at": null,                    // ✅ No longer expiring
  "renews_at": "2025-12-01T00:00:00Z",   // ✅ Back to renewing
  "stripe_subscription_status": "active"
}
```

---

## 🖥️ How to Display on Account Page

### Current Implementation Issues

The current account page needs updating to properly show:
1. **Active subscriptions:** Show "Renews on {renews_at}"
2. **Canceled subscriptions:** Show "Expires on {expires_at}"

### Correct Display Logic

```typescript
{license.status === 'canceled' && license.expires_at ? (
  <RadixUI.Flex align="center" gap="2">
    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    <RadixUI.Text size="2" color="gray">
      Expires {new Date(license.expires_at).toLocaleDateString()}
    </RadixUI.Text>
  </RadixUI.Flex>
) : license.renews_at ? (
  <RadixUI.Flex align="center" gap="2">
    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
    <RadixUI.Text size="2" color="gray">
      Renews {new Date(license.renews_at).toLocaleDateString()}
    </RadixUI.Text>
  </RadixUI.Flex>
) : (
  <span></span>
)}
```

---

## 📝 Database Migration

Ensure your `licenses` table has these fields:

```sql
-- Add missing fields if they don't exist
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS renews_at TIMESTAMPTZ;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS machine_os TEXT;

-- Update expires_at to be nullable (only set when canceled)
ALTER TABLE licenses ALTER COLUMN expires_at DROP NOT NULL;
```

---

## ✅ Summary Checklist

When implementing license/subscription management:

- [ ] **`expires_at`** - Only set when `status='canceled'` (end of paid period)
- [ ] **`renews_at`** - Set from `subscription.current_period_end` for active subscriptions
- [ ] **`canceled_at`** - Timestamp when user canceled (not when access ends)
- [ ] **Handle Cancellation** - Set `expires_at`, clear `renews_at`, set `status='canceled'`
- [ ] **Handle Reactivation** - Clear `expires_at`, set `renews_at`, restore `status`
- [ ] **Display Logic** - Show "Expires" for canceled, "Renews" for active
- [ ] **Webhook Idempotency** - Use `stripe_session_id` and `stripe_subscription_id` to prevent duplicates

---

## 🔗 References

- **Full NarraFlow Documentation:** `/Users/joshuaarnold/Dev/NarraFlow/docs/PAYMENT_AND_LICENSING_INTEGRATION.md`
- **Webhook Implementation:** `/Users/joshuaarnold/Dev/NarraFlow/marketing-site/app/api/webhooks/stripe/route.ts`
- **Stripe Webhook Events:** https://stripe.com/docs/api/events/types

---

## 🚨 Common Pitfalls

1. **Don't set `expires_at` on active subscriptions** - It should be `null`
2. **Don't confuse `canceled_at` with `expires_at`** - User cancels on Nov 15, but expires on Nov 30
3. **Always check `cancel_at` not just `status`** - Stripe can have status='active' with future `cancel_at`
4. **Update `renews_at` on every webhook** - Stripe can change billing dates
5. **Handle reactivation** - Clear `expires_at` when user resubscribes

---

