import * as vscode from "vscode"
import * as fs from "fs/promises"
import * as path from "path"
import { Browser, Page, ScreenshotOptions, TimeoutError, launch } from "puppeteer-core"
// @ts-ignore
import PCR from "puppeteer-chromium-resolver"
import pWaitFor from "p-wait-for"
import delay from "delay"
import { fileExistsAtPath } from "../../utils/fs"
import { BrowserActionResult } from "../../shared/ExtensionMessage"
import { BrowserSettings } from "../../shared/BrowserSettings"
import { exec } from "child_process"
import { promisify } from "util"
import { McpServer } from "../../shared/mcp"

const execAsync = promisify(exec)

export class BrowserSessionWithMCP {
    private context: vscode.ExtensionContext
    private browser?: Browser
    private page?: Page
    private currentMousePosition?: string
    private mcpServerProcess?: any
    browserSettings: BrowserSettings

    constructor(context: vscode.ExtensionContext, browserSettings: BrowserSettings) {
        this.context = context
        this.browserSettings = browserSettings
    }

    // Note: startMcpServer/stopMcpServer are likely redundant now as McpHub manages server processes.
    // Keeping them for now but they might need removal if causing conflicts.
    async startMcpServer(): Promise<void> {
        const serverPath = path.join(
            this.context.extensionPath,
            'browser-tools',
            'browser-tools-mcp',
            'browser-tools-server',
            'browser-connector.ts'
        )

        try {
            console.log(`[DEPRECATED?] Attempting to start MCP server with: node ${serverPath}`);
            this.mcpServerProcess = execAsync(`node "${serverPath}"`)
            console.log('[DEPRECATED?] Browser-tools MCP server process initiated.');
             this.mcpServerProcess.stdout?.on('data', (data: any) => { console.log(`[DEPRECATED?] MCP Server stdout: ${data}`); });
             this.mcpServerProcess.stderr?.on('data', (data: any) => { console.error(`[DEPRECATED?] MCP Server stderr: ${data}`); });
             this.mcpServerProcess.on('close', (code: any) => { console.log(`[DEPRECATED?] MCP server process closed with code ${code}`); });
             this.mcpServerProcess.on('error', (err: any) => { console.error('[DEPRECATED?] Failed to start MCP server process:', err); });
        } catch (error) {
            console.error('[DEPRECATED?] Error executing MCP server start command:', error)
            // Do not throw, as McpHub should handle the actual start
        }
    }

    async stopMcpServer(): Promise<void> {
         if (this.mcpServerProcess) {
            console.log('[DEPRECATED?] Attempting to stop MCP server process...');
            try {
                const killed = this.mcpServerProcess.kill();
                 if (killed) { console.log('[DEPRECATED?] Browser-tools MCP server process killed successfully.'); }
                 else { console.warn('[DEPRECATED?] Failed to kill MCP server process.'); }
                this.mcpServerProcess = undefined;
            } catch (error) {
                console.error('[DEPRECATED?] Failed to stop MCP server:', error)
            }
        } else {
             console.log('[DEPRECATED?] No MCP server process to stop.');
        }
    }

