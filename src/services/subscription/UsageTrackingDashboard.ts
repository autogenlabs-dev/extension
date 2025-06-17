import * as vscode from 'vscode';
import { SubscriptionService } from './SubscriptionService';

/**
 * Creates a usage tracking dashboard webview to visualize subscription usage
 */
export class UsageTrackingDashboard {
  public static currentPanel: UsageTrackingDashboard | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    private subscriptionService: SubscriptionService
  ) {
    this._panel = panel;
    
    // Set initial content and handle updates
    this._updateContent();
    
    // Handle panel close
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
      // Update content when panel becomes visible
    this._panel.onDidChangeViewState(
      _e => {
        if (this._panel.visible) {
          this._updateContent();
        }
      },
      null,
      this._disposables
    );
    
    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'refresh':
            this._updateContent(true);
            break;
          case 'openManageBilling':
            this.subscriptionService.manageBilling();
            break;
          case 'viewPlans':
            this.subscriptionService.showSubscriptionPlans();
            break;
        }
      },
      null,
      this._disposables
    );
  }

  /**
   * Create or show the usage tracking dashboard
   */
  public static createOrShow(
    subscriptionService: SubscriptionService
  ) {
    if (UsageTrackingDashboard.currentPanel) {
      UsageTrackingDashboard.currentPanel._panel.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'usageTrackingDashboard',
      'Subscription Usage Dashboard',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    UsageTrackingDashboard.currentPanel = new UsageTrackingDashboard(
      panel,
      subscriptionService
    );
  }

  /**
   * Update dashboard content with latest subscription information
   */
  private async _updateContent(forceRefresh: boolean = false) {
    this._panel.webview.html = await this._getHtmlContent(forceRefresh);
  }

  /**
   * Generate the HTML content for the dashboard
   */
  private async _getHtmlContent(forceRefresh: boolean = false): Promise<string> {
    const subscription = await this.subscriptionService.getSubscriptionInfo(forceRefresh);
    
    if (!subscription) {
      return this._getErrorHtml('Unable to retrieve subscription information.');
    }

    const usageRequests = subscription.usage_percentage?.requests || 0;
    const usageTokens = subscription.usage_percentage?.tokens || 0;
    
    // Determine color based on usage percentage
    const getUsageColor = (percentage: number) => {
      if (percentage > 90) return '#E51400'; // Red
      if (percentage > 75) return '#F9CE1D'; // Yellow
      return '#3AC26F'; // Green
    };
    
    const requestsColor = getUsageColor(usageRequests);
    const tokensColor = getUsageColor(usageTokens);
    
    // Format dates if present
    const resetDate = subscription.current_usage?.reset_date ? 
      new Date(subscription.current_usage.reset_date).toLocaleDateString() : 'N/A';
    
    const billingDate = subscription.next_billing_date ? 
      new Date(subscription.next_billing_date).toLocaleDateString() : 'N/A';

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Usage Dashboard</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          padding: 20px;
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .tier-badge {
          background-color: var(--vscode-badge-background);
          color: var(--vscode-badge-foreground);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
          text-transform: uppercase;
        }
        .card {
          background-color: var(--vscode-editor-inactiveSelectionBackground);
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 20px;
        }
        h2 {
          margin-top: 0;
          border-bottom: 1px solid var(--vscode-panel-border);
          padding-bottom: 8px;
        }
        .progress-container {
          margin-bottom: 16px;
        }
        .progress-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .progress-bar {
          height: 8px;
          width: 100%;
          background-color: var(--vscode-progressBar-background);
          border-radius: 4px;
        }
        .progress-value {
          height: 100%;
          border-radius: 4px;
        }
        .feature-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
        }
        .feature-item {
          display: flex;
          align-items: center;
        }
        .feature-item::before {
          content: "✓";
          margin-right: 8px;
          color: var(--vscode-terminal-ansiGreen);
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--vscode-panel-border);
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: bold;
        }
        .button-row {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        button {
          padding: 8px 16px;
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        .secondary-button {
          background-color: var(--vscode-button-secondaryBackground);
          color: var(--vscode-button-secondaryForeground);
        }
        .secondary-button:hover {
          background-color: var(--vscode-button-secondaryHoverBackground);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Subscription Usage Dashboard</h1>
          <div class="tier-badge">${subscription.tier || 'Free'} Tier</div>
        </div>
        
        <div class="card">
          <h2>Usage Overview</h2>
          
          <div class="progress-container">
            <div class="progress-label">
              <span>API Calls</span>
              <span>${subscription.current_usage?.requests_used || 0} / ${subscription.usage_limits?.monthly_requests || 0}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-value" style="width: ${usageRequests}%; background-color: ${requestsColor}"></div>
            </div>
          </div>
          
          <div class="progress-container">
            <div class="progress-label">
              <span>Tokens</span>
              <span>${subscription.current_usage?.tokens_used || 0} / ${subscription.usage_limits?.monthly_tokens || 0}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-value" style="width: ${usageTokens}%; background-color: ${tokensColor}"></div>
            </div>
          </div>
          
          <div class="info-row">
            <span class="info-label">Usage Reset Date</span>
            <span>${resetDate}</span>
          </div>
          
          ${subscription.warnings?.approaching_limit ? `
          <div style="margin-top: 16px; padding: 8px; background-color: rgba(249, 206, 29, 0.2); border-left: 3px solid #F9CE1D; color: #F9CE1D;">
            <strong>Warning:</strong> ${subscription.warnings.message || 'You are approaching your usage limits.'}
          </div>
          ` : ''}
        </div>
        
        <div class="card">
          <h2>Billing Information</h2>
          
          <div class="info-row">
            <span class="info-label">Plan</span>
            <span>${subscription.tier || 'Free'}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Billing Cycle</span>
            <span>${subscription.billing_cycle || 'N/A'}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Next Billing Date</span>
            <span>${billingDate}</span>
          </div>
          
          ${subscription.cost ? `
          <div class="info-row">
            <span class="info-label">Cost</span>
            <span>$${subscription.cost}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="card">
          <h2>Available Features</h2>
          
          <div class="feature-list">
            ${Array.isArray(subscription.features) ? 
              subscription.features.map((feature: string) => 
                `<div class="feature-item">${feature}</div>`
              ).join('') : 
              '<div>No features available</div>'
            }
          </div>
        </div>
        
        <div class="button-row">
          <button id="refresh-button">Refresh Data</button>
          <button id="manage-billing-button">Manage Billing</button>
          <button id="view-plans-button" class="secondary-button">View Plans</button>
        </div>
      </div>
      
      <script>
        const vscode = acquireVsCodeApi();
        
        document.getElementById('refresh-button').addEventListener('click', () => {
          vscode.postMessage({ command: 'refresh' });
        });
        
        document.getElementById('manage-billing-button').addEventListener('click', () => {
          vscode.postMessage({ command: 'openManageBilling' });
        });
        
        document.getElementById('view-plans-button').addEventListener('click', () => {
          vscode.postMessage({ command: 'viewPlans' });
        });
      </script>
    </body>
    </html>`;
  }

  /**
   * Generate HTML for error state
   */
  private _getErrorHtml(errorMessage: string): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Usage Dashboard</title>
      <style>
        body {
          font-family: var(--vscode-font-family);
          padding: 20px;
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 80vh;
        }
        .error-container {
          text-align: center;
          max-width: 500px;
        }
        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        button {
          margin-top: 20px;
          padding: 8px 16px;
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
      </style>
    </head>
    <body>
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h2>Unable to Load Dashboard</h2>
        <p>${errorMessage}</p>
        <button id="refresh-button">Refresh</button>
      </div>
      
      <script>
        const vscode = acquireVsCodeApi();
        
        document.getElementById('refresh-button').addEventListener('click', () => {
          vscode.postMessage({ command: 'refresh' });
        });
      </script>
    </body>
    </html>`;
  }

  /**
   * Dispose the webview and associated resources
   */
  public dispose() {
    UsageTrackingDashboard.currentPanel = undefined;
    
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
