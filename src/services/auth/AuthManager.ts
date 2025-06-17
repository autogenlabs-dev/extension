import * as vscode from 'vscode';
import { BackendService } from './BackendService';
import { ISecureStorage } from '../../types/secureStorage';

// Import interfaces for A4F integration (used in methods)
import type { VSCodeConfig as _VSCodeConfig, ModelInfo as _ModelInfo } from './BackendService';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  subscription_tier: string;
  email_verified: boolean;
  monthly_usage?: {
    api_calls: number;
    tokens_used: number;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  hasValidApiKeys: boolean;
}

export class AuthManager {
  private statusBarItem: vscode.StatusBarItem;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    hasValidApiKeys: false
  };

  private _onAuthStateChanged = new vscode.EventEmitter<AuthState>();
  public readonly onAuthStateChanged = this._onAuthStateChanged.event;
  constructor(
    private context: vscode.ExtensionContext,
    private backendService: BackendService,
    private secureStorage: ISecureStorage
  ) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.context.subscriptions.push(this.statusBarItem);
    this.setupStatusBar();
  }

  private setupStatusBar() {
    this.statusBarItem.command = 'auto-gen-code-builder.authStatus';
    this.context.subscriptions.push(
      vscode.commands.registerCommand('auto-gen-code-builder.authStatus', () => {
        this.showAuthMenu();
      })
    );
    this.updateStatusBar();
    this.statusBarItem.show();
  }

  private updateStatusBar() {
    if (this.authState.isAuthenticated && this.authState.user) {
      const showUsage = vscode.workspace.getConfiguration('auto-gen-code-builder')
        .get('showUsageInStatusBar', true);
      
      if (showUsage && this.authState.user.monthly_usage) {
        const usage = this.authState.user.monthly_usage;
        this.statusBarItem.text = `$(account) ${this.authState.user.first_name} (${usage.api_calls} calls)`;
      } else {
        this.statusBarItem.text = `$(account) ${this.authState.user.first_name}`;
      }
      this.statusBarItem.tooltip = `Signed in as ${this.authState.user.email}\nClick for options`;
    } else {
      this.statusBarItem.text = "$(sign-in) AutoGen: Sign In";
      this.statusBarItem.tooltip = "Click to sign in to AutoGen";
    }
  }

  private async showAuthMenu() {    if (this.authState.isAuthenticated) {
      const items = [
        { label: '$(account) View Profile', command: 'viewProfile' },
        { label: '$(key) Manage API Keys', command: 'manageApiKeys' },
        { label: '$(graph) View Usage', command: 'viewUsage' },
        { label: '$(rocket) View A4F Models', command: 'viewA4FModels' },
        { label: '$(settings-gear) A4F Configuration', command: 'configureA4F' },
        { label: '$(link-external) Connect OAuth', command: 'connectOAuth' },
        { label: '$(sign-out) Sign Out', command: 'signOut' }
      ];

      const selected = await vscode.window.showQuickPick(items, {
        title: 'AutoGen Account',
        placeHolder: 'Select an action'
      });

      if (selected) {
        switch (selected.command) {
          case 'viewProfile': await this.showProfile(); break;
          case 'manageApiKeys': await this.manageApiKeys(); break;
          case 'viewUsage': await this.showUsage(); break;
          case 'viewA4FModels': await this.showA4FModels(); break;
          case 'configureA4F': await this.manageA4FConfiguration(); break;
          case 'connectOAuth': await this.connectOAuth(); break;
          case 'signOut': await this.signOut(); break;
        }
      }
    } else {
      const items = [
        { label: '$(sign-in) Sign In', command: 'signIn' },
        { label: '$(person-add) Create Account', command: 'register' }
      ];

      const selected = await vscode.window.showQuickPick(items, {
        title: 'AutoGen Authentication',
        placeHolder: 'Select an action'
      });

      if (selected) {
        if (selected.command === 'signIn') {
          await this.signIn();
        } else if (selected.command === 'register') {
          await this.register();
        }
      }
    }
  }

  async attemptAutoSignIn(): Promise<boolean> {
    try {
      const tokens = await this.secureStorage.getTokens();
      if (tokens.accessToken) {
        const user = await this.backendService.getCurrentUser();
        await this.setAuthenticationState(true, user);
        return true;
      }
    } catch (error) {
      console.log('Auto sign-in failed:', error);
    }
    return false;
  }

  async signIn(): Promise<boolean> {
    try {
      const email = await vscode.window.showInputBox({
        prompt: 'Enter your email address',
        validateInput: (value) => {
          if (!value || !value.includes('@')) {
            return 'Please enter a valid email address';
          }
          return undefined;
        }
      });

      if (!email) return false;

      const password = await vscode.window.showInputBox({
        prompt: 'Enter your password',
        password: true,
        validateInput: (value) => {
          if (!value) return 'Password is required';
          return undefined;
        }
      });

      if (!password) return false;      const result = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Signing in to AutoGen...",
        cancellable: false
      }, async () => {
        return await this.backendService.login(email, password);
      });

      await this.secureStorage.storeTokens(result.access_token, result.refresh_token);
      
      // Handle A4F integration if provided
      if (result.a4f_api_key && result.api_endpoint) {
        await this.configureA4FIntegration(result.a4f_api_key, result.api_endpoint);
        vscode.window.showInformationMessage(
          `Welcome back, ${result.user.first_name}! A4F integration has been automatically configured.`,
          'View A4F Models'
        ).then(async (action) => {
          if (action === 'View A4F Models') {
            await this.showA4FModels();
          }
        });
      } else {
        vscode.window.showInformationMessage(`Welcome back, ${result.user.first_name}!`);
      }
      
      await this.setAuthenticationState(true, result.user);
      return true;

    } catch (error: any) {
      vscode.window.showErrorMessage(`Sign in failed: ${error.message}`);
      return false;
    }
  }

  async register(): Promise<boolean> {
    try {
      const email = await vscode.window.showInputBox({
        prompt: 'Enter your email address',
        validateInput: (value) => {
          if (!value || !value.includes('@')) {
            return 'Please enter a valid email address';
          }
          return undefined;
        }
      });

      if (!email) return false;

      const password = await vscode.window.showInputBox({
        prompt: 'Enter password (minimum 8 characters)',
        password: true,
        validateInput: (value) => {
          if (!value) return 'Password is required';
          if (value.length < 8) return 'Password must be at least 8 characters';
          return undefined;
        }
      });

      if (!password) return false;

      const firstName = await vscode.window.showInputBox({
        prompt: 'Enter your first name',
        validateInput: (value) => value ? undefined : 'First name is required'
      });

      if (!firstName) return false;

      const lastName = await vscode.window.showInputBox({
        prompt: 'Enter your last name',
        validateInput: (value) => value ? undefined : 'Last name is required'
      });

      if (!lastName) return false;

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Creating your AutoGen account...",
        cancellable: false
      }, async () => {
        await this.backendService.register({
          email,
          password,
          first_name: firstName,
          last_name: lastName
        });
      });

      vscode.window.showInformationMessage(
        'Account created successfully! Please check your email for verification, then sign in.',
        'Sign In Now'
      ).then(action => {
        if (action === 'Sign In Now') {
          this.signIn();
        }
      });

      return true;

    } catch (error: any) {
      vscode.window.showErrorMessage(`Registration failed: ${error.message}`);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.backendService.logout();
    } catch (error) {
      // Continue with local sign out even if backend call fails
      console.log('Backend logout failed:', error);
    }

    await this.secureStorage.clearTokens();
    await this.setAuthenticationState(false, null);
    vscode.window.showInformationMessage('Signed out successfully');
  }

  async showProfile(): Promise<void> {
    if (!this.authState.user) return;

    const user = this.authState.user;
    const panel = vscode.window.createWebviewPanel(
      'autoGenProfile',
      'AutoGen Profile',
      vscode.ViewColumn.One,
      { enableScripts: false }
    );

    panel.webview.html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
          .profile-section { margin-bottom: 20px; }
          .profile-item { margin: 8px 0; }
          .label { font-weight: bold; color: var(--vscode-foreground); }
          .value { color: var(--vscode-descriptionForeground); }
          .tier-badge { 
            display: inline-block; 
            padding: 4px 8px; 
            border-radius: 4px; 
            background: var(--vscode-badge-background); 
            color: var(--vscode-badge-foreground);
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <h1>AutoGen Profile</h1>
        
        <div class="profile-section">
          <h3>Account Information</h3>
          <div class="profile-item">
            <span class="label">Name:</span> 
            <span class="value">${user.first_name} ${user.last_name}</span>
          </div>
          <div class="profile-item">
            <span class="label">Email:</span> 
            <span class="value">${user.email}</span>
          </div>
          <div class="profile-item">
            <span class="label">Subscription:</span> 
            <span class="tier-badge">${user.subscription_tier.toUpperCase()}</span>
          </div>
          <div class="profile-item">
            <span class="label">Email Verified:</span> 
            <span class="value">${user.email_verified ? '✅ Yes' : '❌ No'}</span>
          </div>
        </div>

        ${user.monthly_usage ? `
        <div class="profile-section">
          <h3>Usage This Month</h3>
          <div class="profile-item">
            <span class="label">API Calls:</span> 
            <span class="value">${user.monthly_usage.api_calls}</span>
          </div>
          <div class="profile-item">
            <span class="label">Tokens Used:</span> 
            <span class="value">${user.monthly_usage.tokens_used.toLocaleString()}</span>
          </div>
        </div>
        ` : ''}
      </body>
      </html>
    `;
  }

  async manageApiKeys(): Promise<void> {
    try {
      const apiKeys = await this.backendService.getApiKeys();
      
      const quickPick = vscode.window.createQuickPick();
      quickPick.title = 'LLM API Key Manager';
      quickPick.placeholder = 'Select an action or API key to manage';
      
      const items = [
        { label: '$(add) Add New API Key', action: 'add' },
        { label: '$(link-external) Connect OAuth Provider', action: 'oauth' },
        { label: '', kind: vscode.QuickPickItemKind.Separator },
        ...apiKeys.map((key: any) => ({
          label: `$(key) ${key.provider}`,
          description: `****...${key.key_preview}`,
          detail: `Added: ${new Date(key.created_at).toLocaleDateString()} | Status: ${key.is_active ? 'Active' : 'Inactive'}`,
          action: 'manage',
          keyId: key.id
        }))
      ];
      
      quickPick.items = items;
      quickPick.show();
      
      quickPick.onDidAccept(async () => {
        const selected = quickPick.selectedItems[0] as any;
        quickPick.hide();
        
        switch (selected.action) {
          case 'add':
            await this.addManualApiKey();
            break;
          case 'oauth':
            await this.connectOAuth();
            break;
          case 'manage':
            await this.manageSpecificApiKey(selected.keyId);
            break;
        }
      });

    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to load API keys: ${error.message}`);
    }
  }

  private async addManualApiKey(): Promise<void> {
    const providers = [
      { label: 'OpenAI', value: 'openai' },
      { label: 'Anthropic', value: 'anthropic' },
      { label: 'Google', value: 'google' },
      { label: 'OpenRouter', value: 'openrouter' },
      { label: 'Other', value: 'other' }
    ];

    const provider = await vscode.window.showQuickPick(providers, {
      title: 'Select LLM Provider',
      placeHolder: 'Choose the provider for your API key'
    });

    if (!provider) return;

    const apiKey = await vscode.window.showInputBox({
      prompt: `Enter your ${provider.label} API key`,
      password: true,
      validateInput: (value) => {
        if (!value) return 'API key is required';
        if (value.length < 10) return 'API key seems too short';
        return undefined;
      }
    });

    if (!apiKey) return;

    const keyName = await vscode.window.showInputBox({
      prompt: 'Enter a name for this key (optional)',
      placeHolder: `My ${provider.label} Key`
    });

    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Validating and saving API key...",
        cancellable: false
      }, async () => {
        await this.backendService.addApiKey({
          provider: provider.value,
          api_key: apiKey,
          name: keyName || `${provider.label} Key`
        });
      });

      vscode.window.showInformationMessage(`${provider.label} API key added successfully!`);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to add API key: ${error.message}`);
    }
  }

  async connectOAuth(): Promise<void> {
    const providers = [
      { label: 'OpenRouter', value: 'openrouter' },
      { label: 'Glama', value: 'glama' },
      { label: 'Requesty', value: 'requesty' },
      { label: 'AIML', value: 'aiml' }
    ];

    const provider = await vscode.window.showQuickPick(providers, {
      title: 'Connect OAuth Provider',
      placeHolder: 'Choose a provider to connect'
    });

    if (!provider) return;

    try {
      const authUrl = await this.backendService.initiateOAuth(provider.value);
      
      await vscode.env.openExternal(vscode.Uri.parse(authUrl));
      
      vscode.window.showInformationMessage(
        `Please complete the ${provider.label} authentication in your browser. The extension will automatically detect when you're done.`,
        'I\'ve completed authentication'
      ).then(async (action) => {
        if (action === 'I\'ve completed authentication') {
          vscode.window.showInformationMessage(`${provider.label} connected successfully!`);
          await this.refreshAuthState();
        }
      });

    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to connect ${provider.label}: ${error.message}`);
    }
  }

  private async manageSpecificApiKey(keyId: string): Promise<void> {
    const actions = [
      { label: '$(eye) View Details', action: 'view' },
      { label: '$(edit) Update Key', action: 'update' },
      { label: '$(trash) Remove Key', action: 'remove' }
    ];

    const selected = await vscode.window.showQuickPick(actions, {
      title: 'Manage API Key',
      placeHolder: 'Select an action'
    });

    if (!selected) return;

    try {
      switch (selected.action) {
        case 'view':
          const keyDetails = await this.backendService.getApiKeyDetails(keyId);
          await this.showApiKeyDetails(keyDetails);
          break;
        case 'update':
          await this.updateApiKey(keyId);
          break;
        case 'remove':
          await this.removeApiKey(keyId);
          break;
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Action failed: ${error.message}`);
    }
  }

  private async showApiKeyDetails(keyDetails: any): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'apiKeyDetails',
      'API Key Details',
      vscode.ViewColumn.One,
      { enableScripts: false }
    );

    panel.webview.html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; }
          .detail-item { margin: 8px 0; }
          .label { font-weight: bold; }
          .value { color: var(--vscode-descriptionForeground); }
        </style>
      </head>
      <body>
        <h1>API Key Details</h1>
        <div class="detail-item">
          <span class="label">Provider:</span> <span class="value">${keyDetails.provider}</span>
        </div>
        <div class="detail-item">
          <span class="label">Name:</span> <span class="value">${keyDetails.name}</span>
        </div>
        <div class="detail-item">
          <span class="label">Key Preview:</span> <span class="value">${keyDetails.key_preview}</span>
        </div>
        <div class="detail-item">
          <span class="label">Status:</span> <span class="value">${keyDetails.is_active ? 'Active' : 'Inactive'}</span>
        </div>
        <div class="detail-item">
          <span class="label">Created:</span> <span class="value">${new Date(keyDetails.created_at).toLocaleString()}</span>
        </div>
        ${keyDetails.usage_stats ? `
        <h3>Usage Statistics</h3>
        <div class="detail-item">
          <span class="label">Calls This Month:</span> <span class="value">${keyDetails.usage_stats.calls_this_month}</span>
        </div>
        <div class="detail-item">
          <span class="label">Tokens This Month:</span> <span class="value">${keyDetails.usage_stats.tokens_this_month.toLocaleString()}</span>
        </div>
        ` : ''}
      </body>
      </html>
    `;
  }

  private async updateApiKey(keyId: string): Promise<void> {
    const newKey = await vscode.window.showInputBox({
      prompt: 'Enter the new API key',
      password: true,
      validateInput: (value) => {
        if (!value) return 'API key is required';
        if (value.length < 10) return 'API key seems too short';
        return undefined;
      }
    });

    if (!newKey) return;

    await this.backendService.updateApiKey(keyId, { api_key: newKey });
    vscode.window.showInformationMessage('API key updated successfully!');
  }

  private async removeApiKey(keyId: string): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
      'Are you sure you want to remove this API key?',
      { modal: true },
      'Remove'
    );

    if (confirm === 'Remove') {
      await this.backendService.removeApiKey(keyId);
      vscode.window.showInformationMessage('API key removed successfully!');
    }
  }

  async showUsage(): Promise<void> {
    try {
      const usage = await this.backendService.getUsageStatistics();
      
      const panel = vscode.window.createWebviewPanel(
        'usageStats',
        'Usage Statistics',
        vscode.ViewColumn.One,
        { enableScripts: false }
      );

      panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: var(--vscode-font-family); padding: 20px; }
            .usage-section { margin-bottom: 20px; }
            .usage-item { margin: 8px 0; }
            .label { font-weight: bold; }
            .value { color: var(--vscode-descriptionForeground); }
          </style>
        </head>
        <body>
          <h1>Usage Statistics</h1>
          
          <div class="usage-section">
            <h3>This Month</h3>
            <div class="usage-item">
              <span class="label">API Calls:</span> <span class="value">${usage.current_month.api_calls}</span>
            </div>
            <div class="usage-item">
              <span class="label">Tokens Used:</span> <span class="value">${usage.current_month.tokens_used.toLocaleString()}</span>
            </div>
          </div>

          <div class="usage-section">
            <h3>Last Month</h3>
            <div class="usage-item">
              <span class="label">API Calls:</span> <span class="value">${usage.last_month.api_calls}</span>
            </div>
            <div class="usage-item">
              <span class="label">Tokens Used:</span> <span class="value">${usage.last_month.tokens_used.toLocaleString()}</span>
            </div>
          </div>
        </body>
        </html>
      `;

    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to load usage statistics: ${error.message}`);
    }
  }

  async healthCheck(): Promise<void> {
    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Checking backend health...",
        cancellable: false
      }, async () => {
        const health = await this.backendService.healthCheck();
        
        if (health.status === 'healthy') {
          vscode.window.showInformationMessage('✅ Backend is healthy and responding normally');
        } else {
          vscode.window.showWarningMessage(`⚠️ Backend health check: ${health.message}`);
        }
      });
    } catch (error: any) {
      vscode.window.showErrorMessage(`❌ Backend health check failed: ${error.message}`);
    }
  }

  private async setAuthenticationState(isAuthenticated: boolean, user: User | null): Promise<void> {
    this.authState.isAuthenticated = isAuthenticated;
    this.authState.user = user;
    
    if (isAuthenticated) {
      try {
        const apiKeys = await this.backendService.getApiKeys();
        this.authState.hasValidApiKeys = apiKeys.length > 0;
      } catch {
        this.authState.hasValidApiKeys = false;
      }
    } else {
      this.authState.hasValidApiKeys = false;
    }

    this.updateStatusBar();
    
    // Set context for command visibility
    vscode.commands.executeCommand('setContext', 'autoGenAuthenticated', isAuthenticated);
    
    this._onAuthStateChanged.fire(this.authState);
  }

  private async refreshAuthState(): Promise<void> {
    if (this.authState.isAuthenticated) {
      try {
        const user = await this.backendService.getCurrentUser();
        await this.setAuthenticationState(true, user);
      } catch (error) {
        await this.setAuthenticationState(false, null);
      }
    }
  }

  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  public getCurrentUser(): User | null {
    return this.authState.user;
  }

  public async hasValidApiKeys(): Promise<boolean> {
    return this.authState.hasValidApiKeys;
  }
  public getAuthState(): AuthState {
    return { ...this.authState };
  }
  // A4F Integration Methods
  private async configureA4FIntegration(apiKey: string, endpoint: string): Promise<void> {
    try {
      // Store A4F configuration in VS Code settings
      const config = vscode.workspace.getConfiguration('auto-gen-code-builder');
      await config.update('a4f.enabled', true, vscode.ConfigurationTarget.Global);
      await config.update('a4f.apiKey', apiKey, vscode.ConfigurationTarget.Global);
      await config.update('a4f.endpoint', endpoint, vscode.ConfigurationTarget.Global);
      
      console.log('A4F integration configured successfully');
    } catch (error) {
      console.error('Failed to configure A4F integration:', error);
      vscode.window.showWarningMessage('A4F configuration saved but some settings may not persist');
    }
  }

  public async showA4FModels(): Promise<void> {
    try {
      const models = await this.backendService.getA4FModels();
      
      const panel = vscode.window.createWebviewPanel(
        'a4fModels',
        'A4F Available Models',
        vscode.ViewColumn.One,
        { enableScripts: false }
      );

      const modelsByProvider = models.reduce((acc: any, model) => {
        const provider = model.provider || 'Unknown';
        if (!acc[provider]) acc[provider] = [];
        acc[provider].push(model);
        return acc;
      }, {});

      const modelListHTML = Object.entries(modelsByProvider)
        .map(([provider, providerModels]: [string, any]) => `
          <div class="provider-section">
            <h3>${provider}</h3>
            ${(providerModels as any[]).map(model => `
              <div class="model-item">
                <div class="model-name">${model.name}</div>
                <div class="model-description">${model.description || 'No description available'}</div>
                <div class="model-pricing">
                  Input: $${model.pricing?.input || 'N/A'}/1M tokens | 
                  Output: $${model.pricing?.output || 'N/A'}/1M tokens
                </div>
              </div>
            `).join('')}
          </div>
        `).join('');

      panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: var(--vscode-font-family); padding: 20px; }
            .provider-section { margin-bottom: 30px; }
            .provider-section h3 { 
              color: var(--vscode-textLink-foreground);
              border-bottom: 1px solid var(--vscode-widget-border);
              padding-bottom: 5px;
            }
            .model-item { 
              margin: 15px 0; 
              padding: 10px; 
              border-left: 3px solid var(--vscode-textLink-foreground);
              background: var(--vscode-editor-background);
            }
            .model-name { 
              font-weight: bold; 
              color: var(--vscode-foreground);
              margin-bottom: 5px;
            }
            .model-description { 
              color: var(--vscode-descriptionForeground); 
              margin-bottom: 5px;
            }
            .model-pricing { 
              font-size: 0.9em;
              color: var(--vscode-charts-blue);
            }
          </style>
        </head>
        <body>
          <h1>A4F Available Models (${models.length} total)</h1>
          <p>These models are available through your A4F integration:</p>
          ${modelListHTML}
        </body>
        </html>
      `;

    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to load A4F models: ${error.message}`);
    }
  }

  public async manageA4FConfiguration(): Promise<void> {
    const config = vscode.workspace.getConfiguration('auto-gen-code-builder');
    const isA4FEnabled = config.get('a4f.enabled', false);

    const actions = [
      { 
        label: `$(${isA4FEnabled ? 'check' : 'circle-large-outline'}) A4F Integration`,
        description: isA4FEnabled ? 'Currently enabled' : 'Currently disabled',
        action: 'toggle'
      },
      { label: '$(list-unordered) View Available Models', action: 'models' },
      { label: '$(gear) Update Configuration', action: 'configure' },
      { label: '$(info) A4F Integration Info', action: 'info' }
    ];

    const selected = await vscode.window.showQuickPick(actions, {
      title: 'A4F Configuration',
      placeHolder: 'Select an action'
    });

    if (!selected) return;

    try {
      switch (selected.action) {
        case 'toggle':
          await this.toggleA4FIntegration();
          break;
        case 'models':
          await this.showA4FModels();
          break;
        case 'configure':
          await this.updateA4FConfiguration();
          break;
        case 'info':
          await this.showA4FInfo();
          break;
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`A4F action failed: ${error.message}`);
    }
  }

  private async toggleA4FIntegration(): Promise<void> {
    const config = vscode.workspace.getConfiguration('auto-gen-code-builder');
    const isEnabled = config.get('a4f.enabled', false);
    
    await config.update('a4f.enabled', !isEnabled, vscode.ConfigurationTarget.Global);
    
    if (!isEnabled) {
      vscode.window.showInformationMessage('A4F integration enabled! You can now use A4F models in your code generation.');
    } else {
      vscode.window.showInformationMessage('A4F integration disabled.');
    }
  }

  private async updateA4FConfiguration(): Promise<void> {
    try {
      const vsCodeConfig = await this.backendService.getVSCodeConfig();
      
      if (vsCodeConfig.config.a4f_api_key) {
        await this.configureA4FIntegration(
          vsCodeConfig.config.a4f_api_key,
          vsCodeConfig.config.providers.a4f.base_url
        );
        vscode.window.showInformationMessage('A4F configuration updated from backend!');
      } else {
        vscode.window.showWarningMessage('No A4F configuration available from backend.');
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to update A4F configuration: ${error.message}`);
    }
  }

  private async showA4FInfo(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'a4fInfo',
      'A4F Integration Information',
      vscode.ViewColumn.One,
      { enableScripts: false }
    );

    panel.webview.html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: var(--vscode-font-family); padding: 20px; line-height: 1.6; }
          .info-section { margin-bottom: 20px; }
          .highlight { 
            background: var(--vscode-textBlockQuote-background);
            padding: 10px;
            border-left: 4px solid var(--vscode-textLink-foreground);
            margin: 10px 0;
          }
          code { 
            background: var(--vscode-textPreformat-background);
            padding: 2px 4px;
            border-radius: 3px;
          }
        </style>
      </head>
      <body>
        <h1>A4F Integration Information</h1>
        
        <div class="info-section">
          <h3>What is A4F?</h3>
          <p>A4F (AI for Fun) is a comprehensive AI model provider that offers access to 120+ cutting-edge language models from various providers including OpenAI, Anthropic, Google, and more.</p>
        </div>

        <div class="info-section">
          <h3>How it works</h3>
          <div class="highlight">
            <p><strong>Automatic Configuration:</strong> When you sign in to AutoGen, A4F integration is automatically configured with your account. No additional setup required!</p>
          </div>
          <ul>
            <li>Your backend account includes A4F access</li>
            <li>API keys are managed automatically</li>
            <li>Smart model routing prioritizes A4F for optimal performance</li>
            <li>Token usage is tracked and optimized</li>
          </ul>
        </div>

        <div class="info-section">
          <h3>Available Features</h3>
          <ul>
            <li><strong>120+ Models:</strong> Access latest models from multiple providers</li>
            <li><strong>Smart Routing:</strong> Automatic fallback between providers</li>
            <li><strong>Cost Optimization:</strong> Intelligent model selection based on task</li>
            <li><strong>Real-time Usage:</strong> Track tokens and costs</li>
          </ul>
        </div>

        <div class="info-section">
          <h3>Configuration</h3>
          <p>A4F is configured automatically, but you can:</p>
          <ul>
            <li>Enable/disable A4F integration</li>
            <li>View available models</li>
            <li>Update configuration from backend</li>
            <li>Monitor usage statistics</li>
          </ul>
        </div>
      </body>
      </html>
    `;
  }

  public dispose(): void {
    this.statusBarItem.dispose();
    this._onAuthStateChanged.dispose();
  }
}
