// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import delay from "delay"
import * as vscode from "vscode"
import { Logger } from "./services/logging/Logger"
import { createAutoGenAPI } from "./exports"
import "./utils/path" // necessary to have access to String.prototype.toPosix
import { DIFF_VIEW_URI_SCHEME } from "./integrations/editor/DiffViewProvider"
import assert from "node:assert"
import { telemetryService } from "./services/telemetry/TelemetryService"
import { AutoGenProvider } from "./core/webview/AutogenProvider"

/*
Built using https://github.com/microsoft/vscode-webview-ui-toolkit

Inspired by
https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/default/weather-webview
https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/frameworks/hello-world-react-cra

*/

let outputChannel: vscode.OutputChannel

// Import auxiliary window service types
interface IAuxiliaryWindowOpenOptions {
	bounds?: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	mode?: 'normal' | 'float';
	nativeTitlebar?: boolean;
}

class AutoGenExtension {
	private panel: vscode.WebviewPanel | undefined;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly outputChannel: vscode.OutputChannel
	) {}

	public async openAssistant(): Promise<void> {
		if (this.panel) {
			this.panel.reveal();
			return;
		}

		// Create webview panel
		this.panel = vscode.window.createWebviewPanel(
			'autogen-panel-view',
			'AutoGen Code Builder',
			vscode.ViewColumn.Two,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [this.context.extensionUri]
			}
		);

		// Set panel icon
		this.panel.iconPath = {
			light: vscode.Uri.joinPath(this.context.extensionUri, "assets", "icons", "robot_panel_light.png"),
			dark: vscode.Uri.joinPath(this.context.extensionUri, "assets", "icons", "robot_panel_dark.png"),
		};

		// Set webview HTML content with floating panel
		this.panel.webview.html = `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<title>AutoGen Assistant</title>
			<style>
				html, body {
					margin: 0;
					padding: 0;
					height: 100%;
					overflow: hidden;
					background-color: var(--vscode-editor-background);
				}
				#floating {
					width: 400px;
					height: 300px;
					background-color: var(--vscode-editor-background);
					color: var(--vscode-editor-foreground);
					border: 1px solid var(--vscode-panel-border);
					position: absolute;
					top: 50px;
					left: 50px;
					cursor: move;
					padding: 10px;
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
					user-select: none;
					border-radius: 6px;
				}
				#floating-header {
					padding: 8px;
					background-color: var(--vscode-titleBar-activeBackground);
					border-bottom: 1px solid var(--vscode-panel-border);
					display: flex;
					justify-content: space-between;
					align-items: center;
					border-radius: 6px 6px 0 0;
				}
				#floating-content {
					padding: 16px;
					height: calc(100% - 80px);
					overflow-y: auto;
				}
				.title {
					margin: 0;
					font-size: 14px;
					font-weight: 500;
				}
				.close-button {
					background: none;
					border: none;
					color: var(--vscode-editor-foreground);
					cursor: pointer;
					font-size: 16px;
					padding: 4px 8px;
				}
				.close-button:hover {
					background-color: var(--vscode-titleBar-inactiveBackground);
					border-radius: 4px;
				}
			</style>
		</head>
		<body>
			<div id="floating">
				<div id="floating-header">
					<span class="title">AutoGen Assistant</span>
					<button class="close-button" id="close-button">×</button>
				</div>
				<div id="floating-content">
					<p>Welcome to AutoGen Assistant!</p>
					<p>This is a floating panel that you can drag around.</p>
				</div>
			</div>
			<script>
				(function() {
					const floating = document.getElementById('floating');
					const header = document.getElementById('floating-header');
					const closeButton = document.getElementById('close-button');
					let offsetX = 0, offsetY = 0, isDragging = false;

					header.addEventListener('mousedown', (e) => {
						if (e.target === closeButton) return;
						isDragging = true;
						offsetX = floating.offsetLeft - e.clientX;
						offsetY = floating.offsetTop - e.clientY;
						floating.style.opacity = '0.8';
					});

					document.addEventListener('mouseup', () => {
						isDragging = false;
						floating.style.opacity = '1';
					});

					document.addEventListener('mousemove', (e) => {
						if (isDragging) {
							e.preventDefault();
							const newLeft = e.clientX + offsetX;
							const newTop = e.clientY + offsetY;
							
							// Keep panel within viewport bounds
							const maxX = window.innerWidth - floating.offsetWidth;
							const maxY = window.innerHeight - floating.offsetHeight;
							
							floating.style.left = Math.max(0, Math.min(newLeft, maxX)) + 'px';
							floating.style.top = Math.max(0, Math.min(newTop, maxY)) + 'px';
						}
					});

					closeButton.addEventListener('click', () => {
						// Post message to extension to close panel
						vscode.postMessage({ type: 'close' });
					});

					// Handle window resize
					window.addEventListener('resize', () => {
						const rect = floating.getBoundingClientRect();
						const maxX = window.innerWidth - floating.offsetWidth;
						const maxY = window.innerHeight - floating.offsetHeight;
						
						if (rect.right > window.innerWidth) {
							floating.style.left = Math.max(0, maxX) + 'px';
						}
						if (rect.bottom > window.innerHeight) {
							floating.style.top = Math.max(0, maxY) + 'px';
						}
					});

					// Acquire vscode API
					const vscode = acquireVsCodeApi();
				})();
			</script>
		</body>
		</html>`;

		// Handle messages from the webview
		this.panel.webview.onDidReceiveMessage(
			message => {
				switch (message.type) {
					case 'close':
						this.panel?.dispose();
						break;
				}
			},
			undefined,
			this.context.subscriptions
		);

		// Create and resolve provider
		const provider = new AutoGenProvider(this.context, this.outputChannel);
		await provider.resolveWebviewView(this.panel);

		// Handle panel disposal
		this.panel.onDidDispose(() => {
			this.panel = undefined;
		});
	}

	public async initialize(): Promise<void> {
		// Auto-open on activation with a delay to ensure VS Code is ready
		// Don't register commands here, as they will be registered in the activate function
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel("AutoGen")
	context.subscriptions.push(outputChannel)

	Logger.initialize(outputChannel)
	Logger.log("AutoGen extension activated")

	// Initialize extension
	const extension = new AutoGenExtension(context, outputChannel);
	extension.initialize();

	// Create a default provider for API access
	const defaultProvider = new AutoGenProvider(context, outputChannel)
	
	// Register command to move to secondary sidebar
	context.subscriptions.push(
		vscode.commands.registerCommand("AutoGen.moveToSecondary", async () => {
			// Move view to secondary sidebar
			await vscode.commands.executeCommand('vscode.moveViews', {
				viewIds: ['autogen-main-view-secondary'],
				destination: 'workbench.view.extension.autogen-explorer'
			});
			// Set context to show in secondary
			await vscode.commands.executeCommand('setContext', 'isInSecondaryBar', true);
		})
	);

	// Register the sidebar view provider
	const sidebarProvider = new AutoGenProvider(context, outputChannel)
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"autogen-main-view-primary",
			sidebarProvider,
			{
				webviewOptions: {
					retainContextWhenHidden: true
				}
			}
		)
	);

	// Register panel view provider
	const panelProvider = new AutoGenProvider(context, outputChannel)
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"autogen-panel-view",
			panelProvider,
			{
				webviewOptions: {
					retainContextWhenHidden: true
				}
			}
		)
	);

	// Also register for secondary view
	const secondaryProvider = new AutoGenProvider(context, outputChannel)
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"autogen-main-view-secondary",
			secondaryProvider,
			{
				webviewOptions: {
					retainContextWhenHidden: true
				}
			}
		)
	);

	// Keep track of open panels and their providers
	const panelMap = new Map<string, { panel: vscode.WebviewPanel, provider: AutoGenProvider }>();

	// Define the openAutoGenPanel function - our single point of opening panels
	const openAutoGenPanel = async () => {
		// Always open in right column (Three) for consistency
		const viewColumn = vscode.ViewColumn.Three;
		const title = "AutoGen Code Builder";
		
		// Use a constant panel key to ensure we only ever have one panel
		const panelKey = `autogen-panel`;
		
		// Check if we already have a panel
		if (panelMap.has(panelKey)) {
			const existingPanel = panelMap.get(panelKey);
			if (existingPanel && existingPanel.panel) {
				existingPanel.panel.reveal();
				return existingPanel.panel;
			}
		}
		
		Logger.log(`Opening AutoGen panel`)
		const provider = new AutoGenProvider(context, outputChannel)
		
		// Create webview panel in column Three (right side)
		const panel = vscode.window.createWebviewPanel(
			AutoGenProvider.tabPanelId, 
			title, 
			viewColumn,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [context.extensionUri],
			}
		)
		
		panel.iconPath = {
			light: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "robot_panel_light.png"),
			dark: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "robot_panel_dark.png"),
		}
		
		// Save reference to panel
		panelMap.set(panelKey, { panel, provider });
		
		// Handle panel disposal
		panel.onDidDispose(() => {
			// Remove from our tracking map
			panelMap.delete(panelKey);
			// Also dispose the provider
			provider.dispose();
		});
		
		// Resolve the webview
		provider.resolveWebviewView(panel)
		
		return panel
	}

	// Function to open AutoGen in a floating window
	const openAutoGenInFloatingWindow = async () => {
		// First create the panel in the current window
		const panel = await openAutoGenPanel();
		
		// Then move it to a new window
		if (panel) {
			await vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow');
			Logger.log("Moved AutoGen panel to a floating window");
		}
	};

	// Register all panel-related commands - CONSOLIDATED COMMAND REGISTRATION
	context.subscriptions.push(
		// Register main panel opening commands (use only one command registration per command name)
		vscode.commands.registerCommand("autogen.openAssistant", async () => {
			await openAutoGenPanel();
		}),
		vscode.commands.registerCommand("AutoGen.openSecondPanel", async () => {
			await openAutoGenPanel();
		}),
		vscode.commands.registerCommand("AutoGen.openWithLogo", async () => {
			await openAutoGenPanel();
		}),
		
		// Command to open in a floating window
		vscode.commands.registerCommand("autogen.openInFloatingWindow", async () => {
			await openAutoGenInFloatingWindow();
		}),
		
		// Register utility commands for panel functionality
		vscode.commands.registerCommand("autogen.newTask", () => {
			const activeProvider = getActiveProvider();
			if (activeProvider) {
				activeProvider.postMessageToWebview({ 
					type: 'action',
					action: 'chatButtonClicked'
				});
			}
		}),
		vscode.commands.registerCommand("autogen.settings", () => {
			const activeProvider = getActiveProvider();
			if (activeProvider) {
				activeProvider.postMessageToWebview({ 
					type: 'action',
					action: 'settingsButtonClicked'
				});
			}
		})
	);

	// Set the extension's assistantOpen method to use our centralized panel manager
	extension.openAssistant = async () => {
		await openAutoGenPanel();
	};

	// DISABLE auto-opening on startup
	// setTimeout(() => {
	//     openAutoGenPanel();
	// }, 1500);

	// Helper function to get the active provider
	const getActiveProvider = (): AutoGenProvider | undefined => {
		// Get the active provider from the panel map
		for (const [_, entry] of panelMap) {
			if (entry.panel.visible) {
				return entry.provider;
			}
		}
		return defaultProvider; // Fallback to default provider
	};

	// Helper function to post messages to the active provider
	const postToActiveProvider = async (message: any) => {
		const activeProvider = getActiveProvider();
		if (activeProvider) {
			await activeProvider.postMessageToWebview(message);
		}
	};

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand("AutoGen.plusButtonClicked", async () => {
			Logger.log("Plus button Clicked")
			const activeProvider = getActiveProvider();
			if (activeProvider) {
				await activeProvider.clearTask();
				await activeProvider.postStateToWebview();
				await activeProvider.postMessageToWebview({
					type: "action",
					action: "chatButtonClicked",
				});
			}
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("AutoGen.mcpButtonClicked", () => {
			postToActiveProvider({
				type: "action",
				action: "mcpButtonClicked",
			});
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("AutoGen.settingsButtonClicked", () => {
			postToActiveProvider({
				type: "action",
				action: "settingsButtonClicked",
			});
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("AutoGen.historyButtonClicked", () => {
			postToActiveProvider({
				type: "action",
				action: "historyButtonClicked",
			});
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("AutoGen.accountButtonClicked", () => {
			postToActiveProvider({
				type: "action",
				action: "accountButtonClicked",
			});
		}),
	)

	// Diff view provider
	const diffContentProvider = new (class implements vscode.TextDocumentContentProvider {
		provideTextDocumentContent(uri: vscode.Uri): string {
			return Buffer.from(uri.query, "base64").toString("utf-8")
		}
	})()
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(DIFF_VIEW_URI_SCHEME, diffContentProvider))

	// URI Handler
	const handleUri = async (uri: vscode.Uri) => {
		console.log("URI Handler called with:", {
			path: uri.path,
			query: uri.query,
			scheme: uri.scheme,
		})

		const path = uri.path
		const query = new URLSearchParams(uri.query.replace(/\+/g, "%2B"))
		const visibleProvider = getActiveProvider()
		if (!visibleProvider) {
			return
		}
		switch (path) {
			case "/openrouter": {
				const code = query.get("code")
				if (code) {
					await visibleProvider.handleOpenRouterCallback(code)
				}
				break
			}
			case "/auth": {
				const token = query.get("token")
				const state = query.get("state")
				const apiKey = query.get("apiKey")

				console.log("Auth callback received:", {
					token: token,
					state: state,
					apiKey: apiKey,
				})

				// Validate state parameter
				if (!(await visibleProvider.validateAuthState(state))) {
					vscode.window.showErrorMessage("Invalid auth state")
					return
				}

				if (token && apiKey) {
					await visibleProvider.handleAuthCallback(token, apiKey)
				}
				break
			}
			default:
				break
		}
	}
	context.subscriptions.push(vscode.window.registerUriHandler({ handleUri }))
	
	return createAutoGenAPI(outputChannel, defaultProvider)
}

// This method is called when your extension is deactivated
export function deactivate() {
	telemetryService.shutdown()
	Logger.log("AutoGen extension deactivated")
}

// TODO: Find a solution for automatically removing DEV related content from production builds.
//  This type of code is fine in production to keep. We just will want to remove it from production builds
//  to bring down built asset sizes.
//
// This is a workaround to reload the extension when the source code changes
// since vscode doesn't support hot reload for extensions
const { IS_DEV, DEV_WORKSPACE_FOLDER } = process.env

if (IS_DEV && IS_DEV !== "false") {
	assert(DEV_WORKSPACE_FOLDER, "DEV_WORKSPACE_FOLDER must be set in development")
	const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(DEV_WORKSPACE_FOLDER, "src/**/*"))

	watcher.onDidChange(({ scheme, path }) => {
		console.info(`${scheme} ${path} changed. Reloading VSCode...`)

		vscode.commands.executeCommand("workbench.action.reloadWindow")
	})
}
