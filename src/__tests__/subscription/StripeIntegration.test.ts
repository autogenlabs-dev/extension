import * as vscode from 'vscode';
import { BackendService } from '../../services/auth/BackendService';
import { SubscriptionService } from '../../services/subscription/SubscriptionService';
import { SecureStorage } from '../../utils/SecureStorage';
import axios from 'axios';

// Mock vscode module
jest.mock('vscode', () => ({
  window: {
    createWebviewPanel: jest.fn(() => ({
      webview: {
        html: '',
        onDidReceiveMessage: jest.fn(),
        postMessage: jest.fn(),
      },
      onDidDispose: jest.fn(),
      reveal: jest.fn(),
      dispose: jest.fn(),
    })),
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    withProgress: jest.fn((options, task) => task()),
    createStatusBarItem: jest.fn(() => ({
      show: jest.fn(),
      hide: jest.fn(),
      dispose: jest.fn(),
      command: '',
      text: '',
      tooltip: '',
    })),
  }, workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn((key: string, defaultValue: unknown) => {
        const config: Record<string, string | boolean> = {
          'payment.currency': 'USD',
          'payment.savePaymentMethod': false,
          'payment.enablePromotionCodes': true,
          'payment.useInAppCheckout': true,
          'subscription.showStatus': true,
          'subscription.billingPortalUrl': 'https://billing.stripe.com/p/login/autogen'
        };
        return key in config ? config[key as keyof typeof config] : defaultValue;
      })
    })),
  },
  env: {
    openExternal: jest.fn(),
  },
  Uri: {
    parse: jest.fn(url => url),
  },
  StatusBarAlignment: {
    Right: 1,
  },
  ViewColumn: {
    One: 1,
  },
  ProgressLocation: {
    Notification: 1,
  },
}));

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    defaults: { baseURL: '', headers: {} },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock secure storage
jest.mock('../../utils/SecureStorage');

