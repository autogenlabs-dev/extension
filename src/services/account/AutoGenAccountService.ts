import axios, { AxiosRequestConfig, AxiosResponse } from "axios"
import { AutoGenProvider } from "../../core/webview/AutogenProvider"
import { BalanceResponse, PaymentTransaction, UsageTransaction } from "../../shared/AutoGenAccount"

export class AutoGenAccountService {
	private readonly baseUrl = "https://api.AutoGen.bot/v1"
	private providerRef: WeakRef<AutoGenProvider>

	constructor(provider: AutoGenProvider) {
		this.providerRef = new WeakRef(provider)
	}

	/**
	 * Get the user's AutoGen Account key from the apiConfiguration
	 */
	private async getAutoGenApiKey(): Promise<string | undefined> {
		const provider = this.providerRef.deref()
		if (!provider) {
			return undefined
		}

		const { apiConfiguration } = await provider.getStateToPostToWebview()
		return apiConfiguration?.autogenApiKey
	}

	/**
	 * Helper function to make authenticated requests to the AutoGen API
	 * @param endpoint The API endpoint to call (without the base URL)
	 * @param config Additional axios request configuration
	 * @returns The API response data
	 * @throws Error if the API key is not found or the request fails
	 */
	private async authenticatedRequest<T>(endpoint: string, config: AxiosRequestConfig = {}): Promise<T> {
		const autogenApiKey = await this.getAutoGenApiKey()

		if (!autogenApiKey) {
			throw new Error("AutoGen API key not found")
		}

		const url = `${this.baseUrl}${endpoint}`
		const requestConfig: AxiosRequestConfig = {
			...config,
			headers: {
				Authorization: `Bearer ${autogenApiKey}`,
				"Content-Type": "application/json",
				...config.headers,
			},
		}

		const response: AxiosResponse<T> = await axios.get(url, requestConfig)

		if (!response.data) {
			throw new Error(`Invalid response from ${endpoint} API`)
		}

		return response.data
	}

	/**
	 * Fetches the user's current credit balance
	 */
	async fetchBalance(): Promise<BalanceResponse | undefined> {
		try {
			const data = await this.authenticatedRequest<BalanceResponse>("/user/credits/balance")

			// Post to webview
			await this.providerRef.deref()?.postMessageToWebview({
				type: "userCreditsBalance",
				userCreditsBalance: data,
			})

			return data
		} catch (error) {
			console.error("Failed to fetch balance:", error)
			return undefined
		}
	}

	/**
	 * Fetches the user's usage transactions
	 */
	async fetchUsageTransactions(): Promise<UsageTransaction[] | undefined> {
		try {
			const data = await this.authenticatedRequest<UsageTransaction[]>("/user/credits/usage")

			// Post to webview
			await this.providerRef.deref()?.postMessageToWebview({
				type: "userCreditsUsage",
				userCreditsUsage: data,
			})

			return data
		} catch (error) {
			console.error("Failed to fetch usage transactions:", error)
			return undefined
		}
	}

	/**
	 * Fetches the user's payment transactions
	 */
	async fetchPaymentTransactions(): Promise<PaymentTransaction[] | undefined> {
		try {
			const data = await this.authenticatedRequest<PaymentTransaction[]>("/user/credits/payments")

			// Post to webview
			await this.providerRef.deref()?.postMessageToWebview({
				type: "userCreditsPayments",
				userCreditsPayments: data,
			})

			return data
		} catch (error) {
			console.error("Failed to fetch payment transactions:", error)
			return undefined
		}
	}
}
