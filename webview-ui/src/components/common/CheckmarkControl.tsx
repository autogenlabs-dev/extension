import { useCallback, useRef, useState, useEffect } from "react"
import { useClickAway, useEvent } from "react-use"
import styled, { keyframes } from "styled-components"
import { ExtensionMessage } from "../../../../src/shared/ExtensionMessage"
import { vscode } from "../../utils/vscode"
import { CODE_BLOCK_BG_COLOR } from "./CodeBlock"
import { AutoGenCheckpointRestore } from "../../../../src/shared/WebviewMessage"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { createPortal } from "react-dom"
import { useFloating, offset, flip, shift } from "@floating-ui/react"

interface CheckmarkControlProps {
	messageTs?: number
	isCheckpointCheckedOut?: boolean
}

export const CheckmarkControl = ({ messageTs, isCheckpointCheckedOut }: CheckmarkControlProps) => {
	const [compareDisabled, setCompareDisabled] = useState(false)
	const [restoreTaskDisabled, setRestoreTaskDisabled] = useState(false)
	const [restoreWorkspaceDisabled, setRestoreWorkspaceDisabled] = useState(false)
	const [restoreBothDisabled, setRestoreBothDisabled] = useState(false)
	const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
	const [hasMouseEntered, setHasMouseEntered] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const tooltipRef = useRef<HTMLDivElement>(null)

	const { refs, floatingStyles, update, placement } = useFloating({
		placement: "bottom-end",
		middleware: [
			offset({
				mainAxis: 8,
				crossAxis: 10,
			}),
			flip(),
			shift(),
		],
	})

	useEffect(() => {
		const handleScroll = () => {
			update()
		}
		window.addEventListener("scroll", handleScroll, true)
		return () => window.removeEventListener("scroll", handleScroll, true)
	}, [update])

	useEffect(() => {
		if (showRestoreConfirm) {
			update()
		}
	}, [showRestoreConfirm, update])

	const handleMessage = useCallback((event: MessageEvent<ExtensionMessage>) => {
		if (event.data.type === "relinquishControl") {
			setCompareDisabled(false)
			setRestoreTaskDisabled(false)
			setRestoreWorkspaceDisabled(false)
			setRestoreBothDisabled(false)
			setShowRestoreConfirm(false)
		}
	}, [])

	const handleRestoreTask = () => {
		setRestoreTaskDisabled(true)
		vscode.postMessage({
			type: "checkpointRestore",
			number: messageTs,
			text: "task",
		})
	}

	const handleRestoreWorkspace = () => {
		setRestoreWorkspaceDisabled(true)
		vscode.postMessage({
			type: "checkpointRestore",
			number: messageTs,
			text: "workspace",
		})
	}

	const handleRestoreBoth = () => {
		setRestoreBothDisabled(true)
		vscode.postMessage({
			type: "checkpointRestore",
			number: messageTs,
			text: "taskAndWorkspace",
		})
	}

	const handleMouseEnter = () => {
		setHasMouseEntered(true)
	}

	const handleMouseLeave = () => {
		if (hasMouseEntered) {
			setShowRestoreConfirm(false)
			setHasMouseEntered(false)
		}
	}

	const handleControlsMouseLeave = (e: React.MouseEvent) => {
		const tooltipElement = tooltipRef.current

		if (tooltipElement && showRestoreConfirm) {
			const tooltipRect = tooltipElement.getBoundingClientRect()

			if (
				e.clientY >= tooltipRect.top &&
				e.clientY <= tooltipRect.bottom &&
				e.clientX >= tooltipRect.left &&
				e.clientX <= tooltipRect.right
			) {
				return
			}
		}

		setShowRestoreConfirm(false)
		setHasMouseEntered(false)
	}

	useEvent("message", handleMessage)

	return (
		<Container isMenuOpen={showRestoreConfirm} $isCheckedOut={isCheckpointCheckedOut} onMouseLeave={handleControlsMouseLeave}>
			<IconWrapper $isCheckedOut={isCheckpointCheckedOut}>
				<i
					className="codicon codicon-save"
					title={isCheckpointCheckedOut ? "Checkpoint (restored)" : "Checkpoint"}
				/>
			</IconWrapper>
			<DottedLine $isCheckedOut={isCheckpointCheckedOut} />
			<ButtonGroup>
				<CustomButton
					$isCheckedOut={isCheckpointCheckedOut}
					disabled={compareDisabled}
					title="Compare checkpoint"
					onClick={() => {
						setCompareDisabled(true)
						vscode.postMessage({
							type: "checkpointDiff",
							number: messageTs,
						})
					}}>
					{compareDisabled ? <StylishLoader $isCheckedOut={isCheckpointCheckedOut} /> : <i className="codicon codicon-git-compare" />}
				</CustomButton>
			</ButtonGroup>
			<DottedLine $isCheckedOut={isCheckpointCheckedOut} />
			<RestoreButtonWrapper ref={refs.setReference}>
				<CustomButton
					$isCheckedOut={isCheckpointCheckedOut}
					isActive={showRestoreConfirm}
					title="Restore checkpoint"
					onClick={() => setShowRestoreConfirm(true)}>
					<i className="codicon codicon-history" />
				</CustomButton>
				{showRestoreConfirm &&
					createPortal(
						<RestoreConfirmTooltip
							ref={refs.setFloating}
							style={floatingStyles}
							data-placement={placement}
							onMouseEnter={handleMouseEnter}
							onMouseLeave={handleMouseLeave}>
							<RestoreOption>
								<VSCodeButton
									onClick={handleRestoreWorkspace}
									disabled={restoreWorkspaceDisabled}
									style={{
										cursor: restoreWorkspaceDisabled ? "wait" : "pointer",
										width: "100%",
										marginBottom: "10px",
									}}>
									{restoreWorkspaceDisabled ? (
										<ButtonLoader>
											<LoadingDots $isCheckedOut={isCheckpointCheckedOut} />
										</ButtonLoader>
									) : (
										<i className="codicon codicon-files" style={{ marginRight: "6px" }} />
									)}
									Restore Files
								</VSCodeButton>
								<p>
									Restores your project's files back to a snapshot taken at this point (use "Compare" to see
									what will be reverted)
								</p>
							</RestoreOption>
							<RestoreOption>
								<VSCodeButton
									onClick={handleRestoreTask}
									disabled={restoreTaskDisabled}
									style={{
										cursor: restoreTaskDisabled ? "wait" : "pointer",
										width: "100%",
										marginBottom: "10px",
									}}>
									{restoreTaskDisabled ? (
										<ButtonLoader>
											<LoadingDots $isCheckedOut={isCheckpointCheckedOut} />
										</ButtonLoader>
									) : (
										<i className="codicon codicon-tasklist" style={{ marginRight: "6px" }} />
									)}
									Restore Task Only
								</VSCodeButton>
								<p>Deletes messages after this point (does not affect workspace files)</p>
							</RestoreOption>
							<RestoreOption>
								<VSCodeButton
									onClick={handleRestoreBoth}
									disabled={restoreBothDisabled}
									style={{
										cursor: restoreBothDisabled ? "wait" : "pointer",
										width: "100%",
										marginBottom: "10px",
									}}>
									{restoreBothDisabled ? (
										<ButtonLoader>
											<LoadingDots $isCheckedOut={isCheckpointCheckedOut} />
										</ButtonLoader>
									) : (
										<i className="codicon codicon-sync" style={{ marginRight: "6px" }} />
									)}
									Restore Files & Task
								</VSCodeButton>
								<p>Restores your project's files and deletes all messages after this point</p>
							</RestoreOption>
						</RestoreConfirmTooltip>,
						document.body,
					)}
			</RestoreButtonWrapper>
		</Container>
	)
}

const spinAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const pulseAnimation = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
`

const dotsAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`

const StylishLoader = styled.div<{ $isCheckedOut?: boolean }>`
  width: 14px;
  height: 14px;
  border: 2px solid ${props => props.$isCheckedOut ? "var(--vscode-editor-background)" : "transparent"};
  border-top: 2px solid ${props => props.$isCheckedOut ? "var(--vscode-textLink-foreground)" : "var(--vscode-descriptionForeground)"};
  border-radius: 50%;
  animation: ${spinAnimation} 0.8s linear infinite;
  position: relative;
  
  &::before, &::after {
    content: "";
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border: 1px solid ${props => props.$isCheckedOut ? "var(--vscode-textLink-foreground)" : "var(--vscode-descriptionForeground)"};
    border-radius: 50%;
    opacity: 0.2;
    animation: ${pulseAnimation} 1.5s ease-in-out infinite;
  }
  
  &::after {
    animation-delay: 0.5s;
  }
`

const ButtonLoader = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px;
  height: 10px;
`

const LoadingDots = styled.div<{ $isCheckedOut?: boolean }>`
  position: relative;
  width: 18px;
  height: 8px;
  
  &::before, &::after, & {
    content: "";
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: ${props => props.$isCheckedOut ? "var(--vscode-textLink-foreground)" : "var(--vscode-editor-background)"};
    animation: ${dotsAnimation} 0.8s infinite;
  }
  
  &::before {
    left: 0;
    animation-delay: 0s;
  }
  
  &::after {
    left: 14px;
    animation-delay: 0.4s;
  }
  
  &>span {
    position: absolute;
    left: 7px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: ${props => props.$isCheckedOut ? "var(--vscode-textLink-foreground)" : "var(--vscode-editor-background)"};
    animation: ${dotsAnimation} 0.8s infinite;
    animation-delay: 0.2s;
  }
