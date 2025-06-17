import { useCallback, useState } from "react"
import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { useExtensionState } from "@src/context/ExtensionStateContext"
import { validateApiConfiguration } from "@src/utils/validate"
import { vscode } from "@src/utils/vscode"
import ApiOptions from "../settings/ApiOptions"
import { Tab, TabContent } from "../common/Tab"
import { Trans } from "react-i18next"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { getRequestyAuthUrl, getOpenRouterAuthUrl } from "@src/oauth/urls"
import RooHero from "./RooHero"
import AuthenticationForm from "../auth/AuthenticationForm"
import knuthShuffle from "knuth-shuffle-seeded"

const WelcomeView = () => {
	const { apiConfiguration, currentApiConfigName, setApiConfiguration, uriScheme, machineId } = useExtensionState()
	const { t } = useAppTranslation()
	const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
	const [showAuthForm, setShowAuthForm] = useState(false)
	const [isAuthenticated, setIsAuthenticated] = useState(false)

	const handleSubmit = useCallback(() => {
		const error = apiConfiguration ? validateApiConfiguration(apiConfiguration) : undefined

		if (error) {
			setErrorMessage(error)
			return
		}

		setErrorMessage(undefined)
		vscode.postMessage({ type: "upsertApiConfiguration", text: currentApiConfigName, apiConfiguration })
	}, [apiConfiguration, currentApiConfigName])

	// Handle authentication success
	const handleAuthSuccess = useCallback((user: any, authData?: any) => {
		setIsAuthenticated(true)
		setShowAuthForm(false)
		
		// Show success message with API key info
		console.log('Authentication successful:', user)
		
		if (authData?.apiKey) {
			console.log('A4F API Key received:', authData.apiKey)
			console.log('API Endpoint:', authData.apiEndpoint)
			
			// Update API configuration with A4F settings
			if (authData.apiKey) {
				setApiConfiguration({
					...apiConfiguration,
					apiProvider: 'openai' as const,
					openAiApiKey: authData.apiKey,
					openAiBaseUrl: authData.apiEndpoint || 'https://api.a4f.co/v1',
					openAiModelId: 'provider-4/claude-sonnet-4-20250514'
				})
				
				// Clear any previous error
				setErrorMessage(undefined)
				
				// Show success notification
				console.log('A4F API configuration applied successfully!')
			}
		}
	}, [apiConfiguration, setApiConfiguration])

	// Handle authentication error
	const handleAuthError = useCallback((error: string) => {
		setErrorMessage(error)
	}, [])

	// Toggle authentication form
	const toggleAuthForm = useCallback(() => {
		setShowAuthForm(!showAuthForm)
		setErrorMessage(undefined)
	}, [showAuthForm])

	// Using a lazy initializer so it reads once at mount
	const [imagesBaseUri] = useState(() => {
		const w = window as any
		return w.IMAGES_BASE_URI || ""
	})

	return (
		<Tab>
			<TabContent className="flex flex-col gap-5">
				<RooHero />
				<h2 className="mx-auto">{t("chat:greeting")}</h2>

				<div className="outline rounded p-4">
					<Trans i18nKey="welcome:introduction" />
				</div>

				{/* Authentication Section */}
				{isAuthenticated ? (
					<div className="mb-4 p-4 bg-green-100 border border-green-300 rounded text-center">
						<h4 className="text-green-800 font-medium mb-2">
							{t('welcome:auth.success.title')}
						</h4>
						<p className="text-green-700 text-sm">
							{t('welcome:auth.success.message')}
						</p>
					</div>
				) : showAuthForm ? (
					<div className="mb-4">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-vscode-foreground">
								{t('welcome:auth.title')}
							</h3>
							<VSCodeButton
								appearance="secondary"
								onClick={toggleAuthForm}
								className="text-sm"
							>
								{t('welcome:or')} {t('welcome:startRouter')}
							</VSCodeButton>
						</div>
						<AuthenticationForm
							onAuthSuccess={handleAuthSuccess}
							onAuthError={handleAuthError}
						/>
					</div>
				) : (
					<>
						{/* Quick Auth Access */}
						<div className="mb-4 text-center border border-vscode-panel-border rounded p-4">
							<h4 className="mb-3 text-vscode-foreground font-medium">
								{t('welcome:auth.subtitle')}
							</h4>
							<VSCodeButton
								onClick={toggleAuthForm}
								appearance="primary"
								className="mb-2"
							>
								{t('welcome:auth.signIn.title')}
							</VSCodeButton>
							<p className="text-xs text-vscode-descriptionForeground">
								{t('welcome:auth.a4f.description')}
							</p>
						</div>

						<div className="mb-4">
							<h4 className="mt-3 mb-2 text-center">{t("welcome:startRouter")}</h4>

					<div className="flex gap-4">
						{/* Define the providers */}
						{(() => {
							// Provider card configuration
							const providers = [
								{
									slug: "requesty",
									name: "Requesty",
									description: t("welcome:routers.requesty.description"),
									incentive: t("welcome:routers.requesty.incentive"),
									authUrl: getRequestyAuthUrl(uriScheme),
								},
								{
									slug: "openrouter",
									name: "OpenRouter",
									description: t("welcome:routers.openrouter.description"),
									authUrl: getOpenRouterAuthUrl(uriScheme),
								},
							]

							// Shuffle providers based on machine ID (will be consistent for the same machine)
							const orderedProviders = [...providers]
							knuthShuffle(orderedProviders, (machineId as any) || Date.now())

							// Render the provider cards
							return orderedProviders.map((provider, index) => (
								<a
									key={index}
									href={provider.authUrl}
									className="flex-1 border border-vscode-panel-border rounded p-4 flex flex-col items-center cursor-pointer transition-all  no-underline text-inherit"
									target="_blank"
									rel="noopener noreferrer">
									<div className="font-bold">{provider.name}</div>
									<div className="w-16 h-16 flex items-center justify-center rounded m-2 overflow-hidden relative">
										<img
											src={`${imagesBaseUri}/${provider.slug}.png`}
											alt={provider.name}
											className="w-full h-full object-contain p-2"
										/>
									</div>
									<div className="text-center">
										<div className="text-xs text-vscode-descriptionForeground">
											{provider.description}
										</div>
										{provider.incentive && (
											<div className="text-xs font-bold">{provider.incentive}</div>
										)}
									</div>
								</a>
							))
						})()}
					</div>

							<div className="text-center my-4 text-xl uppercase font-bold">{t("welcome:or")}</div>
							<h4 className="mt-3 mb-2 text-center">{t("welcome:startCustom")}</h4>
							<ApiOptions
								fromWelcomeView
								apiConfiguration={apiConfiguration || {}}
								uriScheme={uriScheme}
								setApiConfigurationField={(field, value) => setApiConfiguration({ [field]: value })}
								errorMessage={errorMessage}
								setErrorMessage={setErrorMessage}
							/>
						</div>
					</>
				)}
			</TabContent>
			<div className="sticky bottom-0 bg-vscode-sideBar-background p-5">
				<div className="flex flex-col gap-1">
					<div className="flex justify-end">
						<VSCodeLink
							href="#"
							onClick={(e) => {
								e.preventDefault()
								vscode.postMessage({ type: "importSettings" })
							}}
							className="text-sm">
							{t("welcome:importSettings")}
						</VSCodeLink>
					</div>
					<VSCodeButton onClick={handleSubmit} appearance="primary">
						{t("welcome:start")}
					</VSCodeButton>
					{errorMessage && <div className="text-vscode-errorForeground">{errorMessage}</div>}
				</div>
			</div>
		</Tab>
	)
}

export default WelcomeView