    async launchBrowser(): Promise<void> {
        // await this.startMcpServer() // REMOVED - McpHub handles this

        const stats = await this.ensureChromiumExists()
        this.browser = await stats.puppeteer.launch({
            args: [
                "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            ],
            executablePath: stats.executablePath,
            defaultViewport: this.browserSettings.viewport,
            headless: this.browserSettings.headless,
        })

        this.page = await this.browser?.newPage()
    }

    async closeBrowser(): Promise<BrowserActionResult> {
        // await this.stopMcpServer() // REMOVED - McpHub handles this

        if (this.browser || this.page) {
            console.log("closing browser...")
            await this.browser?.close().catch(() => {})
            this.browser = undefined
            this.page = undefined
            this.currentMousePosition = undefined
        }
        return {}
    }

    private async ensureChromiumExists(): Promise<{puppeteer: {launch: typeof launch}, executablePath: string}> {
        const globalStoragePath = this.context?.globalStorageUri?.fsPath
        if (!globalStoragePath) {
            throw new Error("Global storage uri is invalid")
        }

        const puppeteerDir = path.join(globalStoragePath, "puppeteer")
        const dirExists = await fileExistsAtPath(puppeteerDir)
        if (!dirExists) {
            await fs.mkdir(puppeteerDir, { recursive: true })
        }

        const chromeExecutablePath = vscode.workspace.getConfiguration("AutoGen").get<string>("chromeExecutablePath")
        if (chromeExecutablePath && !(await fileExistsAtPath(chromeExecutablePath))) {
            throw new Error(`Chrome executable not found at path: ${chromeExecutablePath}`)
        }

        const stats = chromeExecutablePath
            ? { puppeteer: require("puppeteer-core"), executablePath: chromeExecutablePath }
            : await PCR({ downloadPath: puppeteerDir })

        return stats
    }

    async doAction(action: (page: Page) => Promise<void>): Promise<BrowserActionResult> {
        if (!this.page) {
            throw new Error("Browser is not launched")
        }

        const logs: string[] = []
        let lastLogTs = Date.now()

        const consoleListener = (msg: any) => {
            if (msg.type() === "log") {
                logs.push(msg.text())
            } else {
                logs.push(`[${msg.type()}] ${msg.text()}`)
            }
            lastLogTs = Date.now()
        }

        const errorListener = (err: Error) => {
            logs.push(`[Page Error] ${err.toString()}`)
            lastLogTs = Date.now()
        }

        this.page.on("console", consoleListener)
        this.page.on("pageerror", errorListener)

        try {
            await action(this.page)
        } catch (err) {
            if (!(err instanceof TimeoutError)) {
                logs.push(`[Error] ${err.toString()}`)
            }
        }

        await pWaitFor(() => Date.now() - lastLogTs >= 500, {
            timeout: 3_000,
            interval: 100,
        }).catch(() => {})

        let screenshotBase64 = await this.page.screenshot({
            encoding: "base64",
            type: "webp",
        })
        let screenshot = `data:image/webp;base64,${screenshotBase64}`

        if (!screenshotBase64) {
            screenshotBase64 = await this.page.screenshot({
                encoding: "base64",
                type: "png",
            })
            screenshot = `data:image/png;base64,${screenshotBase64}`
        }

        if (!screenshotBase64) {
            throw new Error("Failed to take screenshot.")
        }

        this.page.off("console", consoleListener)
        this.page.off("pageerror", errorListener)

        return {
            screenshot,
            logs: logs.join("\n"),
            currentUrl: this.page.url(),
            currentMousePosition: this.currentMousePosition,
        }
    }

    async navigateToUrl(url: string): Promise<BrowserActionResult> {
        return this.doAction(async (page) => {
            await page.goto(url, {
                timeout: 7_000,
                waitUntil: ["domcontentloaded", "networkidle2"],
            })
            await this.waitTillHTMLStable(page)
        })
    }

    private async waitTillHTMLStable(page: Page, timeout = 5_000) {
        const checkDurationMsecs = 500
        const maxChecks = timeout / checkDurationMsecs
        let lastHTMLSize = 0
        let checkCounts = 1
        let countStableSizeIterations = 0
        const minStableSizeIterations = 3

        while (checkCounts++ <= maxChecks) {
            let html = await page.content()
            let currentHTMLSize = html.length

            if (lastHTMLSize !== 0 && currentHTMLSize === lastHTMLSize) {
                countStableSizeIterations++
            } else {
                countStableSizeIterations = 0
            }

            if (countStableSizeIterations >= minStableSizeIterations) {
                break
            }

            lastHTMLSize = currentHTMLSize
            await delay(checkDurationMsecs)
        }
    }

    async click(coordinate: string): Promise<BrowserActionResult> {
        const [x, y] = coordinate.split(",").map(Number)
        return this.doAction(async (page) => {
            let hasNetworkActivity = false
            const requestListener = () => {
                hasNetworkActivity = true
            }
            page.on("request", requestListener)

            await page.mouse.click(x, y)
            this.currentMousePosition = coordinate

            await delay(100)

            if (hasNetworkActivity) {
                await page
                    .waitForNavigation({
                        waitUntil: ["domcontentloaded", "networkidle2"],
                        timeout: 7000,
                    })
                    .catch(() => {})
                await this.waitTillHTMLStable(page)
            }

            page.off("request", requestListener)
        })
    }

    async type(text: string): Promise<BrowserActionResult> {
        return this.doAction(async (page) => {
            await page.keyboard.type(text)
        })
    }

    async scrollDown(): Promise<BrowserActionResult> {
        return this.doAction(async (page) => {
            await page.evaluate(() => {
                window.scrollBy({
                    top: 600,
                    behavior: "auto",
                })
            })
            await delay(300)
        })
    }

    async scrollUp(): Promise<BrowserActionResult> {
        return this.doAction(async (page) => {
            await page.evaluate(() => {
                window.scrollBy({
                    top: -600,
                    behavior: "auto",
                })
            })
            await delay(300)
        })
    }
}

// Register MCP server when extension activates
// Returns true if the settings file was successfully updated or already contained the server, false otherwise.
export async function registerBrowserToolsMCP(context: vscode.ExtensionContext): Promise<boolean> {
    let settingsWriteSuccess = false;
    const functionName = "registerBrowserToolsMCP"; // For logging context
    console.log(`[${functionName}] Starting registration...`);

    // Define paths
    const browserToolsDir = path.join(context.extensionPath, 'browser-tools', 'browser-tools-mcp', 'browser-tools-server');
    const connectorPath = path.join(browserToolsDir, 'browser-connector.ts');
    const absoluteConnectorPath = path.resolve(connectorPath); // Ensure absolute path for settings

    // Ensure browser-tools directory exists
    try {
        console.log(`[${functionName}] Ensuring directory exists: ${browserToolsDir}`);
        await fs.mkdir(browserToolsDir, { recursive: true });
        console.log(`[${functionName}] Directory ensured.`);
    } catch (error) {
        console.error(`[${functionName}] CRITICAL: Failed to create browser tools directory: ${browserToolsDir}`, error);
        vscode.window.showErrorMessage(`Failed to create directory for Browser Tools MCP server. Check permissions.`);
        return false; // Cannot proceed without the directory
    }

    // Define browser-connector.ts content
    const connectorContent = `#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
    CallToolRequestSchema,
    ErrorCode,
    ListResourcesRequestSchema,
    ListResourceTemplatesRequestSchema,
    ListToolsRequestSchema,
    McpError,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

class BrowserToolsServer {
    private server: Server

    constructor() {
        this.server = new Server(
            {
                name: 'browser-tools',
                version: '1.0.0',
            },
            {
                capabilities: {
                    resources: {},
                    tools: {},
                },
            }
        )

        this.setupToolHandlers()

        // Error handling
        this.server.onerror = (error) => console.error('[MCP Error]', error)
        process.on('SIGINT', async () => {
            await this.server.close()
            process.exit(0)
        })
    }

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'navigate',
                    description: 'Navigate to a URL',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            url: { type: 'string' }
                        },
                        required: ['url']
                    }
                },
                {
                    name: 'take_screenshot',
                    description: 'Take a screenshot of current page',
                    inputSchema: { type: 'object', properties: {} }
                }
            ]
        }))

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            if (request.params.name === 'navigate') {
                return {
                    content: [{ type: 'text', text: 'Navigated successfully' }]
                }
            } else if (request.params.name === 'take_screenshot') {
                return {
                    content: [{ type: 'text', text: 'Screenshot taken' }]
                }
            }
            throw new McpError(ErrorCode.MethodNotFound, 'Unknown tool')
        })
    }

    async run() {
        const transport = new StdioServerTransport()
        await this.server.connect(transport)
        console.error('Browser Tools MCP server running on stdio')
    }
}

const server = new BrowserToolsServer()
server.run().catch(console.error)`;

    // Write browser-connector.ts file
    try {
        console.log(`[${functionName}] Writing connector file to: ${connectorPath}`);
        await fs.writeFile(connectorPath, connectorContent);
        console.log(`[${functionName}] Successfully wrote connector file.`);
    } catch (error) {
         console.error(`[${functionName}] CRITICAL: Failed to write connector file: ${connectorPath}`, error);
         vscode.window.showErrorMessage(`Failed to write Browser Tools MCP server script. Check permissions.`);
         return false; // Cannot proceed without the script
    }

    // Add server to MCP settings
    const settingsDir = path.join(context.globalStorageUri.fsPath, 'settings');
    try {
        console.log(`[${functionName}] Ensuring settings directory exists: ${settingsDir}`);
        await fs.mkdir(settingsDir, { recursive: true });
        console.log(`[${functionName}] Settings directory ensured.`);
    } catch (error) {
        console.error(`[${functionName}] CRITICAL: Failed to create settings directory: ${settingsDir}`, error);
        vscode.window.showErrorMessage(`Failed to create MCP settings directory. Check permissions.`);
        return false; // Cannot proceed without settings directory
    }

    const mcpSettingsPath = path.join(settingsDir, 'cline_mcp_settings.json');
    let mcpSettings: { mcpServers: Record<string, any> } = { mcpServers: {} };
    let readError = null;

    // Read existing settings
    try {
        console.log(`[${functionName}] Attempting to read MCP settings from: ${mcpSettingsPath}`);
        const existingSettings = await fs.readFile(mcpSettingsPath, 'utf-8');
        console.log(`[${functionName}] Read existing MCP settings content.`);
        mcpSettings = JSON.parse(existingSettings);
        console.log(`[${functionName}] Successfully parsed existing MCP settings.`);
    } catch (err: any) {
        readError = err; // Store error to log later
        if (err.code === 'ENOENT') {
            console.log(`[${functionName}] MCP settings file not found at ${mcpSettingsPath}. Creating a new one.`);
        } else {
            console.warn(`[${functionName}] Error reading/parsing MCP settings file at ${mcpSettingsPath}. Will overwrite. Error: ${err}`);
            // Show warning but proceed to overwrite
            vscode.window.showWarningMessage(`Could not read existing MCP settings file. It might be corrupted. A new configuration will be created.`);
        }
        mcpSettings = { mcpServers: {} }; // Ensure mcpServers exists even if read fails/file missing
    }

    // Ensure mcpServers property exists
    if (!mcpSettings.mcpServers) {
        console.log(`[${functionName}] mcpServers property missing after read/parse, initializing.`);
        mcpSettings.mcpServers = {};
    }

    // Add/Update browser-tools entry
    console.log(`[${functionName}] Adding/updating 'browser-tools' entry with connector path: ${absoluteConnectorPath}`);
    mcpSettings.mcpServers['browser-tools'] = {
        command: "node",
        // IMPORTANT: Use the *absolute* path for the script argument
        args: [absoluteConnectorPath], // Use resolved absolute path
        env: {},
        disabled: false,
        autoApprove: []
    };

    // Write updated settings back
    try {
        const settingsJsonString = JSON.stringify(mcpSettings, null, 2);
        console.log(`[${functionName}] Attempting to write updated MCP settings to: ${mcpSettingsPath}`);
        await fs.writeFile(mcpSettingsPath, settingsJsonString);
        console.log(`[${functionName}] Successfully wrote updated MCP settings file.`);
        settingsWriteSuccess = true; // Mark as success only if write succeeds
        if (readError && readError.code !== 'ENOENT') { // Don't warn if the file just didn't exist initially
             console.warn(`[${functionName}] Note: Although settings were written, there was an error reading the original file: ${readError}`);
        }
    } catch (error) {
        console.error(`[${functionName}] CRITICAL: Failed to write MCP settings file: ${mcpSettingsPath}`, error);
        settingsWriteSuccess = false; // Mark as failure
        vscode.window.showErrorMessage(`Error saving MCP settings: ${error instanceof Error ? error.message : String(error)}`); // Show error to user
    }

    // Return whether the settings file write was successful
    console.log(`[${functionName}] finished. Settings write success: ${settingsWriteSuccess}`);
    return settingsWriteSuccess;
}
