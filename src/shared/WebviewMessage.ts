import { ApiConfiguration } from "./api"
import { AutoApprovalSettings } from "./AutoApprovalSettings"
import { BrowserSettings } from "./BrowserSettings"
import { ChatSettings } from "./ChatSettings"
import { UserInfo } from "./UserInfo"
import { ChatContent } from "./ChatContent"
import { TelemetrySetting } from "./TelemetrySetting"

export interface WebviewMessage {
	type:
		| "apiConfiguration"
		| "webviewDidLaunch"
		| "newTask"
		| "askResponse"
		| "clearTask"
		| "didShowAnnouncement"
		| "selectImages"
		| "exportCurrentTask"
		| "showTaskWithId"
		| "deleteTaskWithId"
		| "exportTaskWithId"
		| "resetState"
		| "requestOllamaModels"
		| "requestLmStudioModels"
		| "openImage"
		| "openInBrowser"
		| "openFile"
		| "openMention"
		| "cancelTask"
		| "refreshOpenRouterModels"
		| "refreshOpenAiModels"
		| "openMcpSettings"
		| "restartMcpServer"
		| "deleteMcpServer"
		| "autoApprovalSettings"
		| "browserSettings"
		| "togglePlanActMode"
		| "checkpointDiff"
		| "checkpointRestore"
		| "taskCompletionViewChanges"
		| "openExtensionSettings"
		| "requestVsCodeLmModels"
		| "toggleToolAutoApprove"
		| "toggleMcpServer"
		| "getLatestState"
		| "accountLoginClicked"
		| "accountLogoutClicked"
		| "showAccountViewClicked"
		| "authStateChanged"
		| "authCallback"
		| "fetchMcpMarketplace"
		| "downloadMcp"
		| "silentlyRefreshMcpMarketplace"
		| "searchCommits"
		| "showMcpView"
		| "fetchLatestMcpServersFromHub"
		| "telemetrySetting"
		| "openSettings"
		| "updateMcpTimeout"
		| "fetchOpenGraphData"
		| "checkIsImageUrl"
		| "invoke"
		| "updateSettings"
		| "clearAllTaskHistory"
		| "fetchUserCreditsData"
		| "optionsResponse"
		| "requestTotalTasksSize"
		| "initializePrompt" // Added for ExtensionView -> AutoGenProvider communication
		// Native Filesystem Operations
		| "nativeFsReadFile"
		| "nativeFsWriteFile"
		| "nativeFsListDirectory"
		| "nativeFsCreateDirectory"
		| "nativeFsGetFileInfo"
		| "nativeFsRename"
		| "nativeFsDelete"
	// | "relaunchChromeDebugMode"
	text?: string
	prompt?: string // Added for initializePrompt message
	disabled?: boolean
	askResponse?: AutoGenAskResponse
	apiConfiguration?: ApiConfiguration
	images?: string[]
	bool?: boolean
	number?: number
	autoApprovalSettings?: AutoApprovalSettings
	browserSettings?: BrowserSettings
	chatSettings?: ChatSettings
	chatContent?: ChatContent
	mcpId?: string
	timeout?: number
	// For toggleToolAutoApprove
	serverName?: string
	toolName?: string
	autoApprove?: boolean
	
	// For selected context items
	selectedItems?: { type: string; path: string }[]

	// For auth
	user?: UserInfo | null
	customToken?: string
	// For openInBrowser
	url?: string
	planActSeparateModelsSetting?: boolean
	telemetrySetting?: TelemetrySetting
	customInstructionsSetting?: string

	// --- Native Filesystem Payload ---
	path?: string // Used by most nativeFs operations
	content?: string // Used by nativeFsWriteFile
	newPath?: string // Used by nativeFsRename
	recursive?: boolean // Used by nativeFsDelete
	useTrash?: boolean // Used by nativeFsDelete
	overwrite?: boolean // Used by nativeFsRename
	// --- End Native Filesystem Payload ---
}

export type AutoGenAskResponse = "yesButtonClicked" | "noButtonClicked" | "messageResponse"

export type AutoGenCheckpointRestore = "task" | "workspace" | "taskAndWorkspace"
