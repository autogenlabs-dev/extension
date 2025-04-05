import { VSCodeCheckbox, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { useCallback } from "react"
import styled from "styled-components"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { AutoApprovalSettings } from "../../../../src/shared/AutoApprovalSettings"
import { vscode } from "../../utils/vscode"
import { getAsVar, VSCodeStyles } from "../../utils/vscStyles"

const SettingsSection = styled.div`
	border: 1px solid ${() => getAsVar(VSCodeStyles.VSC_TITLEBAR_INACTIVE_FOREGROUND)};
	border-radius: 6px;
	padding: 16px;
	margin-bottom: 16px;
	width: auto;
`

const SectionTitle = styled.h4`
	margin-top: 0;
	margin-bottom: 12px;
	color: ${() => getAsVar(VSCodeStyles.VSC_FOREGROUND)};
`

const Description = styled.div`
	color: ${() => getAsVar(VSCodeStyles.VSC_DESCRIPTION_FOREGROUND)};
	font-size: 12px;
	margin-top: 4px;
`

const ActionItem = styled.div`
	margin-bottom: 12px;
	&:last-child {
		margin-bottom: 0;
	}
`

const ACTION_METADATA: {
	id: keyof AutoApprovalSettings["actions"]
	label: string
	shortName: string
	description: string
}[] = [
	{
		id: "readFiles",
		label: "Read files and directories",
		shortName: "Read",
		description: "Allows access to read any file on your computer.",
	},
	{
		id: "editFiles",
		label: "Edit files",
		shortName: "Edit",
		description: "Allows modification of any files on your computer.",
	},
	{
		id: "executeCommands",
		label: "Execute safe commands",
		shortName: "Commands",
		description:
			"Allows execution of safe terminal commands. If the model determines a command is potentially destructive, it will still require approval.",
	},
	// {
	// 	id: "useBrowser",
	// 	label: "Use the browser",
	// 	shortName: "Browser",
	// 	description: "Allows ability to launch and interact with any website in a headless browser.",
	// },
	{
		id: "useMcp",
		label: "Use MCP servers",
		shortName: "MCP",
		description: "Allows use of configured MCP servers which may modify filesystem or interact with APIs.",
	},
]

const AutoApproveSettings = () => {
	const { autoApprovalSettings } = useExtensionState()

	const enabledActions = ACTION_METADATA.filter((action) => autoApprovalSettings.actions[action.id])
	const hasEnabledActions = enabledActions.length > 0

	const updateEnabled = useCallback(
		(enabled: boolean) => {
			vscode.postMessage({
				type: "autoApprovalSettings",
				autoApprovalSettings: {
					...autoApprovalSettings,
					enabled,
				},
			})
		},
		[autoApprovalSettings],
	)

	const updateAction = useCallback(
		(actionId: keyof AutoApprovalSettings["actions"], value: boolean) => {
			// Calculate what the new actions state will be
			const newActions = {
				...autoApprovalSettings.actions,
				[actionId]: value,
			}

			// Check if this will result in any enabled actions
			const willHaveEnabledActions = Object.values(newActions).some(Boolean)

			vscode.postMessage({
				type: "autoApprovalSettings",
				autoApprovalSettings: {
					...autoApprovalSettings,
					actions: newActions,
					// If no actions will be enabled, ensure the main toggle is off
					enabled: willHaveEnabledActions ? autoApprovalSettings.enabled : false,
				},
			})
		},
		[autoApprovalSettings],
	)

	const updateMaxRequests = useCallback(
		(maxRequests: number) => {
			vscode.postMessage({
				type: "autoApprovalSettings",
				autoApprovalSettings: {
					...autoApprovalSettings,
					maxRequests,
				},
			})
		},
		[autoApprovalSettings],
	)

	const updateNotifications = useCallback(
		(enableNotifications: boolean) => {
			vscode.postMessage({
				type: "autoApprovalSettings",
				autoApprovalSettings: {
					...autoApprovalSettings,
					enableNotifications,
				},
			})
		},
		[autoApprovalSettings],
	)

	return (
		<div style={{ padding: "16px" }}>
			<h3 style={{ marginTop: 0, marginBottom: "16px" }}>Auto-approve Settings</h3>
			
			<SettingsSection>
				<SectionTitle>Enable Auto-approve</SectionTitle>
				<VSCodeCheckbox
					checked={hasEnabledActions && autoApprovalSettings.enabled}
					disabled={!hasEnabledActions}
					onClick={(e) => {
						if (!hasEnabledActions) return
						e.stopPropagation()
						updateEnabled(!autoApprovalSettings.enabled)
					}}>
					Enable Auto-approve
				</VSCodeCheckbox>
			</SettingsSection>

			<SettingsSection>
				<SectionTitle>Actions to Auto-approve</SectionTitle>
				{ACTION_METADATA.map((action) => (
					<ActionItem key={action.id}>
						<VSCodeCheckbox
							checked={autoApprovalSettings.actions[action.id]}
							onChange={(e) => {
								const checked = (e.target as HTMLInputElement).checked
								updateAction(action.id, checked)
							}}>
							{action.label}
						</VSCodeCheckbox>
						<Description style={{ marginLeft: "24px" }}>
							{action.description}
						</Description>
					</ActionItem>
				))}
			</SettingsSection>

			<SettingsSection>
				<SectionTitle>Maximum Consecutive Auto-approved Requests</SectionTitle>
				<VSCodeTextField
					type="text"
					value={autoApprovalSettings.maxRequests.toString()}
					onChange={(e) => {
						const value = parseInt((e.target as HTMLInputElement).value)
						if (!isNaN(value) && value >= 0) {
							updateMaxRequests(value)
						}
					}}
				/>
				<Description>
					After this many consecutive auto-approved requests, AutoGen will require manual approval for the next request.
				</Description>
			</SettingsSection>

			<SettingsSection>
				<SectionTitle>Notifications</SectionTitle>
				<VSCodeCheckbox
					checked={autoApprovalSettings.enableNotifications}
					onChange={(e) => {
						const checked = (e.target as HTMLInputElement).checked
						updateNotifications(checked)
					}}>
					Show notifications for auto-approved actions
				</VSCodeCheckbox>
			</SettingsSection>
		</div>
	)
}

export default AutoApproveSettings 