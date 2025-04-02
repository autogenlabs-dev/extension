import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { vscode } from "../../utils/vscode"
import { memo } from "react"
import { formatLargeNumber } from "../../utils/format"

type HistoryPreviewProps = {
	showHistoryView: () => void
}

const HistoryPreview = ({ showHistoryView }: HistoryPreviewProps) => {
	const { taskHistory } = useExtensionState()
	const handleHistorySelect = (id: string) => {
		vscode.postMessage({ type: "showTaskWithId", text: id })
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

	return (
		<div style={{ flexShrink: 0 }}>
			<style>
				{`
					.history-preview-container {
						padding: 0px 20px;
					}
					
					.history-preview-header {
						color: #9ca3af;
						margin: 10px 20px 10px 20px;
						display: flex;
						align-items: center;
						transition: transform 0.2s ease-in-out;
					}
					
					.history-preview-header:hover {
						transform: translateX(2px);
					}
					
					.history-preview-item {
						background-color: #2d3748;
						border-radius: 8px;
						position: relative;
						overflow: hidden;
						opacity: 0.9;
						cursor: pointer;
						margin-bottom: 16px;
						border: 1px solid #4b5563;
						transition: all 0.3s ease;
						box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
					}
					
					.history-preview-item:hover {
						background-color: #374151;
						opacity: 1;
						transform: translateY(-2px);
						box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
						border-color: #6b7280;
					}
					
					.history-preview-date {
						color: #9ca3af;
						font-weight: 500;
						font-size: 0.85em;
						text-transform: uppercase;
						transition: color 0.2s ease;
					}
					
					.history-preview-item:hover .history-preview-date {
						color: #d1d5db;
					}
					
					.history-preview-content {
						font-size: var(--vscode-font-size);
						color: #ffffff;
						margin-bottom: 12px;
						display: -webkit-box;
						-webkit-line-clamp: 3;
						-webkit-box-orient: vertical;
						overflow: hidden;
						white-space: pre-wrap;
						word-break: break-word;
						overflow-wrap: anywhere;
						line-height: 1.4;
					}
					
					.history-preview-stats {
						font-size: 0.85em;
						color: #9ca3af;
						display: flex;
						flex-wrap: wrap;
						gap: 6px;
						flex-direction: column;
					}
					
					.token-bar {
						height: 6px;
						background-color: #1f2937;
						border-radius: 8px;
						overflow: hidden;
						margin-bottom: 8px;
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
					
					.history-preview-item:hover .token-in {
						background: linear-gradient(90deg, #4f46e5, #6366f1);
					}
					
					.history-preview-item:hover .token-out {
						background: linear-gradient(90deg, #059669, #10b981);
					}
					
					.token-stats {
						display: flex;
						justify-content: space-between;
						margin-bottom: 8px;
					}
					
					.token-legend {
						display: flex;
						gap: 12px;
						margin-top: 2px;
					}
					
					.legend-item {
						display: flex;
						align-items: center;
						gap: 4px;
					}
					
					.legend-color {
						width: 10px;
						height: 10px;
						border-radius: 2px;
					}
					
					.in-color {
						background: linear-gradient(90deg, #3b82f6, #60a5fa);
					}
					
					.out-color {
						background: linear-gradient(90deg, #10b981, #34d399);
					}
					
					.view-all-button {
						opacity: 0.8;
						transition: opacity 0.3s ease, transform 0.3s ease;
						border-radius: 4px;
						padding: 8px 16px;
						margin-top: 4px;
					}
					
					.view-all-button:hover {
						opacity: 1;
						transform: translateY(-1px);
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
					
					.history-preview-item:hover .api-cost {
						background-color: #2d3748;
					}
				`}
			</style>

			{/* <div style={{ marginTop: 10 }} className="history-preview-header">
				<span
					className="codicon codicon-history"
					style={{
						marginRight: "6px",
						transform: "scale(0.9)",
					}}></span>
				<span
					style={{
						fontWeight: 500,
						fontSize: "0.85em",
					}}>
					Recent History
				</span>
			</div> */}
			<div className="history-preview-container">
				{taskHistory
					.filter((item) => item.ts && item.task)
					.slice(0, 1)
					.map((item) => (
						<div key={item.id} className="history-preview-item" onClick={() => handleHistorySelect(item.id)}>
							<div style={{ padding: "16px" }}>
								<div style={{ marginBottom: "10px" }}>
									<span className="history-preview-date">
										{formatDate(item.ts)}
									</span>
								</div>
								<div className="history-preview-content">
									{item.task}
								</div>
								<div className="history-preview-stats">
									<div className="token-bar">
										<div className="token-in" style={{ width: `${(item.tokensIn / (item.tokensIn + item.tokensOut)) * 100}%` }}></div>
										<div className="token-out" style={{ width: `${(item.tokensOut / (item.tokensIn + item.tokensOut)) * 100}%` }}></div>
									</div>
									<div className="token-stats">
										<span>
											Total Tokens: {formatLargeNumber(item.tokensIn + item.tokensOut)}
										</span>
										<div className="token-legend">
											<div className="legend-item">
												<div className="legend-color in-color"></div>
												<span>In: {formatLargeNumber(item.tokensIn || 0)}</span>
											</div>
											<div className="legend-item">
												<div className="legend-color out-color"></div>
												<span>Out: {formatLargeNumber(item.tokensOut || 0)}</span>
											</div>
										</div>
									</div>
									{!!item.cacheWrites && (
										<span>
											• Cache: +{formatLargeNumber(item.cacheWrites || 0)} →{" "}
											{formatLargeNumber(item.cacheReads || 0)}
										</span>
									)}
									{!!item.totalCost && (
										<span className="api-cost">
											<span className="codicon codicon-credit-card" style={{ marginRight: "4px" }}></span>
											API Cost: ${item.totalCost?.toFixed(4)}
										</span>
									)}
								</div>
							</div>
						</div>
					))}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}>
					<VSCodeButton
						appearance="secondary"
						onClick={() => showHistoryView()}
						className="view-all-button">
						<div
							style={{
								fontSize: "var(--vscode-font-size)",
								color: "#d1d5db",
								display: "flex",
								alignItems: "center",
								gap: "6px"
							}}>
							View all history
							<span className="codicon codicon-arrow-right"></span>
						</div>
					</VSCodeButton>
				</div>
			</div>
		</div>
	)
}

export default memo(HistoryPreview)
