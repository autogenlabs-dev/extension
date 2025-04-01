import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import React, { memo, useEffect, useMemo, useRef, useState } from "react"
import { useWindowSize } from "react-use"
import { mentionRegexGlobal } from "../../../../src/shared/context-mentions"
import { AutoGenMessage } from "../../../../src/shared/ExtensionMessage"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { formatLargeNumber } from "../../utils/format"
import { formatSize } from "../../utils/size"
import { vscode } from "../../utils/vscode"
import Thumbnails from "../common/Thumbnails"
import { normalizeApiConfiguration } from "../settings/ApiOptions"

interface TaskHeaderProps {
	task: AutoGenMessage
	tokensIn: number
	tokensOut: number
	doesModelSupportPromptCache: boolean
	cacheWrites?: number
	cacheReads?: number
	totalCost: number
	lastApiReqTotalTokens?: number
	onClose: () => void
	showSettings?: () => void
}

const TaskHeader: React.FC<TaskHeaderProps> = ({
	task,
	tokensIn,
	tokensOut,
	doesModelSupportPromptCache,
	cacheWrites,
	cacheReads,
	totalCost,
	lastApiReqTotalTokens,
	onClose,
	showSettings,
}) => {
	const { apiConfiguration, currentTaskItem, checkpointTrackerErrorMessage } = useExtensionState()
	const [isTaskExpanded, setIsTaskExpanded] = useState(false)
	const [isTextExpanded, setIsTextExpanded] = useState(false)
	const [showSeeMore, setShowSeeMore] = useState(false)
	const textContainerRef = useRef<HTMLDivElement>(null)
	const textRef = useRef<HTMLDivElement>(null)

	const { selectedModelInfo } = useMemo(() => normalizeApiConfiguration(apiConfiguration), [apiConfiguration])
	const contextWindow = selectedModelInfo?.contextWindow

	// Open task header when checkpoint tracker error message is set
	const prevErrorMessageRef = useRef(checkpointTrackerErrorMessage)
	useEffect(() => {
		if (checkpointTrackerErrorMessage !== prevErrorMessageRef.current) {
			setIsTaskExpanded(true)
			prevErrorMessageRef.current = checkpointTrackerErrorMessage
		}
	}, [checkpointTrackerErrorMessage])

	/*
	When dealing with event listeners in React components that depend on state variables, we face a challenge. We want our listener to always use the most up-to-date version of a callback function that relies on current state, but we don't want to constantly add and remove event listeners as that function updates. This scenario often arises with resize listeners or other window events. Simply adding the listener in a useEffect with an empty dependency array risks using stale state, while including the callback in the dependencies can lead to unnecessary re-registrations of the listener. There are react hook libraries that provide a elegant solution to this problem by utilizing the useRef hook to maintain a reference to the latest callback function without triggering re-renders or effect re-runs. This approach ensures that our event listener always has access to the most current state while minimizing performance overhead and potential memory leaks from multiple listener registrations. 
	Sources
	- https://usehooks-ts.com/react-hook/use-event-listener
	- https://streamich.github.io/react-use/?path=/story/sensors-useevent--docs
	- https://github.com/streamich/react-use/blob/master/src/useEvent.ts
	- https://stackoverflow.com/questions/55565444/how-to-register-event-with-useeffect-hooks

	Before:
	
	const updateMaxHeight = useCallback(() => {
		if (isExpanded && textContainerRef.current) {
			const maxHeight = window.innerHeight * (3 / 5)
			textContainerRef.current.style.maxHeight = `${maxHeight}px`
		}
	}, [isExpanded])

	useEffect(() => {
		updateMaxHeight()
	}, [isExpanded, updateMaxHeight])

	useEffect(() => {
		window.removeEventListener("resize", updateMaxHeight)
		window.addEventListener("resize", updateMaxHeight)
		return () => {
			window.removeEventListener("resize", updateMaxHeight)
		}
	}, [updateMaxHeight])

	After:
	*/

	const { height: windowHeight, width: windowWidth } = useWindowSize()

	useEffect(() => {
		if (isTextExpanded && textContainerRef.current) {
			const maxHeight = windowHeight * (1 / 2)
			textContainerRef.current.style.maxHeight = `${maxHeight}px`
		}
	}, [isTextExpanded, windowHeight])

	useEffect(() => {
		if (isTaskExpanded && textRef.current && textContainerRef.current) {
			let textContainerHeight = textContainerRef.current.clientHeight
			if (!textContainerHeight) {
				textContainerHeight = textContainerRef.current.getBoundingClientRect().height
			}
			const isOverflowing = textRef.current.scrollHeight > textContainerHeight

			// necessary to show see more button again if user resizes window to expand and then back to collapse
			if (!isOverflowing) {
				setIsTextExpanded(false)
			}
			setShowSeeMore(isOverflowing)
		}
	}, [task.text, windowWidth, isTaskExpanded])

	const isCostAvailable = useMemo(() => {
		const openAiCompatHasPricing =
			apiConfiguration?.apiProvider === "openai" &&
			apiConfiguration?.openAiModelInfo?.inputPrice &&
			apiConfiguration?.openAiModelInfo?.outputPrice
		if (openAiCompatHasPricing) {
			return true
		}
		return (
			apiConfiguration?.apiProvider !== "vscode-lm" &&
			apiConfiguration?.apiProvider !== "ollama" &&
			apiConfiguration?.apiProvider !== "lmstudio" &&
			apiConfiguration?.apiProvider !== "gemini"
		)
	}, [apiConfiguration?.apiProvider, apiConfiguration?.openAiModelInfo])

	const shouldShowPromptCacheInfo =
		doesModelSupportPromptCache && apiConfiguration?.apiProvider !== "openrouter" && apiConfiguration?.apiProvider !== "AutoGen"

	const ContextWindowComponent = (
		<>
			{isTaskExpanded && contextWindow && (
				<div
					style={{
						display: "flex",
						flexDirection: windowWidth < 270 ? "column" : "row",
						gap: "4px",
					}}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "4px",
							flexShrink: 0, // Prevents shrinking
						}}>
						<span style={{ fontWeight: "bold" }}>
							Context Window:
						</span>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "3px",
							flex: 1,
							whiteSpace: "nowrap",
						}}>
						<span>{formatLargeNumber(lastApiReqTotalTokens || 0)}</span>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "3px",
								flex: 1,
							}}>
							<div
								style={{
									flex: 1,
									height: "4px",
									backgroundColor: "color-mix(in srgb, var(--vscode-badge-foreground) 20%, transparent)",
									borderRadius: "2px",
									overflow: "hidden",
								}}>
								<div
									style={{
										width: `${((lastApiReqTotalTokens || 0) / contextWindow) * 100}%`,
										height: "100%",
										backgroundColor: "var(--vscode-badge-foreground)",
										borderRadius: "2px",
									}}
								/>
							</div>
							<span>{formatLargeNumber(contextWindow)}</span>
						</div>
					</div>
				</div>
			)}
		</>
	)

	return (
		<div style={{ padding: "10px 13px 10px 13px" }}>
			<div
				style={{
					backgroundColor: "#374151", // Updated to match the bot-message background
					borderRadius: "8px",
					padding: "10px",
					color: "var(--vscode-foreground)",
					position: "relative",
				}}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
					<div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "8px",
									cursor: "pointer",
									userSelect: "none",
								}}
								onClick={() => setIsTaskExpanded(!isTaskExpanded)}>
								<i
									className={`codicon codicon-chevron-${isTaskExpanded ? "down" : "right"}`}
									style={{ fontSize: "12px" }}
								/>
								<span style={{ fontWeight: "bold" }}>Task</span>
							</div>
							<div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
								{showSettings && (
									<VSCodeButton appearance="icon" onClick={showSettings}>
										<i className="codicon codicon-settings-gear" />
									</VSCodeButton>
								)}
								<VSCodeButton appearance="icon" onClick={onClose}>
									<i className="codicon codicon-close" />
								</VSCodeButton>
							</div>
						</div>

						{isTaskExpanded && (
							<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
								<div
									ref={textContainerRef}
									style={{
										position: "relative",
										overflow: "hidden",
										transition: "max-height 0.2s ease-out",
									}}>
									<div ref={textRef} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
										{task.text}
									</div>
								</div>
								{showSeeMore && (
									<VSCodeButton
										appearance="secondary"
										onClick={() => setIsTextExpanded(!isTextExpanded)}
										style={{ alignSelf: "flex-start" }}>
										{isTextExpanded ? "See Less" : "See More"}
									</VSCodeButton>
								)}
								{task.images && task.images.length > 0 && (
									<div style={{ marginTop: "8px" }}>
										<Thumbnails images={task.images} />
									</div>
								)}
							</div>
						)}

						{isTaskExpanded && (
							<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
								{/* Tokens */}
								<div
									style={{
										display: "flex",
										flexDirection: windowWidth < 270 ? "column" : "row",
										gap: "4px",
									}}>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "4px",
											flexShrink: 0,
										}}>
										<span style={{ fontWeight: "bold" }}>Tokens:</span>
									</div>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: "4px",
											flex: 1,
										}}>
										<span>
											{formatLargeNumber(tokensIn)} in / {formatLargeNumber(tokensOut)} out
										</span>
										{shouldShowPromptCacheInfo && (
											<>
												{" "}
												•{" "}
												<span>
													{formatLargeNumber(cacheWrites || 0)} cached / {formatLargeNumber(cacheReads || 0)} reused
												</span>
											</>
										)}
									</div>
								</div>

								{/* Cost */}
								{isCostAvailable && (
									<div
										style={{
											display: "flex",
											flexDirection: windowWidth < 270 ? "column" : "row",
											gap: "4px",
										}}>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "4px",
												flexShrink: 0,
											}}>
											<span style={{ fontWeight: "bold" }}>Cost:</span>
										</div>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "4px",
												flex: 1,
											}}>
											<span>${totalCost.toFixed(4)}</span>
										</div>
									</div>
								)}

								{/* Context Window */}
								{ContextWindowComponent}

								{/* Checkpoint Tracker Error */}
								{checkpointTrackerErrorMessage && (
									<div
										style={{
											display: "flex",
											flexDirection: "column",
											gap: "4px",
											marginTop: "4px",
											padding: "8px",
											backgroundColor: "var(--vscode-inputValidation-errorBackground)",
											border: "1px solid var(--vscode-inputValidation-errorBorder)",
											borderRadius: "4px",
										}}>
										<div style={{ fontWeight: "bold", color: "var(--vscode-inputValidation-errorForeground)" }}>
											Error: Failed to track task progress
										</div>
										<div style={{ color: "var(--vscode-inputValidation-errorForeground)" }}>
											{checkpointTrackerErrorMessage}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export const highlightMentions = (text?: string, withShadow = true) => {
	if (!text) return text
	const parts = text.split(mentionRegexGlobal)
	return parts.map((part, index) => {
		if (index % 2 === 0) {
			// This is regular text
			return part
		} else {
			// This is a mention
			return (
				<span
					key={index}
					className={withShadow ? "mention-context-highlight-with-shadow" : "mention-context-highlight"}
					style={{ cursor: "pointer" }}
					onClick={() => vscode.postMessage({ type: "openMention", text: part })}>
					@{part}
				</span>
			)
		}
	})
}

const DeleteButton: React.FC<{
	taskSize: string
	taskId?: string
}> = ({ taskSize, taskId }) => (
	<VSCodeButton
		appearance="icon"
		onClick={() => vscode.postMessage({ type: "deleteTaskWithId", text: taskId })}
		style={{ padding: "0px 0px" }}>
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: "3px",
				fontSize: "10px",
				fontWeight: "bold",
				opacity: 0.8, // Increased opacity for better visibility on dark background
				color: "#ffffff",
			}}>
			<i className={`codicon codicon-trash`} />
			{taskSize}
		</div>
	</VSCodeButton>
)

// const ExportButton = () => (
// 	<VSCodeButton
// 		appearance="icon"
// 		onClick={() => vscode.postMessage({ type: "exportCurrentTask" })}
// 		style={{
// 				// marginBottom: "-2px",
// 				// marginRight: "-2.5px",
// 			}}>
// 		<div style={{ fontSize: "10.5px", fontWeight: "bold", opacity: 0.6 }}>EXPORT</div>
// 	</VSCodeButton>
// )

export default memo(TaskHeader)
