import {
	VSCodeButton,
	VSCodeCheckbox,
	VSCodeLink,
	VSCodeTextArea,
	VSCodePanels,
	VSCodePanelTab,
	VSCodePanelView,
	VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react"
import { memo, useCallback, useEffect, useState } from "react"
import styled from "styled-components"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { validateApiConfiguration, validateModelId } from "../../utils/validate"
import { vscode } from "../../utils/vscode"
import SettingsButton from "../common/SettingsButton"
import ApiOptions from "./ApiOptions"
import { TabButton } from "../mcp/McpView"
import { useEvent } from "react-use"
import { ExtensionMessage } from "../../../../src/shared/ExtensionMessage"
import { getAsVar, VSCodeStyles } from "../../utils/vscStyles"
import AutoApproveSettings from "./AutoApproveSettings"
const { IS_DEV } = process.env

type SettingsViewProps = {
	onDone: () => void
}

const SettingsContainer = styled.div`
	height: 100%;
	display: flex;
	flex-direction: column;
	animation: fadeIn 0.3s ease-in-out;
	padding: 0;
	overflow-y: auto;

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	& > vscode-panels {
		flex: 1;
		overflow-y: auto;
		padding: 0 16px;
	}
`

const PanelContent = styled.div`
	max-width: 800px;
	margin: 0 auto;
`

const SettingsSection = styled.div`
	border: 1px solid ${() => getAsVar(VSCodeStyles.VSC_TITLEBAR_INACTIVE_FOREGROUND)};
	border-radius: 6px;
	padding: 20px;
	margin-bottom: 20px;
	transition: all 0.2s ease-in-out;
	background: var(--vscode-editor-background);

	&:hover {
		border-color: ${() => getAsVar(VSCodeStyles.VSC_FOREGROUND)};
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}
`

const SectionTitle = styled.h3`
	margin-top: 0;
	margin-bottom: 16px;
	color: ${() => getAsVar(VSCodeStyles.VSC_FOREGROUND)};
`

const Description = styled.div`
	color: ${() => getAsVar(VSCodeStyles.VSC_DESCRIPTION_FOREGROUND)};
	margin-top: 8px;
`

const ButtonContainer = styled.div`
	margin-top: auto;
	padding: 16px;
	display: flex;
	align-items: center;
	background: var(--vscode-editor-background);
	border-top: 1px solid var(--vscode-widget-border);
	position: sticky;
	bottom: 0;
	z-index: 10;

	& > vscode-button {
		min-width: 120px;
		margin-right: 8px;
		transition: all 0.2s ease;
	}

	& > vscode-button:last-child {
		margin-right: 0;
	}

	& > vscode-button::part(control) {
		padding: 4px 12px;
		border-radius: 4px;
	}

	& > vscode-button[appearance="primary"]::part(control) {
		background: var(--vscode-button-background);
		color: var(--vscode-button-foreground);
		border: none;
	}

	& > vscode-button[appearance="primary"]:hover::part(control) {
		background: var(--vscode-button-hoverBackground);
	}

	& > vscode-button[appearance="secondary"]::part(control) {
		border: 1px solid var(--vscode-button-background);
		background: transparent;
		color: var(--vscode-button-background);
	}

	& > vscode-button[appearance="secondary"]:hover::part(control) {
		background: var(--vscode-button-background);
		color: var(--vscode-button-foreground);
		opacity: 0.8;
	}
`

const VersionText = styled.div`
	margin-left: auto;
	color: ${() => getAsVar(VSCodeStyles.VSC_DESCRIPTION_FOREGROUND)};
	opacity: 0.7;
	font-size: 11px;
	letter-spacing: 0.5px;
`

const SettingsView = ({ onDone }: SettingsViewProps) => {
	const {
		apiConfiguration,
		version,
		customInstructions,
		setCustomInstructions,
		openRouterModels,
		telemetrySetting,
		setTelemetrySetting,
		chatSettings,
		planActSeparateModelsSetting,
		setPlanActSeparateModelsSetting,
	} = useExtensionState()
	const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>(undefined)
	const [modelIdErrorMessage, setModelIdErrorMessage] = useState<string | undefined>(undefined)
	const [pendingTabChange, setPendingTabChange] = useState<"chat" | "Agent" | null>(null)

	const handleSubmit = (withoutDone: boolean = false) => {
		const apiValidationResult = validateApiConfiguration(apiConfiguration)
		const modelIdValidationResult = validateModelId(apiConfiguration, openRouterModels)

		let apiConfigurationToSubmit = apiConfiguration
		if (!apiValidationResult && !modelIdValidationResult) {
			// vscode.postMessage({ type: "apiConfiguration", apiConfiguration })
			// vscode.postMessage({
			// 	type: "customInstructions",
			// 	text: customInstructions,
			// })
			// vscode.postMessage({
			// 	type: "telemetrySetting",
			// 	text: telemetrySetting,
			// })
			// console.log("handleSubmit", withoutDone)
			// vscode.postMessage({
			// 	type: "separateModeSetting",
			// 	text: separateModeSetting,
			// })
		} else {
			// if the api configuration is invalid, we don't save it
			apiConfigurationToSubmit = undefined
		}

		vscode.postMessage({
			type: "updateSettings",
			planActSeparateModelsSetting,
			customInstructionsSetting: customInstructions,
			telemetrySetting,
			apiConfiguration: apiConfigurationToSubmit,
		})

		if (!withoutDone) {
			onDone()
		}
	}

	useEffect(() => {
		setApiErrorMessage(undefined)
		setModelIdErrorMessage(undefined)
	}, [apiConfiguration])

	const handleMessage = useCallback(
		(event: MessageEvent) => {
			const message: ExtensionMessage = event.data
			switch (message.type) {
				case "didUpdateSettings":
					if (pendingTabChange) {
						vscode.postMessage({
							type: "togglePlanActMode",
							chatSettings: {
								mode: pendingTabChange,
							},
						})
						setPendingTabChange(null)
					}
					break
			}
		},
		[pendingTabChange],
	)

	useEvent("message", handleMessage)

	const handleResetState = () => {
		vscode.postMessage({ type: "resetState" })
	}

	const handleTabChange = (tab: "chat" | "Agent") => {
		if (tab === chatSettings.mode) {
			return
		}
		setPendingTabChange(tab)
		handleSubmit(true)
	}

	return (
		<SettingsContainer>
			<VSCodePanels>
				<VSCodePanelTab id="api">API</VSCodePanelTab>
				<VSCodePanelTab id="auto-approve">Auto-approve</VSCodePanelTab>
				<VSCodePanelTab id="custom-instructions">Custom Instructions</VSCodePanelTab>
				{/* <VSCodePanelTab id="telemetry">Telemetry</VSCodePanelTab> */}

				<VSCodePanelView id="api">
					<ApiOptions showModelOptions={true} />
				</VSCodePanelView>

				<VSCodePanelView id="auto-approve">
					<AutoApproveSettings />
				</VSCodePanelView>

				<VSCodePanelView id="custom-instructions">
					<PanelContent>
						<SettingsSection>
							<SectionTitle>Custom Instructions</SectionTitle>
							<VSCodeTextArea
								value={customInstructions}
								onChange={(e) => {
									setCustomInstructions((e.target as HTMLTextAreaElement).value)
								}}
								style={{ width: "330px", height: "auto" }}
							/>
						</SettingsSection>
					</PanelContent>
				</VSCodePanelView>

				{/* <VSCodePanelView id="telemetry">
					<PanelContent>
						<SettingsSection>
							<SectionTitle>Telemetry</SectionTitle>
							<VSCodeCheckbox
								checked={telemetrySetting === "enabled"}
								onChange={(e) => {
									setTelemetrySetting((e.target as HTMLInputElement).checked ? "enabled" : "disabled")
								}}>
								Enable telemetry
							</VSCodeCheckbox>
							<Description>
								We collect anonymous usage data to help improve AutoGen. No personal information or code is ever
								collected.
							</Description>
						</SettingsSection>
					</PanelContent>
				</VSCodePanelView> */}
			</VSCodePanels>

			<ButtonContainer>
				<VSCodeButton appearance="primary" onClick={() => handleSubmit()}>
					Done
				</VSCodeButton>
				<VSCodeButton onClick={handleResetState}>Reset All Settings</VSCodeButton>
				<VersionText>Version: {version}</VersionText>
			</ButtonContainer>
		</SettingsContainer>
	)
}

export default SettingsView
