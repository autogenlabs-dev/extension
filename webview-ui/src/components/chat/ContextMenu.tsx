import React, { useEffect, useMemo, useRef } from "react"
import styled from "styled-components"
import { ContextMenuOptionType, ContextMenuQueryItem, getContextMenuOptions } from "../../utils/context-mentions"
import { cleanPathPrefix } from "../common/CodeAccordian"

interface ContextMenuProps {
	onSelect: (type: ContextMenuOptionType, value?: string) => void
	searchQuery: string
	onMouseDown: () => void
	selectedIndex: number
	setSelectedIndex: React.Dispatch<React.SetStateAction<number>>
	selectedType: ContextMenuOptionType | null
	queryItems: ContextMenuQueryItem[]
	trigger?: string
}

const MenuContainer = styled.div`
	position: absolute;
	bottom: calc(100% - 10px);
	left: 15px;
	right: 15px;
	overflow-x: hidden;
	background-color: var(--vscode-editorSuggestWidget-background);
	border: 1px solid var(--vscode-editorSuggestWidget-border);
	border-radius: 3px;
	box-shadow: 0 2px 8px var(--vscode-widget-shadow);
`

const MenuItem = styled.div<{ isSelected: boolean }>`
	padding: 8px 12px;
	cursor: pointer;
	color: ${props => (props.isSelected ? "var(--vscode-editorSuggestWidget-selectedForeground)" : "var(--vscode-editorSuggestWidget-foreground)")};
	border-bottom: 1px solid var(--vscode-editorSuggestWidget-border);
	display: flex;
	align-items: center;
	background-color: ${props => (props.isSelected ? "var(--vscode-editorSuggestWidget-selectedBackground)" : "transparent")};
	transition: all 0.12s ease;
	user-select: none;

	&:last-child {
		border-bottom: none;
	}

	&:hover {
		background-color: ${props => !props.isSelected && "var(--vscode-list-hoverBackground)"};
	}
`

const MenuItemIcon = styled.i`
	margin-right: 8px;
	flex-shrink: 0;
	font-size: 14px;
`

const MenuItemContent = styled.div`
	display: flex;
	align-items: center;
	flex: 1;
	min-width: 0;
	overflow: hidden;
`

const MenuItemLabel = styled.span`
	line-height: 1.2;
`

const MenuItemDescription = styled.span`
	font-size: 0.85em;
	opacity: 0.7;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 1.2;
`

const NoResults = styled.span`
	line-height: 1.2;
`

const ContextMenu: React.FC<ContextMenuProps> = ({
	onSelect,
	searchQuery,
	onMouseDown,
	selectedIndex,
	setSelectedIndex,
	selectedType,
	queryItems,
	trigger,
}) => {
	const menuRef = useRef<HTMLDivElement>(null)

	const filteredOptions = useMemo(
		() => getContextMenuOptions(searchQuery, selectedType, queryItems, trigger),
		[searchQuery, selectedType, queryItems, trigger],
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
		<MenuContainer onMouseDown={onMouseDown}>
			{filteredOptions.map((option, index) => (
				<MenuItem
					key={`${option.type}-${option.value || index}`}
					isSelected={index === selectedIndex}
					onClick={() => isOptionSelectable(option) && onSelect(option.type, option.value)}
					onMouseEnter={() => isOptionSelectable(option) && setSelectedIndex(index)}>
					{option.type === ContextMenuOptionType.NoResults ? (
						<NoResults>{option.label || "No results"}</NoResults>
					) : (
						<>
							<MenuItemIcon className={`codicon codicon-${getIconForOption(option)}`} />
							<MenuItemContent>
								<MenuItemLabel>{renderOptionContent(option)}</MenuItemLabel>
								{option.description && <MenuItemDescription>{option.description}</MenuItemDescription>}
							</MenuItemContent>
						</>
					)}
				</MenuItem>
			))}
		</MenuContainer>
	)
}

export default ContextMenu
