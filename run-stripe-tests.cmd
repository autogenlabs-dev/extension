@echo off
REM Windows batch script to run Stripe integration tests

echo Checking TypeScript compilation with test config...
call npx tsc -p tsconfig.test.json --noEmit --skipLibCheck

echo Running Stripe integration tests...
set USE_TEST_TSCONFIG=true
call npx jest src/__tests__/subscription/StripeIntegration.test.ts --detectOpenHandles --forceExit
