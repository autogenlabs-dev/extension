import React, { useState, useCallback, useEffect } from 'react'
import { Eye, EyeOff, User, Mail, Lock, Shield, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAppTranslation } from '@/i18n/TranslationContext'
import { vscode } from '@/utils/vscode'

interface ValidationErrors {
  email?: string
  password?: string
  firstName?: string
  lastName?: string
  confirmPassword?: string
}

interface PasswordStrength {
  score: number
  message: string
  color: string
}

interface AuthFormData {
  email: string
  password: string
  firstName: string
  lastName: string
  confirmPassword: string
}

interface AuthenticationFormProps {
  onAuthSuccess?: (user: any, authData?: any) => void
  onAuthError?: (error: string) => void
}

const AuthenticationForm: React.FC<AuthenticationFormProps> = ({
  onAuthSuccess,
  onAuthError
}) => {
  const { t } = useAppTranslation()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Email validation
  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email) return t('welcome:auth.validation.emailRequired')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return t('welcome:auth.validation.emailInvalid')
    return undefined
  }, [t])

  // Password strength calculation
  const calculatePasswordStrength = useCallback((password: string): PasswordStrength => {
    if (!password) return { score: 0, message: '', color: 'text-vscode-descriptionForeground' }
    
    let score = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    
    score = Object.values(checks).filter(Boolean).length
    
    if (score <= 2) {
      return { score, message: t('welcome:auth.password.weak'), color: 'text-red-500' }
    } else if (score <= 3) {
      return { score, message: t('welcome:auth.password.fair'), color: 'text-yellow-500' }
    } else if (score <= 4) {
      return { score, message: t('welcome:auth.password.good'), color: 'text-blue-500' }
    } else {
      return { score, message: t('welcome:auth.password.strong'), color: 'text-green-500' }
    }
  }, [t])

  // Password validation
  const validatePassword = useCallback((password: string): string | undefined => {
    if (!password) return t('welcome:auth.validation.passwordRequired')
    if (password.length < 8) return t('welcome:auth.validation.passwordMinLength')
    return undefined
  }, [t])

  // Form validation
  const validateField = useCallback((field: keyof AuthFormData, value: string): string | undefined => {
    switch (field) {
      case 'email':
        return validateEmail(value)
      case 'password':
        return validatePassword(value)
      case 'firstName':
        return !value ? t('welcome:auth.validation.firstNameRequired') : undefined
      case 'lastName':
        return !value ? t('welcome:auth.validation.lastNameRequired') : undefined
      case 'confirmPassword':
        return isSignUp && value !== formData.password ? t('welcome:auth.validation.passwordMismatch') : undefined
      default:
        return undefined
    }
  }, [validateEmail, validatePassword, isSignUp, formData.password, t])

  // Handle input change
  const handleInputChange = useCallback((field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  // Handle input blur
  const handleInputBlur = useCallback((field: keyof AuthFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, formData[field])
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [validateField, formData])

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {}
    const fieldsToValidate: (keyof AuthFormData)[] = isSignUp 
      ? ['email', 'password', 'firstName', 'lastName', 'confirmPassword']
      : ['email', 'password']

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field])
      if (error) newErrors[field] = error
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [isSignUp, validateField, formData])

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      if (isSignUp) {
        // Send registration message to extension
        vscode.postMessage({
          type: 'auth:register',
          data: {
            email: formData.email,
            password: formData.password,
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        })
      } else {
        // Send login message to extension
        vscode.postMessage({
          type: 'auth:login',
          data: {
            email: formData.email,
            password: formData.password
          }
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('welcome:auth.errors.unknownError')
      onAuthError?.(errorMessage)
      setLoading(false)
    }
  }, [validateForm, isSignUp, formData, onAuthError, t])

  // Listen for auth responses from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data
      
      switch (message.type) {
        case 'auth:loginSuccess':
          setLoading(false)
          onAuthSuccess?.(message.user, {
            apiKey: message.values?.apiKey,
            apiEndpoint: message.values?.apiEndpoint,
            accessToken: message.values?.accessToken,
            refreshToken: message.values?.refreshToken
          })
          break
        case 'auth:registerSuccess':
          setLoading(false)
          // Switch to login mode after successful registration
          setIsSignUp(false)
          setFormData(prev => ({ ...prev, password: '', confirmPassword: '', firstName: '', lastName: '' }))
          break
        case 'auth:error':
          setLoading(false)
          onAuthError?.(message.error)
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onAuthSuccess, onAuthError])

  // Toggle between login and signup
  const toggleMode = useCallback(() => {
    setIsSignUp(!isSignUp)
    setErrors({})
    setTouched({})
    setFormData({
      email: formData.email, // Keep email
      password: '',
      firstName: '',
      lastName: '',
      confirmPassword: ''
    })
  }, [isSignUp, formData.email])

  const passwordStrength = calculatePasswordStrength(formData.password)

  return (
    <div className="w-full max-w-md mx-auto space-y-6 p-6 bg-vscode-sideBar-background border border-vscode-panel-border rounded-md">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-vscode-textLink-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-vscode-foreground">
          {isSignUp ? t('welcome:auth.signUp.title') : t('welcome:auth.signIn.title')}
        </h2>
        <p className="text-sm text-vscode-descriptionForeground">
          {isSignUp ? t('welcome:auth.signUp.subtitle') : t('welcome:auth.signIn.subtitle')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-vscode-foreground">
            {t('welcome:auth.fields.email')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vscode-descriptionForeground" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={() => handleInputBlur('email')}
              placeholder={t('welcome:auth.placeholders.email')}
              className={cn(
                'pl-10',
                errors.email && touched.email && 'border-red-500 focus-visible:border-red-500'
              )}
              disabled={loading}
              autoComplete="email"
            />
          </div>
          {errors.email && touched.email && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Sign Up Fields */}
        {isSignUp && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {/* First Name */}
              <div className="space-y-1">
                <label htmlFor="firstName" className="text-sm font-medium text-vscode-foreground">
                  {t('welcome:auth.fields.firstName')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vscode-descriptionForeground" />
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    onBlur={() => handleInputBlur('firstName')}
                    placeholder={t('welcome:auth.placeholders.firstName')}
                    className={cn(
                      'pl-10',
                      errors.firstName && touched.firstName && 'border-red-500 focus-visible:border-red-500'
                    )}
                    disabled={loading}
                    autoComplete="given-name"
                  />
                </div>
                {errors.firstName && touched.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <label htmlFor="lastName" className="text-sm font-medium text-vscode-foreground">
                  {t('welcome:auth.fields.lastName')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vscode-descriptionForeground" />
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    onBlur={() => handleInputBlur('lastName')}
                    placeholder={t('welcome:auth.placeholders.lastName')}
                    className={cn(
                      'pl-10',
                      errors.lastName && touched.lastName && 'border-red-500 focus-visible:border-red-500'
                    )}
                    disabled={loading}
                    autoComplete="family-name"
                  />
                </div>
                {errors.lastName && touched.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Password Field */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-vscode-foreground">
            {t('welcome:auth.fields.password')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vscode-descriptionForeground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onBlur={() => handleInputBlur('password')}
              placeholder={t('welcome:auth.placeholders.password')}
              className={cn(
                'pl-10 pr-10',
                errors.password && touched.password && 'border-red-500 focus-visible:border-red-500'
              )}
              disabled={loading}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-vscode-descriptionForeground hover:text-vscode-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && touched.password && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {errors.password}
            </p>
          )}
          
          {/* Password Strength Indicator */}
          {isSignUp && formData.password && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-vscode-descriptionForeground">
                  {t('welcome:auth.password.strength')}
                </span>
                <span className={cn('text-xs font-medium', passwordStrength.color)}>
                  {passwordStrength.message}
                </span>
              </div>
              <div className="w-full bg-vscode-input-border rounded-full h-1">
                <div 
                  className="h-1 rounded-full transition-all duration-300 ease-in-out"
                  style={{
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    backgroundColor: passwordStrength.score <= 2 ? '#ef4444' : 
                                   passwordStrength.score <= 3 ? '#eab308' :
                                   passwordStrength.score <= 4 ? '#3b82f6' : '#10b981'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password Field (Sign Up Only) */}
        {isSignUp && (
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-vscode-foreground">
              {t('welcome:auth.fields.confirmPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-vscode-descriptionForeground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onBlur={() => handleInputBlur('confirmPassword')}
                placeholder={t('welcome:auth.placeholders.confirmPassword')}
                className={cn(
                  'pl-10 pr-10',
                  errors.confirmPassword && touched.confirmPassword && 'border-red-500 focus-visible:border-red-500'
                )}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-vscode-descriptionForeground hover:text-vscode-foreground"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && touched.confirmPassword && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {errors.confirmPassword}
              </p>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {t('welcome:auth.validation.passwordMatch')}
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
          variant="default"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {isSignUp ? t('welcome:auth.buttons.signingUp') : t('welcome:auth.buttons.signingIn')}
            </div>
          ) : (
            isSignUp ? t('welcome:auth.buttons.signUp') : t('welcome:auth.buttons.signIn')
          )}
        </Button>
      </form>

      {/* Toggle Mode */}
      <div className="text-center space-y-2">
        <p className="text-sm text-vscode-descriptionForeground">
          {isSignUp ? t('welcome:auth.toggleMode.haveAccount') : t('welcome:auth.toggleMode.noAccount')}
        </p>
        <Button
          type="button"
          variant="link"
          onClick={toggleMode}
          disabled={loading}
          className="text-vscode-textLink-foreground hover:text-vscode-textLink-activeForeground"
        >
          {isSignUp ? t('welcome:auth.toggleMode.signIn') : t('welcome:auth.toggleMode.signUp')}
        </Button>
      </div>

      {/* A4F Integration Notice */}
      <div className="p-3 bg-vscode-textBlockQuote-background border-l-4 border-vscode-textLink-foreground rounded-r">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-vscode-textLink-foreground mt-0.5 flex-shrink-0" />
          <div className="text-xs text-vscode-descriptionForeground">
            <p className="font-medium text-vscode-foreground mb-1">
              {t('welcome:auth.a4f.title')}
            </p>
            <p>{t('welcome:auth.a4f.description')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthenticationForm