#!/usr/bin/env bash
# ============================================================
# GolfDraw — Automated Setup Script
# Creates all folders and files from scratch
# ============================================================
set -e

PROJECT="golf-lottery-app"

echo "🚀 Creating GolfDraw project..."
mkdir -p "$PROJECT"
cd "$PROJECT"

# Create directory structure
mkdir -p \
  "app/(auth)/login" \
  "app/(auth)/signup" \
  "app/(dashboard)/dashboard" \
  "app/(dashboard)/scores" \
  "app/(dashboard)/draws" \
  "app/(dashboard)/charity" \
  "app/(dashboard)/winnings" \
  "app/(dashboard)/subscription" \
  "app/admin/users" \
  "app/admin/draws" \
  "app/admin/charities" \
  "app/admin/winners" \
  "app/api/auth/callback" \
  "app/api/stripe/checkout" \
  "app/api/stripe/webhook" \
  "app/api/draws/run" \
  "lib/supabase" \
  "components/ui" \
  "components/dashboard" \
  "components/admin" \
  "types" \
  "public"

echo "✅ Directory structure created"
echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env.local and fill in your values"
echo "  2. Run the schema.sql in your Supabase SQL Editor"
echo "  3. npm run dev"
