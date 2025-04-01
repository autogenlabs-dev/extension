import { VSCodeButton, VSCodeDivider, VSCodeLink, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { useCallback, useEffect, useState } from "react"
import { useEvent } from "react-use"
import { ExtensionMessage } from "../../../../src/shared/ExtensionMessage"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { validateApiConfiguration } from "../../utils/validate"
import { vscode } from "../../utils/vscode"
import ApiOptions from "../settings/ApiOptions"
import styled, { keyframes } from "styled-components"

const fadeIn = keyframes`
	from {
		opacity: 0;
		transform: translateY(20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
`

const pulse = keyframes`
	0% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.05);
	}
	100% {
		transform: scale(1);
	}
`

const AnimatedContainer = styled.div`
	animation: ${fadeIn} 0.6s ease-out;
`

const FeatureItem = styled.div`
	display: flex;
	align-items: center;
	margin: 8px 0;
	padding: 8px;
	border-radius: 4px;
	background: var(--vscode-editor-background);
	transition: transform 0.2s ease;

	&:hover {
		transform: translateX(5px);
	}

	i {
		margin-right: 8px;
		color: var(--vscode-textLink-foreground);
	}
`

const LogoContainer = styled.div`
	animation: ${pulse} 2s infinite ease-in-out;
	display: flex;
	justify-content: center;
	margin: 20px 0;
`

const SupportSection = styled.div`
	margin-top: 20px;
	padding: 16px;
	border-radius: 6px;
	background: var(--vscode-editor-background);
	border: 1px solid var(--vscode-widget-border);
`

const WelcomeView = () => {
	const { apiConfiguration } = useExtensionState()
	const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>(undefined)
	const [showApiOptions, setShowApiOptions] = useState(false)

	const disableLetsGoButton = apiErrorMessage != null

	const handleLogin = () => {
		vscode.postMessage({ type: "accountLoginClicked" })
	}

	const handleSubmit = () => {
		vscode.postMessage({ type: "apiConfiguration", apiConfiguration })
	}

	useEffect(() => {
		setApiErrorMessage(validateApiConfiguration(apiConfiguration))
	}, [apiConfiguration])

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				padding: "0 0px",
				display: "flex",
				flexDirection: "column",
			}}>
			<div
				style={{
					height: "100%",
					padding: "0 20px",
					overflow: "auto",
				}}>
				<AnimatedContainer>
					<h2>Hi, I'm AutoGen</h2>
					<LogoContainer>
						<img
							src="https://ik.imagekit.io/rowzblbre/icon.png?updatedAt=1743414492953"
							style={{
								width: "120px",
								height: "120px",
							}}
							alt="AutoGen Logo"
						/>
					</LogoContainer>

					<p style={{ fontSize: "16px", lineHeight: "1.6", marginBottom: "24px" }}>
						Experience the future of coding with <strong>AutoGen</strong> - your AI pair programmer powered by Claude 3.7 Sonnet. From rapid prototyping to complex problem-solving, I'm here to transform your ideas into reality with intelligent, context-aware assistance.
					</p>

					<div style={{ marginTop: "20px" }}>
						<FeatureItem>
							<i className="codicon codicon-file-code"></i>
							Create & edit files with intelligent code generation
						</FeatureItem>
						<FeatureItem>
							<i className="codicon codicon-search"></i>
							Explore complex projects and understand codebases
						</FeatureItem>
						<FeatureItem>
							<i className="codicon codicon-browser"></i>
							Access web resources and documentation
						</FeatureItem>
						<FeatureItem>
							<i className="codicon codicon-terminal"></i>
							Execute terminal commands (with your permission)
						</FeatureItem>
						<FeatureItem>
							<i className="codicon codicon-extensions"></i>
							Use MCP to create new tools and extend capabilities
						</FeatureItem>
					</div>

					<p style={{ color: "var(--vscode-descriptionForeground)", marginTop: "20px" }}>
						Sign up for an account to get started for free, or use an API key that provides access to models like Claude
						3.7 Sonnet.
					</p>

					<VSCodeButton appearance="primary" onClick={handleLogin} style={{ width: "100%", marginTop: 4 }}>
						Get Started for Free
					</VSCodeButton>

					{!showApiOptions && (
						<VSCodeButton
							appearance="secondary"
							onClick={() => setShowApiOptions(!showApiOptions)}
							style={{ marginTop: 10, width: "100%" }}>
							Use your own API key
						</VSCodeButton>
					)}

					<div style={{ marginTop: "18px" }}>
						{showApiOptions && (
							<div>
								<ApiOptions showModelOptions={false} />
								<VSCodeButton onClick={handleSubmit} disabled={disableLetsGoButton} style={{ marginTop: "3px" }}>
									Let's go!
								</VSCodeButton>
							</div>
						)}
					</div>

					<SupportSection>
						<h4 style={{ margin: "0 0 10px 0" }}>Need Help?</h4>
						<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
							<VSCodeLink href="mailto:support@autogenlabs.com" style={{ display: "inline-flex", alignItems: "center" }}>
								<i className="codicon codicon-mail" style={{ marginRight: "8px" }}></i>
								support@autogenlabs.com
							</VSCodeLink>
							<VSCodeLink href="https://autogenlabs.com" style={{ display: "inline-flex", alignItems: "center" }}>
								<i className="codicon codicon-globe" style={{ marginRight: "8px" }}></i>
								Visit our website
							</VSCodeLink>
						</div>
					</SupportSection>
				</AnimatedContainer>
			</div>
		</div>
	)
}

export default WelcomeView
