import * as vscode from 'vscode';
import { SubscriptionService } from './SubscriptionService';

/**
 * Handler for Stripe webhook events to update subscription status
 */
export class WebhookHandler {
  constructor(private subscriptionService: SubscriptionService) {}

  /**
   * Process a webhook event from Stripe
   * @param event The webhook event object from Stripe
   */
  public async processWebhookEvent(event: any): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
      }
    } catch (error) {
      console.error('Error processing webhook event:', error);
    }
  }

  /**
   * Handle subscription update events
   */
  private async handleSubscriptionUpdate(subscription: any): Promise<void> {
    try {
      // Refresh subscription data in extension
      await this.subscriptionService.getSubscriptionInfo(true);

      // Show notification based on status
      if (subscription.status === 'active') {
        vscode.window.showInformationMessage(
          `Your subscription to the ${subscription.plan?.nickname || 'premium'} plan is now active!`
        );
      } else if (subscription.status === 'trialing') {
        const trialEnd = new Date(subscription.trial_end * 1000).toLocaleDateString();
        vscode.window.showInformationMessage(
          `Your trial has started and will end on ${trialEnd}.`
        );
      }
    } catch (error) {
      console.error('Error handling subscription update:', error);
    }
  }

  /**
   * Handle subscription cancellation events
   */
  private async handleSubscriptionCancelled(subscription: any): Promise<void> {
    try {
      // Refresh subscription data in extension
      await this.subscriptionService.getSubscriptionInfo(true);

      vscode.window.showInformationMessage(
        `Your subscription has been cancelled. You'll have access until ${
          new Date(subscription.current_period_end * 1000).toLocaleDateString()
        }.`
      );
    } catch (error) {
      console.error('Error handling subscription cancellation:', error);
    }
  }

  /**
   * Handle successful payment events
   */
  private async handlePaymentSucceeded(invoice: any): Promise<void> {
    try {
      // Only handle subscription invoices
      if (invoice.subscription) {
        const amount = (invoice.amount_paid / 100).toFixed(2);
        const currency = invoice.currency.toUpperCase();
        
        vscode.window.showInformationMessage(
          `Payment of ${currency} ${amount} was successful. Thank you for your subscription!`
        );
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }
  /**
   * Handle failed payment events
   */
  private async handlePaymentFailed(_invoice: any): Promise<void> {
    try {
      // Show warning with link to billing portal
      const config = vscode.workspace.getConfiguration('auto-gen-code-builder');
      const billingPortalUrl = config.get<string>('subscription.billingPortalUrl', 'https://billing.stripe.com/p/login/autogen');
      
      const response = await vscode.window.showWarningMessage(
        `Payment for your subscription failed. Please update your payment method.`,
        'Update Payment Method',
        'Dismiss'
      );
      
      if (response === 'Update Payment Method') {
        vscode.env.openExternal(vscode.Uri.parse(billingPortalUrl));
      }
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }
}
