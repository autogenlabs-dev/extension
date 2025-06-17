// Ensure this file is treated as a module
export { };

import * as vscode from 'vscode';

/**
 * Manages payment webview panel for Stripe checkout
 */
export class PaymentWebviewPanel {
  public static currentPanel: PaymentWebviewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    clientSecret: string,
    planName: string,
    price: string,
    stripePublishableKey: string
  ) {
    this._panel = panel;
    this._panel.webview.html = this._getWebviewContent(
      clientSecret,
      planName,
      price,
      stripePublishableKey
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'paymentSuccess':
            vscode.window.showInformationMessage(`Successfully subscribed to ${planName}!`);
            this._panel.dispose();
            break; case 'paymentError':
            // Enhanced error handling for payment issues
            const errorMsg = message.error || 'Payment failed';
            if (errorMsg.includes('payment method') || errorMsg.includes('payment source')) {
              vscode.window.showErrorMessage(
                `Payment setup required: ${message.error}`,
                'Setup Payment Method',
                'Try Again'
              ).then(selection => {
                if (selection === 'Setup Payment Method') {
                  vscode.commands.executeCommand('auto-gen-code-builder.manageBilling');
                }
              });
            } else {
              vscode.window.showErrorMessage(`Payment failed: ${message.error}`);
            }
            break;
          case 'openBrowserCheckout':
            // Get checkout URL from VS Code settings or use a fallback
            const config = vscode.workspace.getConfiguration('auto-gen-code-builder');
            const billingPortalUrl = config.get<string>('subscription.billingPortalUrl', 'https://billing.stripe.com/p/login/autogen');
            vscode.env.openExternal(vscode.Uri.parse(billingPortalUrl));
            this._panel.dispose();
            break;
          case 'close':
            this._panel.dispose();
            break;
        }
      },
      null,
      this._disposables
    );
  }

  /**
   * Creates or shows the payment webview panel
   */
  public static createOrShow(
    clientSecret: string,
    planName: string,
    price: string,
    stripePublishableKey: string
  ) {
    if (PaymentWebviewPanel.currentPanel) {
      PaymentWebviewPanel.currentPanel._panel.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'stripePayment',
      `Subscribe to ${planName}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [],
        retainContextWhenHidden: true
      }
    );

    PaymentWebviewPanel.currentPanel = new PaymentWebviewPanel(
      panel,
      clientSecret,
      planName,
      price,
      stripePublishableKey
    );
  }

  /**
   * Creates the HTML content for the payment webview
   */  private _getWebviewContent(
    clientSecret: string,
    planName: string,
    price: string,
    stripePublishableKey: string
  ): string {
    // Get payment configuration
    const config = vscode.workspace.getConfiguration('auto-gen-code-builder');
    const currency = config.get<string>('payment.currency', 'USD');
    const savePaymentMethod = config.get<boolean>('payment.savePaymentMethod', false);
    const enablePromotionCodes = config.get<boolean>('payment.enablePromotionCodes', true);

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscribe to ${planName}</title>
      <script src="https://js.stripe.com/v3/"></script>
      <style>
        body {
          font-family: var(--vscode-font-family);
          line-height: 1.6;
          padding: 20px;
          color: var(--vscode-foreground);
          background-color: var(--vscode-editor-background);
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
        }
        h1 {
          color: var(--vscode-editor-foreground);
          font-size: var(--vscode-font-size);
          font-weight: var(--vscode-font-weight);
        }
        .card-element {
          padding: 10px;
          border: 1px solid var(--vscode-input-border);
          border-radius: 4px;
          background: var(--vscode-input-background);
          margin-bottom: 20px;
        }
        button {
          padding: 10px 15px;
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          width: 100%;
          margin-top: 10px;
        }
        button:hover {
          background: var(--vscode-button-hoverBackground);
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error {
          color: var(--vscode-errorForeground);
          margin-top: 10px;
        }
        .success {
          color: var(--vscode-notificationsInfoIcon-foreground);
          margin-top: 10px;
        }
        .plan-details {
          margin: 20px 0;
          padding: 15px;
          background: var(--vscode-editor-inactiveSelectionBackground);
          border-radius: 4px;
        }
        .plan-detail {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .plan-detail-label {
          font-weight: bold;
        }
        .checkbox-container {
          display: flex;
          align-items: center;
          margin-top: 10px;
          margin-bottom: 15px;
        }
        .checkbox-container input {
          margin-right: 8px;
        }
        .promotion-code {
          margin-top: 15px;
          margin-bottom: 15px;
        }
        .promotion-code input {
          padding: 8px;
          border: 1px solid var(--vscode-input-border);
          border-radius: 4px;
          background: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          width: 100%;
          margin-top: 5px;
        }
        .browser-checkout {
          text-align: center;
          margin-top: 20px;
        }
        .browser-checkout a {
          color: var(--vscode-textLink-foreground);
          text-decoration: none;
        }
        .browser-checkout a:hover {
          text-decoration: underline;
        }
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
        }
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-left-color: var(--vscode-button-background);
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Subscribe to ${planName}</h1>
        
        <div class="plan-details">
          <div class="plan-detail">
            <span class="plan-detail-label">Plan:</span>
            <span>${planName}</span>
          </div>
          <div class="plan-detail">
            <span class="plan-detail-label">Price:</span>
            <span>${price} per month</span>
          </div>
          <div class="plan-detail">
            <span class="plan-detail-label">Currency:</span>
            <span>${currency}</span>
          </div>
        </div>
        
        <form id="payment-form">
          <div id="card-element" class="card-element">
            <!-- Stripe Card Element will be inserted here -->
          </div>
          
          <div id="card-errors" class="error" role="alert"></div>
          
          ${enablePromotionCodes ? `
          <div class="promotion-code">
            <label for="promo-code">Promotion Code (Optional)</label>
            <input type="text" id="promo-code" placeholder="Enter promotion code">
          </div>
          ` : ''}

          ${savePaymentMethod ? `
          <div class="checkbox-container">
            <input type="checkbox" id="save-payment-method" checked>
            <label for="save-payment-method">Save payment method for future transactions</label>
          </div>
          ` : ''}
          
          <button id="submit-button" type="submit">Subscribe Now</button>
          
          <div class="browser-checkout">
            <a href="#" id="browser-checkout-link">Prefer to checkout in your browser?</a>
          </div>
        </form>
        
        <div id="loading" class="loading" style="display:none;">
          <div class="spinner"></div>
          <span>Processing payment...</span>
        </div>
        
        <div id="success-message" class="success" style="display:none;">
          <h2>Thank you for your subscription!</h2>
          <p>Your payment was processed successfully.</p>
          <p>Your subscription to ${planName} is now active.</p>
          <button id="close-button">Close</button>
        </div>
      </div>

      <script>
        (function() {
          const vscode = acquireVsCodeApi();
          const stripe = Stripe('${stripePublishableKey}');
          const clientSecret = '${clientSecret}';
          
          const elements = stripe.elements();
          const cardElement = elements.create('card');
          cardElement.mount('#card-element');

          const form = document.getElementById('payment-form');
          const errorElement = document.getElementById('card-errors');
          const successElement = document.getElementById('success-message');
          const loadingElement = document.getElementById('loading');
          const submitButton = document.getElementById('submit-button');
          const closeButton = document.getElementById('close-button');
          const browserCheckoutLink = document.getElementById('browser-checkout-link');
          
          // Setup browser checkout option
          browserCheckoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            vscode.postMessage({
              command: 'openBrowserCheckout'
            });
          });
          
          // Setup close button
          if (closeButton) {
            closeButton.addEventListener('click', function() {
              vscode.postMessage({
                command: 'close'
              });
            });
          }
          
          cardElement.on('change', function(event) {
            if (event.error) {
              errorElement.textContent = event.error.message;
            } else {
              errorElement.textContent = '';
            }
          });
          
          form.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            submitButton.disabled = true;
            submitButton.textContent = 'Processing...';
            form.style.display = 'none';
            loadingElement.style.display = 'flex';
            
            try {
              // Get additional payment options
              const savePayment = ${savePaymentMethod} ? document.getElementById('save-payment-method')?.checked : false;
              const promoCode = ${enablePromotionCodes} ? document.getElementById('promo-code')?.value : '';
              
              const paymentMethodOptions = {
                setup_future_usage: savePayment ? 'off_session' : undefined
              };
              
              const paymentIntentData = {
                ...(promoCode ? { promotion_code: promoCode } : {})
              };
                const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                  card: cardElement,
                  billing_details: {
                    name: 'VS Code User'
                  }
                },
                setup_future_usage: savePayment ? 'off_session' : undefined
              });
              
              if (result.error) {
                // Show error to your customer
                errorElement.textContent = result.error.message;
                loadingElement.style.display = 'none';
                form.style.display = 'block';
                submitButton.disabled = false;
                submitButton.textContent = 'Subscribe Now';
                
                // Send error to extension
                vscode.postMessage({
                  command: 'paymentError',
                  error: result.error.message
                });
              } else {
                // Payment succeeded
                loadingElement.style.display = 'none';
                successElement.style.display = 'block';
                
                // Send success to extension
                vscode.postMessage({
                  command: 'paymentSuccess',
                  paymentIntent: result.paymentIntent
                });
              }
            } catch (e) {
              errorElement.textContent = e.message || 'An unexpected error occurred.';
              loadingElement.style.display = 'none';
              form.style.display = 'block';
              submitButton.disabled = false;
              submitButton.textContent = 'Subscribe Now';
              
              // Send error to extension
              vscode.postMessage({
                command: 'paymentError',
                error: e.message || 'An unexpected error occurred'
              });
            }
          });
        })();
      </script>
    </body>
    </html>`;
  }

  /**
   * Dispose of the webview and associated resources
   */
  public dispose() {
    PaymentWebviewPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
