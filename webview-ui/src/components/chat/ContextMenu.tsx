import React, { useEffect, useMemo, useRef } from "react"
import { ContextMenuOptionType, ContextMenuQueryItem, getContextMenuOptions } from "../../utils/context-mentions"
import { cleanPathPrefix } from "../common/CodeAccordian"

interface ContextMenuProps {
	onSelect: (type: ContextMenuOptionType, value?: string) => void
	searchQuery: string
	onMouseDown: () => void
	selectedIndex: number
	setSelectedIndex: (index: number) => void
	selectedType: ContextMenuOptionType | null
	queryItems: ContextMenuQueryItem[]
}

const ContextMenu: React.FC<ContextMenuProps> = ({
	onSelect,
	searchQuery,
	onMouseDown,
	selectedIndex,
	setSelectedIndex,
	selectedType,
	queryItems,
}) => {
	const menuRef = useRef<HTMLDivElement>(null)

	const filteredOptions = useMemo(
		() => getContextMenuOptions(searchQuery, selectedType, queryItems),
		[searchQuery, selectedType, queryItems],
	)

	useEffect(() => {
		if (menuRef.current) {
			const selectedElement = menuRef.current.children[selectedIndex] as HTMLElement
			if (selectedElement) {
				const menuRect = menuRef.current.getBoundingClientRect()
				const selectedRect = selectedElement.getBoundingClientRect()

				if (selectedRect.bottom > menuRect.bottom) {
					menuRef.current.scrollTop += selectedRect.bottom - menuRect.bottom
				} else if (selectedRect.top < menuRect.top) {
					menuRef.current.scrollTop -= menuRect.top - selectedRect.top
				}
			}
		}
	}, [selectedIndex])

	const renderOptionContent = (option: ContextMenuQueryItem) => {
		switch (option.type) {
			case ContextMenuOptionType.Problems:
				return <span>Problems</span>
			case ContextMenuOptionType.Terminal:
				return <span>Terminal</span>
			case ContextMenuOptionType.URL:
				return (
					<div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
						<span style={{ lineHeight: "1.2" }}>Paste URL to fetch contents</span>
						<span
							style={{
								fontSize: "0.85em",
								opacity: 0.7,
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
								lineHeight: "1.2",
							}}>
							Add a link to fetch webpage content
						</span>
					</div>
				)
			case ContextMenuOptionType.NoResults:
				return <span>No results found</span>
			case ContextMenuOptionType.Git:
				if (option.value) {
					return (
						<div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
							<span style={{ lineHeight: "1.2" }}>{option.label}</span>
							<span
								style={{
									fontSize: "0.85em",
									opacity: 0.7,
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
									lineHeight: "1.2",
								}}>
								{option.description}
							</span>
						</div>
					)
				} else {
					return <span>Git Commits</span>
				}
			case ContextMenuOptionType.File:
			case ContextMenuOptionType.Folder:
				if (option.value) {
					return (
						<>
							<span>/</span>
							{option.value?.startsWith("/.") && <span>.</span>}
							<span
								style={{
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
									direction: "rtl",
									textAlign: "left",
								}}>
								{cleanPathPrefix(option.value || "") + "\u200E"}
							</span>
						</>
					)
				} else {
					return <span>Add {option.type === ContextMenuOptionType.File ? "File" : "Folder"}</span>
				}
		}
	}

	const getIconForOption = (option: ContextMenuQueryItem): string => {
		switch (option.type) {
			case ContextMenuOptionType.File:
				return "file"
			case ContextMenuOptionType.Folder:
				return "folder"
			case ContextMenuOptionType.Problems:
				return "warning"
			case ContextMenuOptionType.Terminal:
				return "terminal"
			// case ContextMenuOptionType.URL:
			// 	return "link"
			// case ContextMenuOptionType.Git:
			// 	return "git-commit"
			// case ContextMenuOptionType.NoResults:
			// 	return "info"
			default:
				return "file"
		}
	}

	const isOptionSelectable = (option: ContextMenuQueryItem): boolean => {
		return option.type !== ContextMenuOptionType.NoResults && option.type !== ContextMenuOptionType.URL
	}

	return (
		<div
			style={{
				position: "absolute",
				bottom: "calc(100% - 10px)",
				left: 15,
				right: 15,
				overflowX: "hidden",
			}}
			onMouseDown={onMouseDown}>
			<div
				ref={menuRef}
				style={{
					backgroundColor: "#111827", // Dark background matching the rest of the UI
					border: "1px solid #4b5563",
					borderRadius: "6px", // Slightly more rounded corners
					boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)", // Enhanced shadow
					zIndex: 1000,
					display: "flex",
					flexDirection: "column",
					maxHeight: "250px", // Slightly larger max height
					overflowY: "auto",
				}}>
				{/* Can't use virtuoso since it requires fixed height and menu height is dynamic based on # of items */}
				{filteredOptions.map((option, index) => (
					<div
						className={`context-menu-item ${index === selectedIndex && isOptionSelectable(option) ? 'selected' : ''}`}
						key={`${option.type}-${option.value || index}`}
						onClick={() => isOptionSelectable(option) && onSelect(option.type, option.value)}
						style={{
							padding: "10px 12px", // More vertical padding
							cursor: isOptionSelectable(option) ? "pointer" : "default",
							color:
								index === selectedIndex && isOptionSelectable(option)
									? "var(--vscode-quickInputList-focusForeground)"
									: "var(--vscode-foreground)",
							borderBottom: index < filteredOptions.length - 1 ? "1px solid rgba(75, 85, 99, 0.4)" : "none", // Lighter border
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							backgroundColor:
								index === selectedIndex && isOptionSelectable(option)
									? "var(--vscode-quickInputList-focusBackground)"
									: "",
							transition: "all 0.12s ease", // Smooth hover transition
							userSelect: "none", // Prevent text selection
							opacity: isOptionSelectable(option) ? 1 : 0.6, // Dimmer appearance for non-selectable items
						}}
						onMouseEnter={() => isOptionSelectable(option) && setSelectedIndex(index)}>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								flex: 1,
								minWidth: 0,
								overflow: "hidden",
							}}>
							<i
								className={`codicon codicon-${getIconForOption(option)}`}
								style={{
									marginRight: "8px",
									flexShrink: 0,
									fontSize: "14px",
								}}
							/>
							{renderOptionContent(option)}
						</div>
						{(option.type === ContextMenuOptionType.File ||
							option.type === ContextMenuOptionType.Folder ||
							option.type === ContextMenuOptionType.Git) &&
							!option.value && (
								<i
									className="codicon codicon-chevron-right"
									style={{
										fontSize: "14px",
										flexShrink: 0,
										marginLeft: 8,
									}}
								/>
							)}
						{(option.type === ContextMenuOptionType.Problems ||
							option.type === ContextMenuOptionType.Terminal ||
							((option.type === ContextMenuOptionType.File ||
								option.type === ContextMenuOptionType.Folder ||
								option.type === ContextMenuOptionType.Git) &&
								option.value)) && (
								<i
									className="codicon codicon-add"
									style={{
										fontSize: "14px",
										flexShrink: 0,
										marginLeft: 8,
									}}
								/>
							)}
					</div>
				))}
			</div>
		</div>
	)
}

export default ContextMenu
