# ExtensionView Integration Guide

## Overview

This document explains how the ExtensionView is integrated with the AutoGen Code Builder extension and provides guidance for integrating it with other similar extensions.

## Architecture Overview

The ExtensionView integration consists of several key components:

### 1. Core Integration Points

#### A. Extension Registration (`src/extension.ts`)

```typescript
// Command registration for opening the ExtensionView
let autoGenBuilderDisposable = vscode.commands.registerCommand("extension.openAutoGenBuilder", () => {
	const extensionView = new ExtensionView(context)
})
```

#### B. ExtensionView Class (`src/extentionView/extensionView.ts`)

- Creates a webview panel with custom HTML/CSS/JS
- Handles bidirectional communication between webview and extension host
- Integrates with AutoGenProvider for AI task automation
- Manages component creation and file operations

#### C. Component Architecture

```
src/extentionView/
├── extensionView.ts          # Main ExtensionView class
├── styles.css               # Global styles
└── components/
    ├── Sidebar.ts           # Navigation sidebar
    ├── MainContent.ts       # Main content area
    ├── DesignPanel.ts       # Design tools panel
    ├── DocumentationPanel.ts # Documentation panel
    ├── WebsiteTemplatesPanel.ts # Template panel
    ├── SettingsPanel.ts     # Settings panel
    └── setups/              # Framework setup utilities
        ├── reactWithTailwindSetup.ts
        ├── nextjsWithTailwindSetup.ts
        ├── reactWithBootstrapSetup.ts
        └── nextjsWithBootstrapSetup.ts
```

## Key Integration Features

### 1. Message Communication System

The ExtensionView uses a sophisticated message passing system:

```typescript
// From webview to extension host
this.panel.webview.onDidReceiveMessage(async (message) => {
	switch (message.command) {
		case "createComponentFile":
			// Handle component creation
			break
		case "initializePrompt":
			// Trigger AutoGen task
			break
		case "setupReactTailwind":
			// Setup React + Tailwind project
			break
		// ... other commands
	}
})
```

### 2. AutoGenProvider Integration

The ExtensionView integrates with AutoGenProvider to trigger AI tasks:

```typescript
// Get AutoGen provider instance
const autoGenProvider = AutoGenProvider.getVisibleInstance()

// Trigger AI task with component data
await autoGenProvider.initAutoGenWithTask(prompt)
```

### 3. File System Operations

Handles component file creation and project setup:

```typescript
// Create component file
const targetPath = path.join(vscode.workspace.rootPath, cleanPath)
fs.writeFileSync(targetPath, componentCode, "utf-8")

// Trigger AutoGen analysis
const prompt = `Analyze the newly generated component...`
await autoGenProvider.initAutoGenWithTask(prompt)
```

## Integration with Another Extension

### Step 1: Copy Core Files

Copy the following files to your extension:

```
src/extentionView/
├── extensionView.ts
├── styles.css
└── components/ (entire directory)
```

### Step 2: Update Package.json

Add the command registration:

```json
{
	"contributes": {
		"commands": [
			{
				"command": "yourExtension.openBuilder",
				"title": "Open Your Builder UI"
			}
		]
	}
}
```

### Step 3: Register Command in Extension.ts

```typescript
// In your activate() function
let builderDisposable = vscode.commands.registerCommand("yourExtension.openBuilder", () => {
	const extensionView = new ExtensionView(context)
})

context.subscriptions.push(builderDisposable)
```

### Step 4: Adapt AutoGenProvider Integration

If your extension has a different AI provider, modify the integration:

```typescript
// Replace AutoGenProvider with your provider
const yourProvider = YourProvider.getVisibleInstance()
if (yourProvider) {
	await yourProvider.initTaskWithPrompt(prompt)
}
```

### Step 5: Customize UI Components

Modify the component files to match your extension's needs:

#### A. Update Sidebar (`components/Sidebar.ts`)

```typescript
// Add/remove sidebar icons based on your features
<div class="sidebar-icon" data-panel="your-custom-panel">
  <!-- Your custom SVG icon -->
</div>
```

#### B. Update Main Content (`components/MainContent.ts`)

```typescript
// Add your custom panels
<div id="yourCustomPanel" class="framework-section hidden">
  <!-- Your custom panel content -->
</div>
```