`

const Container = styled.div<{ isMenuOpen?: boolean; $isCheckedOut?: boolean }>`
	display: flex;
	align-items: center;
	padding: 6px 0;
	gap: 6px;
	position: relative;
	min-width: 0;
	margin-top: -10px;
	margin-bottom: -10px;
	opacity: ${(props) => (props.$isCheckedOut ? 1 : props.isMenuOpen ? 1 : 0.5)};
	transition: opacity 0.2s ease-in-out;

	&:hover {
		opacity: 1;
	}
`

const IconWrapper = styled.div<{ $isCheckedOut?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${(props) => (props.$isCheckedOut ? "var(--vscode-textLink-foreground)" : "var(--vscode-descriptionForeground)")};
	flex-shrink: 0;
	
	i {
		font-size: 14px;
		transition: transform 0.2s ease;
		
		&:hover {
			transform: scale(1.1);
		}
	}
`

const DottedLine = styled.div<{ small?: boolean; $isCheckedOut?: boolean }>`
	flex: ${(props) => (props.small ? "0 0 6px" : "1")};
	min-width: ${(props) => (props.small ? "6px" : "8px")};
	height: 1px;
	background-color: ${(props) => (props.$isCheckedOut ? "var(--vscode-textLink-foreground)" : "var(--vscode-descriptionForeground)")};
	opacity: 0.7;
`

const ButtonGroup = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 1;
	flex-shrink: 0;
`

const RestoreButtonWrapper = styled.div`
	position: relative;
	margin-left: auto;
`

const CustomButton = styled.button<{ disabled?: boolean; isActive?: boolean; $isCheckedOut?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${(props) =>
		props.isActive || props.disabled
			? props.$isCheckedOut
				? "var(--vscode-textLink-foreground)"
				: "var(--vscode-descriptionForeground)"
			: "transparent"};
	border: none;
	color: ${(props) =>
		props.isActive || props.disabled
			? "var(--vscode-editor-background)"
			: props.$isCheckedOut
				? "var(--vscode-textLink-foreground)"
				: "var(--vscode-descriptionForeground)"};
	padding: 3px;
	border-radius: 3px;
	cursor: pointer;
	position: relative;
	width: 24px;
	height: 24px;
	transition: transform 0.15s ease, background-color 0.15s ease;

	i {
		font-size: 14px;
	}

	&:hover:not(:disabled) {
		background: ${(props) =>
			props.$isCheckedOut ? "var(--vscode-textLink-foreground)" : "var(--vscode-descriptionForeground)"};
		color: var(--vscode-editor-background);
		transform: translateY(-1px);
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 1;
		cursor: not-allowed;
	}
`

const RestoreOption = styled.div`
	&:not(:last-child) {
		margin-bottom: 12px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--vscode-editorGroup-border);
	}

	p {
		margin: 4px 0 2px 0;
		color: var(--vscode-descriptionForeground);
		font-size: 11px;
		line-height: 15px;
	}

	&:last-child p {
		margin: 4px 0 0 0;
	}
`

const RestoreConfirmTooltip = styled.div`
	position: fixed;
	background: ${CODE_BLOCK_BG_COLOR};
	border: 1px solid var(--vscode-editorGroup-border);
	padding: 14px;
	border-radius: 6px;
	width: min(calc(100vw - 54px), 600px);
	z-index: 1000;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

	// Add invisible padding to create a safe hover zone
	&::before {
		content: "";
		position: absolute;
		top: -8px;
		left: 0;
		right: 0;
		height: 8px;
	}

	// Adjust arrow to be above the padding
	&::after {
		content: "";
		position: absolute;
		top: -6px;
		right: 24px;
		width: 10px;
		height: 10px;
		background: ${CODE_BLOCK_BG_COLOR};
		border-left: 1px solid var(--vscode-editorGroup-border);
		border-top: 1px solid var(--vscode-editorGroup-border);
		transform: rotate(45deg);
		z-index: 1;
	}

	// When menu appears above the button
	&[data-placement^="top"] {
		&::before {
			top: auto;
			bottom: -8px;
		}

		&::after {
			top: auto;
			bottom: -6px;
			right: 24px;
			transform: rotate(225deg);
		}
	}

	p {
		margin: 0 0 6px 0;
		color: var(--vscode-descriptionForeground);
		font-size: 12px;
		white-space: normal;
		word-wrap: break-word;
	}
`
