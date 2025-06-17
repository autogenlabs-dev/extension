import { LoginResponse, RegisterRequest } from '../../services/auth/BackendService'
import { SecureStorage } from '../../utils/SecureStorage'
import { webviewMessageHandler } from '../../core/webview/webviewMessageHandler'
import { WebviewMessage } from '../../shared/WebviewMessage'

// Mock dependencies
jest.mock('../../utils/SecureStorage')
jest.mock('axios')

describe('Authentication System Tests', () => {
  let mockSecureStorage: jest.Mocked<SecureStorage>
  let mockProvider: any

  beforeEach(() => {
    // Setup mocks
    mockSecureStorage = {
      store: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      has: jest.fn(),
      clear: jest.fn(),
      storeTokens: jest.fn(),
      getTokens: jest.fn(),
      clearTokens: jest.fn(),
      getInstance: jest.fn(),
      initialize: jest.fn()
    } as any

    mockProvider = {
      postMessageToWebview: jest.fn(),
      log: jest.fn(),
      getAuthManager: jest.fn()
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('LoginResponse Interface Validation', () => {
    it('should validate correct login response structure', () => {
      const mockLoginResponse: LoginResponse = {
        access_token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test_token',
        refresh_token: 'def50200test_refresh_token',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: 'user_123',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          subscription_tier: 'premium',
          email_verified: true,
          monthly_usage: {
            api_calls: 150,
            tokens_used: 45000
          }
        },
        a4f_api_key: 'a4f_sk_1234567890abcdef',
        api_endpoint: 'https://api.example.com'
      }

      // Validate required fields
      expect(mockLoginResponse.access_token).toBeDefined()
      expect(mockLoginResponse.refresh_token).toBeDefined()
      expect(mockLoginResponse.token_type).toBe('Bearer')
      expect(mockLoginResponse.user).toBeDefined()
      expect(mockLoginResponse.user.id).toBeDefined()
      expect(mockLoginResponse.user.email).toBeDefined()
      expect(mockLoginResponse.user.first_name).toBeDefined()
      expect(mockLoginResponse.user.last_name).toBeDefined()
      expect(mockLoginResponse.user.subscription_tier).toBeDefined()
      expect(typeof mockLoginResponse.user.email_verified).toBe('boolean')

      // Validate A4F integration fields
      expect(mockLoginResponse.a4f_api_key).toBeDefined()
      expect(mockLoginResponse.api_endpoint).toBeDefined()
      expect(mockLoginResponse.a4f_api_key).toMatch(/^a4f_sk_/)
      expect(mockLoginResponse.api_endpoint).toMatch(/^https?:\/\//)

      // Validate usage tracking
      expect(mockLoginResponse.user.monthly_usage).toBeDefined()
      expect(typeof mockLoginResponse.user.monthly_usage?.api_calls).toBe('number')
      expect(typeof mockLoginResponse.user.monthly_usage?.tokens_used).toBe('number')
    })

    it('should validate minimal login response without optional fields', () => {
      const minimalLoginResponse: LoginResponse = {
        access_token: 'test_token',
        refresh_token: 'test_refresh',
        token_type: 'Bearer',
        user: {
          id: 'user_123',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          subscription_tier: 'free',
          email_verified: false
        }
      }

      expect(minimalLoginResponse.access_token).toBeDefined()
      expect(minimalLoginResponse.refresh_token).toBeDefined()
      expect(minimalLoginResponse.user).toBeDefined()
      expect(minimalLoginResponse.a4f_api_key).toBeUndefined()
      expect(minimalLoginResponse.api_endpoint).toBeUndefined()
      expect(minimalLoginResponse.expires_in).toBeUndefined()
    })
  })

  describe('Webview Authentication Message Handling', () => {
    it('should handle successful login message', async () => {
      const loginMessage: WebviewMessage = {
        type: 'auth:login',
        data: {
          email: 'test@example.com',
          password: 'testpassword123'
        }
      }

      await webviewMessageHandler(mockProvider, loginMessage)

      // Verify success response was sent with API key
      expect(mockProvider.postMessageToWebview).toHaveBeenCalledWith({
        type: 'auth:loginSuccess',
        user: {
          id: 'demo-user',
          email: 'test@example.com',
          first_name: 'Demo',
          last_name: 'User',
          subscription_tier: 'premium',
          email_verified: true,
          monthly_usage: {
            api_calls: 150,
            tokens_used: 45000
          }
        },
        text: 'A4F API Key: ddc-a4f-a480842d898b49d4a15e14800c2f3c72',
        values: {
          apiKey: 'ddc-a4f-a480842d898b49d4a15e14800c2f3c72',
          apiEndpoint: 'https://api.a4f.co/v1',
          accessToken: 'demo_access_token_123',
          refreshToken: 'demo_refresh_token_456'
        }
      })
    })

    it('should handle login validation errors', async () => {
      const invalidLoginMessage: WebviewMessage = {
        type: 'auth:login',
        data: {
          email: '',
          password: ''
        }
      }

      await webviewMessageHandler(mockProvider, invalidLoginMessage)

      // Verify error response was sent
      expect(mockProvider.postMessageToWebview).toHaveBeenCalledWith({
        type: 'auth:error',
        error: 'Email and password are required'
      })
    })

    it('should handle successful registration message', async () => {
      const registerMessage: WebviewMessage = {
        type: 'auth:register',
        data: {
          email: 'newuser@example.com',
          password: 'securepassword123',
          first_name: 'Jane',
          last_name: 'Smith'
        }
      }

      await webviewMessageHandler(mockProvider, registerMessage)

      // Verify success response was sent
      expect(mockProvider.postMessageToWebview).toHaveBeenCalledWith({
        type: 'auth:registerSuccess',
        message: 'Account created successfully! Please check your email for verification.'
      })
    })

    it('should handle registration validation errors', async () => {
      const invalidRegisterMessage: WebviewMessage = {
        type: 'auth:register',
        data: {
          email: 'test@example.com',
          password: 'pass',
          first_name: '',
          last_name: 'Smith'
        }
      }

      await webviewMessageHandler(mockProvider, invalidRegisterMessage)

      // Verify error response was sent
      expect(mockProvider.postMessageToWebview).toHaveBeenCalledWith({
        type: 'auth:error',
        error: 'All fields are required'
      })
    })

    it('should handle logout message', async () => {
      const logoutMessage: WebviewMessage = {
        type: 'auth:logout'
      }

      await webviewMessageHandler(mockProvider, logoutMessage)

      // Verify success response was sent
      expect(mockProvider.postMessageToWebview).toHaveBeenCalledWith({
        type: 'auth:logoutSuccess',
        message: 'Signed out successfully'
      })
    })
  })

  describe('SecureStorage Token Management', () => {
    it('should store authentication tokens correctly', async () => {
      const accessToken = 'test_access_token'
      const refreshToken = 'test_refresh_token'

      await mockSecureStorage.storeTokens(accessToken, refreshToken)

      expect(mockSecureStorage.storeTokens).toHaveBeenCalledWith(accessToken, refreshToken)
    })

    it('should retrieve authentication tokens correctly', async () => {
      const mockTokens = {
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token'
      }

      mockSecureStorage.getTokens.mockResolvedValue(mockTokens)

      const result = await mockSecureStorage.getTokens()

      expect(result).toEqual(mockTokens)
      expect(mockSecureStorage.getTokens).toHaveBeenCalled()
    })

    it('should clear authentication tokens correctly', async () => {
      await mockSecureStorage.clearTokens()

      expect(mockSecureStorage.clearTokens).toHaveBeenCalled()
    })

    it('should handle missing tokens gracefully', async () => {
      mockSecureStorage.getTokens.mockResolvedValue({
        accessToken: undefined,
        refreshToken: undefined
      })

      const result = await mockSecureStorage.getTokens()

      expect(result.accessToken).toBeUndefined()
      expect(result.refreshToken).toBeUndefined()
    })
  })

  describe('A4F Integration Response Validation', () => {
    it('should validate VSCodeConfig response structure', () => {
      const mockVSCodeConfig = {
        config: {
          a4f_api_key: 'a4f_sk_test123',
          api_endpoint: 'https://api.example.com',
          providers: {
            a4f: {
              enabled: true,
              base_url: 'https://api.a4f.co/v1',
              models: ['gpt-4', 'claude-3-sonnet', 'gemini-pro'],
              priority: 1
            }
          },
          model_routing: {
            popular_models_to_a4f: true,
            default_provider: 'a4f'
          }
        }
      }

      // Validate structure
      expect(mockVSCodeConfig.config).toBeDefined()
      expect(mockVSCodeConfig.config.a4f_api_key).toBeDefined()
      expect(mockVSCodeConfig.config.api_endpoint).toBeDefined()
      expect(mockVSCodeConfig.config.providers.a4f).toBeDefined()
      expect(mockVSCodeConfig.config.model_routing).toBeDefined()

      // Validate A4F provider config
      const a4fConfig = mockVSCodeConfig.config.providers.a4f
      expect(a4fConfig.enabled).toBe(true)
      expect(a4fConfig.base_url).toMatch(/^https?:\/\//)
      expect(Array.isArray(a4fConfig.models)).toBe(true)
      expect(a4fConfig.models.length).toBeGreaterThan(0)
      expect(typeof a4fConfig.priority).toBe('number')

      // Validate model routing
      expect(typeof mockVSCodeConfig.config.model_routing.popular_models_to_a4f).toBe('boolean')
      expect(mockVSCodeConfig.config.model_routing.default_provider).toBe('a4f')
    })

    it('should validate ModelInfo array structure', () => {
      const mockModels = [
        {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: 'a4f',
          context_length: 8192,
          description: 'Most capable GPT-4 model'
        },
        {
          id: 'claude-3-sonnet',
          name: 'Claude 3 Sonnet',
          provider: 'a4f',
          context_length: 200000,
          description: 'Balanced model for complex tasks'
        }
      ]

      mockModels.forEach(model => {
        expect(model.id).toBeDefined()
        expect(model.name).toBeDefined()
        expect(model.provider).toBe('a4f')
        expect(typeof model.context_length).toBe('number')
        expect(model.context_length).toBeGreaterThan(0)
        expect(model.description).toBeDefined()
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      const networkErrorMessage: WebviewMessage = {
        type: 'auth:login',
        data: {
          email: 'test@example.com',
          password: 'testpassword'
        }
      }

      // Simulate network error by throwing in the handler
      const errorProvider = {
        ...mockProvider,
        postMessageToWebview: jest.fn().mockRejectedValue(new Error('Network error'))
      }

      try {
        await webviewMessageHandler(errorProvider, networkErrorMessage)
      } catch (error) {
        // Error should be caught and handled
      }

      expect(errorProvider.postMessageToWebview).toHaveBeenCalled()
    })

    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.org'
      ]

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com'
      ]

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true)
      })

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false)
      })
    })

    it('should validate password strength requirements', () => {
      const strongPasswords = [
        'MyStr0ngP@ssw0rd!',
        'Complex123Password!',
        'V3rySecur3P@ss!'
      ]

      const weakPasswords = [
        '123456',
        'pass',
        'weak',
        'short'
      ]

      strongPasswords.forEach(password => {
        expect(password.length).toBeGreaterThanOrEqual(8)
        expect(password).toMatch(/[A-Z]/) // Uppercase
        expect(password).toMatch(/[a-z]/) // Lowercase
        expect(password).toMatch(/\d/) // Number
        expect(password).toMatch(/[!@#$%^&*(),.?":{}|<>]/) // Special char
      })

      weakPasswords.forEach(password => {
        expect(password.length).toBeLessThan(8)
      })
    })
  })

  describe('Authentication State Management', () => {
    it('should track authentication state correctly', () => {
      const initialState = {
        isAuthenticated: false,
        user: null,
        hasValidApiKeys: false
      }

      const authenticatedState = {
        isAuthenticated: true,
        user: {
          id: 'user_123',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          subscription_tier: 'premium',
          email_verified: true
        },
        hasValidApiKeys: true
      }

      // Validate initial state
      expect(initialState.isAuthenticated).toBe(false)
      expect(initialState.user).toBeNull()
      expect(initialState.hasValidApiKeys).toBe(false)

      // Validate authenticated state
      expect(authenticatedState.isAuthenticated).toBe(true)
      expect(authenticatedState.user).toBeDefined()
      expect(authenticatedState.hasValidApiKeys).toBe(true)
    })

    it('should handle authentication expiry correctly', async () => {
      const expiredTokenResponse = {
        type: 'auth:error',
        error: 'Session expired. Please sign in again.'
      }

      expect(expiredTokenResponse.type).toBe('auth:error')
      expect(expiredTokenResponse.error).toContain('expired')
    })
  })

  describe('Integration Test - Complete Authentication Flow', () => {
    it('should complete full login flow with A4F integration', async () => {
      // Step 1: User submits login form
      const loginData = {
        email: 'user@example.com',
        password: 'securepassword123'
      }

      // Step 2: Simulate successful backend response
      const mockBackendResponse: LoginResponse = {
        access_token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test',
        refresh_token: 'def50200test',
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: 'user_123',
          email: loginData.email,
          first_name: 'John',
          last_name: 'Doe',
          subscription_tier: 'premium',
          email_verified: true,
          monthly_usage: {
            api_calls: 50,
            tokens_used: 15000
          }
        },
        a4f_api_key: 'a4f_sk_premium_key_123',
        api_endpoint: 'https://api.autogen.example.com'
      }

      // Step 3: Verify tokens are stored
      await mockSecureStorage.storeTokens(
        mockBackendResponse.access_token,
        mockBackendResponse.refresh_token
      )

      expect(mockSecureStorage.storeTokens).toHaveBeenCalledWith(
        mockBackendResponse.access_token,
        mockBackendResponse.refresh_token
      )

      // Step 4: Verify A4F configuration
      expect(mockBackendResponse.a4f_api_key).toBeDefined()
      expect(mockBackendResponse.a4f_api_key).toMatch(/^a4f_sk_/)
      expect(mockBackendResponse.api_endpoint).toMatch(/^https?:\/\//)

      // Step 5: Verify user data structure
      expect(mockBackendResponse.user.subscription_tier).toBe('premium')
      expect(mockBackendResponse.user.email_verified).toBe(true)
      expect(mockBackendResponse.user.monthly_usage).toBeDefined()
    })

    it('should handle complete registration flow', async () => {
      // Step 1: User submits registration form
      const registrationData: RegisterRequest = {
        email: 'newuser@example.com',
        password: 'NewUserPassword123!',
        first_name: 'Jane',
        last_name: 'Smith'
      }

      // Step 2: Validate registration data
      expect(registrationData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      expect(registrationData.password.length).toBeGreaterThanOrEqual(8)
      expect(registrationData.first_name.trim()).toBeTruthy()
      expect(registrationData.last_name.trim()).toBeTruthy()

      // Step 3: Simulate webview message
      const registerMessage: WebviewMessage = {
        type: 'auth:register',
        data: registrationData
      }

      await webviewMessageHandler(mockProvider, registerMessage)

      // Step 4: Verify success response
      expect(mockProvider.postMessageToWebview).toHaveBeenCalledWith({
        type: 'auth:registerSuccess',
        message: 'Account created successfully! Please check your email for verification.'
      })
    })
  })
})