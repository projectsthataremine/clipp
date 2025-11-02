# Supabase Database Schema

## Project Information
- **Project URL**: `https://buqkvxtxjwyohzsogfbz.supabase.co`
- **Date Documented**: 2025-11-01

## Tables

### 1. `licenses`
**Purpose**: Main licensing table for managing user licenses and Stripe subscriptions

**Columns**:
- `id` (bigint, primary key) - Auto-incrementing ID
- `key` (text, unique, required) - License key
- `stripe_session_id` (text, unique, nullable) - Stripe checkout session ID
- `stripe_customer_id` (text, nullable) - Stripe customer ID
- `stripe_subscription_id` (text, nullable) - Stripe subscription ID
- `user_id` (uuid, nullable) - Foreign key to auth.users.id
- `customer_email` (text, required) - Customer email address
- `status` (license_status, default: 'active') - License status enum: pending, active, canceled, expired
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `expires_at` (timestamptz, nullable) - License expiration timestamp
- `activated_at` (timestamptz, nullable) - License activation timestamp
- `canceled_at` (timestamptz, nullable) - License cancellation timestamp
- `stripe_subscription_status` (text, nullable) - Stripe subscription status
- `renews_at` (timestamptz, nullable) - Next renewal timestamp
- `metadata` (jsonb, default: '{}') - Additional metadata

**RLS Enabled**: ✓

**RLS Policies**:
- **"Users can view their own licenses"** (SELECT)
  - Roles: public
  - Condition: `auth.uid() = user_id`
  - Users can only view licenses that belong to them

**Foreign Keys**:
- `user_id` → `auth.users.id`

---

### 2. `edge_function_logs`
**Purpose**: Logging table for tracking edge function calls, performance, and errors

**Columns**:
- `id` (bigint, primary key) - Auto-incrementing ID
- `function_name` (text, required) - Name of the edge function
- `event_type` (text, required) - Type of event being logged
- `license_key` (text, nullable) - Associated license key
- `machine_id` (text, nullable) - Machine/device identifier
- `stripe_session_id` (text, nullable) - Associated Stripe session
- `request_data` (jsonb, nullable) - Request payload
- `response_data` (jsonb, nullable) - Response payload
- `error_message` (text, nullable) - Error message if failed
- `ip_address` (text, nullable) - Client IP address
- `user_agent` (text, nullable) - Client user agent
- `duration_ms` (integer, nullable) - Request duration in milliseconds
- `success` (boolean, required) - Whether the request succeeded
- `created_at` (timestamptz, default: now()) - Log entry timestamp

**RLS Enabled**: ✓

**RLS Policies**:
- **No policies** - Table is locked down completely
  - Only accessible via service role or direct database access
  - Intentional for internal logging and audit purposes

---

### 3. `contact_submissions`
**Purpose**: Store user feedback, bug reports, feature requests, and other contact form submissions

**Columns**:
- `id` (uuid, primary key, default: gen_random_uuid()) - Unique identifier
- `type` (text, required) - Submission type (bug, testimonial, feature, feedback, help, other)
- `message` (text, required) - User's message content
- `metadata` (jsonb, default: '{}', nullable) - Additional metadata
- `created_at` (timestamptz, default: now(), nullable) - Submission timestamp

**RLS Enabled**: ✓

**RLS Policies**:
- **"Anyone can insert contact submissions"** (INSERT)
  - Roles: public
  - Condition: `true` (always allowed)
  - Allows anyone (authenticated or not) to submit contact forms

**Check Constraints**:
- `type` must be one of: 'bug', 'testimonial', 'feature', 'feedback', 'help', 'other'

---

## Installed Extensions

### Active Extensions:
- `uuid-ossp` (1.1) - Generate universally unique identifiers (UUIDs)
- `pg_graphql` (1.5.11) - GraphQL support
- `pgcrypto` (1.3) - Cryptographic functions
- `pg_stat_statements` (1.11) - Track SQL statement statistics
- `supabase_vault` (0.3.1) - Supabase Vault for secrets management
- `plpgsql` (1.0) - PL/pgSQL procedural language

### Available Extensions (not installed):
- `vector` (0.8.0) - Vector data type for AI/ML embeddings
- `postgis` (3.3.7) - Geographic data types and functions
- `pg_cron` (1.6.4) - Job scheduler
- `http` (1.6) - HTTP client for external API calls
- And many more...

---

## Security Notes

### Good Practices:
✓ RLS is enabled on all tables
✓ Users can only see their own licenses (privacy preserved)
✓ Contact form is open for public submissions
✓ Logs table is completely locked down (prevents data leakage)

### Access Patterns:
- **`licenses`**: Only SELECT policy exists - INSERT/UPDATE/DELETE must be done via Edge Functions with service role access
- **`edge_function_logs`**: No public access - internal logging only
- **`contact_submissions`**: Public INSERT only - reading requires service role

---

## Integration Points

### Stripe Integration:
The `licenses` table is tightly integrated with Stripe:
- Stores Stripe session, customer, and subscription IDs
- Tracks subscription status and renewal dates
- Links payments to user accounts

### Authentication:
- `licenses.user_id` links to Supabase Auth's `auth.users.id`
- RLS policies use `auth.uid()` for user-specific data access

### Logging:
- Edge functions log their activity to `edge_function_logs`
- Tracks performance metrics, errors, and usage patterns
- Stores request/response data for debugging
