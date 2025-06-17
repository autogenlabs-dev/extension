import { useCallback } from "react"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"

import { ProviderSettings } from "Autogenlabs/shared/api"

import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink"

import { inputEventTransform } from "../transforms"

interface AutogenLabsProps {
	apiConfiguration: ProviderSettings
	setApiConfigurationField: (field: keyof ProviderSettings, value: ProviderSettings[keyof ProviderSettings]) => void
}

const Autogenlabs = ({ apiConfiguration, setApiConfigurationField }: AutogenLabsProps) => {
	const handleApiKeyChange = useCallback(
		(value: string) => {
			setApiConfigurationField("autogenLabsApiKey", value)
		},
		[setApiConfigurationField]
	)

	const handleBaseUrlChange = useCallback(
		(value: string) => {
			setApiConfigurationField("autogenLabsBaseUrl", value)
		},
		[setApiConfigurationField]
	)

	return (
		<div className="flex flex-col gap-2">
			<div className="p-3 bg-vscode-input-background border border-vscode-input-border rounded">
				<div className="mb-2">
					<h3 className="text-sm font-medium text-vscode-foreground">
						AutogenLabs Provider
					</h3>
					<p className="text-xs text-vscode-descriptionForeground mt-1">
						Access 120+ AI models through A4F.co API. This provider automatically configures when you log in with your A4F account, providing seamless access to models from OpenAI, Anthropic, Google, Meta, Mistral, and more.
					</p>
				</div>
			</div>			<VSCodeTextField
				type="password"
				value={apiConfiguration?.autogenLabsApiKey || ""}
				onInput={inputEventTransform(handleApiKeyChange)}
				placeholder="Enter your A4F.co API key"
				className="w-full">
				<label className="block font-medium mb-1">API Key</label>
			</VSCodeTextField>
			<div className="text-xs text-vscode-descriptionForeground">
				Get your API key from{" "}
				<VSCodeButtonLink href="https://a4f.co" target="_blank">
					A4F.co
				</VSCodeButtonLink>
			</div>

			<VSCodeTextField
				value={apiConfiguration?.autogenLabsBaseUrl || "https://api.a4f.co/v1"}
				onInput={inputEventTransform(handleBaseUrlChange)}
				placeholder="https://api.a4f.co/v1"
				className="w-full">
				<label className="block font-medium mb-1">Base URL</label>
			</VSCodeTextField>
			<div className="text-xs text-vscode-descriptionForeground">
				The base URL for the A4F.co API endpoint
			</div>
		</div>
	)
}

export { Autogenlabs }