describe('Stripe Payment Integration', () => {
  let secureStorage: SecureStorage;
  let backendService: BackendService;
  let subscriptionService: SubscriptionService;  // Create a properly typed mock HTTP client for Axios
  const mockHttpClient = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: { baseURL: 'https://api.example.com', headers: {} },
  } as unknown as ReturnType<typeof axios.create>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock secure storage
    secureStorage = new SecureStorage({} as vscode.ExtensionContext);
    (SecureStorage as jest.Mocked<any>).getInstance = jest.fn(() => secureStorage);

    // Setup mock http client
    (axios.create as jest.Mock).mockReturnValue(mockHttpClient);

    // Create services
    backendService = new BackendService(secureStorage);
    subscriptionService = new SubscriptionService(backendService);
  });

  describe('Subscription Plans', () => {
    it('should retrieve subscription plans', async () => {
      // Mock backend response
      const mockPlans = [
        {
          id: 'cd80d975-1727-4c85-a1eb-cbb2998fd32d',
          name: 'free',
          display_name: 'Free Plan',
          monthly_tokens: 10000,
          price_monthly: 0.0,
          features: null,
          is_active: true
        },
        {
          id: '5b2bea87-5bfa-4b07-aa1f-dc0490e8ab7b',
          name: 'pro',
          display_name: 'Pro Plan',
          monthly_tokens: 100000,
          price_monthly: 29.99,
          features: null,
          is_active: true
        }
      ];

      mockHttpClient.get.mockResolvedValue({ data: mockPlans });

      // Call the method
      await subscriptionService.showSubscriptionPlans();
      // Verify API call was made
      expect(mockHttpClient.get).toHaveBeenCalledWith('/subscriptions/plans');
      expect(vscode.window.withProgress).toHaveBeenCalled();
    });
  });

  describe('Checkout Session', () => {
    it('should create a checkout session for a paid plan', async () => {
      // Mock plan data
      const plan = {
        id: 'premium',
        name: 'Premium',
        price: 20
      };

      // Mock checkout session response
      const mockCheckoutSession = {
        checkout_url: 'https://checkout.stripe.com/pay/cs_test_123',
        client_secret: 'pi_123_secret_456',
        session_id: 'cs_test_123'
      };

      mockHttpClient.post.mockResolvedValue({ data: mockCheckoutSession });

      // Call the method
      await subscriptionService.subscribeToPlan(plan);      // Verify API call was made
      expect(mockHttpClient.post).toHaveBeenCalledWith('/subscriptions/subscribe', {
        plan_name: 'Premium',
        setup_future_usage: 'off_session',
        payment_method_types: ['card']
      });

      // Verify webview would be created for paid plan with client secret
      expect(vscode.window.createWebviewPanel).toHaveBeenCalled();
    });

    it('should handle free plan subscription without payment UI', async () => {
      // Mock plan data
      const plan = {
        id: 'free',
        name: 'Free Tier',
        price: 0
      };

      // Mock subscription response
      const mockResponse = {
        success: true
      };

      mockHttpClient.post.mockResolvedValue({ data: mockResponse });

      // Call the method
      await subscriptionService.subscribeToPlan(plan);      // Verify API call was made
      expect(mockHttpClient.post).toHaveBeenCalledWith('/subscriptions/subscribe', {
        plan_name: 'Free Tier',
        setup_future_usage: 'off_session',
        payment_method_types: ['card']
      });

      // Verify success message was shown
      expect(vscode.window.showInformationMessage).toHaveBeenCalled();

      // Verify NO webview was created for free plan
      expect(vscode.window.createWebviewPanel).not.toHaveBeenCalled();
    });
  });

  describe('Billing Portal', () => {
    it('should open the billing portal for subscription management', async () => {
      // Mock portal session response
      const mockPortalSession = {
        portal_url: 'https://billing.stripe.com/session/bps_123',
        return_url: 'vscode://AutoGenCodeBuilder.auto-gen-code-builder/billing-return'
      };

      mockHttpClient.post.mockResolvedValue({ data: mockPortalSession });

      // Call the method
      await subscriptionService.manageBilling();
      // Verify API call was made
      expect(mockHttpClient.post).toHaveBeenCalledWith('/subscriptions/billing-portal');

      // Verify portal URL was opened in browser
      expect(vscode.env.openExternal).toHaveBeenCalledWith('https://billing.stripe.com/session/bps_123');
    });
  });  // Custom error interface for API errors with complete properties
  interface ApiErrorWithResponse extends Error {
    response?: {
      data?: {
        detail?: string;
        message?: string;
        error?: string;
      };
      status?: number;
      statusText?: string;
    };
  }
  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock error response with enhanced error properties
      const mockError = new Error('Payment failed') as ApiErrorWithResponse;
      mockError.response = {
        data: {
          detail: 'Invalid payment method',
          message: 'Payment verification failed'
        },
        status: 400,
        statusText: 'Bad Request'
      };
      mockHttpClient.post.mockRejectedValue(mockError);

      // Mock plan data with proper typing
      const plan: { id: string; name: string; price: number } = {
        id: 'premium',
        name: 'Premium',
        price: 20
      };

      // Call the method - should not throw
      await subscriptionService.subscribeToPlan(plan);

      // Verify error message was shown
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Invalid payment method')
      );
    });
  });

  describe('Webhook Handling', () => {
    it('should process subscription update webhook events', async () => {
      // Import WebhookHandler directly in the test to avoid mocking issues
      const { WebhookHandler } = require('../../services/subscription/WebhookHandler');
      const webhookHandler = new WebhookHandler(subscriptionService);

      // Mock subscription object in event
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            status: 'active',
            plan: {
              nickname: 'Premium'
            }
          }
        }
      };

      // Mock the getSubscriptionInfo method
      const getSubscriptionInfoSpy = jest.spyOn(subscriptionService, 'getSubscriptionInfo');
      getSubscriptionInfoSpy.mockResolvedValue({});

      // Process the webhook event
      await webhookHandler.processWebhookEvent(mockEvent);

      // Verify subscription info was refreshed
      expect(getSubscriptionInfoSpy).toHaveBeenCalledWith(true);

      // Verify notification was shown
      expect(vscode.window.showInformationMessage).toHaveBeenCalled();
    });
  });
});
