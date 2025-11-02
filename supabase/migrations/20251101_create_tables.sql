-- Create custom types
CREATE TYPE license_status AS ENUM ('pending', 'active', 'canceled', 'expired');

-- ============================================================================
-- Table: licenses
-- Purpose: Main licensing table for managing user licenses and Stripe subscriptions
-- ============================================================================
CREATE TABLE licenses (
  id BIGSERIAL PRIMARY KEY,

  -- License key (UUID format)
  key TEXT NOT NULL UNIQUE,

  -- Stripe integration
  stripe_session_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_subscription_status TEXT,

  -- User tracking
  user_id UUID REFERENCES auth.users(id),
  customer_email TEXT NOT NULL,

  -- Machine binding (single machine at a time)
  machine_id TEXT,
  machine_name TEXT,

  -- License lifecycle
  status license_status NOT NULL DEFAULT 'active',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  renews_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,

  -- Additional metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes for licenses table
CREATE INDEX idx_licenses_key ON licenses(key);
CREATE INDEX idx_licenses_user_id ON licenses(user_id);
CREATE INDEX idx_licenses_machine_id ON licenses(machine_id);
CREATE INDEX idx_licenses_stripe_customer_id ON licenses(stripe_customer_id);
CREATE INDEX idx_licenses_stripe_subscription_id ON licenses(stripe_subscription_id);
CREATE INDEX idx_licenses_status ON licenses(status);

-- Enable RLS on licenses
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own licenses
CREATE POLICY "Users can view their own licenses"
  ON licenses FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- Table: edge_function_logs
-- Purpose: Logging table for tracking edge function calls, performance, and errors
-- ============================================================================
CREATE TABLE edge_function_logs (
  id BIGSERIAL PRIMARY KEY,

  -- Function metadata
  function_name TEXT NOT NULL,
  event_type TEXT NOT NULL,

  -- Associated data
  license_key TEXT,
  machine_id TEXT,
  stripe_session_id TEXT,

  -- Request/Response data
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,

  -- Client information
  ip_address TEXT,
  user_agent TEXT,

  -- Performance metrics
  duration_ms INTEGER,
  success BOOLEAN NOT NULL,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for edge_function_logs
CREATE INDEX idx_edge_function_logs_function_name ON edge_function_logs(function_name);
CREATE INDEX idx_edge_function_logs_license_key ON edge_function_logs(license_key);
CREATE INDEX idx_edge_function_logs_created_at ON edge_function_logs(created_at);
CREATE INDEX idx_edge_function_logs_success ON edge_function_logs(success);

-- Enable RLS on edge_function_logs
ALTER TABLE edge_function_logs ENABLE ROW LEVEL SECURITY;

-- No RLS policies - table is locked down completely
-- Only accessible via service role or direct database access

-- ============================================================================
-- Table: contact_submissions
-- Purpose: Store user feedback, bug reports, feature requests, and other contact form submissions
-- ============================================================================
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Submission type
  type TEXT NOT NULL CHECK (type IN ('bug', 'testimonial', 'feature', 'feedback', 'help', 'other')),

  -- Message content
  message TEXT NOT NULL,

  -- Additional metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for contact_submissions
CREATE INDEX idx_contact_submissions_type ON contact_submissions(type);
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at);

-- Enable RLS on contact_submissions
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can insert contact submissions
CREATE POLICY "Anyone can insert contact submissions"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Helper function to update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column to licenses
ALTER TABLE licenses ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create trigger to auto-update updated_at on licenses
CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
