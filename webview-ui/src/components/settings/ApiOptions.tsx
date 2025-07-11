import {
	VSCodeCheckbox,
	VSCodeDropdown,
	VSCodeLink,
	VSCodeOption,
	VSCodeRadio,
	VSCodeRadioGroup,
	VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react"
import { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react"
import ThinkingBudgetSlider from "./ThinkingBudgetSlider"
import { useEvent, useInterval } from "react-use"
import styled from "styled-components"
import * as vscodemodels from "vscode"
import {
	anthropicDefaultModelId,
	anthropicModels,
	ApiConfiguration,
	ApiProvider,
	azureOpenAiDefaultApiVersion,
	bedrockDefaultModelId,
	bedrockModels,
	deepSeekDefaultModelId,
	deepSeekModels,
	geminiDefaultModelId,
	geminiModels,
	mistralDefaultModelId,
	mistralModels,
	ModelInfo,
	openAiModelInfoSaneDefaults,
	openAiNativeDefaultModelId,
	openAiNativeModels,
	openRouterDefaultModelId,
	openRouterDefaultModelInfo,
	mainlandQwenModels,
	internationalQwenModels,
	mainlandQwenDefaultModelId,
	internationalQwenDefaultModelId,
	vertexDefaultModelId,
	vertexModels,
	askSageModels,
	askSageDefaultModelId,
	askSageDefaultURL,
	xaiDefaultModelId,
	xaiModels,
	sambanovaModels,
	sambanovaDefaultModelId,
} from "../../../../src/shared/api"
import { ExtensionMessage } from "../../../../src/shared/ExtensionMessage"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { vscode } from "../../utils/vscode"
import { getAsVar, VSCodeStyles } from "../../utils/vscStyles"
import VSCodeButtonLink from "../common/VSCodeButtonLink"
import OpenRouterModelPicker, { ModelDescriptionMarkdown } from "./OpenRouterModelPicker"
import { AutoGenAccountInfoCard } from "./AutoGenAccountInfoCard"

interface ApiOptionsProps {
	showModelOptions: boolean
	apiErrorMessage?: string
	modelIdErrorMessage?: string
	isPopup?: boolean
}

// This is necessary to ensure dropdown opens downward, important for when this is used in popup
const DROPDOWN_Z_INDEX = 1001 // Higher than the OpenRouterModelPicker's and ModelSelectorTooltip's z-index

export const DropdownContainer = styled.div<{ zIndex?: number }>`
	position: relative;
	z-index: ${(props) => props.zIndex || DROPDOWN_Z_INDEX};

	// Force dropdowns to open downward
	& vscode-dropdown::part(listbox) {
		position: absolute !important;
		top: 100% !important;
		bottom: auto !important;
	}
`

declare module "vscode" {
	interface LanguageModelChatSelector {
		vendor?: string
		family?: string
		version?: string
		id?: string
	}
}

const SettingsSection = styled.div`
	border: 1px solid ${() => getAsVar(VSCodeStyles.VSC_TITLEBAR_INACTIVE_FOREGROUND)};
	border-radius: 8px;
	padding: 20px;
	margin-bottom: 20px;
	background: ${() => getAsVar(VSCodeStyles.VSC_EDITOR_BACKGROUND)};
	width: auto;
	max-width: 100%;
`

const SectionTitle = styled.h4`
	margin-top: 0;
	margin-bottom: 16px;
	color: ${() => getAsVar(VSCodeStyles.VSC_FOREGROUND)};
	font-size: 14px;
	font-weight: 600;
`

const Description = styled.div`
	color: ${() => getAsVar(VSCodeStyles.VSC_DESCRIPTION_FOREGROUND)};
	font-size: 12px;
	margin-top: 6px;
	line-height: 1.4;
`

const FormGroup = styled.div`
	margin-bottom: 20px;
	&:last-child {
		margin-bottom: 0;
	}
`

const StyledDropdown = styled(VSCodeDropdown)`
	width: 100%;
	margin-top: 4px;
	background: ${() => getAsVar(VSCodeStyles.VSC_INPUT_BACKGROUND)};
	border: 1px solid ${() => getAsVar(VSCodeStyles.VSC_INPUT_BORDER)};
	border-radius: 4px;

	&:hover {
		border-color: ${() => getAsVar(VSCodeStyles.VSC_INPUT_BORDER)};
		background: ${() => getAsVar(VSCodeStyles.VSC_INPUT_BACKGROUND)};
	}

	&:focus {
		border-color: ${() => getAsVar(VSCodeStyles.VSC_FOCUS_BORDER)};
		outline: none;
	}
`

const StyledOption = styled(VSCodeOption)`
	background: ${() => getAsVar(VSCodeStyles.VSC_INPUT_BACKGROUND)};
	color: ${() => getAsVar(VSCodeStyles.VSC_FOREGROUND)};
	padding: 8px 12px;

	&:hover {
		background: ${() => getAsVar(VSCodeStyles.VSC_EDITOR_BACKGROUND)};
	}
`

const DropdownLabel = styled.label`
	display: block;
	margin-bottom: 6px;
	color: ${() => getAsVar(VSCodeStyles.VSC_FOREGROUND)};
	font-weight: 500;
	font-size: 12px;
`

const ApiOptions = ({ showModelOptions, apiErrorMessage, modelIdErrorMessage, isPopup }: ApiOptionsProps) => {
	const { apiConfiguration, setApiConfiguration, uriScheme } = useExtensionState()
	const [ollamaModels, setOllamaModels] = useState<string[]>([])
	const [lmStudioModels, setLmStudioModels] = useState<string[]>([])
	const [vsCodeLmModels, setVsCodeLmModels] = useState<vscodemodels.LanguageModelChatSelector[]>([])
	const [anthropicBaseUrlSelected, setAnthropicBaseUrlSelected] = useState(!!apiConfiguration?.anthropicBaseUrl)
	const [azureApiVersionSelected, setAzureApiVersionSelected] = useState(!!apiConfiguration?.azureApiVersion)
	const [awsEndpointSelected, setAwsEndpointSelected] = useState(!!apiConfiguration?.awsBedrockEndpoint)
	const [modelConfigurationSelected, setModelConfigurationSelected] = useState(false)
	const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

	const handleInputChange = (field: keyof ApiConfiguration) => (event: any) => {
		setApiConfiguration({
			...apiConfiguration,
			[field]: event.target.value,
		})
	}

	const { selectedProvider, selectedModelId, selectedModelInfo } = useMemo(() => {
		return normalizeApiConfiguration(apiConfiguration)
	}, [apiConfiguration])

	// Poll ollama/lmstudio models
	const requestLocalModels = useCallback(() => {
		if (selectedProvider === "ollama") {
			vscode.postMessage({
				type: "requestOllamaModels",
				text: apiConfiguration?.ollamaBaseUrl,
			})
		} else if (selectedProvider === "lmstudio") {
			vscode.postMessage({
				type: "requestLmStudioModels",
				text: apiConfiguration?.lmStudioBaseUrl,
			})
		} else if (selectedProvider === "vscode-lm") {
			vscode.postMessage({ type: "requestVsCodeLmModels" })
		}
	}, [selectedProvider, apiConfiguration?.ollamaBaseUrl, apiConfiguration?.lmStudioBaseUrl])
	useEffect(() => {
		if (selectedProvider === "ollama" || selectedProvider === "lmstudio" || selectedProvider === "vscode-lm") {
			requestLocalModels()
		}
	}, [selectedProvider, requestLocalModels])
	useInterval(
		requestLocalModels,
		selectedProvider === "ollama" || selectedProvider === "lmstudio" || selectedProvider === "vscode-lm" ? 2000 : null,
	)

	const handleMessage = useCallback((event: MessageEvent) => {
		const message: ExtensionMessage = event.data
		if (message.type === "ollamaModels" && message.ollamaModels) {
			setOllamaModels(message.ollamaModels)
		} else if (message.type === "lmStudioModels" && message.lmStudioModels) {
			setLmStudioModels(message.lmStudioModels)
		} else if (message.type === "vsCodeLmModels" && message.vsCodeLmModels) {
			setVsCodeLmModels(message.vsCodeLmModels)
		}
	}, [])
	useEvent("message", handleMessage)

	/*
	VSCodeDropdown has an open bug where dynamically rendered options don't auto select the provided value prop. You can see this for yourself by comparing  it with normal select/option elements, which work as expected.
	https://github.com/microsoft/vscode-webview-ui-toolkit/issues/433

	In our case, when the user switches between providers, we recalculate the selectedModelId depending on the provider, the default model for that provider, and a modelId that the user may have selected. Unfortunately, the VSCodeDropdown component wouldn't select this calculated value, and would default to the first "Select a model..." option instead, which makes it seem like the model was cleared out when it wasn't.

	As a workaround, we create separate instances of the dropdown for each provider, and then conditionally render the one that matches the current provider.
	*/
	const createDropdown = (models: Record<string, ModelInfo>) => {
		return (
			<StyledDropdown
				id="model-id"
				value={selectedModelId}
				onChange={handleInputChange("apiModelId")}
				style={{ width: "100%" }}>
				<StyledOption value="">Select a model...</StyledOption>
				{Object.keys(models).map((modelId) => (
					<StyledOption
						key={modelId}
						value={modelId}
						style={{
							whiteSpace: "normal",
							wordWrap: "break-word",
							maxWidth: "100%",
						}}>
						{modelId}
					</StyledOption>
				))}
			</StyledDropdown>
		)
	}

	return (
		<div style={{ padding: "16px", width: "500px", maxWidth: "100%" }}>
			<SettingsSection>
				<SectionTitle>API Provider Configuration</SectionTitle>
				<FormGroup>
					<DropdownContainer className="dropdown-container">
						<DropdownLabel htmlFor="api-provider">API Provider</DropdownLabel>
						<StyledDropdown
							id="api-provider"
							value={selectedProvider}
							onChange={handleInputChange("apiProvider")}
							style={{ minWidth: 130 }}>
							<StyledOption value="AutoGen">AutoGen</StyledOption>
							<StyledOption value="openrouter">OpenRouter</StyledOption>
							<StyledOption value="anthropic">Anthropic</StyledOption>
							<StyledOption value="bedrock">AWS Bedrock</StyledOption>
							<StyledOption value="openai">OpenAI Compatible</StyledOption>
							<StyledOption value="vertex">GCP Vertex AI</StyledOption>
							<StyledOption value="gemini">Google Gemini</StyledOption>
							<StyledOption value="deepseek">DeepSeek</StyledOption>
							<StyledOption value="mistral">Mistral</StyledOption>
							<StyledOption value="openai-native">OpenAI</StyledOption>
							<StyledOption value="vscode-lm">VS Code LM API</StyledOption>
							<StyledOption value="requesty">Requesty</StyledOption>
							<StyledOption value="together">Together</StyledOption>
							<StyledOption value="qwen">Alibaba Qwen</StyledOption>
							<StyledOption value="lmstudio">LM Studio</StyledOption>
							<StyledOption value="ollama">Ollama</StyledOption>
							<StyledOption value="litellm">LiteLLM</StyledOption>
							<StyledOption value="asksage">AskSage</StyledOption>
							<StyledOption value="xai">X AI</StyledOption>
							<StyledOption value="sambanova">SambaNova</StyledOption>
						</StyledDropdown>
					</DropdownContainer>
				</FormGroup>

				{selectedProvider === "AutoGen" && (
					<FormGroup>
						<AutoGenAccountInfoCard />
					</FormGroup>
				)}

				{selectedProvider === "asksage" && (
					<FormGroup>
						<VSCodeTextField
							value={apiConfiguration?.asksageApiKey || ""}
							style={{ width: "100%" }}
							type="password"
							onInput={handleInputChange("asksageApiKey")}
							placeholder="Enter API Key...">
							<span style={{ fontWeight: 500 }}>AskSage API Key</span>
						</VSCodeTextField>
						<Description>
							Please check your token cost before use LLM.
						</Description>
						<VSCodeTextField
							value={apiConfiguration?.asksageApiUrl || askSageDefaultURL}
							style={{ width: "100%", marginTop: "12px" }}
							type="url"
							onInput={handleInputChange("asksageApiUrl")}
							placeholder="Enter AskSage API URL...">
							<span style={{ fontWeight: 500 }}>AskSage API URL</span>
						</VSCodeTextField>
					</FormGroup>
				)}

				{selectedProvider === "anthropic" && (
					<FormGroup>
						<VSCodeTextField
							value={apiConfiguration?.apiKey || ""}
							style={{ width: "100%" }}
							type="password"
							onInput={handleInputChange("apiKey")}
							placeholder="Enter API Key...">
							<span style={{ fontWeight: 500 }}>Anthropic API Key</span>
						</VSCodeTextField>

						<VSCodeCheckbox
							checked={anthropicBaseUrlSelected}
							onChange={(e: any) => {
								const isChecked = e.target.checked === true
								setAnthropicBaseUrlSelected(isChecked)
								if (!isChecked) {
									setApiConfiguration({
										...apiConfiguration,
										anthropicBaseUrl: "",
									})
								}
							}}>
							Use custom base URL
						</VSCodeCheckbox>

						{anthropicBaseUrlSelected && (
							<VSCodeTextField
								value={apiConfiguration?.anthropicBaseUrl || ""}
								style={{ width: "100%", marginTop: 3 }}
								type="url"
								onInput={handleInputChange("anthropicBaseUrl")}
								placeholder="Default: https://api.anthropic.com"
							/>
						)}

						<Description>
							Please check you token cost before use LLM.
							{!apiConfiguration?.apiKey && (
								<VSCodeLink
									href="https://console.anthropic.com/settings/keys"
									style={{
										display: "inline",
										fontSize: "inherit",
									}}>
									You can get an Anthropic API key by signing up here.
								</VSCodeLink>
							)}
						</Description>
					</FormGroup>
				)}

				{selectedProvider === "openai-native" && (
					<FormGroup>
						<VSCodeTextField
							value={apiConfiguration?.openAiNativeApiKey || ""}
							style={{ width: "100%" }}
							type="password"
							onInput={handleInputChange("openAiNativeApiKey")}
							placeholder="Enter API Key...">
							<span style={{ fontWeight: 500 }}>OpenAI API Key</span>
						</VSCodeTextField>
						<Description>
							Please check you token cost before use LLM.
							{!apiConfiguration?.openAiNativeApiKey && (
								<VSCodeLink
									href="https://platform.openai.com/api-keys"
									style={{
										display: "inline",
										fontSize: "inherit",
									}}>
									You can get an OpenAI API key by signing up here.
								</VSCodeLink>
							)}
						</Description>
					</FormGroup>
				)}

				{selectedProvider === "deepseek" && (
					<FormGroup>
						<VSCodeTextField
							value={apiConfiguration?.deepSeekApiKey || ""}
							style={{ width: "100%" }}
							type="password"
							onInput={handleInputChange("deepSeekApiKey")}
							placeholder="Enter API Key...">
							<span style={{ fontWeight: 500 }}>DeepSeek API Key</span>
						</VSCodeTextField>
						<Description>
							Please check you token cost before use LLM.
							{!apiConfiguration?.deepSeekApiKey && (
								<VSCodeLink
									href="https://www.deepseek.com/"
									style={{
										display: "inline",
										fontSize: "inherit",
									}}>
									You can get a DeepSeek API key by signing up here.
								</VSCodeLink>
							)}
						</Description>
					</FormGroup>
				)}

				{selectedProvider === "qwen" && (
					<FormGroup>
						<DropdownContainer className="dropdown-container" style={{ position: "inherit" }}>
							<DropdownLabel htmlFor="qwen-line-provider">Alibaba API Line</DropdownLabel>
							<StyledDropdown
								id="qwen-line-provider"
								value={apiConfiguration?.qwenApiLine || "china"}
								onChange={handleInputChange("qwenApiLine")}
								style={{ width: "100%" }}>
								<StyledOption value="china">China API</StyledOption>
								<StyledOption value="international">International API</StyledOption>
							</StyledDropdown>
						</DropdownContainer>
						<Description>
							Please select the appropriate API interface based on your location. If you are in China, choose the China
							API interface. Otherwise, choose the International API interface.
						</Description>
						<VSCodeTextField
							value={apiConfiguration?.qwenApiKey || ""}
							style={{ width: "100%" }}
							type="password"
							onInput={handleInputChange("qwenApiKey")}
							placeholder="Enter API Key...">
							<span style={{ fontWeight: 500 }}>Qwen API Key</span>
						</VSCodeTextField>
						<Description>
							Please check you token cost before use LLM.
							{!apiConfiguration?.qwenApiKey && (
								<VSCodeLink
									href="https://bailian.console.aliyun.com/"
									style={{
										display: "inline",
										fontSize: "inherit",
									}}>
									You can get a Qwen API key by signing up here.
								</VSCodeLink>
							)}
						</Description>
					</FormGroup>
				)}

				{selectedProvider === "mistral" && (
					<FormGroup>
						<VSCodeTextField
							value={apiConfiguration?.mistralApiKey || ""}
							style={{ width: "100%" }}
							type="password"
							onInput={handleInputChange("mistralApiKey")}
							placeholder="Enter API Key...">
							<span style={{ fontWeight: 500 }}>Mistral API Key</span>
						</VSCodeTextField>
						<Description>
							Please check you token cost before use LLM.
							{!apiConfiguration?.mistralApiKey && (
								<VSCodeLink
									href="https://console.mistral.ai/codestral"
									style={{
										display: "inline",
										fontSize: "inherit",
									}}>
									You can get a Mistral API key by signing up here.
								</VSCodeLink>
							)}
						</Description>
					</FormGroup>
				)}

				{selectedProvider === "openrouter" && (
					<FormGroup>
						<VSCodeTextField
							value={apiConfiguration?.openRouterApiKey || ""}
							style={{ width: "100%" }}
							type="password"
							onInput={handleInputChange("openRouterApiKey")}
							placeholder="Enter API Key...">
							<span style={{ fontWeight: 500 }}>OpenRouter API Key</span>
						</VSCodeTextField>
						{!apiConfiguration?.openRouterApiKey && (
							<VSCodeButtonLink
								href={getOpenRouterAuthUrl(uriScheme)}
								style={{ margin: "5px 0 0 0" }}
								appearance="secondary">
								Get OpenRouter API Key
							</VSCodeButtonLink>
						)}
						<Description>
							Please check your token cost before use LLM.
						</Description>
					</FormGroup>
				)}

				{selectedProvider === "bedrock" && (
					<FormGroup>
						<VSCodeRadioGroup
							value={apiConfiguration?.awsUseProfile ? "profile" : "credentials"}
							onChange={(e) => {
								const value = (e.target as HTMLInputElement)?.value
								const useProfile = value === "profile"
								setApiConfiguration({
									...apiConfiguration,
									awsUseProfile: useProfile,
								})
							}}>
							<VSCodeRadio value="credentials">AWS Credentials</VSCodeRadio>
							<VSCodeRadio value="profile">AWS Profile</VSCodeRadio>
						</VSCodeRadioGroup>

						{apiConfiguration?.awsUseProfile ? (
							<VSCodeTextField
								value={apiConfiguration?.awsProfile || ""}
								style={{ width: "100%" }}
								onInput={handleInputChange("awsProfile")}
								placeholder="Enter profile name (default if empty)">
								<span style={{ fontWeight: 500 }}>AWS Profile Name</span>
							</VSCodeTextField>
						) : (
							<>
								<VSCodeTextField
									value={apiConfiguration?.awsAccessKey || ""}
									style={{ width: "100%" }}
									type="password"
									onInput={handleInputChange("awsAccessKey")}
									placeholder="Enter Access Key...">
									<span style={{ fontWeight: 500 }}>AWS Access Key</span>
								</VSCodeTextField>
								<VSCodeTextField
									value={apiConfiguration?.awsSecretKey || ""}
									style={{ width: "100%" }}
									type="password"
									onInput={handleInputChange("awsSecretKey")}
									placeholder="Enter Secret Key...">
									<span style={{ fontWeight: 500 }}>AWS Secret Key</span>
								</VSCodeTextField>
								<VSCodeTextField
									value={apiConfiguration?.awsSessionToken || ""}
									style={{ width: "100%" }}
									type="password"
									onInput={handleInputChange("awsSessionToken")}
									placeholder="Enter Session Token...">
									<span style={{ fontWeight: 500 }}>AWS Session Token</span>
								</VSCodeTextField>
							</>
						)}
						<DropdownContainer zIndex={DROPDOWN_Z_INDEX - 1} className="dropdown-container">
							<label htmlFor="aws-region-dropdown">
								<span style={{ fontWeight: 500 }}>AWS Region</span>
							</label>
							<VSCodeDropdown
								id="aws-region-dropdown"
								value={apiConfiguration?.awsRegion || ""}
								style={{ width: "100%" }}
								onChange={handleInputChange("awsRegion")}>
								<VSCodeOption value="">Select a region...</VSCodeOption>
								<VSCodeOption value="us-east-1">us-east-1</VSCodeOption>
								<VSCodeOption value="us-east-2">us-east-2</VSCodeOption>
								<VSCodeOption value="us-west-2">us-west-2</VSCodeOption>
								<VSCodeOption value="ap-south-1">ap-south-1</VSCodeOption>
								<VSCodeOption value="ap-northeast-1">ap-northeast-1</VSCodeOption>
								<VSCodeOption value="ap-northeast-2">ap-northeast-2</VSCodeOption>
								<VSCodeOption value="ap-southeast-1">ap-southeast-1</VSCodeOption>
								<VSCodeOption value="ap-southeast-2">ap-southeast-2</VSCodeOption>
								<VSCodeOption value="ca-central-1">ca-central-1</VSCodeOption>
								<VSCodeOption value="eu-central-1">eu-central-1</VSCodeOption>
								<VSCodeOption value="eu-central-2">eu-central-2</VSCodeOption>
								<VSCodeOption value="eu-west-1">eu-west-1</VSCodeOption>
								<VSCodeOption value="eu-west-2">eu-west-2</VSCodeOption>
								<VSCodeOption value="eu-west-3">eu-west-3</VSCodeOption>
								<VSCodeOption value="sa-east-1">sa-east-1</VSCodeOption>
								<VSCodeOption value="us-gov-east-1">us-gov-east-1</VSCodeOption>
								<VSCodeOption value="us-gov-west-1">us-gov-west-1</VSCodeOption>
							</VSCodeDropdown>
						</DropdownContainer>

						<div style={{ display: "flex", flexDirection: "column" }}>
							<VSCodeCheckbox
								checked={awsEndpointSelected}
								onChange={(e: any) => {
									const isChecked = e.target.checked === true
									setAwsEndpointSelected(isChecked)
									if (!isChecked) {
										setApiConfiguration({
											...apiConfiguration,
											awsBedrockEndpoint: "",
										})
									}
								}}>
								Use custom VPC endpoint
							</VSCodeCheckbox>

							{awsEndpointSelected && (
								<VSCodeTextField
									value={apiConfiguration?.awsBedrockEndpoint || ""}
									style={{ width: "100%", marginTop: 3, marginBottom: 5 }}
									type="url"
									onInput={handleInputChange("awsBedrockEndpoint")}
									placeholder="Enter VPC Endpoint URL (optional)"
								/>
							)}

							<VSCodeCheckbox
								checked={apiConfiguration?.awsUseCrossRegionInference || false}
								onChange={(e: any) => {
									const isChecked = e.target.checked === true
									setApiConfiguration({
										...apiConfiguration,
										awsUseCrossRegionInference: isChecked,
									})
								}}>
								Use cross-region inference
							</VSCodeCheckbox>

							{selectedModelInfo.supportsPromptCache && (
								<>
									<VSCodeCheckbox
										checked={apiConfiguration?.awsBedrockUsePromptCache || false}
										onChange={(e: any) => {
											const isChecked = e.target.checked === true
											setApiConfiguration({
												...apiConfiguration,
												awsBedrockUsePromptCache: isChecked,
											})
										}}>
										Use prompt caching (Beta)
									</VSCodeCheckbox>
								</>
							)}
						</div>
						<Description>
							{apiConfiguration?.awsUseProfile ? (
								<>
									Using AWS Profile credentials from ~/.aws/credentials. Leave profile name empty to use the default
									profile. These credentials are only used locally to make API requests from this extension.
								</>
							) : (
								<>
									Authenticate by either providing the keys above or use the default AWS credential providers, i.e.
									~/.aws/credentials or environment variables. These credentials are only used locally to make API
									requests from this extension.
								</>
							)}
						</Description>
					</FormGroup>
				)}

				{apiConfiguration?.apiProvider === "vertex" && (
					<FormGroup>
						<VSCodeTextField
							value={apiConfiguration?.vertexProjectId || ""}
							style={{ width: "100%" }}
							onInput={handleInputChange("vertexProjectId")}
							placeholder="Enter Project ID...">
							<span style={{ fontWeight: 500 }}>Google Cloud Project ID</span>
						</VSCodeTextField>
						<DropdownContainer zIndex={DROPDOWN_Z_INDEX - 2} className="dropdown-container">
							<label htmlFor="vertex-region-dropdown">
								<span style={{ fontWeight: 500 }}>Google Cloud Region</span>
							</label>
							<VSCodeDropdown
								id="vertex-region-dropdown"
								value={apiConfiguration?.vertexRegion || ""}
								style={{ width: "100%" }}
								onChange={handleInputChange("vertexRegion")}>
								<VSCodeOption value="">Select a region...</VSCodeOption>
								<VSCodeOption value="us-east5">us-east5</VSCodeOption>
								<VSCodeOption value="us-central1">us-central1</VSCodeOption>
								<VSCodeOption value="europe-west1">europe-west1</VSCodeOption>
								<VSCodeOption value="europe-west4">europe-west4</VSCodeOption>
								<VSCodeOption value="asia-southeast1">asia-southeast1</VSCodeOption>
							</VSCodeDropdown>
						</DropdownContainer>
						<Description>
							To use Google Cloud Vertex AI, you need to
							<VSCodeLink
								href="https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude#before_you_begin"
								style={{ display: "inline", fontSize: "inherit" }}>
								{"1) create a Google Cloud account › enable the Vertex AI API › enable the desired Claude models,"}
							</VSCodeLink>{" "}
							<VSCodeLink
								href="https://cloud.google.com/docs/authentication/provide-credentials-adc#google-idp"
								style={{ display: "inline", fontSize: "inherit" }}>
								{"2) install the Google Cloud CLI › configure Application Default Credentials."}
							</VSCodeLink>
						</Description>
					</FormGroup>
				)}

				{selectedProvider === "gemini" && (
					<FormGroup>
						<VSCodeTextField
							value={apiConfiguration?.geminiApiKey || ""}
							style={{ width: "100%" }}
							type="password"
							onInput={handleInputChange("geminiApiKey")}
							placeholder="Enter API Key...">
							<span style={{ fontWeight: 500 }}>Gemini API Key</span>
						</VSCodeTextField>
						<Description>
							Please check you token cost before use LLM.
							{!apiConfiguration?.geminiApiKey && (
								<VSCodeLink
									href="https://ai.google.dev/"
									style={{
										display: "inline",
										fontSize: "inherit",
									}}>
									You can get a Gemini API key by signing up here.
								</VSCodeLink>
							)}
						</Description>
					</FormGroup>
				)}

				{selectedProvider === "openai" && (
					<FormGroup>
						<VSCodeTextField
							value={apiConfiguration?.openAiBaseUrl || ""}
							style={{ width: "100%" }}
							type="url"
							onInput={handleInputChange("openAiBaseUrl")}
							placeholder={"Enter base URL..."}>
							<span style={{ fontWeight: 500 }}>Base URL</span>
						</VSCodeTextField>
						<VSCodeTextField
							value={apiConfiguration?.openAiApiKey || ""}
							style={{ width: "100%" }}
							type="password"
							onInput={handleInputChange("openAiApiKey")}
							placeholder="Enter API Key...">
							<span style={{ fontWeight: 500 }}>API Key</span>
						</VSCodeTextField>
						<VSCodeTextField
							value={apiConfiguration?.openAiModelId || ""}
							style={{ width: "100%" }}
							onInput={handleInputChange("openAiModelId")}
							placeholder={"Enter Model ID..."}>
							<span style={{ fontWeight: 500 }}>Model ID</span>
						</VSCodeTextField>
						<VSCodeCheckbox
							checked={azureApiVersionSelected}
							onChange={(e: any) => {
								const isChecked = e.target.checked === true
								setAzureApiVersionSelected(isChecked)
								if (!isChecked) {
									setApiConfiguration({
										...apiConfiguration,
										azureApiVersion: "",
									})
								}
							}}>
							Set Azure API version
						</VSCodeCheckbox>
						{azureApiVersionSelected && (
							<VSCodeTextField
								value={apiConfiguration?.azureApiVersion || ""}
								style={{ width: "100%", marginTop: 3 }}
								onInput={handleInputChange("azureApiVersion")}
								placeholder={`Default: ${azureOpenAiDefaultApiVersion}`}
							/>
						)}
						<div
							style={{
								color: getAsVar(VSCodeStyles.VSC_DESCRIPTION_FOREGROUND),
								display: "flex",
								margin: "10px 0",
								cursor: "pointer",
								alignItems: "center",
								width: "auto"
							}}
							onClick={() => setModelConfigurationSelected((val) => !val)}>
							<span
								className={`codicon ${modelConfigurationSelected ? "codicon-chevron-down" : "codicon-chevron-right"}`}
								style={{
									marginRight: "4px",
								}}></span>
							<span
								style={{
									fontWeight: 700,
									textTransform: "uppercase",
								}}>
								Model Configuration
							</span>
						</div>
						{modelConfigurationSelected && (
							<>
								<VSCodeCheckbox
									checked={!!apiConfiguration?.openAiModelInfo?.supportsImages}
									onChange={(e: any) => {
										const isChecked = e.target.checked === true
										let modelInfo = apiConfiguration?.openAiModelInfo
											? apiConfiguration.openAiModelInfo
											: { ...openAiModelInfoSaneDefaults }
										modelInfo.supportsImages = isChecked
										setApiConfiguration({
											...apiConfiguration,
											openAiModelInfo: modelInfo,
										})
									}}>
									Supports Images
								</VSCodeCheckbox>
								<VSCodeCheckbox
									checked={!!apiConfiguration?.openAiModelInfo?.supportsComputerUse}
									onChange={(e: any) => {
										const isChecked = e.target.checked === true
										let modelInfo = apiConfiguration?.openAiModelInfo
											? apiConfiguration.openAiModelInfo
											: { ...openAiModelInfoSaneDefaults }
										modelInfo = { ...modelInfo, supportsComputerUse: isChecked }
										setApiConfiguration({
											...apiConfiguration,
											openAiModelInfo: modelInfo,
										})
									}}>
									Supports Computer Use
								</VSCodeCheckbox>
								<div style={{ display: "flex", gap: 10, marginTop: "5px", width: "auto" }}>
									<VSCodeTextField
										value={
											apiConfiguration?.openAiModelInfo?.contextWindow
												? apiConfiguration.openAiModelInfo.contextWindow.toString()
												: openAiModelInfoSaneDefaults.contextWindow?.toString()
										}
										style={{ flex: 1, width: "auto" }}
										onInput={(input: any) => {
											let modelInfo = apiConfiguration?.openAiModelInfo
												? apiConfiguration.openAiModelInfo
												: { ...openAiModelInfoSaneDefaults }
											modelInfo.contextWindow = Number(input.target.value)
											setApiConfiguration({
												...apiConfiguration,
												openAiModelInfo: modelInfo,
											})
										}}>
										<span style={{ fontWeight: 500 }}>Context Window Size</span>
									</VSCodeTextField>
									<VSCodeTextField
										value={
											apiConfiguration?.openAiModelInfo?.maxTokens
												? apiConfiguration.openAiModelInfo.maxTokens.toString()
												: openAiModelInfoSaneDefaults.maxTokens?.toString()
										}
										style={{ flex: 1, width: "auto" }}
										onInput={(input: any) => {
											let modelInfo = apiConfiguration?.openAiModelInfo
												? apiConfiguration.openAiModelInfo
												: { ...openAiModelInfoSaneDefaults }
											modelInfo.maxTokens = input.target.value
											setApiConfiguration({
												...apiConfiguration,
												openAiModelInfo: modelInfo,
											})
										}}>
										<span style={{ fontWeight: 500 }}>Max Output Tokens</span>
									</VSCodeTextField>
								</div>
								<div style={{ display: "flex", gap: 10, marginTop: "5px", width: "auto" }}>
									<VSCodeTextField
										value={
											apiConfiguration?.openAiModelInfo?.inputPrice
												? apiConfiguration.openAiModelInfo.inputPrice.toString()
												: openAiModelInfoSaneDefaults.inputPrice?.toString()
										}
										style={{ flex: 1, width: "auto" }}
										onInput={(input: any) => {
											let modelInfo = apiConfiguration?.openAiModelInfo
												? apiConfiguration.openAiModelInfo
												: { ...openAiModelInfoSaneDefaults }
											modelInfo.inputPrice = input.target.value
											setApiConfiguration({
												...apiConfiguration,
												openAiModelInfo: modelInfo,
											})
										}}>
										<span style={{ fontWeight: 500 }}>Input Price / 1M tokens</span>
									</VSCodeTextField>
									<VSCodeTextField
										value={
											apiConfiguration?.openAiModelInfo?.outputPrice
												? apiConfiguration.openAiModelInfo.outputPrice.toString()
												: openAiModelInfoSaneDefaults.outputPrice?.toString()
										}
										style={{ flex: 1, width: "auto" }}
										onInput={(input: any) => {
											let modelInfo = apiConfiguration?.openAiModelInfo
												? apiConfiguration.openAiModelInfo
												: { ...openAiModelInfoSaneDefaults }
											modelInfo.outputPrice = input.target.value
											setApiConfiguration({
												...apiConfiguration,
												openAiModelInfo: modelInfo,
											})
										}}>
										<span style={{ fontWeight: 500 }}>Output Price / 1M tokens</span>
									</VSCodeTextField>
								</div>
								<div style={{ display: "flex", gap: 10, marginTop: "5px", width: "auto" }}>
									<VSCodeTextField
										value={
											apiConfiguration?.openAiModelInfo?.temperature
												? apiConfiguration.openAiModelInfo.temperature.toString()
												: openAiModelInfoSaneDefaults.temperature?.toString()
										}
										onInput={(input: any) => {
											let modelInfo = apiConfiguration?.openAiModelInfo
												? apiConfiguration.openAiModelInfo
												: { ...openAiModelInfoSaneDefaults }

											// Check if the input ends with a decimal point or has trailing zeros after decimal
											const value = input.target.value
											const shouldPreserveFormat =
												value.endsWith(".") || (value.includes(".") && value.endsWith("0"))

											modelInfo.temperature =
												value === ""
													? openAiModelInfoSaneDefaults.temperature
													: shouldPreserveFormat
														? value // Keep as string to preserve decimal format
														: parseFloat(value)

											setApiConfiguration({
												...apiConfiguration,
												openAiModelInfo: modelInfo,
											})
										}}>
										<span style={{ fontWeight: 500 }}>Temperature</span>
									</VSCodeTextField>
								</div>
							</>
						)}
						<Description>
							<span style={{ color: "var(--vscode-errorForeground)" }}>
								(<span style={{ fontWeight: 500 }}>Note:</span> AutoGen uses complex prompts and works best with Claude
								models. Less capable models may not work as expected.)
							</span>
						</Description>
					</FormGroup>
				)}

				{selectedProvider === "requesty" && (
					<FormGroup>
						<VSCodeTextField
							value={apiConfiguration?.requestyApiKey || ""}
							style={{ width: "100%" }}
							type="password"
							onInput={handleInputChange("requestyApiKey")}
							placeholder="Enter API Key...">
							<span style={{ fontWeight: 500 }}>API Key</span>
						</VSCodeTextField>
						<VSCodeTextField
							value={apiConfiguration?.requestyModelId || ""}
							style={{ width: "100%" }}
							onInput={handleInputChange("requestyModelId")}
							placeholder={"Enter Model ID..."}>
							<span style={{ fontWeight: 500 }}>Model ID</span>
						</VSCodeTextField>
						<Description>
							<span style={{ color: "var(--vscode-errorForeground)" }}>
								(<span style={{ fontWeight: 500 }}>Note:</span> AutoGen uses complex prompts and works best with Claude
								models. Less capable models may not work as expected.)
							</span>
						</Description>
					</FormGroup>
				)}

				{selectedProvider === "together" && (
					<FormGroup>
						<VSCodeTextField
							value={apiConfiguration?.togetherApiKey || ""}
							style={{ width: "100%" }}
							type="password"
							onInput={handleInputChange("togetherApiKey")}
							placeholder="Enter API Key...">
							<span style={{ fontWeight: 500 }}>API Key</span>
						</VSCodeTextField>
						<VSCodeTextField
							value={apiConfiguration?.togetherModelId || ""}
							style={{ width: "100%" }}
							onInput={handleInputChange("togetherModelId")}
							placeholder={"Enter Model ID..."}>
							<span style={{ fontWeight: 500 }}>Model ID</span>
						</VSCodeTextField>
						<Description>
							<span style={{ color: "var(--vscode-errorForeground)" }}>
								(<span style={{ fontWeight: 500 }}>Note:</span> AutoGen uses complex prompts and works best with Claude
								models. Less capable models may not work as expected.)
							</span>
						</Description>
					</FormGroup>
				)}

				{selectedProvider === "vscode-lm" && (
					<FormGroup>
						<DropdownContainer zIndex={DROPDOWN_Z_INDEX - 2} className="dropdown-container">
							<label htmlFor="vscode-lm-model">
								<span style={{ fontWeight: 500 }}>Language Model</span>
							</label>
							{vsCodeLmModels.length > 0 ? (
								<VSCodeDropdown
									id="vscode-lm-model"
									value={
										apiConfiguration?.vsCodeLmModelSelector
											? `${apiConfiguration.vsCodeLmModelSelector.vendor ?? ""}/${apiConfiguration.vsCodeLmModelSelector.family ?? ""}`
											: ""
									}
									onChange={(e) => {
										const value = (e.target as HTMLInputElement).value
										if (!value) {
											return
										}
										const [vendor, family] = value.split("/")
										handleInputChange("vsCodeLmModelSelector")({
											target: {
												value: { vendor, family },
											},
										})
									}}
									style={{ width: "100%" }}>
									<VSCodeOption value="">Select a model...</VSCodeOption>
									{vsCodeLmModels.map((model) => (
										<VSCodeOption
											key={`${model.vendor}/${model.family}`}
											value={`${model.vendor}/${model.family}`}>
											{model.vendor} - {model.family}
										</VSCodeOption>
									))}
								</VSCodeDropdown>
							) : (
								<p
									style={{
										fontSize: "12px",
										marginTop: "5px",
										color: "var(--vscode-descriptionForeground)",
									}}>
									The VS Code Language Model API allows you to run models provided by other VS Code extensions
									(including but not limited to GitHub Copilot). The easiest way to get started is to install the
									Copilot extension from the VS Marketplace and enabling Claude 3.7 Sonnet.
								</p>
							)}

							<p
								style={{
									fontSize: "12px",
									marginTop: "5px",
									color: "var(--vscode-errorForeground)",
									fontWeight: 500,
								}}>
								Note: This is a very experimental integration and may not work as expected.
							</p>
						</DropdownContainer>
					</FormGroup>
				)}

				{selectedProvider === "lmstudio" && (
					<FormGroup>
						<VSCodeTextField
							value={apiConfiguration?.lmStudioBaseUrl || ""}
							style={{ width: "100%" }}
							type="url"
							onInput={handleInputChange("lmStudioBaseUrl")}
							placeholder={"Default: http://localhost:1234"}>
							<span style={{ fontWeight: 500 }}>Base URL (optional)</span>
						</VSCodeTextField>
						<VSCodeTextField
							value={apiConfiguration?.lmStudioModelId || ""}
							style={{ width: "100%" }}
							onInput={handleInputChange("lmStudioModelId")}
							placeholder={"e.g. meta-llama-3.1-8b-instruct"}>
							<span style={{ fontWeight: 500 }}>Model ID</span>
						</VSCodeTextField>
						{lmStudioModels.length > 0 && (
							<VSCodeRadioGroup
								value={
									lmStudioModels.includes(apiConfiguration?.lmStudioModelId || "")
										? apiConfiguration?.lmStudioModelId
										: ""
								}
								onChange={(e) => {
									const value = (e.target as HTMLInputElement)?.value
									// need to check value first since radio group returns empty string sometimes
									if (value) {
										handleInputChange("lmStudioModelId")({
											target: { value },
										})
									}
								}}>
								{lmStudioModels.map((model) => (
									<VSCodeRadio key={model} value={model} checked={apiConfiguration?.lmStudioModelId === model}>
										{model}
									</VSCodeRadio>
								))}
							</VSCodeRadioGroup>
						)}
						<Description>
							LM Studio allows you to run models locally on your computer. For instructions on how to get started, see
							their
							<VSCodeLink href="https://lmstudio.ai/docs" style={{ display: "inline", fontSize: "inherit" }}>
								quickstart guide.
							</VSCodeLink>
							You will also need to start LM Studio's{" "}
							<VSCodeLink
								href="https://lmstudio.ai/docs/basics/server"
								style={{ display: "inline", fontSize: "inherit" }}>
								local server
							</VSCodeLink>{" "}
							feature to use it with this extension.{" "}
							<span style={{ color: "var(--vscode-errorForeground)" }}>
								(<span style={{ fontWeight: 500 }}>Note:</span> AutoGen uses complex prompts and works best with Claude
								models. Less capable models may not work as expected.)
							</span>
						</Description>
					</FormGroup>
				)}

				{selectedProvider === "litellm" && (
					<FormGroup>
						<VSCodeTextField
							value={apiConfiguration?.liteLlmApiKey || ""}
							style={{ width: "100%" }}
							type="password"
							onInput={handleInputChange("liteLlmApiKey")}
							placeholder="Default: noop">
							<span style={{ fontWeight: 500 }}>API Key</span>
						</VSCodeTextField>
						<VSCodeTextField
							value={apiConfiguration?.liteLlmBaseUrl || ""}
							style={{ width: "100%" }}
							type="url"
							onInput={handleInputChange("liteLlmBaseUrl")}
							placeholder={"Default: http://localhost:4000"}>
							<span style={{ fontWeight: 500 }}>Base URL (optional)</span>
						</VSCodeTextField>
						<VSCodeTextField
							value={apiConfiguration?.liteLlmModelId || ""}
							style={{ width: "100%" }}
							onInput={handleInputChange("liteLlmModelId")}
							placeholder={"e.g. gpt-4"}>
							<span style={{ fontWeight: 500 }}>Model ID</span>
						</VSCodeTextField>
						<Description>
							LiteLLM provides a unified interface to access various LLM providers' models. See their{" "}
							<VSCodeLink href="https://docs.litellm.ai/docs/" style={{ display: "inline", fontSize: "inherit" }}>
								quickstart guide
							</VSCodeLink>{" "}
							for more information.
						</Description>
					</FormGroup>
				)}

				{selectedProvider === "ollama" && (
					<FormGroup>
						<VSCodeTextField
							value={apiConfiguration?.ollamaBaseUrl || ""}
							style={{ width: "100%" }}
							type="url"
							onInput={handleInputChange("ollamaBaseUrl")}
							placeholder={"Default: http://localhost:11434"}>
							<span style={{ fontWeight: 500 }}>Base URL (optional)</span>
						</VSCodeTextField>
						<VSCodeTextField
							value={apiConfiguration?.ollamaModelId || ""}
							style={{ width: "100%" }}
							onInput={handleInputChange("ollamaModelId")}
							placeholder={"e.g. llama3.1"}>
							<span style={{ fontWeight: 500 }}>Model ID</span>
						</VSCodeTextField>
						<VSCodeTextField
							value={apiConfiguration?.ollamaApiOptionsCtxNum || "32768"}
							style={{ width: "100%" }}
							onInput={handleInputChange("ollamaApiOptionsCtxNum")}
							placeholder={"e.g. 32768"}>
							<span style={{ fontWeight: 500 }}>Model Context Window</span>
						</VSCodeTextField>
						{ollamaModels.length > 0 && (
							<VSCodeRadioGroup
								value={
									ollamaModels.includes(apiConfiguration?.ollamaModelId || "")
										? apiConfiguration?.ollamaModelId
										: ""
								}
								onChange={(e) => {
									const value = (e.target as HTMLInputElement)?.value
									// need to check value first since radio group returns empty string sometimes
									if (value) {
										handleInputChange("ollamaModelId")({
											target: { value },
										})
									}
								}}>
								{ollamaModels.map((model) => (
									<VSCodeRadio key={model} value={model} checked={apiConfiguration?.ollamaModelId === model}>
										{model}
									</VSCodeRadio>
								))}
							</VSCodeRadioGroup>
						)}
						<Description>
							Ollama allows you to run models locally on your computer. For instructions on how to get started, see
							their
							<VSCodeLink
								href="https://github.com/ollama/ollama/blob/main/README.md"
								style={{ display: "inline", fontSize: "inherit" }}>
								quickstart guide.
							</VSCodeLink>
							<span style={{ color: "var(--vscode-errorForeground)" }}>
								(<span style={{ fontWeight: 500 }}>Note:</span> AutoGen uses complex prompts and works best with Claude
								models. Less capable models may not work as expected.)
							</span>
						</Description>
					</FormGroup>
				)}

				{selectedProvider === "xai" && (
					<FormGroup>
						<VSCodeTextField
							value={apiConfiguration?.xaiApiKey || ""}
							style={{ width: "100%" }}
							type="password"
							onInput={handleInputChange("xaiApiKey")}
							placeholder="Enter API Key...">
							<span style={{ fontWeight: 500 }}>X AI API Key</span>
						</VSCodeTextField>
						<Description>
							Please check you token cost before use LLM.
							{!apiConfiguration?.xaiApiKey && (
								<VSCodeLink href="https://x.ai" style={{ display: "inline", fontSize: "inherit" }}>
									You can get an X AI API key by signing up here.
								</VSCodeLink>
							)}
						</Description>
					</FormGroup>
				)}

				{selectedProvider === "sambanova" && (
					<FormGroup>
						<VSCodeTextField
							value={apiConfiguration?.sambanovaApiKey || ""}
							style={{ width: "100%" }}
							type="password"
							onInput={handleInputChange("sambanovaApiKey")}
							placeholder="Enter API Key...">
							<span style={{ fontWeight: 500 }}>SambaNova API Key</span>
						</VSCodeTextField>
						<Description>
							Please check you token cost before use LLM.
							{!apiConfiguration?.sambanovaApiKey && (
								<VSCodeLink
									href="https://docs.sambanova.ai/cloud/docs/get-started/overview"
									style={{
										display: "inline",
										fontSize: "inherit",
									}}>
									You can get a SambaNova API key by signing up here.
								</VSCodeLink>
							)}
						</Description>
					</FormGroup>
				)}

				{apiErrorMessage && (
					<p
						style={{
							margin: "-10px 0 4px 0",
							fontSize: 12,
							color: "var(--vscode-errorForeground)",
						}}>
						{apiErrorMessage}
					</p>
				)}
			</SettingsSection>

			{showModelOptions && (
				<SettingsSection>
					<SectionTitle>Model Configuration</SectionTitle>
					{selectedProvider !== "openrouter" &&
						selectedProvider !== "AutoGen" &&
						selectedProvider !== "openai" &&
						selectedProvider !== "ollama" &&
						selectedProvider !== "lmstudio" &&
						selectedProvider !== "vscode-lm" &&
						selectedProvider !== "litellm" &&
						selectedProvider !== "requesty" && (
							<>
								<DropdownContainer zIndex={DROPDOWN_Z_INDEX - 2} className="dropdown-container">
									<label htmlFor="model-id">
										<span style={{ fontWeight: 500 }}>Model</span>
									</label>
									{selectedProvider === "anthropic" && createDropdown(anthropicModels)}
									{selectedProvider === "bedrock" && createDropdown(bedrockModels)}
									{selectedProvider === "vertex" && createDropdown(vertexModels)}
									{selectedProvider === "gemini" && createDropdown(geminiModels)}
									{selectedProvider === "openai-native" && createDropdown(openAiNativeModels)}
									{selectedProvider === "deepseek" && createDropdown(deepSeekModels)}
									{selectedProvider === "qwen" &&
										createDropdown(
											apiConfiguration?.qwenApiLine === "china" ? mainlandQwenModels : internationalQwenModels,
										)}
									{selectedProvider === "mistral" && createDropdown(mistralModels)}
									{selectedProvider === "asksage" && createDropdown(askSageModels)}
									{selectedProvider === "xai" && createDropdown(xaiModels)}
									{selectedProvider === "sambanova" && createDropdown(sambanovaModels)}
								</DropdownContainer>

								<ModelInfoView
									selectedModelId={selectedModelId}
									modelInfo={selectedModelInfo}
									isPopup={isPopup}
								/>
							</>
						)}

					{(selectedProvider === "openrouter" || selectedProvider === "AutoGen") && showModelOptions && (
						<OpenRouterModelPicker isPopup={isPopup} />
					)}

					{modelIdErrorMessage && (
						<p
							style={{
								margin: "-10px 0 4px 0",
								fontSize: 12,
								color: "var(--vscode-errorForeground)",
							}}>
							{modelIdErrorMessage}
						</p>
					)}
				</SettingsSection>
			)}
		</div>
	)
}

export function getOpenRouterAuthUrl(uriScheme?: string) {
	return `https://openrouter.ai/`
}

export const formatPrice = (price: number) => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(price)
}

export const ModelInfoView = ({
	selectedModelId,
	modelInfo,
	isPopup,
}: {
	selectedModelId: string
	modelInfo: ModelInfo
	isPopup?: boolean
}) => {
	const isGemini = Object.keys(geminiModels).includes(selectedModelId)

	return (
		<div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
			<ModelInfoSupportsItem
				isSupported={modelInfo.supportsImages ?? false}
				supportsLabel="Supports images"
				doesNotSupportLabel="Does not support images"
			/>
			<ModelInfoSupportsItem
				isSupported={modelInfo.supportsComputerUse ?? false}
				supportsLabel="Supports computer use"
				doesNotSupportLabel="Does not support computer use"
			/>
			{!isGemini && (
				<ModelInfoSupportsItem
					isSupported={modelInfo.supportsPromptCache}
					supportsLabel="Supports prompt caching"
					doesNotSupportLabel="Does not support prompt caching"
				/>
			)}
			{modelInfo.maxTokens !== undefined && modelInfo.maxTokens > 0 && (
				<span style={{ fontSize: "12px" }}>
					<span style={{ fontWeight: 500 }}>Max output:</span> {modelInfo.maxTokens?.toLocaleString()} tokens
				</span>
			)}
		</div>
	)
}

const ModelInfoSupportsItem = ({
	isSupported,
	supportsLabel,
	doesNotSupportLabel,
}: {
	isSupported: boolean
	supportsLabel: string
	doesNotSupportLabel: string
}) => (
	<span
		style={{
			fontSize: "12px",
			fontWeight: 500,
			color: isSupported ? "var(--vscode-charts-green)" : "var(--vscode-errorForeground)",
		}}>
		<i
			className={`codicon codicon-${isSupported ? "check" : "x"}`}
			style={{
				marginRight: 4,
				marginBottom: isSupported ? 1 : -1,
				fontSize: isSupported ? 11 : 13,
				fontWeight: 700,
				display: "inline-block",
				verticalAlign: "bottom",
			}}></i>
		{isSupported ? supportsLabel : doesNotSupportLabel}
	</span>
)

export function normalizeApiConfiguration(apiConfiguration?: ApiConfiguration): {
	selectedProvider: ApiProvider
	selectedModelId: string
	selectedModelInfo: ModelInfo
} {
	const provider = apiConfiguration?.apiProvider || "anthropic"
	const modelId = apiConfiguration?.apiModelId

	const getProviderData = (models: Record<string, ModelInfo>, defaultId: string) => {
		let selectedModelId: string
		let selectedModelInfo: ModelInfo
		if (modelId && modelId in models) {
			selectedModelId = modelId
			selectedModelInfo = models[modelId]
		} else {
			selectedModelId = defaultId
			selectedModelInfo = models[defaultId]
		}
		return {
			selectedProvider: provider,
			selectedModelId,
			selectedModelInfo,
		}
	}
	switch (provider) {
		case "anthropic":
			return getProviderData(anthropicModels, anthropicDefaultModelId)
		case "bedrock":
			return getProviderData(bedrockModels, bedrockDefaultModelId)
		case "vertex":
			return getProviderData(vertexModels, vertexDefaultModelId)
		case "gemini":
			return getProviderData(geminiModels, geminiDefaultModelId)
		case "openai-native":
			return getProviderData(openAiNativeModels, openAiNativeDefaultModelId)
		case "deepseek":
			return getProviderData(deepSeekModels, deepSeekDefaultModelId)
		case "qwen":
			const qwenModels = apiConfiguration?.qwenApiLine === "china" ? mainlandQwenModels : internationalQwenModels
			const qwenDefaultId =
				apiConfiguration?.qwenApiLine === "china" ? mainlandQwenDefaultModelId : internationalQwenDefaultModelId
			return getProviderData(qwenModels, qwenDefaultId)
		case "mistral":
			return getProviderData(mistralModels, mistralDefaultModelId)
		case "asksage":
			return getProviderData(askSageModels, askSageDefaultModelId)
		case "openrouter":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.openRouterModelId || openRouterDefaultModelId,
				selectedModelInfo: apiConfiguration?.openRouterModelInfo || openRouterDefaultModelInfo,
			}
		case "AutoGen":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.openRouterModelId || openRouterDefaultModelId,
				selectedModelInfo: apiConfiguration?.openRouterModelInfo || openRouterDefaultModelInfo,
			}
		case "openai":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.openAiModelId || "",
				selectedModelInfo: apiConfiguration?.openAiModelInfo || openAiModelInfoSaneDefaults,
			}
		case "ollama":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.ollamaModelId || "",
				selectedModelInfo: openAiModelInfoSaneDefaults,
			}
		case "lmstudio":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.lmStudioModelId || "",
				selectedModelInfo: openAiModelInfoSaneDefaults,
			}
		case "vscode-lm":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.vsCodeLmModelSelector
					? `${apiConfiguration.vsCodeLmModelSelector.vendor}/${apiConfiguration.vsCodeLmModelSelector.family}`
					: "",
				selectedModelInfo: {
					...openAiModelInfoSaneDefaults,
					supportsImages: false, // VSCode LM API currently doesn't support images
				},
			}
		case "litellm":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.liteLlmModelId || "",
				selectedModelInfo: openAiModelInfoSaneDefaults,
			}
		case "xai":
			return getProviderData(xaiModels, xaiDefaultModelId)
		case "sambanova":
			return getProviderData(sambanovaModels, sambanovaDefaultModelId)
		default:
			return getProviderData(anthropicModels, anthropicDefaultModelId)
	}
}

export default memo(ApiOptions)
