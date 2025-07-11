import * as vscode from "vscode"
import { getShell } from "../../utils/shell"

export interface TerminalInfo {
	terminal: vscode.Terminal
	busy: boolean
	lastCommand: string
	id: number
	shellIntegrationAttempted?: boolean
}

// Although vscode.window.terminals provides a list of all open terminals, there's no way to know whether they're busy or not (exitStatus does not provide useful information for most commands). In order to prevent creating too many terminals, we need to keep track of terminals through the life of the extension, as well as session specific terminals for the life of a task (to get latest unretrieved output).
// Since we have promises keeping track of terminal processes, we get the added benefit of keep track of busy terminals even after a task is closed.
export class TerminalRegistry {
	private static terminals: TerminalInfo[] = []
	private static nextTerminalId = 1
	private static shellPath: string | null = null

	static createTerminal(cwd?: string | vscode.Uri | undefined): TerminalInfo {
		// Detect preferred shell only once
		if (this.shellPath === null) {
			try {
				this.shellPath = getShell();
				console.log(`Detected shell path: ${this.shellPath}`);
			} catch (error) {
				console.warn("Failed to detect shell path:", error);
				this.shellPath = ""; // Set to empty string to avoid retrying
			}
		}

		// Create terminal with detected shell if available
		const terminal = vscode.window.createTerminal({
			cwd,
			name: "AutoGen",
			iconPath: new vscode.ThemeIcon("robot"),
			...(this.shellPath ? { shellPath: this.shellPath } : {})
		})
		
		const newInfo: TerminalInfo = {
			terminal,
			busy: false,
			lastCommand: "",
			id: this.nextTerminalId++,
			shellIntegrationAttempted: false
		}
		this.terminals.push(newInfo)
		return newInfo
	}

	static getTerminal(id: number): TerminalInfo | undefined {
		const terminalInfo = this.terminals.find((t) => t.id === id)
		if (terminalInfo && this.isTerminalClosed(terminalInfo.terminal)) {
			this.removeTerminal(id)
			return undefined
		}
		return terminalInfo
	}

	static updateTerminal(id: number, updates: Partial<TerminalInfo>) {
		const terminal = this.getTerminal(id)
		if (terminal) {
			Object.assign(terminal, updates)
		}
	}

	static removeTerminal(id: number) {
		this.terminals = this.terminals.filter((t) => t.id !== id)
	}

	static getAllTerminals(): TerminalInfo[] {
		this.terminals = this.terminals.filter((t) => !this.isTerminalClosed(t.terminal))
		return this.terminals
	}

	// The exit status of the terminal will be undefined while the terminal is active. (This value is set when onDidCloseTerminal is fired.)
	private static isTerminalClosed(terminal: vscode.Terminal): boolean {
		return terminal.exitStatus !== undefined
	}
}