#### C. Update Message Handlers (`extensionView.ts`)

```typescript
// Add your custom message handlers
case "yourCustomCommand":
  // Handle your custom functionality
  break;
```

## Message Communication Protocol

### From Webview to Extension Host

| Command                | Purpose                   | Parameters                                 |
| ---------------------- | ------------------------- | ------------------------------------------ |
| `createComponentFile`  | Create component file     | `filePath`, `componentCode`, `title`, etc. |
| `initializePrompt`     | Trigger AI task           | `prompt`                                   |
| `setupReactTailwind`   | Setup React + Tailwind    | None                                       |
| `setupNextjsTailwind`  | Setup Next.js + Tailwind  | None                                       |
| `setupReactBootstrap`  | Setup React + Bootstrap   | None                                       |
| `setupNextjsBootstrap` | Setup Next.js + Bootstrap | None                                       |

### From Extension Host to Webview

| Command            | Purpose            | Parameters        |
| ------------------ | ------------------ | ----------------- |
| `info`             | Show info message  | `message`         |
| `error`            | Show error message | `message`         |
| `componentCreated` | Confirm creation   | `success`, `path` |

## Customization Guide

### 1. Adding New Panels

1. Create a new component file in `components/`:

```typescript
// components/YourPanel.ts
export function getYourPanelHtml(): string {
	return `<div id="yourPanel">Your content</div>`
}
```

2. Add to sidebar in `components/Sidebar.ts`:

```typescript
<div class="sidebar-icon" data-panel="your-panel">
  <!-- Your icon SVG -->
</div>
```

3. Add to main content in `components/MainContent.ts`:

```typescript
<div id="yourPanel" class="framework-section hidden">
  ${getYourPanelHtml()}
</div>
```

4. Handle panel switching in `extensionView.ts`:

```typescript
case 'your-panel':
  if (panels.yourPanel) {
    panels.yourPanel.classList.remove('hidden');
    panels.yourPanel.classList.add('visible');
  }
  break;
```

### 2. Adding New Commands

1. Add message handler in `extensionView.ts`:

```typescript
case "yourNewCommand":
  // Your command logic
  break;
```

2. Send message from webview JavaScript:

```javascript
vscode.postMessage({
	command: "yourNewCommand",
	data: yourData,
})
```

### 3. Styling Customization

Modify `styles.css` and component-specific CSS files to match your extension's theme:

```css
:root {
	--your-primary: #your-color;
	--your-secondary: #your-color;
	/* Update color variables */
}
```

## Best Practices

### 1. Error Handling

Always wrap message handlers in try-catch blocks:

```typescript
try {
	// Your logic here
} catch (error: any) {
	console.error("Error:", error)
	vscode.window.showErrorMessage(`Error: ${error.message}`)
}
```

### 2. State Management

Use a centralized state object for webview state:

```javascript
const state = {
	activePanel: "framework",
	selectedOptions: {},
	// ... other state
}
```

### 3. Resource Management

Properly dispose of resources:

```typescript
this.panel.onDidDispose(() => {
	// Clean up resources
	this.panel = undefined
})
```

### 4. Security

Use proper CSP and validate all inputs:

```typescript
// Validate file paths
if (!vscode.workspace.rootPath) {
	throw new Error("No workspace found!")
}
```

## Troubleshooting

### Common Issues

1. **Webview not loading**: Check CSP settings and resource URIs
2. **Messages not received**: Verify message structure and command names
3. **File creation fails**: Check workspace permissions and paths
4. **AI integration fails**: Verify provider instance availability

### Debug Tips

1. Use `console.log` in both webview and extension code
2. Check VS Code Developer Tools for webview debugging
3. Use VS Code's output channel for logging
4. Test message flow with simple commands first

## Example Integration

Here's a minimal example of integrating with another extension:

```typescript
// yourExtension.ts
import { ExtensionView } from "./path/to/extensionView"

export function activate(context: vscode.ExtensionContext) {
	// Register your builder command
	let builderCommand = vscode.commands.registerCommand("yourExtension.openBuilder", () => {
		const builder = new ExtensionView(context)
	})

	context.subscriptions.push(builderCommand)
}
```

This integration guide provides a complete framework for integrating the ExtensionView with any VS Code extension that needs a sophisticated UI builder interface.
