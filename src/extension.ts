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

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel("AutoGen")
	context.subscriptions.push(outputChannel)

	Logger.initialize(outputChannel)
	Logger.log("AutoGen extension activated")

	// Create a default provider for API access
	const defaultProvider = new AutoGenProvider(context, outputChannel)
	
	// Keep track of open panels and their providers
	const panelMap = new Map<string, { panel: vscode.WebviewPanel, provider: AutoGenProvider }>();

	// Define the openAutoGenPanel function
	const openAutoGenPanel = async () => {
		// Always open in right column (Three) for consistency
		const viewColumn = vscode.ViewColumn.Three;
		const title = "AutoGen";
		
		const panelKey = `column-${viewColumn}-${title}`;
		
		// Check if we already have a panel with this ID
		if (panelMap.has(panelKey)) {
			const existingPanel = panelMap.get(panelKey);
			if (existingPanel && existingPanel.panel) {
				existingPanel.panel.reveal();
				return existingPanel.panel;
			}
		}
		
		Logger.log(`Opening AutoGen in right panel`)
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

	// Open a single instance on activation
	setTimeout(() => {
		// Always open a single panel on the right side on startup
		openAutoGenPanel();
	}, 1000);

	// Command to open in right panel or focus existing panel
	context.subscriptions.push(
		vscode.commands.registerCommand("AutoGen.openSecondPanel", async () => {
			await openAutoGenPanel();
		})
	);

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
