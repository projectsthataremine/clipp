#!/bin/bash
# Upload Supabase Edge Function secrets from .env.secrets file
# Usage: ./scripts/upload-secrets.sh

set -e

# Check if .env.secrets exists
if [ ! -f .env.secrets ]; then
  echo "❌ Error: .env.secrets file not found"
  echo "Create a .env.secrets file in the project root with all required secrets."
  echo "See docs/EDGE_FUNCTIONS.md for the required format."
  exit 1
fi

echo "📦 Loading secrets from .env.secrets..."
source .env.secrets

echo "🚀 Uploading secrets to Supabase..."

# Stripe Production
echo "  - STRIPE_SECRET_KEY_PROD"
npx supabase secrets set STRIPE_SECRET_KEY_PROD="$STRIPE_SECRET_KEY_PROD"

echo "  - STRIPE_PRICE_ID_PROD"
npx supabase secrets set STRIPE_PRICE_ID_PROD="$STRIPE_PRICE_ID_PROD"

echo "  - STRIPE_WEBHOOK_SECRET_PROD"
npx supabase secrets set STRIPE_WEBHOOK_SECRET_PROD="$STRIPE_WEBHOOK_SECRET_PROD"

# Stripe Sandbox
echo "  - STRIPE_SECRET_KEY_SANDBOX"
npx supabase secrets set STRIPE_SECRET_KEY_SANDBOX="$STRIPE_SECRET_KEY_SANDBOX"

echo "  - STRIPE_PRICE_ID_SANDBOX"
npx supabase secrets set STRIPE_PRICE_ID_SANDBOX="$STRIPE_PRICE_ID_SANDBOX"

echo "  - STRIPE_WEBHOOK_SECRET_SANDBOX"
npx supabase secrets set STRIPE_WEBHOOK_SECRET_SANDBOX="$STRIPE_WEBHOOK_SECRET_SANDBOX"

# Licensing
echo "  - LICENSE_PRIVATE_KEY"
npx supabase secrets set LICENSE_PRIVATE_KEY="$LICENSE_PRIVATE_KEY"

echo "  - LICENSE_PUBLIC_KEY"
npx supabase secrets set LICENSE_PUBLIC_KEY="$LICENSE_PUBLIC_KEY"

echo "  - EDGE_FUNCTION_SECRET"
npx supabase secrets set EDGE_FUNCTION_SECRET="$EDGE_FUNCTION_SECRET"

echo ""
echo "✅ All secrets uploaded successfully!"
echo ""
echo "Verify with: npx supabase secrets list"
