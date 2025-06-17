import { ApiHandlerOptions, AutogenLabsModelId, autogenLabsDefaultModelId, autogenLabsModels } from "../../shared/api"

import { BaseOpenAiCompatibleProvider } from "./base-openai-compatible-provider"

export class AutogenLabsHandler extends BaseOpenAiCompatibleProvider<AutogenLabsModelId> {
	constructor(options: ApiHandlerOptions) {
		super({
			...options,
			providerName: "AutogenLabs",
			baseURL: options.autogenLabsBaseUrl ?? "https://api.a4f.co/v1",
			apiKey: options.autogenLabsApiKey,
			defaultProviderModelId: autogenLabsDefaultModelId,
			providerModels: autogenLabsModels,
			defaultTemperature: 0.7,
		})
	}
}
