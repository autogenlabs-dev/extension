import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import React, { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import DynamicTextArea from "react-textarea-autosize"
import { useClickAway, useEvent, useWindowSize } from "react-use"
import styled from "styled-components"
import { mentionRegex, mentionRegexGlobal } from "../../../../src/shared/context-mentions"
import { ExtensionMessage } from "../../../../src/shared/ExtensionMessage"
import { useExtensionState } from "../../context/ExtensionStateContext"
import {
	ContextMenuOptionType,
	getContextMenuOptions,
	insertMention,
	removeMention,
	shouldShowContextMenu,
} from "../../utils/context-mentions"
import { useMetaKeyDetection, useShortcut } from "../../utils/hooks"
import { validateApiConfiguration, validateModelId } from "../../utils/validate"
import { vscode } from "../../utils/vscode"
import { CODE_BLOCK_BG_COLOR } from "../common/CodeBlock"
import Thumbnails from "../common/Thumbnails"
import Tooltip from "../common/Tooltip"
import ApiOptions, { normalizeApiConfiguration } from "../settings/ApiOptions"
import { MAX_IMAGES_PER_MESSAGE } from "./ChatView"
import ContextMenu from "./ContextMenu"
import { ChatSettings } from "../../../../src/shared/ChatSettings"

// Define interface for selected items
interface SelectedItem {
	type: string;
	path: string;
}

// Add new regex for both triggers
const triggerRegex = /(?:^|\s)[@#](?:(?!\s).)*$/;
const triggerRegexGlobal = /(?:^|\s)[@#][^\s]*/g;

interface ChatTextAreaProps {
	inputValue: string
	setInputValue: (value: string) => void
	textAreaDisabled: boolean
	placeholderText: string
	selectedImages: string[]
	setSelectedImages: React.Dispatch<React.SetStateAction<string[]>>
	onSend: (text: string, images: string[], selectedItems: { type: string; path: string }[]) => void
	onSelectImages: () => void
	shouldDisableImages: boolean
	onHeightChange?: (height: number) => void
}

const PLAN_MODE_COLOR = "var(--vscode-inputValidation-warningBorder)"

const SwitchOption = styled.div<{ isActive: boolean }>`
	padding: 2px 8px;
	color: ${(props) => (props.isActive ? "white" : "var(--vscode-input-foreground)")};
	z-index: 1;
	transition: color 0.2s ease;
	font-size: 12px;
	width: 50%;
	text-align: center;

	&:hover {
		background-color: ${(props) => (!props.isActive ? "var(--vscode-toolbar-hoverBackground)" : "transparent")};
	}
`

const SwitchContainer = styled.div<{ disabled: boolean }>`
	display: flex;
	align-items: center;
	background-color: var(--vscode-editor-background);
	border: 1px solid var(--vscode-input-border);
	border-radius: 12px;
	overflow: hidden;
	cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
	opacity: ${(props) => (props.disabled ? 0.5 : 1)};
	transform: scale(0.85);
	transform-origin: right center;
	margin-left: -10px; // compensate for the transform so flex spacing works
	user-select: none; // Prevent text selection
`

const Slider = styled.div<{ isAct: boolean; isPlan?: boolean }>`
	position: absolute;
	height: 100%;
	width: 50%;
	background-color: ${(props) => (props.isPlan ? PLAN_MODE_COLOR : "var(--vscode-focusBorder)")};
	transition: transform 0.2s ease;
	transform: translateX(${(props) => (props.isAct ? "100%" : "0%")});
`

const ButtonGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;
	flex: 1;
	min-width: 0;
`

const ButtonContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 3px;
	font-size: 10px;
	white-space: nowrap;
	min-width: 0;
	width: 100%;
`

const ControlsContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: -5px;
	padding: 0px 15px 5px 15px;
`

// Move the ModelSelectorTooltipProps interface above its usage
interface ModelSelectorTooltipProps {
	arrowPosition: number
	menuPosition: number
}

// Update the ModelSelectorTooltip styling to ensure it's visible
const ModelSelectorTooltip = styled.div<ModelSelectorTooltipProps>`
  position: fixed;
  top: ${props => props.menuPosition + 40}px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 600px;
  background: ${CODE_BLOCK_BG_COLOR};
  border: 1px solid var(--vscode-editorGroup-border);
  padding: 12px;
  border-radius: 3px;
  z-index: 2000;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  overscroll-behavior: contain;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  // Arrow pointing up
  &::before {
    content: "";
    position: absolute;
    top: -10px;
    left: ${props => (props.arrowPosition ? props.arrowPosition : 50)}%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid ${CODE_BLOCK_BG_COLOR};
    z-index: 1;
  }
`

const ModelContainer = styled.div`
	position: relative;
	display: flex;
	flex: 1;
	min-width: 0;
`

const ModelButtonWrapper = styled.div`
	display: inline-flex; // Make it shrink to content
	min-width: 0; // Allow shrinking
	max-width: 100%; // Don't overflow parent
`

const ModelDisplayButton = styled.a<{ isActive?: boolean; disabled?: boolean }>`
	padding: 0px 0px;
	height: 20px;
	width: 100%;
	min-width: 0;
	cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
	text-decoration: ${(props) => (props.isActive ? "underline" : "none")};
	color: ${(props) => (props.isActive ? "var(--vscode-foreground)" : "var(--vscode-descriptionForeground)")};
	display: flex;
	align-items: center;
	font-size: 10px;
	outline: none;
	user-select: none;
	opacity: ${(props) => (props.disabled ? 0.5 : 1)};
	pointer-events: ${(props) => (props.disabled ? "none" : "auto")};

	&:hover,
	&:focus {
		color: ${(props) => (props.disabled ? "var(--vscode-descriptionForeground)" : "var(--vscode-foreground)")};
		text-decoration: ${(props) => (props.disabled ? "none" : "underline")};
		outline: none;
	}

	&:active {
		color: ${(props) => (props.disabled ? "var(--vscode-descriptionForeground)" : "var(--vscode-foreground)")};
		text-decoration: ${(props) => (props.disabled ? "none" : "underline")};
		outline: none;
	}

	&:focus-visible {
		outline: none;
	}
`

const ModelButtonContent = styled.div`
	width: 100%;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

// Update the InlineControls styling to improve visibility and functionality
const InlineControls = styled.div`
  position: absolute;
  top: 18px;
  right: 40px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 1;
`

const InlineToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: var(--vscode-editor-background);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  border: 1px solid var(--vscode-input-border);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  &:hover {
    background-color: var(--vscode-toolbar-hoverBackground);
    border-color: var(--vscode-focusBorder);
  }
`

const InlineModelButton = styled.div`
  display: flex;
  align-items: center;
  background-color: var(--vscode-editor-background);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  border: 1px solid var(--vscode-input-border);
  cursor: pointer;
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  &:hover {
    background-color: var(--vscode-toolbar-hoverBackground);
    border-color: var(--vscode-focusBorder);
  }
`

const ActiveIndicator = styled.div<{ isPlan?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) => (props.isPlan ? PLAN_MODE_COLOR : "#0078D4")};
  margin-right: 4px;
`

const Badge = styled.div`
	display: inline-flex;
	align-items: center;
	background: var(--vscode-badge-background);
	color: var(--vscode-badge-foreground);
	border-radius: 3px;
	padding: 4px 8px;
	font-size: 11px;
	border: 1px solid var(--vscode-badge-border, transparent);
	transition: all 0.1s ease;

	.codicon {
		margin-right: 6px;
		font-size: 12px;
	}

	.close-icon {
		margin-left: 6px;
		opacity: 0.7;
		cursor: pointer;
		transition: all 0.1s ease;
		
		&:hover {
			opacity: 1;
		}
	}

	&:hover {
		border-color: var(--vscode-focusBorder);
	}
`

const BadgeContainer = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	padding: 10px 15px;
	background: var(--vscode-editor-background);
	border-bottom: 1px solid var(--vscode-input-border);
	margin-bottom: 5px;
`

const TopControls = styled.div`
	position: absolute;
	top: 12px;
	left: 15px;
	z-index: 10;
	display: flex;
	align-items: center;
	gap: 3px;
	margin: 5px;
`

const ControlButton = styled.div<{ disabled?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
	opacity: ${props => props.disabled ? 0.5 : 1};
	font-size: 12px;
	transition: all 0.1s ease;
	
	&:hover {
		background: ${props => !props.disabled && 'var(--vscode-toolbar-hoverBackground)'};
		border-color: ${props => !props.disabled && 'var(--vscode-focusBorder)'};
	}

	.codicon {
		font-size: 13px;
	}
`

const ChatTextArea = forwardRef<HTMLTextAreaElement, ChatTextAreaProps>(
	(
		{
			inputValue,
			setInputValue,
			textAreaDisabled,
			placeholderText,
			selectedImages,
			setSelectedImages,
			onSend,
			onSelectImages,
			shouldDisableImages,
			onHeightChange,
		},
		ref
	): JSX.Element => {
		const { filePaths, chatSettings, apiConfiguration, openRouterModels, platform } = useExtensionState()
		const [isTextAreaFocused, setIsTextAreaFocused] = useState(false)
		const [gitCommits, setGitCommits] = useState<any[]>([])

		const [thumbnailsHeight, setThumbnailsHeight] = useState(0)
		const [textAreaBaseHeight, setTextAreaBaseHeight] = useState<number | undefined>(undefined)
		const [showContextMenu, setShowContextMenu] = useState(false)
		const [cursorPosition, setCursorPosition] = useState(0)
		const [searchQuery, setSearchQuery] = useState("")
		const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
		const [isMouseDownOnMenu, setIsMouseDownOnMenu] = useState(false)
		const highlightLayerRef = useRef<HTMLDivElement>(null)
		const [selectedMenuIndex, setSelectedMenuIndex] = useState(-1)
		const [selectedType, setSelectedType] = useState<ContextMenuOptionType | null>(null)
		const [justDeletedSpaceAfterMention, setJustDeletedSpaceAfterMention] = useState(false)
		const [intendedCursorPosition, setIntendedCursorPosition] = useState<number | null>(null)
		const contextMenuContainerRef = useRef<HTMLDivElement>(null)
		const [showModelSelector, setShowModelSelector] = useState(false)
		const modelSelectorRef = useRef<HTMLDivElement | null>(null)
		const { width: viewportWidth, height: viewportHeight } = useWindowSize()
		const buttonRef = useRef<HTMLDivElement>(null)
		const [arrowPosition, setArrowPosition] = useState(0)
		const [menuPosition, setMenuPosition] = useState(0)
		const [shownTooltipMode, setShownTooltipMode] = useState<ChatSettings["mode"] | null>(null)

		const [, metaKeyChar] = useMetaKeyDetection(platform)

		// Add a ref to track previous menu state
		const prevShowModelSelector = useRef(showModelSelector)

		// Add state for selected items
		const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

		// Add handler for clicks outside model selector
		useEffect(() => {
			function handleClickOutside(event: MouseEvent) {
				if (showModelSelector && 
					modelSelectorRef.current && 
					!modelSelectorRef.current.contains(event.target as Node) &&
					buttonRef.current && 
					!buttonRef.current.contains(event.target as Node)) {
					setShowModelSelector(false);
				}
			}

			document.addEventListener('mousedown', handleClickOutside);
			return () => {
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}, [showModelSelector]);

		// Fetch git commits when Git is selected or when typing a hash
		useEffect(() => {
			if (selectedType === ContextMenuOptionType.Git || /^[a-f0-9]+$/i.test(searchQuery)) {
				vscode.postMessage({
					type: "searchCommits",
					text: searchQuery || "",
				})
			}
		}, [selectedType, searchQuery])

		const handleMessage = useCallback((event: MessageEvent) => {
			const message: ExtensionMessage = event.data
			switch (message.type) {
				case "commitSearchResults": {
					const commits =
						message.commits?.map((commit: any) => ({
							type: ContextMenuOptionType.Git,
							value: commit.hash,
							label: commit.subject,
							description: `${commit.shortHash} by ${commit.author} on ${commit.date}`,
						})) || []
					setGitCommits(commits)
					break
				}
			}
		}, [])

		useEvent("message", handleMessage)

		const queryItems = useMemo(() => {
			return [
				{ type: ContextMenuOptionType.Problems, value: "problems" },
				{ type: ContextMenuOptionType.Terminal, value: "terminal" },
				...gitCommits,
				...filePaths
					.map((file) => "/" + file)
					.map((path) => ({
						type: path.endsWith("/") ? ContextMenuOptionType.Folder : ContextMenuOptionType.File,
						value: path,
					})),
			]
		}, [filePaths, gitCommits])

		useEffect(() => {
			const handleClickOutside = (event: MouseEvent) => {
				if (contextMenuContainerRef.current && !contextMenuContainerRef.current.contains(event.target as Node)) {
					setShowContextMenu(false)
				}
			}

			if (showContextMenu) {
				document.addEventListener("mousedown", handleClickOutside)
			}

			return () => {
				document.removeEventListener("mousedown", handleClickOutside)
			}
		}, [showContextMenu, setShowContextMenu])

		const handleMentionSelect = useCallback(
			(type: ContextMenuOptionType, value?: string) => {
				if (type === ContextMenuOptionType.NoResults) {
					return
				}

				// Add selected item to badges based on type
				if (value) {
					switch (type) {
						case ContextMenuOptionType.File:
						case ContextMenuOptionType.Folder:
							setSelectedItems(prev => [...prev, {
								type: type === ContextMenuOptionType.File ? 'file' : 'folder',
								path: value.substring(1) // Remove leading slash
							}]);
							break;
						case ContextMenuOptionType.Problems:
							setSelectedItems(prev => [...prev, {
								type: 'problems',
								path: 'Problems'
							}]);
							break;
						case ContextMenuOptionType.Terminal:
							setSelectedItems(prev => [...prev, {
								type: 'terminal',
								path: 'Terminal'
							}]);
							break;
						case ContextMenuOptionType.Git:
							setSelectedItems(prev => [...prev, {
								type: 'git',
								path: value
							}]);
							break;
					}
				}

				setShowContextMenu(false)
				setSelectedType(null)
				setSearchQuery("")

				// Clear the trigger character from the input
				if (textAreaRef.current) {
					const textBeforeCursor = textAreaRef.current.value.slice(0, cursorPosition)
					const lastTriggerIndex = Math.max(
						textBeforeCursor.lastIndexOf("@"),
						textBeforeCursor.lastIndexOf("#")
					)
					
					if (lastTriggerIndex !== -1) {
						const newValue = textAreaRef.current.value.slice(0, lastTriggerIndex) +
							textAreaRef.current.value.slice(cursorPosition)
						
						setInputValue(newValue)
						setCursorPosition(lastTriggerIndex)
						setIntendedCursorPosition(lastTriggerIndex)
					}
				}

				setTimeout(() => {
					if (textAreaRef.current) {
						textAreaRef.current.blur()
						textAreaRef.current.focus()
					}
				}, 0)
			},
			[setInputValue, cursorPosition],
		)

		// Wrap the onSend prop to clear selected items
		const handleSend = useCallback(() => {
			onSend(inputValue, selectedImages, selectedItems);
			setSelectedItems([]); // Clear selected items after sending
		}, [onSend, setSelectedItems, inputValue, selectedImages]);

		const handleKeyDown = useCallback(
			(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
				if (showContextMenu) {
					if (event.key === "Escape") {
						setSelectedType(null)
						setSelectedMenuIndex(3) // File by default
						return
					}

					if (event.key === "ArrowUp" || event.key === "ArrowDown") {
						event.preventDefault()
						setSelectedMenuIndex((prevIndex) => {
							const direction = event.key === "ArrowUp" ? -1 : 1
							const options = getContextMenuOptions(searchQuery, selectedType, queryItems)
							const optionsLength = options.length

							if (optionsLength === 0) return prevIndex

							// Find selectable options (non-URL types)
							const selectableOptions = options.filter(
								(option) =>
									option.type !== ContextMenuOptionType.URL && option.type !== ContextMenuOptionType.NoResults,
							)

							if (selectableOptions.length === 0) return -1 // No selectable options

							// Find the index of the next selectable option
							const currentSelectableIndex = selectableOptions.findIndex((option) => option === options[prevIndex])

							const newSelectableIndex =
								(currentSelectableIndex + direction + selectableOptions.length) % selectableOptions.length

							// Find the index of the selected option in the original options array
							return options.findIndex((option) => option === selectableOptions[newSelectableIndex])
						})
						return
					}
					if ((event.key === "Enter" || event.key === "Tab") && selectedMenuIndex !== -1) {
						event.preventDefault()
						const selectedOption = getContextMenuOptions(searchQuery, selectedType, queryItems)[selectedMenuIndex]
						if (
							selectedOption &&
							selectedOption.type !== ContextMenuOptionType.URL &&
							selectedOption.type !== ContextMenuOptionType.NoResults
						) {
							handleMentionSelect(selectedOption.type, selectedOption.value)
						}
						return
					}
				}

				const isComposing = event.nativeEvent?.isComposing ?? false
				if (event.key === "Enter" && !event.shiftKey && !isComposing) {
					event.preventDefault()
					setIsTextAreaFocused(false)
					handleSend() // Use handleSend instead of onSend
				}

				if (event.key === "Backspace" && !isComposing) {
					const charBeforeCursor = inputValue[cursorPosition - 1]
					const charAfterCursor = inputValue[cursorPosition + 1]

					const charBeforeIsWhitespace =
						charBeforeCursor === " " || charBeforeCursor === "\n" || charBeforeCursor === "\r\n"
					const charAfterIsWhitespace =
						charAfterCursor === " " || charAfterCursor === "\n" || charAfterCursor === "\r\n"
					// checks if char before cursor is whitespace after a mention
					if (
						charBeforeIsWhitespace &&
						inputValue.slice(0, cursorPosition - 1).match(new RegExp(mentionRegex.source + "$")) // "$" is added to ensure the match occurs at the end of the string
					) {
						const newCursorPosition = cursorPosition - 1
						// if mention is followed by another word, then instead of deleting the space separating them we just move the cursor to the end of the mention
						if (!charAfterIsWhitespace) {
							event.preventDefault()
							textAreaRef.current?.setSelectionRange(newCursorPosition, newCursorPosition)
							setCursorPosition(newCursorPosition)
						}
						setCursorPosition(newCursorPosition)
						setJustDeletedSpaceAfterMention(true)
					} else if (justDeletedSpaceAfterMention) {
						const { newText, newPosition } = removeMention(inputValue, cursorPosition)
						if (newText !== inputValue) {
							event.preventDefault()
							setInputValue(newText)
							setIntendedCursorPosition(newPosition) // Store the new cursor position in state
						}
						setJustDeletedSpaceAfterMention(false)
						setShowContextMenu(false)
					} else {
						setJustDeletedSpaceAfterMention(false)
					}
				}
			},
			[showContextMenu, searchQuery, selectedMenuIndex, handleSend, selectedType, inputValue, cursorPosition, setInputValue, justDeletedSpaceAfterMention, queryItems],
		)

		useLayoutEffect(() => {
			if (intendedCursorPosition !== null && textAreaRef.current) {
				textAreaRef.current.setSelectionRange(intendedCursorPosition, intendedCursorPosition)
				setIntendedCursorPosition(null) // Reset the state
			}
		}, [inputValue, intendedCursorPosition])

		const handleInputChange = useCallback(
			(e: React.ChangeEvent<HTMLTextAreaElement>) => {
				const newValue = e.target.value
				const newCursorPosition = e.target.selectionStart
				setInputValue(newValue)
				setCursorPosition(newCursorPosition)
				const showMenu = shouldShowContextMenu(newValue, newCursorPosition)

				setShowContextMenu(showMenu)
				if (showMenu) {
					const lastTriggerIndex = Math.max(
						newValue.lastIndexOf("@", newCursorPosition - 1),
						newValue.lastIndexOf("#", newCursorPosition - 1)
					)
					const query = newValue.slice(lastTriggerIndex + 1, newCursorPosition)
					setSearchQuery(query)
					if (query.length > 0) {
						setSelectedMenuIndex(0)
					} else {
						setSelectedMenuIndex(3) // Set to "File" option by default
					}
				} else {
					setSearchQuery("")
					setSelectedMenuIndex(-1)
				}
			},
			[setInputValue],
		)

		useEffect(() => {
			if (!showContextMenu) {
				setSelectedType(null)
			}
		}, [showContextMenu])

		const handleBlur = useCallback(() => {
			// Only hide the context menu if the user didn't click on it
			if (!isMouseDownOnMenu) {
				setShowContextMenu(false)
			}
			setIsTextAreaFocused(false)
		}, [isMouseDownOnMenu])

		const handlePaste = useCallback(
			async (e: React.ClipboardEvent) => {
				const items = e.clipboardData.items

				const pastedText = e.clipboardData.getData("text")
				// Check if the pasted content is a URL, add space after so user can easily delete if they don't want it
				const urlRegex = /^\S+:\/\/\S+$/
				if (urlRegex.test(pastedText.trim())) {
					e.preventDefault()
					const trimmedUrl = pastedText.trim()
					const newValue = inputValue.slice(0, cursorPosition) + trimmedUrl + " " + inputValue.slice(cursorPosition)
					setInputValue(newValue)
					const newCursorPosition = cursorPosition + trimmedUrl.length + 1
					setCursorPosition(newCursorPosition)
					setIntendedCursorPosition(newCursorPosition)
					setShowContextMenu(false)

					// Scroll to new cursor position
					// https://stackoverflow.com/questions/29899364/how-do-you-scroll-to-the-position-of-the-cursor-in-a-textarea/40951875#40951875
					setTimeout(() => {
						if (textAreaRef.current) {
							textAreaRef.current.blur()
							textAreaRef.current.focus()
						}
					}, 0)
					// NOTE: callbacks dont utilize return function to cleanup, but it's fine since this timeout immediately executes and will be cleaned up by the browser (no chance component unmounts before it executes)

					return
				}

				const acceptedTypes = ["png", "jpeg", "webp"] // supported by anthropic and openrouter (jpg is just a file extension but the image will be recognized as jpeg)
				const imageItems = Array.from(items).filter((item) => {
					const [type, subtype] = item.type.split("/")
					return type === "image" && acceptedTypes.includes(subtype)
				})
				if (!shouldDisableImages && imageItems.length > 0) {
					e.preventDefault()
					const imagePromises = imageItems.map((item) => {
						return new Promise<string | null>((resolve) => {
							const blob = item.getAsFile()
							if (!blob) {
								resolve(null)
								return
							}
							const reader = new FileReader()
							reader.onloadend = () => {
								if (reader.error) {
									console.error("Error reading file:", reader.error)
									resolve(null)
								} else {
									const result = reader.result
									resolve(typeof result === "string" ? result : null)
								}
							}
							reader.readAsDataURL(blob)
						})
					})
					const imageDataArray = await Promise.all(imagePromises)
					const dataUrls = imageDataArray.filter((dataUrl): dataUrl is string => dataUrl !== null)
					//.map((dataUrl) => dataUrl.split(",")[1]) // strip the mime type prefix, sharp doesn't need it
					if (dataUrls.length > 0) {
						setSelectedImages((prevImages) => [...prevImages, ...dataUrls].slice(0, MAX_IMAGES_PER_MESSAGE))
					} else {
						console.warn("No valid images were processed")
					}
				}
			},
			[shouldDisableImages, setSelectedImages, cursorPosition, setInputValue, inputValue],
		)

		const handleThumbnailsHeightChange = useCallback((height: number) => {
			setThumbnailsHeight(height)
		}, [])

		useEffect(() => {
			if (selectedImages.length === 0) {
				setThumbnailsHeight(0)
			}
		}, [selectedImages])

		const handleMenuMouseDown = useCallback(() => {
			setIsMouseDownOnMenu(true)
		}, [])

		const updateHighlights = useCallback(() => {
			if (!textAreaRef.current || !highlightLayerRef.current) return

			const text = textAreaRef.current.value
			const html = text
				.replace(/\n$/, "\n\n")
				.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] || c)
				// Remove the highlighting for @ and # triggers
				.replace(triggerRegexGlobal, '$&')

			highlightLayerRef.current.innerHTML = html
			highlightLayerRef.current.scrollTop = textAreaRef.current.scrollTop
			highlightLayerRef.current.scrollLeft = textAreaRef.current.scrollLeft
		}, [])

		useLayoutEffect(() => {
			updateHighlights()
		}, [inputValue, updateHighlights])

		const updateCursorPosition = useCallback(() => {
			if (textAreaRef.current) {
				setCursorPosition(textAreaRef.current.selectionStart)
			}
		}, [])

		const handleKeyUp = useCallback(
			(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
				if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
					updateCursorPosition()
				}
			},
			[updateCursorPosition],
		)

		// Separate the API config submission logic
		const submitApiConfig = useCallback(() => {
			const apiValidationResult = validateApiConfiguration(apiConfiguration)
			const modelIdValidationResult = validateModelId(apiConfiguration, openRouterModels)

			if (!apiValidationResult && !modelIdValidationResult) {
				vscode.postMessage({ type: "apiConfiguration", apiConfiguration })
			} else {
				vscode.postMessage({ type: "getLatestState" })
			}
		}, [apiConfiguration, openRouterModels])

		const onModeToggle = useCallback(() => {
			if (textAreaDisabled) return
			let changeModeDelay = 0
			if (showModelSelector) {
				// Close the model selector if it's open
				setShowModelSelector(false);
				submitApiConfig();
				changeModeDelay = 250;
			}
			setTimeout(() => {
				const newMode = chatSettings.mode === "chat" ? "Agent" : "chat"
				vscode.postMessage({
					type: "togglePlanActMode",
					chatSettings: {
						mode: newMode,
					},
					chatContent: {
						message: inputValue.trim() ? inputValue : undefined,
						images: selectedImages.length > 0 ? selectedImages : undefined,
					},
				})
				// Focus the textarea after mode toggle with slight delay
				setTimeout(() => {
					textAreaRef.current?.focus()
				}, 100)
			}, changeModeDelay)
		}, [chatSettings.mode, showModelSelector, submitApiConfig, inputValue, selectedImages, textAreaDisabled])

		useShortcut("Meta+Shift+a", onModeToggle, { disableTextInputs: false }) // important that we don't disable the text input here

		const handleContextButtonClick = useCallback(() => {
			if (textAreaDisabled) return

			// Focus the textarea first
			textAreaRef.current?.focus()

			// If input is empty, just insert @
			if (!inputValue.trim()) {
				const event = {
					target: {
						value: "@",
						selectionStart: 1,
					},
				} as React.ChangeEvent<HTMLTextAreaElement>
				handleInputChange(event)
				updateHighlights()
				return
			}

			// If input ends with space or is empty, just append @
			if (inputValue.endsWith(" ")) {
				const event = {
					target: {
						value: inputValue + "@",
						selectionStart: inputValue.length + 1,
					},
				} as React.ChangeEvent<HTMLTextAreaElement>
				handleInputChange(event)
				updateHighlights()
				return
			}

			// Otherwise add space then @
			const event = {
				target: {
					value: inputValue + " @",
					selectionStart: inputValue.length + 2,
				},
			} as React.ChangeEvent<HTMLTextAreaElement>
			handleInputChange(event)
			updateHighlights()
		}, [inputValue, textAreaDisabled, handleInputChange, updateHighlights])

		// Add new handler for # trigger
		const handleHashButtonClick = useCallback(() => {
			if (textAreaDisabled) return

			// Focus the textarea first
			textAreaRef.current?.focus()

			// If input is empty, just insert #
			if (!inputValue.trim()) {
				const event = {
					target: {
						value: "#",
						selectionStart: 1,
					},
				} as React.ChangeEvent<HTMLTextAreaElement>
				handleInputChange(event)
				updateHighlights()
				return
			}

			// If input ends with space or is empty, just append #
			if (inputValue.endsWith(" ")) {
				const event = {
					target: {
						value: inputValue + "#",
						selectionStart: inputValue.length + 1,
					},
				} as React.ChangeEvent<HTMLTextAreaElement>
				handleInputChange(event)
				updateHighlights()
				return
			}

			// Otherwise add space then #
			const event = {
				target: {
					value: inputValue + " #",
					selectionStart: inputValue.length + 2,
				},
			} as React.ChangeEvent<HTMLTextAreaElement>
			handleInputChange(event)
			updateHighlights()
		}, [inputValue, textAreaDisabled, handleInputChange, updateHighlights])

		// Use an effect to detect menu close
		useEffect(() => {
			if (prevShowModelSelector.current && !showModelSelector) {
				// Menu was just closed
				submitApiConfig()
			}
			prevShowModelSelector.current = showModelSelector
		}, [showModelSelector, submitApiConfig])

		// Fix the handleModelButtonClick function
		const handleModelButtonClick = useCallback(() => {
			// First close any open context menu
			setShowContextMenu(false);

			// Calculate position for the popup before opening it
			if (!showModelSelector && buttonRef.current) {
				const buttonRect = buttonRef.current.getBoundingClientRect();
				setMenuPosition(buttonRect.top);
				setArrowPosition(buttonRect.width / 2);
			}

			// Toggle the model selector
			setShowModelSelector(prev => !prev);
		}, []);

		// Update the effect that calculates arrow position
		useEffect(() => {
			if (showModelSelector && buttonRef.current) {
				const buttonRect = buttonRef.current.getBoundingClientRect()
				const buttonCenter = buttonRect.left + buttonRect.width / 2

				// Calculate distance from right edge of viewport using viewport coordinates
				const rightPosition = document.documentElement.clientWidth - buttonCenter - 5

				setArrowPosition(rightPosition)
				setMenuPosition(buttonRect.top + 1) // Added +1 to move menu down by 1px
			}
		}, [showModelSelector, viewportWidth, viewportHeight])

		useEffect(() => {
			if (!showModelSelector) {
				// Attempt to save if possible
				// NOTE: we cannot call this here since it will create an infinite loop between this effect and the callback since getLatestState will update state. Instead we should submitapiconfig when the menu is explicitly closed, rather than as an effect of showModelSelector changing.
				// handleApiConfigSubmit()

				// Reset any active styling by blurring the button
				const button = buttonRef.current?.querySelector("a")
				if (button) {
					button.blur()
				}
			}
		}, [showModelSelector])

		/**
		 * Handles the drag over event to allow dropping.
		 * Prevents the default behavior to enable drop.
		 *
		 * @param {React.DragEvent} e - The drag event.
		 */
		const onDragOver = (e: React.DragEvent) => {
			e.preventDefault()
		}

		/**
		 * Handles the drop event for files and text.
		 * Processes dropped images and text, updating the state accordingly.
		 *
		 * @param {React.DragEvent} e - The drop event.
		 */
		const onDrop = async (e: React.DragEvent) => {
			e.preventDefault()

			const files = Array.from(e.dataTransfer.files)
			const text = e.dataTransfer.getData("text")

			if (text) {
				handleTextDrop(text)
				return
			}

			const acceptedTypes = ["png", "jpeg", "webp"]
			const imageFiles = files.filter((file) => {
				const [type, subtype] = file.type.split("/")
				return type === "image" && acceptedTypes.includes(subtype)
			})

			if (shouldDisableImages || imageFiles.length === 0) return

			const imageDataArray = await readImageFiles(imageFiles)
			const dataUrls = imageDataArray.filter((dataUrl): dataUrl is string => dataUrl !== null)

			if (dataUrls.length > 0) {
				setSelectedImages((prevImages) => [...prevImages, ...dataUrls].slice(0, MAX_IMAGES_PER_MESSAGE))
			} else {
				console.warn("No valid images were processed")
			}
		}

		/**
		 * Handles the drop event for text.
		 * Inserts the dropped text at the current cursor position.
		 *
		 * @param {string} text - The dropped text.
		 */
		const handleTextDrop = (text: string) => {
			const newValue = inputValue.slice(0, cursorPosition) + text + inputValue.slice(cursorPosition)
			setInputValue(newValue)
			const newCursorPosition = cursorPosition + text.length
			setCursorPosition(newCursorPosition)
			setIntendedCursorPosition(newCursorPosition)
		}

		/**
		 * Reads image files and returns their data URLs.
		 * Uses FileReader to read the files as data URLs.
		 *
		 * @param {File[]} imageFiles - The image files to read.
		 * @returns {Promise<(string | null)[]>} - A promise that resolves to an array of data URLs or null values.
		 */
		const readImageFiles = (imageFiles: File[]): Promise<(string | null)[]> => {
			return Promise.all(
				imageFiles.map(
					(file) =>
						new Promise<string | null>((resolve) => {
							const reader = new FileReader()
							reader.onloadend = () => {
								if (reader.error) {
									console.error("Error reading file:", reader.error)
									resolve(null)
								} else {
									const result = reader.result
									resolve(typeof result === "string" ? result : null)
								}
							}
							reader.readAsDataURL(file)
						}),
				),
			)
		}

		// Get model display name - add dependency on showModelSelector to ensure it updates
		const modelDisplayName = useMemo(() => {
			const { selectedProvider, selectedModelId } = normalizeApiConfiguration(apiConfiguration);
			const unknownModel = "unknown";
			if (!apiConfiguration) return unknownModel;

			switch (selectedProvider) {
				case "AutoGen":
					return `${selectedProvider}:${selectedModelId}`;
				case "openai":
					return `openai-compat:${selectedModelId}`;
				case "vscode-lm":
					return `vscode-lm:${apiConfiguration.vsCodeLmModelSelector ?
						`${apiConfiguration.vsCodeLmModelSelector.vendor ?? ""}/${apiConfiguration.vsCodeLmModelSelector.family ?? ""}` :
						unknownModel}`;
				case "together":
					return `${selectedProvider}:${apiConfiguration.togetherModelId || unknownModel}`;
				case "lmstudio":
					return `${selectedProvider}:${apiConfiguration.lmStudioModelId || unknownModel}`;
				case "ollama":
					return `${selectedProvider}:${apiConfiguration.ollamaModelId || unknownModel}`;
				case "litellm":
					return `${selectedProvider}:${apiConfiguration.liteLlmModelId || unknownModel}`;
				case "requesty":
				case "anthropic":
				case "openrouter":
				default:
					return `${selectedProvider}:${selectedModelId || unknownModel}`;
			}
		}, [apiConfiguration, showModelSelector]);

		// Function to handle model selector ref
		const setModelSelectorRef = (element: HTMLDivElement | null) => {
			modelSelectorRef.current = element;
			if (element) {
				// Focus on the first interactive element when the tooltip opens
				setTimeout(() => {
					const firstButton = element.querySelector('button, input, select');
					if (firstButton instanceof HTMLElement) {
						firstButton.focus();
					}
				}, 100);
			}
		};

		return (
			<div>
				{selectedItems.length > 0 && (
					<BadgeContainer>
						{selectedItems.map((item, index) => (
							<Badge key={index}>
								<span className={`codicon codicon-${item.type === 'file' ? 'file' : item.type === 'folder' ? 'folder' : item.type === 'problems' ? 'problems' : item.type === 'terminal' ? 'terminal' : 'git'}`} />
								{item.path.split('/').pop()}
								<span 
									className="codicon codicon-close close-icon"
									onClick={() => setSelectedItems(prev => prev.filter((_, i) => i !== index))}
								/>
							</Badge>
						))}
					</BadgeContainer>
				)}
				<div
					style={{
						padding: "10px 15px",
						opacity: textAreaDisabled ? 0.5 : 1,
						position: "relative",
						display: "flex",
					}}
					onDrop={onDrop}
					onDragOver={onDragOver}>
					{/* Move controls to top left */}
					<TopControls>
						<ControlButton 
							disabled={textAreaDisabled}
							onClick={handleContextButtonClick}
							title="Add file/folder reference (@)">
							<span>@</span>
						</ControlButton>
						<ControlButton
							disabled={shouldDisableImages}
							onClick={() => !shouldDisableImages && onSelectImages()}
							title="Add images">
							<i style={{ marginTop: 2 }} className="codicon codicon-device-camera" />
						</ControlButton>
					</TopControls>

					{showContextMenu && (
						<div ref={contextMenuContainerRef}>
							<ContextMenu
								onSelect={handleMentionSelect}
								searchQuery={searchQuery}
								onMouseDown={handleMenuMouseDown}
								selectedIndex={selectedMenuIndex}
								setSelectedIndex={setSelectedMenuIndex}
								selectedType={selectedType}
								queryItems={queryItems}
							/>
						</div>
					)}
					{!isTextAreaFocused && (
						<div
							style={{
								position: "absolute",
								inset: "10px 15px",
								border: "1px solid var(--vscode-input-border)",
								borderRadius: 2,
								pointerEvents: "none",
								zIndex: 5,
							}}
						/>
					)}
					<div
						ref={highlightLayerRef}
						style={{
							position: "absolute",
							top: 10,
							left: 15,
							right: 15,
							bottom: 10,
							pointerEvents: "none",
							whiteSpace: "pre-wrap",
							wordWrap: "break-word",
							color: "transparent",
							overflow: "hidden",
							backgroundColor: "transparent",
							fontFamily: "var(--vscode-font-family)",
							fontSize: "var(--vscode-editor-font-size)",
							lineHeight: "var(--vscode-editor-line-height)",
							borderRadius: 2,
							borderLeft: 0,
							borderRight: 0,
							borderTop: 0,
							borderColor: "transparent",
							borderBottom: `${thumbnailsHeight + 6}px solid transparent`,
							paddingTop: "42px",
							paddingRight: "28px",
							paddingLeft: "52px",
							paddingBottom: "6px",
						}}
					/>
					<DynamicTextArea
						data-testid="chat-input"
						ref={(el) => {
							if (typeof ref === "function") {
								ref(el)
							} else if (ref) {
								ref.current = el
							}
							textAreaRef.current = el
						}}
						value={inputValue}
						disabled={textAreaDisabled}
						onChange={(e) => {
							handleInputChange(e)
							updateHighlights()
						}}
						onKeyDown={handleKeyDown}
						onKeyUp={handleKeyUp}
						onFocus={() => setIsTextAreaFocused(true)}
						onBlur={handleBlur}
						onPaste={handlePaste}
						onSelect={updateCursorPosition}
						onMouseUp={updateCursorPosition}
						onHeightChange={(height) => {
							if (textAreaBaseHeight === undefined || height < textAreaBaseHeight) {
								setTextAreaBaseHeight(height)
							}
							onHeightChange?.(height)
						}}
						placeholder={placeholderText}
						minRows={5} // Set minimum height to ensure enough space for text
						autoFocus={true}
						style={{
							width: "100%",
							boxSizing: "border-box",
							backgroundColor: "var(--vscode-input-background)",
							color: "var(--vscode-input-foreground)",
							border: "1px solid var(--vscode-input-border)",
							borderRadius: 3,
							fontFamily: "var(--vscode-font-family)",
							fontSize: "var(--vscode-editor-font-size)",
							lineHeight: "var(--vscode-editor-line-height)",
							resize: "none",
							overflowX: "hidden",
							overflowY: "auto",
							scrollbarWidth: "thin",
							paddingTop: "42px",
							paddingRight: "28px",
							paddingLeft: "52px",
							paddingBottom: "6px",
							borderColor: isTextAreaFocused ? "var(--vscode-focusBorder)" : "var(--vscode-input-border)",
							cursor: textAreaDisabled ? "not-allowed" : undefined,
							flex: 1,
							zIndex: 2,
							outline: "none",
							borderBottom: `${thumbnailsHeight + 6}px solid transparent`,
						}}
						onScroll={() => updateHighlights()}
					/>
					{selectedImages.length > 0 && (
						<Thumbnails
							images={selectedImages}
							setImages={setSelectedImages}
							onHeightChange={handleThumbnailsHeightChange}
							style={{
								position: "absolute",
								paddingTop: 4,
								bottom: 14,
								left: 22,
								right: 47, // (54 + 9) + 4 extra padding
								zIndex: 2,
							}}
						/>
					)}
					<div
						style={{
							position: "absolute",
							right: 23,
							display: "flex",
							alignItems: "flex-center",
							height: textAreaBaseHeight || 31,
							bottom: 9.5, // should be 10 but doesnt look good on mac
							zIndex: 2,
						}}>
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								alignItems: "center",
							}}>
							{/* <div
								className={`input-icon-button ${shouldDisableImages ? "disabled" : ""} codicon codicon-device-camera`}
								onClick={() => {
									if (!shouldDisableImages) {
										onSelectImages()
									}
								}}
								style={{
									marginRight: 5.5,
									fontSize: 16.5,
								}}
							/> */}
							<div
								data-testid="send-button"
								className={`input-icon-button ${textAreaDisabled ? "disabled" : ""} codicon codicon-send`}
								onClick={() => {
									if (!textAreaDisabled) {
										setIsTextAreaFocused(false)
										handleSend() // Use handleSend instead of onSend
									}
								}}
								style={{ fontSize: 15 }}></div>
						</div>
					</div>
					{/* Add inline controls at the top of the text area */}
					<InlineControls>
						<InlineToggle onClick={onModeToggle} title={`Toggle mode (${metaKeyChar}+Shift+A)`} style={{ borderColor: chatSettings.mode === "chat" ? PLAN_MODE_COLOR : "#0078D4" }}>
							<ActiveIndicator isPlan={chatSettings.mode === "chat"} />
							<span style={{ fontWeight: "500" }}>
								{chatSettings.mode === "chat" ? "Plan" : "Agent"}
							</span>
						</InlineToggle>

						<InlineModelButton onClick={handleModelButtonClick} title="Change model" style={{ borderColor: showModelSelector ? "#0078D4" : "var(--vscode-input-border)", backgroundColor: showModelSelector ? "var(--vscode-toolbar-hoverBackground)" : "var(--vscode-editor-background)" }}>
							<span className="codicon codicon-plug" style={{ fontSize: "10px", marginRight: "6px" }} />
							<span style={{ fontWeight: "500" }}>{modelDisplayName}</span>
						</InlineModelButton>
					</InlineControls>
				</div>

				{/* Keep model selector tooltip */}
				{showModelSelector && (
					<div style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						zIndex: 1090,
						pointerEvents: 'none'
					}}>
						<ModelSelectorTooltip
							arrowPosition={arrowPosition}
							menuPosition={menuPosition}
							style={{
								pointerEvents: 'auto'
							}}
							ref={setModelSelectorRef}
						>
							<ApiOptions
								showModelOptions={true}
								apiErrorMessage={undefined}
								modelIdErrorMessage={undefined}
								isPopup={true}
							/>
						</ModelSelectorTooltip>
					</div>
				)}
			</div>
		)
	},
)

export default ChatTextArea
