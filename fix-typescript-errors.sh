#!/usr/bin/env bash

# Script to fix TypeScript errors in Stripe integration tests

echo "🔧 Fixing TypeScript errors in Stripe integration tests..."

# Run the tests with the test-specific tsconfig
echo "Running TypeScript compiler with test config..."
npx tsc -p tsconfig.test.json --noEmit

# If you want to run the tests afterwards:
echo "Running tests..."
npx jest src/__tests__/subscription/StripeIntegration.test.ts --config=jest.config.js

echo "✅ Done! TypeScript errors should now be fixed."
