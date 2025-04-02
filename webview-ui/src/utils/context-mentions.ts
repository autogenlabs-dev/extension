import { mentionRegex, mentionRegexGlobal } from "../../../src/shared/context-mentions"
import { Fzf } from "fzf"

export interface ContextMenuQueryItem {
	type: ContextMenuOptionType;
	value?: string;
	label?: string;
	description?: string;
}

export function insertMention(text: string, cursorPosition: number, mention: string): { newValue: string; mentionIndex: number } {
	const textBeforeCursor = text.slice(0, cursorPosition)
	const textAfterCursor = text.slice(cursorPosition)

	const lastAtIndex = Math.max(
		textBeforeCursor.lastIndexOf("@"),
		textBeforeCursor.lastIndexOf("#")
	)
	
	if (lastAtIndex === -1) {
		return { newValue: text, mentionIndex: -1 }
	}

	const newValue = textBeforeCursor.slice(0, lastAtIndex + 1) + mention + " " + textAfterCursor
	return { newValue, mentionIndex: lastAtIndex }
}

export function removeMention(text: string, cursorPosition: number): { newText: string; newPosition: number } {
	const textBeforeCursor = text.slice(0, cursorPosition)
	const textAfterCursor = text.slice(cursorPosition)

	const match = textBeforeCursor.match(mentionRegex)
	if (!match || match.index === undefined) {
		return { newText: text, newPosition: cursorPosition }
	}

	const mentionStart = match.index
	const newText = text.slice(0, mentionStart) + textAfterCursor
	return { newText, newPosition: mentionStart }
}

export enum ContextMenuOptionType {
	File = "file",
	Folder = "folder",
	Git = "git",
	Problems = "problems",
	Terminal = "terminal",
	URL = "url",
	NoResults = "no-results",
}

export function shouldShowContextMenu(text: string, cursorPosition: number): boolean {
	const textBeforeCursor = text.slice(0, cursorPosition)
	const match = textBeforeCursor.match(mentionRegex)
	return !!match && match.index !== undefined && match.index + match[0].length === textBeforeCursor.length
}

export function getContextMenuOptions(
	searchQuery: string,
	selectedType: ContextMenuOptionType | null,
	queryItems: ContextMenuQueryItem[],
	trigger?: string
): ContextMenuQueryItem[] {
	// For @ trigger, only show files and folders
	if (trigger === '@') {
		const fileAndFolderItems = queryItems.filter(item => 
			item.type === ContextMenuOptionType.File || item.type === ContextMenuOptionType.Folder
		);

		if (!searchQuery) {
			return fileAndFolderItems.length > 0 
				? fileAndFolderItems 
				: [{ type: ContextMenuOptionType.NoResults, label: "No files or folders found" }];
		}

		const filtered = fileAndFolderItems.filter(item =>
			item.value?.toLowerCase().includes(searchQuery.toLowerCase())
		);

		return filtered.length > 0 
			? filtered 
			: [{ type: ContextMenuOptionType.NoResults, label: "No matching files or folders" }];
	}
	
	// For # trigger, show all options except files and folders
	if (trigger === '#') {
		const options = [
			{ type: ContextMenuOptionType.Problems, label: "Problems", description: "Reference workspace problems" },
			{ type: ContextMenuOptionType.Terminal, label: "Terminal", description: "Reference terminal output" },
			{ type: ContextMenuOptionType.Git, label: "Git", description: "Reference git commits" },
		];

		if (searchQuery) {
			return options.filter(
				(option) =>
					option.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					option.description?.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		}

		return options;
	}

	// Default behavior if no trigger specified
	if (!selectedType) {
		const options = [
			{ type: ContextMenuOptionType.Problems, label: "Problems", description: "Reference workspace problems" },
			{ type: ContextMenuOptionType.Terminal, label: "Terminal", description: "Reference terminal output" },
			{ type: ContextMenuOptionType.Git, label: "Git", description: "Reference git commits" },
			{ type: ContextMenuOptionType.File, label: "File", description: "Reference workspace files" },
			{ type: ContextMenuOptionType.Folder, label: "Folder", description: "Reference workspace folders" },
		]

		if (searchQuery) {
			return options.filter(
				(option) =>
					option.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					option.description?.toLowerCase().includes(searchQuery.toLowerCase()),
			)
		}

		return options
	}

	const filteredItems = queryItems.filter((item) => {
		if (item.type !== selectedType) {
			return false
		}

		if (!searchQuery) {
			return true
		}

		return item.value?.toLowerCase().includes(searchQuery.toLowerCase())
	})

	if (filteredItems.length === 0) {
		return [{ type: ContextMenuOptionType.NoResults, label: "No results found" }]
	}

	return filteredItems
}
