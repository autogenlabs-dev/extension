// type that represents json data that is sent from extension to webview, called ExtensionMessage and has 'type' enum which can be 'plusButtonClicked' or 'settingsButtonClicked' or 'hello'

import { GitCommit } from "../utils/git"
import { ApiConfiguration, ModelInfo } from "./api"
import { AutoApprovalSettings } from "./AutoApprovalSettings"
import { BrowserSettings } from "./BrowserSettings"
import { ChatSettings } from "./ChatSettings"
import { BalanceResponse, PaymentTransaction, UsageTransaction } from "./AutoGenAccount"
import { HistoryItem } from "./HistoryItem"
import { McpServer, McpMarketplaceCatalog, McpMarketplaceItem, McpDownloadResponse } from "./mcp"
import { TelemetrySetting } from "./TelemetrySetting"

// webview will hold state
export interface ExtensionMessage {
	type:
		| "action"
		| "state"
		| "selectedImages"
		| "ollamaModels"
		| "lmStudioModels"
		| "theme"
		| "workspaceUpdated"
		| "invoke"
		| "partialMessage"
		| "openRouterModels"
		| "openAiModels"
		| "mcpServers"
		| "relinquishControl"
		| "vsCodeLmModels"
		| "requestVsCodeLmModels"
		| "authCallback"
		| "mcpMarketplaceCatalog"
		| "mcpDownloadDetails"
		| "commitSearchResults"
		| "openGraphData"
		| "isImageUrlResult"
		| "didUpdateSettings"
		| "userCreditsBalance"
		| "userCreditsUsage"
		| "userCreditsPayments"
		| "totalTasksSize"
		// Native Filesystem Results/Errors
		| "nativeFsReadFileResult"
		| "nativeFsWriteFileResult"
		| "nativeFsListDirectoryResult"
		| "nativeFsCreateDirectoryResult"
		| "nativeFsGetFileInfoResult"
		| "nativeFsRenameResult"
		| "nativeFsDeleteResult"
		| "nativeFsError"
	text?: string
	action?:
		| "chatButtonClicked"
		| "mcpButtonClicked"
		| "settingsButtonClicked"
		| "historyButtonClicked"
		| "didBecomeVisible"
		| "accountLoginClicked"
		| "accountLogoutClicked"
		| "accountButtonClicked"
	invoke?: Invoke
	state?: ExtensionState
	images?: string[]
	ollamaModels?: string[]
	lmStudioModels?: string[]
	vsCodeLmModels?: { vendor?: string; family?: string; version?: string; id?: string }[]
	filePaths?: string[]
	partialMessage?: AutoGenMessage
	openRouterModels?: Record<string, ModelInfo>
	openAiModels?: string[]
	mcpServers?: McpServer[]
	customToken?: string
	mcpMarketplaceCatalog?: McpMarketplaceCatalog
	error?: string
	mcpDownloadDetails?: McpDownloadResponse
	commits?: GitCommit[]
	openGraphData?: {
		title?: string
		description?: string
		image?: string
		url?: string
		siteName?: string
		type?: string
	}
	url?: string
	isImage?: boolean
	userCreditsBalance?: BalanceResponse
	userCreditsUsage?: UsageTransaction[]
	userCreditsPayments?: PaymentTransaction[]
	totalTasksSize?: number | null

	// --- Native Filesystem Payload (Extension -> Webview) ---
	path?: string // For results and errors
	content?: string // For readFile result
	entries?: { name: string; type: 'file' | 'directory' | 'unknown' }[] // For listDirectory result
	stats?: SerializableFileStat // Use the serializable version
	oldPath?: string // For rename result
	newPath?: string // For rename result
	operation?: string // For error messages
	// error?: string // Already exists
	// --- End Native Filesystem Payload ---
}

/**
 * A serializable representation of file status information,
 * mirroring essential parts of vscode.FileStat.
 */
export interface SerializableFileStat {
	type: 'file' | 'directory' | 'symbolicLink' | 'unknown';
	ctime: number; // Creation time in milliseconds since epoch
	mtime: number; // Modification time in milliseconds since epoch
	size: number;  // Size in bytes
}

