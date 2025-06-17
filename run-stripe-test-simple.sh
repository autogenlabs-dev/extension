#!/bin/bash
npx jest src/__tests__/subscription/StripeIntegration.test.ts --config jest.config.js --testTimeout=30000 --forceExit
