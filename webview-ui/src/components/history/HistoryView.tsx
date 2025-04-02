import { VSCodeButton, VSCodeTextField, VSCodeRadioGroup, VSCodeRadio } from "@vscode/webview-ui-toolkit/react"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { vscode } from "../../utils/vscode"
import { Virtuoso } from "react-virtuoso"
import { memo, useMemo, useState, useEffect, useCallback } from "react"
import Fuse, { FuseResult } from "fuse.js"
import { formatLargeNumber } from "../../utils/format"
import { formatSize } from "../../utils/size"
import DangerButton from "../common/DangerButton"
import { ExtensionMessage } from "../../../../src/shared/ExtensionMessage"
import { useEvent } from "react-use"

type HistoryViewProps = {
	onDone: () => void
}

type SortOption = "newest" | "oldest" | "mostExpensive" | "mostTokens" | "mostRelevant"

const HistoryView = ({ onDone }: HistoryViewProps) => {
	const { taskHistory, totalTasksSize } = useExtensionState()
	const [searchQuery, setSearchQuery] = useState("")
	const [sortOption, setSortOption] = useState<SortOption>("newest")
	const [lastNonRelevantSort, setLastNonRelevantSort] = useState<SortOption | null>("newest")
	const [deleteAllDisabled, setDeleteAllDisabled] = useState(false)

	const handleMessage = useCallback((event: MessageEvent<ExtensionMessage>) => {
		if (event.data.type === "relinquishControl") {
			setDeleteAllDisabled(false)
		}
	}, [])
	useEvent("message", handleMessage)

	// Request total tasks size when component mounts
	useEffect(() => {
		vscode.postMessage({ type: "requestTotalTasksSize" })
	}, [])

	useEffect(() => {
		if (searchQuery && sortOption !== "mostRelevant" && !lastNonRelevantSort) {
			setLastNonRelevantSort(sortOption)
			setSortOption("mostRelevant")
		} else if (!searchQuery && sortOption === "mostRelevant" && lastNonRelevantSort) {
			setSortOption(lastNonRelevantSort)
			setLastNonRelevantSort(null)
		}
	}, [searchQuery, sortOption, lastNonRelevantSort])

	const handleHistorySelect = (id: string) => {
		vscode.postMessage({ type: "showTaskWithId", text: id })
	}

	const handleDeleteHistoryItem = (id: string) => {
		vscode.postMessage({ type: "deleteTaskWithId", text: id })
	}

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp)
		return date
			?.toLocaleString("en-US", {
				month: "long",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
			})
			.replace(", ", " ")
			.replace(" at", ",")
			.toUpperCase()
	}

	const presentableTasks = useMemo(() => {
		return taskHistory.filter((item) => item.ts && item.task)
	}, [taskHistory])

	const fuse = useMemo(() => {
		return new Fuse(presentableTasks, {
			keys: ["task"],
			threshold: 0.6,
			shouldSort: true,
			isCaseSensitive: false,
			ignoreLocation: false,
			includeMatches: true,
			minMatchCharLength: 1,
		})
	}, [presentableTasks])

	const taskHistorySearchResults = useMemo(() => {
		let results = searchQuery ? highlight(fuse.search(searchQuery)) : presentableTasks

		results.sort((a, b) => {
			switch (sortOption) {
				case "oldest":
					return a.ts - b.ts
				case "mostExpensive":
					return (b.totalCost || 0) - (a.totalCost || 0)
				case "mostTokens":
					return (
						(b.tokensIn || 0) +
						(b.tokensOut || 0) +
						(b.cacheWrites || 0) +
						(b.cacheReads || 0) -
						((a.tokensIn || 0) + (a.tokensOut || 0) + (a.cacheWrites || 0) + (a.cacheReads || 0))
					)
				case "mostRelevant":
					// NOTE: you must never sort directly on object since it will cause members to be reordered
					return searchQuery ? 0 : b.ts - a.ts // Keep fuse order if searching, otherwise sort by newest
				case "newest":
				default:
					return b.ts - a.ts
			}
		})

		return results
	}, [presentableTasks, searchQuery, fuse, sortOption])

	return (
		<>
			<style>
				{`
					.history-item {
						cursor: pointer;
						transition: all 0.3s ease;
						position: relative;
					}
					
					.history-item:hover {
						background-color: #2d3748;
						transform: translateY(-1px);
					}
					
					.history-item-content {
						display: flex;
						flex-direction: column;
						gap: 12px;
						padding: 16px 20px;
						position: relative;
						border-bottom: 1px solid #3f4655;
					}
					
					.history-header {
						display: flex;
						justify-content: space-between;
						align-items: center;
					}
					
					.history-date {
						color: #9ca3af;
						font-weight: 500;
						font-size: 0.85em;
						text-transform: uppercase;
						transition: color 0.2s ease;
					}
					
					.history-item:hover .history-date {
						color: #d1d5db;
					}
					
					.history-content {
						font-size: var(--vscode-font-size);
						color: #ffffff;
						display: -webkit-box;
						-webkit-line-clamp: 3;
						-webkit-box-orient: vertical;
						overflow: hidden;
						white-space: pre-wrap;
						word-break: break-word;
						overflow-wrap: anywhere;
						line-height: 1.4;
					}
					
					.token-section {
						display: flex;
						flex-direction: column;
						gap: 8px;
					}
					
					.token-bar {
						height: 6px;
						background-color: #1f2937;
						border-radius: 8px;
						overflow: hidden;
						margin-bottom: 4px;
						display: flex;
						box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
					}
					
					.token-in {
						height: 100%;
						background: linear-gradient(90deg, #3b82f6, #60a5fa);
						transition: width 0.5s ease-in-out;
						border-radius: 8px 0 0 8px;
					}
					
					.token-out {
						height: 100%;
						background: linear-gradient(90deg, #10b981, #34d399);
						transition: width 0.5s ease-in-out;
						border-radius: 0 8px 8px 0;
					}
					
					.history-item:hover .token-in {
						background: linear-gradient(90deg, #4f46e5, #6366f1);
					}
					
					.history-item:hover .token-out {
						background: linear-gradient(90deg, #059669, #10b981);
					}
					
					.token-row {
						display: flex;
						justify-content: space-between;
						align-items: center;
					}
					
					.token-stat {
						display: flex;
						align-items: center;
						gap: 8px;
						flex-wrap: wrap;
						color: var(--vscode-descriptionForeground);
					}
					
					.token-label {
						font-weight: 500;
					}
					
					.token-value {
						display: flex;
						align-items: center;
						gap: 3px;
					}
					
					.api-cost {
						display: inline-flex;
						align-items: center;
						background-color: #1f2937;
						padding: 4px 8px;
						border-radius: 4px;
						transition: all 0.2s ease;
						width: auto;
						box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
					}
					
					.history-item:hover .api-cost {
						background-color: #2d3748;
					}
					
					.delete-button, .export-button {
						opacity: 0;
						pointer-events: none;
						transition: opacity 0.2s ease, transform 0.2s ease;
					}
					
					.history-item:hover .delete-button,
					.history-item:hover .export-button {
						opacity: 1;
						pointer-events: auto;
					}
					
					.history-item:hover .delete-button:hover,
					.history-item:hover .export-button:hover {
						transform: scale(1.05);
					}
					
					.history-item-highlight {
						background-color: #4b5563;
						color: #ffffff;
					}
					
					.search-container {
						position: relative;
						width: 100%;
					}
					
					.clear-button {
						display: flex;
						justify-content: center;
						align-items: center;
						height: 100%;
						transition: transform 0.2s ease;
					}
					
					.clear-button:hover {
						transform: scale(1.1);
					}
					
					.danger-button {
						transition: all 0.3s ease;
					}
					
					.danger-button:hover:not(:disabled) {
						transform: translateY(-1px);
					}
				`}
			</style>
			<div
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
					backgroundColor: "#1f2937",
					color: "#ffffff",
				}}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						padding: "10px 17px 10px 20px",
						borderBottom: "1px solid #4b5563",
					}}>
					<h3
						style={{
							color: "#ffffff",
							margin: 0,
						}}>
						History
					</h3>
					<VSCodeButton onClick={onDone}>Done</VSCodeButton>
				</div>
				<div style={{ padding: "5px 17px 6px 17px" }}>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "6px",
						}}>
						{/* <VSCodeTextField
							style={{ width: "100%" }}
							placeholder="Fuzzy search history..."
							value={searchQuery}
							onInput={(e) => {
								const newValue = (e.target as HTMLInputElement)?.value
								setSearchQuery(newValue)
								if (newValue && !searchQuery && sortOption !== "mostRelevant") {
									setLastNonRelevantSort(sortOption)
									setSortOption("mostRelevant")
								}
							}}>
							<div
								slot="start"
								className="codicon codicon-search"
								style={{
									fontSize: 13,
									marginTop: 2.5,
									opacity: 0.8,
								}}></div>
							{searchQuery && (
								<div
									className="input-icon-button codicon codicon-close"
									aria-label="Clear search"
									onClick={() => setSearchQuery("")}
									slot="end"
									style={{
										display: "flex",
										justifyContent: "center",
										alignItems: "center",
										height: "100%",
									}}
								/>
							)}
						</VSCodeTextField>
						<VSCodeRadioGroup
							style={{ display: "flex", flexWrap: "wrap" }}
							value={sortOption}
							onChange={(e) => setSortOption((e.target as HTMLInputElement).value as SortOption)}>
							<VSCodeRadio value="newest">Newest</VSCodeRadio>
							<VSCodeRadio value="oldest">Oldest</VSCodeRadio>
							<VSCodeRadio value="mostExpensive">Most Expensive</VSCodeRadio>
							<VSCodeRadio value="mostTokens">Most Tokens</VSCodeRadio>
							<VSCodeRadio value="mostRelevant" disabled={!searchQuery} style={{ opacity: searchQuery ? 1 : 0.5 }}>
								Most Relevant
							</VSCodeRadio>
						</VSCodeRadioGroup> */}
					</div>
				</div>
				<div style={{ flexGrow: 1, overflowY: "auto", margin: 0 }}>
					<Virtuoso
						style={{
							flexGrow: 1,
							overflowY: "scroll",
						}}
						data={taskHistorySearchResults}
						itemContent={(index, item) => (
							<div
								key={item.id}
								className="history-item"
								style={{
									cursor: "pointer",
									borderBottom:
										index < taskHistory.length - 1 ? "1px solid #4b5563" : "none",
								}}
								onClick={() => handleHistorySelect(item.id)}>
								<div className="history-item-content">
									<div className="history-header">
										<span className="history-date">
											{formatDate(item.ts)}
										</span>
										<VSCodeButton
											appearance="icon"
											onClick={(e) => {
												e.stopPropagation()
												handleDeleteHistoryItem(item.id)
											}}
											className="delete-button"
											style={{ padding: "0px 0px" }}>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "3px",
													fontSize: "11px",
												}}>
												<span className="codicon codicon-trash"></span>
												{formatSize(item.size)}
											</div>
										</VSCodeButton>
									</div>
									<div className="history-content"
										dangerouslySetInnerHTML={{
											__html: item.task,
										}}
									/>
									<div className="token-section">
										<div className="token-bar">
											<div 
												className="token-in" 
												style={{ 
													width: `${((item.tokensIn || 0) / ((item.tokensIn || 0) + (item.tokensOut || 0))) * 100}%` 
												}}
											></div>
											<div 
												className="token-out" 
												style={{ 
													width: `${((item.tokensOut || 0) / ((item.tokensIn || 0) + (item.tokensOut || 0))) * 100}%` 
												}}
											></div>
										</div>
										<div className="token-row">
											<div className="token-stat">
												<span className="token-label">Tokens:</span>
												<span className="token-value">
													<i
														className="codicon codicon-arrow-up"
														style={{
															fontSize: "12px",
															fontWeight: "bold",
															marginBottom: "-2px",
															color: "#60a5fa"
														}}
													/>
													{formatLargeNumber(item.tokensIn || 0)}
												</span>
												<span className="token-value">
													<i
														className="codicon codicon-arrow-down"
														style={{
															fontSize: "12px",
															fontWeight: "bold",
															marginBottom: "-2px",
															color: "#34d399"
														}}
													/>
													{formatLargeNumber(item.tokensOut || 0)}
												</span>
											</div>
											{!item.totalCost && <ExportButton itemId={item.id} />}
										</div>

										{!!item.cacheWrites && (
											<div className="token-stat">
												<span className="token-label">Cache:</span>
												<span className="token-value">
													<i
														className="codicon codicon-database"
														style={{
															fontSize: "12px",
															fontWeight: "bold",
															marginBottom: "-1px",
														}}
													/>
													+{formatLargeNumber(item.cacheWrites || 0)}
												</span>
												<span className="token-value">
													<i
														className="codicon codicon-arrow-right"
														style={{
															fontSize: "12px",
															fontWeight: "bold",
															marginBottom: 0,
														}}
													/>
													{formatLargeNumber(item.cacheReads || 0)}
												</span>
											</div>
										)}
										{!!item.totalCost && (
											<div className="token-row">
												<div className="token-stat">
													<span className="api-cost">
														<span className="codicon codicon-credit-card" style={{ marginRight: "4px" }}></span>
														${item.totalCost?.toFixed(4)}
													</span>
												</div>
												<ExportButton itemId={item.id} />
											</div>
										)}
									</div>
								</div>
							</div>
						)}
					/>
				</div>
				<div
					style={{
						padding: "16px",
						borderTop: "1px solid #4b5563",
						backgroundColor: "#1f2937",
					}}>
					<DangerButton
						className="danger-button"
						style={{ width: "100%" }}
						disabled={deleteAllDisabled || taskHistory.length === 0}
						onClick={() => {
							setDeleteAllDisabled(true)
							vscode.postMessage({ type: "clearAllTaskHistory" })
						}}>
						Delete All History{totalTasksSize !== null ? ` (${formatSize(totalTasksSize)})` : ""}
					</DangerButton>
				</div>
			</div>
		</>
	)
}

