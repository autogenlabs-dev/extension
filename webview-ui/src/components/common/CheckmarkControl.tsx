import { useCallback, useRef, useState, useEffect } from "react"
import { useClickAway, useEvent } from "react-use"
import styled from "styled-components"
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

const Container = styled.div<{ isMenuOpen?: boolean; $isCheckedOut?: boolean }>`
	display: flex;
	align-items: center;
	padding: 6px 8px;
	gap: 8px;
	position: relative;
	min-width: 0;
	margin: -8px 0;
	opacity: ${(props) => (props.$isCheckedOut ? 1 : props.isMenuOpen ? 1 : 0.7)};
	border-radius: 4px;
	transition: all 0.2s ease;
	background: ${props => props.isMenuOpen ? 'var(--vscode-toolbar-activeBackground)' : 'transparent'};
	justify-content: space-between;

	&:hover {
		opacity: 1;
		background-color: var(--vscode-toolbar-hoverBackground);
	}
`

const LeftSection = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
	flex: 0 1 auto;
`

const RightSection = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;
	flex: 0 0 auto;
`

const ButtonGroup = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 1 1 auto;
	min-width: 0;
	padding: 0 8px;
`

const IconWrapper = styled.div<{ $isCheckedOut?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	color: ${(props) => (props.$isCheckedOut ? "var(--vscode-textLink-foreground)" : "var(--vscode-descriptionForeground)")};
	font-size: 14px;
	width: 16px;
	height: 16px;
`

const Label = styled.span<{ $isCheckedOut?: boolean }>`
	color: ${(props) => (props.$isCheckedOut ? "var(--vscode-textLink-foreground)" : "var(--vscode-descriptionForeground)")};
	font-size: 11px;
	font-weight: 500;
	flex-shrink: 0;
`

const Divider = styled.div`
	width: 1px;
	height: 14px;
	background-color: var(--vscode-editorGroup-border);
	margin: 0 2px;
`

const CustomButton = styled.button<{ disabled?: boolean; isActive?: boolean; $isCheckedOut?: boolean }>`
	display: inline-flex;
	align-items: center;
	background: ${(props) =>
		props.isActive
			? props.$isCheckedOut
				? "var(--vscode-textLink-foreground)"
				: "var(--vscode-button-secondaryBackground)"
			: "transparent"};
	border: none;
	color: ${(props) =>
		props.isActive
			? "var(--vscode-button-foreground)"
			: props.$isCheckedOut
				? "var(--vscode-textLink-foreground)"
				: "var(--vscode-descriptionForeground)"};
	padding: 4px 8px;
	font-size: 11px;
	cursor: pointer;
	position: relative;
	border-radius: 3px;
	transition: all 0.2s ease;
	font-weight: 500;

	&:hover:not(:disabled) {
		background: ${(props) =>
			props.$isCheckedOut 
				? "var(--vscode-textLink-activeForeground)" 
				: "var(--vscode-button-secondaryHoverBackground)"};
		color: var(--vscode-button-foreground);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.codicon {
		transition: transform 0.2s ease;
	}

	&:hover:not(:disabled) .codicon {
		transform: scale(1.1);
	}
`

const RestoreOption = styled.div`
	&:not(:last-child) {
		margin-bottom: 12px;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--vscode-editorGroup-border);
	}

	p {
		margin: 8px 0 0 0;
		color: var(--vscode-foreground);
		font-size: 12px;
		line-height: 1.4;
		opacity: 0.8;
	}

	vscode-button {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		
		.codicon {
			margin-right: 6px;
		}
	}
`

const RestoreConfirmTooltip = styled.div`
	position: fixed;
	background: var(--vscode-editorWidget-background);
	border: 1px solid var(--vscode-editorWidget-border);
	padding: 16px;
	border-radius: 6px;
	width: min(calc(100vw - 54px), 400px);
	z-index: 1000;
	box-shadow: 0 4px 12px var(--vscode-widget-shadow);

	&::before {
		content: "";
		position: absolute;
		top: -8px;
		left: 0;
		right: 0;
		height: 8px;
	}

	&::after {
		content: "";
		position: absolute;
		top: -6px;
		right: 24px;
		width: 10px;
		height: 10px;
		background: var(--vscode-editorWidget-background);
		border-left: 1px solid var(--vscode-editorWidget-border);
		border-top: 1px solid var(--vscode-editorWidget-border);
		transform: rotate(45deg);
		z-index: 1;
	}

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
`

export const CheckmarkControl = ({ messageTs, isCheckpointCheckedOut }: CheckmarkControlProps) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null)
	const menuRef = useRef<HTMLDivElement>(null)
	const buttonRef = useRef<HTMLButtonElement>(null)

	const handleRestoreClick = (event: React.MouseEvent) => {
		event.stopPropagation()
		const rect = buttonRef.current?.getBoundingClientRect()
		if (rect) {
			setMenuPosition({ x: rect.right - 400, y: rect.bottom + 8 })
			setIsMenuOpen(true)
		}
	}

	const handleClickOutside = useCallback((event: MouseEvent) => {
		if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
			setIsMenuOpen(false)
		}
	}, [])

	useEffect(() => {
		if (isMenuOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		} else {
			document.removeEventListener('mousedown', handleClickOutside)
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isMenuOpen, handleClickOutside])

	return (
		<Container isMenuOpen={isMenuOpen} $isCheckedOut={isCheckpointCheckedOut}>
			<LeftSection>
				<IconWrapper $isCheckedOut={isCheckpointCheckedOut}>
					<i className="codicon codicon-source-control" />
				</IconWrapper>
				<Label $isCheckedOut={isCheckpointCheckedOut}>Checkpoint</Label>
			</LeftSection>

			<ButtonGroup>
				<CustomButton
					$isCheckedOut={isCheckpointCheckedOut}
					onClick={() => {}}
				>
					<i className="codicon codicon-git-compare" />
					Compare
				</CustomButton>
			</ButtonGroup>

			<RightSection>
				<CustomButton
					ref={buttonRef}
					$isCheckedOut={isCheckpointCheckedOut}
					onClick={handleRestoreClick}
				>
					<i className="codicon codicon-history" />
					Restore
				</CustomButton>
			</RightSection>

			{isMenuOpen && menuPosition && (
				<RestoreConfirmTooltip
					ref={menuRef}
					style={{
						left: menuPosition.x,
						top: menuPosition.y,
					}}
				>
					<RestoreOption>
						<VSCodeButton appearance="primary">
							<i className="codicon codicon-arrow-left" />
							Restore to this checkpoint
						</VSCodeButton>
						<p>Restore your workspace to this checkpoint's state</p>
					</RestoreOption>
					<RestoreOption>
						<VSCodeButton appearance="secondary">
							<i className="codicon codicon-git-branch" />
							Create branch from checkpoint
						</VSCodeButton>
						<p>Create a new branch starting from this checkpoint</p>
					</RestoreOption>
				</RestoreConfirmTooltip>
			)}
		</Container>
	)
}