export type Invoke = "sendMessage" | "primaryButtonClick" | "secondaryButtonClick"

export type Platform = "aix" | "darwin" | "freebsd" | "linux" | "openbsd" | "sunos" | "win32" | "unknown"

export const DEFAULT_PLATFORM = "unknown"

export interface ExtensionState {
	apiConfiguration?: ApiConfiguration
	mcpServers?: McpServer[] // Add MCP servers list
	autoApprovalSettings: AutoApprovalSettings
	browserSettings: BrowserSettings
	chatSettings: ChatSettings
	checkpointTrackerErrorMessage?: string
	autogenMessages: AutoGenMessage[]
	currentTaskItem?: HistoryItem
	customInstructions?: string
	mcpMarketplaceEnabled?: boolean
	planActSeparateModelsSetting: boolean
	platform: Platform
	shouldShowAnnouncement: boolean
	taskHistory: HistoryItem[]
	telemetrySetting: TelemetrySetting
	uriScheme?: string
	userInfo?: {
		displayName: string | null
		email: string | null
		photoURL: string | null
	}
	version: string
	vscMachineId: string
}

export interface AutoGenMessage {
	ts: number
	type: "ask" | "say"
	ask?: AutoGenAsk
	say?: AutoGenSay
	text?: string
	reasoning?: string
	images?: string[]
	partial?: boolean
	lastCheckpointHash?: string
	isCheckpointCheckedOut?: boolean
	conversationHistoryIndex?: number
	conversationHistoryDeletedRange?: [number, number] // for when conversation history is truncated for API requests
}

export type AutoGenAsk =
	| "followup"
	| "plan_mode_response"
	| "command"
	| "command_output"
	| "completion_result"
	| "tool"
	| "api_req_failed"
	| "resume_task"
	| "resume_completed_task"
	| "mistake_limit_reached"
	| "auto_approval_max_req_reached"
	| "browser_action_launch"
	| "use_mcp_server"

export type AutoGenSay =
	| "task"
	| "error"
	| "api_req_started"
	| "api_req_finished"
	| "text"
	| "reasoning"
	| "completion_result"
	| "user_feedback"
	| "user_feedback_diff"
	| "api_req_retried"
	| "command"
	| "command_output"
	| "tool"
	| "shell_integration_warning"
	| "browser_action_launch"
	| "browser_action"
	| "browser_action_result"
	| "mcp_server_request_started"
	| "mcp_server_response"
	| "use_mcp_server"
	| "diff_error"
	| "deleted_api_reqs"
	| "autogenignore_error"
	| "checkpoint_created"

export interface AutoGenSayTool {
	tool:
		| "editedExistingFile"
		| "newFileCreated"
		| "readFile"
		| "listFilesTopLevel"
		| "listFilesRecursive"
		| "listCodeDefinitionNames"
		| "searchFiles"
	path?: string
	diff?: string
	content?: string
	regex?: string
	filePattern?: string
}

// must keep in sync with system prompt
export const browserActions = ["launch", "click", "type", "scroll_down", "scroll_up", "close"] as const
export type BrowserAction = (typeof browserActions)[number]

export interface AutoGenSayBrowserAction {
	action: BrowserAction
	coordinate?: string
	text?: string
}

export type BrowserActionResult = {
	screenshot?: string
	logs?: string
	currentUrl?: string
	currentMousePosition?: string
}

export interface AutoGenAskUseMcpServer {
	serverName: string
	type: "use_mcp_tool" | "access_mcp_resource"
	toolName?: string
	arguments?: string
	uri?: string
}

export interface AutoGenPlanModeResponse {
	response: string
	options?: string[]
	selected?: string
}

export interface AutoGenAskQuestion {
	question: string
	options?: string[]
	selected?: string
}

export interface AutoGenApiReqInfo {
	request?: string
	tokensIn?: number
	tokensOut?: number
	cacheWrites?: number
	cacheReads?: number
	cost?: number
	cancelReason?: AutoGenApiReqCancelReason
	streamingFailedMessage?: string
}

export type AutoGenApiReqCancelReason = "streaming_failed" | "user_cancelled"

export const COMPLETION_RESULT_CHANGES_FLAG = "HAS_CHANGES"
