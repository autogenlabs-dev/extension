export interface ChatSettings {
	mode: "chat" | "Agent"
}

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
	mode: "Agent",
}