const ExportButton = ({ itemId }: { itemId: string }) => (
	<VSCodeButton
		className="export-button"
		appearance="icon"
		onClick={(e) => {
			e.stopPropagation()
			vscode.postMessage({ type: "exportTaskWithId", text: itemId })
		}}>
		<div style={{ 
			fontSize: "11px", 
			fontWeight: 500, 
			opacity: 1,
			display: "flex",
			alignItems: "center",
			gap: "3px"
		}}>
			<span className="codicon codicon-export"></span>
			EXPORT
		</div>
	</VSCodeButton>
)

// https://gist.github.com/evenfrost/1ba123656ded32fb7a0cd4651efd4db0
export const highlight = (fuseSearchResult: FuseResult<any>[], highlightClassName: string = "history-item-highlight") => {
	const set = (obj: Record<string, any>, path: string, value: any) => {
		const pathValue = path.split(".")
		let i: number

		for (i = 0; i < pathValue.length - 1; i++) {
			obj = obj[pathValue[i]] as Record<string, any>
		}

		obj[pathValue[i]] = value
	}

	// Function to merge overlapping regions
	const mergeRegions = (regions: [number, number][]): [number, number][] => {
		if (regions.length === 0) return regions

		// Sort regions by start index
		regions.sort((a, b) => a[0] - b[0])

		const merged: [number, number][] = [regions[0]]

		for (let i = 1; i < regions.length; i++) {
			const last = merged[merged.length - 1]
			const current = regions[i]

			if (current[0] <= last[1] + 1) {
				// Overlapping or adjacent regions
				last[1] = Math.max(last[1], current[1])
			} else {
				merged.push(current)
			}
		}

		return merged
	}

	const generateHighlightedText = (inputText: string, regions: [number, number][] = []) => {
		if (regions.length === 0) {
			return inputText
		}

		// Sort and merge overlapping regions
		const mergedRegions = mergeRegions(regions)

		let content = ""
		let nextUnhighlightedRegionStartingIndex = 0

		mergedRegions.forEach((region) => {
			const start = region[0]
			const end = region[1]
			const lastRegionNextIndex = end + 1

			content += [
				inputText.substring(nextUnhighlightedRegionStartingIndex, start),
				`<span class="${highlightClassName}">`,
				inputText.substring(start, lastRegionNextIndex),
				"</span>",
			].join("")

			nextUnhighlightedRegionStartingIndex = lastRegionNextIndex
		})

		content += inputText.substring(nextUnhighlightedRegionStartingIndex)

		return content
	}

	return fuseSearchResult
		.filter(({ matches }) => matches && matches.length)
		.map(({ item, matches }) => {
			const highlightedItem = { ...item }

			matches?.forEach((match) => {
				if (match.key && typeof match.value === "string" && match.indices) {
					// Merge overlapping regions before generating highlighted text
					const mergedIndices = mergeRegions([...match.indices])
					set(highlightedItem, match.key, generateHighlightedText(match.value, mergedIndices))
				}
			})

			return highlightedItem
		})
}

export default memo(HistoryView)
