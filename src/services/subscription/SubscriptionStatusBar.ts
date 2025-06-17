import * as vscode from 'vscode';
import { SubscriptionService } from './SubscriptionService';

/**
 * Status bar item showing subscription information
 */
export class SubscriptionStatusBar {
  private statusBarItem: vscode.StatusBarItem;
  
  constructor(
    private context: vscode.ExtensionContext,
    private subscriptionService: SubscriptionService
  ) {
    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    
    this.statusBarItem.command = 'auto-gen-code-builder.showCurrentSubscription';
    this.context.subscriptions.push(this.statusBarItem);
    
    // Update status initially and schedule periodic updates
    this.updateStatus();
    
    // Update subscription status every 30 minutes
    const intervalId = setInterval(() => this.updateStatus(), 30 * 60 * 1000);
    
    // Clean up interval on deactivation
    this.context.subscriptions.push({
      dispose: () => {
        clearInterval(intervalId);
      }
    });
  }
  
  /**
   * Update the status bar with current subscription information
   */
  public async updateStatus() {
    try {
      // Check if the status bar should be visible
      const config = vscode.workspace.getConfiguration('auto-gen-code-builder');
      const showStatus = config.get<boolean>('subscription.showStatus', true);
      
      if (!showStatus) {
        this.statusBarItem.hide();
        return;
      }
      
      // Get current subscription
      const subscription = await this.subscriptionService.getSubscriptionInfo();
      
      if (!subscription || subscription.tier === 'free') {
        // Show upgrade prompt for free users
        this.statusBarItem.text = '$(star) Upgrade';
        this.statusBarItem.tooltip = 'You are using the free plan. Click to upgrade.';
      } else {
        // Show subscription status for paid users
        this.statusBarItem.text = `$(verified) ${subscription.tier}`;
        
        // Build tooltip with usage information
        let tooltip = `Plan: ${subscription.tier}\n`;
        
        if (subscription.usage_limits && subscription.current_usage) {
          const usedRequests = subscription.current_usage.requests_used || 0;
          const totalRequests = subscription.usage_limits.monthly_requests || 0;
          const usedTokens = subscription.current_usage.tokens_used || 0;
          const totalTokens = subscription.usage_limits.monthly_tokens || 0;
          
          tooltip += `API Calls: ${usedRequests.toLocaleString()}/${totalRequests.toLocaleString()}\n`;
          tooltip += `Tokens: ${usedTokens.toLocaleString()}/${totalTokens.toLocaleString()}`;
        }
        
        this.statusBarItem.tooltip = tooltip;
      }
      
      this.statusBarItem.show();
    } catch (error) {
      console.error('Failed to update subscription status:', error);
      
      // Show a generic message in case of error
      this.statusBarItem.text = '$(account) Account';
      this.statusBarItem.tooltip = 'Click to view your account';
      this.statusBarItem.show();
    }
  }
  
  /**
   * Hide the status bar item
   */
  public hide() {
    this.statusBarItem.hide();
  }
  
  /**
   * Show the status bar item
   */
  public show() {
    this.updateStatus();
  }
  
  /**
   * Dispose the status bar item
   */
  public dispose() {
    this.statusBarItem.dispose();
  }
}
