import * as vscode from 'vscode';
import { BackendService } from '../auth/BackendService';
import { PaymentWebviewPanel } from './PaymentWebviewPanel';
import { UsageTrackingDashboard } from './UsageTrackingDashboard';

/**
 * Service for managing subscriptions and payment processing
 */
export class SubscriptionService {
  // Stripe publishable key - in production, this should be fetched from backend
  private stripePublishableKey: string;

  constructor(private backendService: BackendService) {
    this.stripePublishableKey = 'pk_test_51RVi9b00tZAh2watbNFlPjw4jKS02yZbKHQ1t97GcyMTOGLwcL8QhzxDSGtGuuEAJP4DHcEWOkut5N0CCTnuqBgh00p44dvGCb';
  }
  /**
   * Show available subscription plans
   */
  public async showSubscriptionPlans() {
    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Loading subscription plans...",
        cancellable: false
      }, async () => {
        const plans = await this.backendService.getSubscriptionPlans();

        if (!plans || plans.length === 0) {
          vscode.window.showErrorMessage('No subscription plans found.');
          return;
        }

        // Check if we're in development/mock mode
        const isDevelopmentMode = process.env.NODE_ENV === 'development';
        // Format plans for quick pick
        const items = plans.map((plan: any) => ({
          label: plan.display_name || plan.name || plan.id,
          description: `$${plan.price_monthly || plan.price || 0}/month${isDevelopmentMode ? ' (Mock)' : ''}`,
          detail: this.getPlanDetails(plan),
          plan: plan
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select a subscription plan',
          title: `Available Subscription Plans${isDevelopmentMode ? ' (Development Mode)' : ''}`
        });

        if (selected) {
          await this.subscribeToPlan(selected.plan);
        }
      });
    } catch (error) {
      vscode.window.showErrorMessage('Failed to retrieve subscription plans: ' + this.getErrorMessage(error));
    }
  }/**
   * Show current subscription details
   */
  public async showCurrentSubscription() {
    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Loading subscription details...",
        cancellable: false
      }, async () => {
        const subscription = await this.getSubscriptionInfo();

        if (!subscription) {
          // Show error if we couldn't get any subscription data
          vscode.window.showErrorMessage('Unable to retrieve subscription information. Please check your connection and try again.');
          return;
        }

        if (subscription.tier === 'free') {
          // Show options for free users
          const actions = ['View Plans', 'Show Dashboard', 'Close'];
          const choice = await vscode.window.showInformationMessage(
            'You are currently on the free plan.',
            ...actions
          );

          if (choice === 'View Plans') {
            await this.showSubscriptionPlans();
          } else if (choice === 'Show Dashboard') {
            UsageTrackingDashboard.createOrShow(this);
          }
          return;
        }

        // For paid users, show the dashboard by default
        UsageTrackingDashboard.createOrShow(this);
      });
    } catch (error) {
      vscode.window.showErrorMessage('Failed to retrieve current subscription: ' + this.getErrorMessage(error));
    }
  }  /**
   * Subscribe to a specific plan
   */
  public async subscribeToPlan(plan: any): Promise<any> {
    try {
      const result = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Subscribing to ${plan.display_name || plan.name || plan.id} plan...`,
        cancellable: false
      }, async (_progress) => {
        // Handle free plan subscription immediately
        if (plan.name === 'free' || plan.id === 'free' || (plan.price_monthly === 0 && plan.price === 0)) {
          const response = await this.backendService.createCheckoutSession(plan.name || plan.id);
          if (response.success) {
            vscode.window.showInformationMessage(`Successfully subscribed to ${plan.display_name || plan.name || plan.id} plan!`);
          }
          return response;
        }
        // For paid plans, ensure customer payment setup
        const customerReady = await this.ensureCustomerSetup();
        let response;

        if (!customerReady) {
          // Handle new customer payment setup
          response = await this.handlePaymentMethodSetup(plan);
          if (!response) {
            return null; // User cancelled or setup failed
          }
        } else {
          // Use enhanced customer setup
          response = await this.setupCustomerPayment(plan);
        }

        if (response && (response.checkout_url || response.client_secret)) {
          // Check if we should use in-extension payment UI or browser checkout
          const config = vscode.workspace.getConfiguration('auto-gen-code-builder');
          const useInAppCheckout = config.get('payment.useInAppCheckout', true);

          if (useInAppCheckout && response.client_secret) {
            // Show payment form in webview
            PaymentWebviewPanel.createOrShow(
              response.client_secret,
              plan.display_name || plan.name || plan.id,
              `$${plan.price_monthly || plan.price || 0}`,
              this.stripePublishableKey
            );
          } else {
            // Open checkout in browser
            vscode.env.openExternal(vscode.Uri.parse(response.checkout_url));
          }
        } else {
          vscode.window.showWarningMessage(`Unable to start checkout process for ${plan.display_name || plan.name || plan.id} plan.`);
        }

        return response;
      });

      return result;
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);      // Provide specific error handling for common payment issues
      if (errorMessage.includes('no attached payment source') || errorMessage.includes('no payment method attached')) {
        const choice = await vscode.window.showErrorMessage(
          'Payment method setup required. Please ensure you have a valid payment method attached to your account.',
          'Open Billing Portal'
        );
        if (choice === 'Open Billing Portal') {
          this.manageBilling();
        }
      } else {
        vscode.window.showErrorMessage(`Failed to subscribe to ${plan.display_name || plan.name || plan.id} plan: ` + errorMessage);
      }

      // Don't re-throw the error, let the UI handle it gracefully
      return null;
    }
  }
  /**
   * Open the billing portal to manage subscription
   */
  public async manageBilling() {
    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Opening billing portal...",
        cancellable: false
      }, async () => {
        const response = await this.backendService.createBillingPortalSession();
        if (response && response.portal_url) {
          // Check if this is a fallback URL
          if (response.fallback) {
            const choice = await vscode.window.showInformationMessage(
              'Billing portal is not available on the backend. Would you like to open the external billing portal?',
              'Open External Portal',
              'Cancel'
            );

            if (choice === 'Open External Portal') {
              vscode.env.openExternal(vscode.Uri.parse(response.portal_url));
            }
          } else {
            // Direct to the actual backend billing portal
            vscode.env.openExternal(vscode.Uri.parse(response.portal_url));
          }
        } else {
          vscode.window.showErrorMessage('Unable to open billing portal.');
        }
      });
    } catch (error) {
      vscode.window.showErrorMessage('Failed to open billing portal: ' + this.getErrorMessage(error));
    }
  }/**
   * Get current subscription information
   * @param forceRefresh Force a refresh from the server instead of using cached data
   */
  public async getSubscriptionInfo(forceRefresh: boolean = false): Promise<any> {
    try {
      // Check for cached subscription data if not forcing refresh
      if (!forceRefresh) {
        // TODO: Implement caching mechanism for subscription data
      }

      const subscription = await this.backendService.getUserSubscription();
      return subscription;
    } catch (error: any) {
      // Handle "Not Found" error gracefully - user might be on free plan
      if (error.response?.status === 404 || error.message?.includes('Not Found')) {
        console.log('No subscription found - user is likely on free plan');
        return {
          tier: 'free',
          status: 'active',
          usage_limits: {
            monthly_requests: 100,
            monthly_tokens: 10000
          },
          current_usage: {
            requests_used: 0,
            tokens_used: 0
          },
          features: ['gpt-3.5-turbo'],
          billing_cycle: null,
          next_billing_date: null
        };
      }

      console.error('Failed to get subscription info:', error);
      return null;
    }
  }

  /**
   * Format plan details for display
   */  private getPlanDetails(plan: any): string {
    const features = [];

    // Handle direct fields on plan object (from backend API)
    if (plan.monthly_tokens) {
      features.push(`${plan.monthly_tokens.toLocaleString()} tokens/month`);
    }

    // Handle features object (for backwards compatibility)
    if (plan.features) {
      if (plan.features.monthly_requests) {
        features.push(`${plan.features.monthly_requests.toLocaleString()} API calls/month`);
      }
      if (plan.features.monthly_tokens && !plan.monthly_tokens) {
        features.push(`${plan.features.monthly_tokens.toLocaleString()} tokens/month`);
      }
      if (plan.features.models && Array.isArray(plan.features.models)) {
        features.push(`${plan.features.models.length} AI models`);
      }
      if (plan.features.priority_support) {
        features.push('Priority support');
      }
    }

    return features.join(' • ');
  }

  /**
   * Format subscription details for display
   */
  private formatSubscriptionDetails(subscription: any): string {
    const details = [`Current Plan: ${subscription.tier || 'Free'}`];

    if (subscription.status) {
      details.push(`Status: ${subscription.status}`);
    }

    if (subscription.usage_limits) {
      if (subscription.usage_limits.monthly_requests) {
        details.push(`Monthly API Calls: ${subscription.usage_limits.monthly_requests.toLocaleString()}`);
      }
      if (subscription.usage_limits.monthly_tokens) {
        details.push(`Monthly Tokens: ${subscription.usage_limits.monthly_tokens.toLocaleString()}`);
      }
    }

    if (subscription.current_usage) {
      if (subscription.current_usage.requests_used) {
        details.push(`API Calls Used: ${subscription.current_usage.requests_used.toLocaleString()}`);
      }
      if (subscription.current_usage.tokens_used) {
        details.push(`Tokens Used: ${subscription.current_usage.tokens_used.toLocaleString()}`);
      }
      if (subscription.current_usage.reset_date) {
        details.push(`Next Reset: ${new Date(subscription.current_usage.reset_date).toLocaleDateString()}`);
      }
    }

    if (subscription.next_billing_date) {
      details.push(`Next Billing: ${new Date(subscription.next_billing_date).toLocaleDateString()}`);
    }

    return details.join('\\n');
  }
  /**
   * Extract error message from error object
   */
  private getErrorMessage(error: any): string {
    // Handle HTTP errors
    if (error.response) {
      if (error.response.status === 404) {
        return 'Subscription not found - you may be on the free plan';
      }
      if (error.response.status === 401) {
        return 'Authentication required - please sign in';
      }
      if (error.response.status === 403) {
        return 'Access denied - please check your permissions';
      }
      if (error.response.data && error.response.data.detail) {
        return error.response.data.detail;
      }
      return `Server error (${error.response.status})`;
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED') {
      return 'Unable to connect to server - please check your internet connection';
    }

    return error.message || 'Unknown error';
  }

  /**
   * Helper method to set up customer for payment if needed
   */
  private async ensureCustomerSetup(): Promise<boolean> {
    try {
      // Check if the user has a valid customer setup
      const subscription = await this.backendService.getUserSubscription();

      // If they have an active subscription, customer is already set up
      if (subscription && subscription.status === 'active') {
        return true;
      }

      return false;
    } catch (error: any) {
      // If no subscription found (404), customer setup might be needed
      if (error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Handle payment method setup for new customers
   */
  private async handlePaymentMethodSetup(plan: any): Promise<any> {
    try {
      // First, attempt to create a customer and setup intent
      const response = await this.backendService.createCheckoutSession(plan.name || plan.id);

      // If we get a setup intent or payment intent, use it
      if (response && (response.client_secret || response.setup_intent)) {
        return response;
      }

      // If no proper payment setup is available, show guidance
      const choice = await vscode.window.showWarningMessage(
        'Payment setup required for this plan. Would you like to set up payment method?',
        'Set Up Payment',
        'Cancel'
      );

      if (choice === 'Set Up Payment') {
        // Show a setup flow or direct to billing portal
        await this.manageBilling();
      }

      return null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initialize or retrieve Stripe configuration
   */
  private async getStripeConfiguration(): Promise<{ publishableKey: string; customerId?: string }> {
    try {
      // In production, fetch this from the backend
      const config = vscode.workspace.getConfiguration('auto-gen-code-builder');
      const publishableKey = config.get<string>('payment.stripePublishableKey', this.stripePublishableKey);

      // Try to get customer ID from backend
      let customerId;
      try {
        const subscription = await this.backendService.getUserSubscription();
        customerId = subscription?.customer_id;
      } catch (error) {
        // Customer might not exist yet, which is fine for new users
        console.log('No existing customer found, will create on first payment');
      }

      return { publishableKey, customerId };
    } catch (error) {
      console.error('Failed to get Stripe configuration:', error);
      return { publishableKey: this.stripePublishableKey };
    }
  }

  /**
   * Create or update customer payment setup
   */
  private async setupCustomerPayment(plan: any): Promise<any> {
    try {
      const stripeConfig = await this.getStripeConfiguration();

      // Send additional parameters to help with customer setup
      const response = await this.backendService.createCheckoutSession(plan.name || plan.id);

      // Enhance response with Stripe configuration
      if (response) {
        response.stripe_publishable_key = stripeConfig.publishableKey;
        response.customer_id = stripeConfig.customerId;
      }

      return response;
    } catch (error) {
      throw error;
    }
  }
}
