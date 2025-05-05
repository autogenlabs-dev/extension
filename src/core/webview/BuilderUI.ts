import * as vscode from 'vscode';

export class BuilderUI {
    private static currentPanel: vscode.WebviewPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.extensionUri = extensionUri;

        // Set the webview's initial HTML content
        this.panel.webview.html = this.getHtmlForWebview();

        // Handle panel disposal
        this.panel.onDidDispose(() => BuilderUI.currentPanel = undefined);
    }

    public static show(extensionUri: vscode.Uri) {
        if (BuilderUI.currentPanel) {
            // If the panel is already open, reveal it
            BuilderUI.currentPanel.reveal(vscode.ViewColumn.One);
        } else {
            // Otherwise, create a new panel
            const panel = vscode.window.createWebviewPanel(
                'builderUI',
                'Builder UI',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                }
            );

            new BuilderUI(panel, extensionUri);
            BuilderUI.currentPanel = panel;
        }
    }

    private getHtmlForWebview(): string {
        // Get URIs for the built JS and CSS
        const webview = this.panel.webview;
        const buildPath = (file: string) =>
            webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'webview-ui', 'build', 'assets', file));

        const scriptUri = buildPath('index.js');
        const styleUri = buildPath('index.css');

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Builder UI</title>
                <link rel="stylesheet" href="${styleUri}">
            </head>
            <body>
                <div id="root"></div>
                <script type="module" src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }
}
