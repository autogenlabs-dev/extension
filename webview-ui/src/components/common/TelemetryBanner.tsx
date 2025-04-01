import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { memo, useState } from "react"
import styled from "styled-components"
import { vscode } from "../../utils/vscode"
import { TelemetrySetting } from "../../../../src/shared/TelemetrySetting"

const BannerContainer = styled.div`
	background-color: var(--vscode-banner-background);
	padding: 12px 20px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	flex-shrink: 0;
	margin-bottom: 6px;
`

const ButtonContainer = styled.div`
	display: flex;
	gap: 8px;
	width: 100%;

	& > vscode-button {
		flex: 1;
	}
`

const InfoText = styled.div`
	font-size: 12px;
	color: var(--vscode-descriptionForeground);
	margin-top: 4px;
`

const FeatureHighlight = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	margin-top: 4px;
	font-size: 12px;
	
	i {
		color: var(--vscode-textLink-foreground);
	}
`

const TelemetryBanner = () => {
	const [hasChosen, setHasChosen] = useState(false)

	const handleAllow = () => {
		setHasChosen(true)
		vscode.postMessage({ type: "telemetrySetting", telemetrySetting: "enabled" satisfies TelemetrySetting })
	}

	const handleDeny = () => {
		setHasChosen(true)
		vscode.postMessage({ type: "telemetrySetting", telemetrySetting: "disabled" satisfies TelemetrySetting })
	}

	const handleOpenSettings = () => {
		vscode.postMessage({ type: "openSettings" })
	}

	return hasChosen ? null : (
		<BannerContainer>
			<div>
				<strong>Enable Auto-Approve for Faster Development</strong>
				<InfoText>
					Auto-approve allows AutoGen to execute safe commands automatically, making your development workflow smoother and faster.
				</InfoText>
				<FeatureHighlight>
					<i className="codicon codicon-check"></i>
					Automatically approve safe file operations
				</FeatureHighlight>
				<FeatureHighlight>
					<i className="codicon codicon-check"></i>
					Speed up your development workflow
				</FeatureHighlight>
				<FeatureHighlight>
					<i className="codicon codicon-check"></i>
					Maintain control with configurable settings
				</FeatureHighlight>
				<div style={{ marginTop: 8 }}>
					You can enable auto-approve in{" "}
					<VSCodeLink href="#" onClick={handleOpenSettings}>
						settings
					</VSCodeLink>
					. You can always adjust these preferences later.
				</div>
			</div>
			<ButtonContainer>
				<VSCodeButton appearance="primary" onClick={() => {
					handleOpenSettings();
					setHasChosen(true);
				}}>
					Open Settings
				</VSCodeButton>
				<VSCodeButton appearance="secondary" onClick={() => setHasChosen(true)}>
					Maybe Later
				</VSCodeButton>
			</ButtonContainer>
		</BannerContainer>
	)
}

export default memo(TelemetryBanner)
