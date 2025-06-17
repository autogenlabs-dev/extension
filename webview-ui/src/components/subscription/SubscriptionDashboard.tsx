import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  VSCodeButton, 
  VSCodeProgressRing, 
  VSCodeDivider,
  VSCodeBadge,
  VSCodePanels,
  VSCodePanelTab,
  VSCodePanelView
} from '@vscode/webview-ui-toolkit/react';

interface SubscriptionInfo {
  tier: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'past_due' | 'cancelled' | 'expired';
  usage_limits: {
    monthly_requests: number | 'unlimited';
    monthly_tokens: number | 'unlimited';
    concurrent_requests: number;
    rate_limit_per_minute: number;
  };
  current_usage: {
    requests_used: number;
    tokens_used: number;
    reset_date: string;
  };
  usage_percentage: {
    requests: number;
    tokens: number;
  };
  features: string[];
  billing?: {
    next_billing_date?: string;
    cost?: number;
    billing_cycle?: 'monthly' | 'annual';
  };
  organization?: {
    seats: number;
    used_seats: number;
  };
  warnings?: {
    approaching_limit?: boolean;
    message?: string;
  };
}

export const SubscriptionDashboard: React.FC = () => {
  const { t } = useTranslation('subscription');
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const formatNumber = (num: number | 'unlimited'): string => {
    if (num === 'unlimited') return 'Unlimited';
    if (typeof num === 'number') {
      return num.toLocaleString();
    }
    return 'N/A';
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'var(--vscode-errorForeground)';
    if (percentage >= 75) return 'var(--vscode-warningForeground)';
    return 'var(--vscode-charts-green)';
  };

  const getTierBadgeColor = (tier: string): string => {
    switch (tier) {
      case 'free': return 'var(--vscode-charts-blue)';
      case 'premium': return 'var(--vscode-charts-purple)';
      case 'enterprise': return 'var(--vscode-charts-orange)';
      default: return 'var(--vscode-foreground)';
    }
  };

  // Mock data for testing
  useEffect(() => {
    const mockSubscription: SubscriptionInfo = {
      tier: 'premium',
      status: 'active',
      usage_limits: {
        monthly_requests: 10000,
        monthly_tokens: 1000000,
        concurrent_requests: 10,
        rate_limit_per_minute: 60
      },
      current_usage: {
        requests_used: 2500,
        tokens_used: 250000,
        reset_date: '2025-01-01T00:00:00Z'
      },
      usage_percentage: {
        requests: 25,
        tokens: 25
      },
      features: ['gpt-4', 'claude-sonnet-4', 'gpt-3.5-turbo', 'claude-haiku', 'priority-support'],
      billing: {
        next_billing_date: '2025-01-15T00:00:00Z',
        cost: 20,
        billing_cycle: 'monthly'
      },
      warnings: {
        approaching_limit: false
      }
    };

    setTimeout(() => {
      setSubscription(mockSubscription);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <VSCodeProgressRing />
        <span className="ml-2">Loading subscription data...</span>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-4 text-center">
        <p className="text-vscode-errorForeground mb-4">Error loading subscription data</p>
        <VSCodeButton onClick={() => window.location.reload()}>
          Retry
        </VSCodeButton>
      </div>
    );
  }

  return (
    <div className="subscription-dashboard p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-vscode-foreground mb-2">
          Subscription Dashboard
        </h1>
        <p className="text-vscode-descriptionForeground">
          Manage your subscription and monitor API usage
        </p>
      </div>

      {/* Current Plan */}
      <div className="bg-vscode-editor-background border border-vscode-widget-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-vscode-foreground">
            Current Plan
          </h2>
          <VSCodeBadge 
            style={{ 
              backgroundColor: getTierBadgeColor(subscription.tier), 
              color: 'white' 
            }}
          >
            {subscription.tier.toUpperCase()}
          </VSCodeBadge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-vscode-descriptionForeground">
              Status
            </p>
            <p className={`font-medium ${
              subscription.status === 'active' 
                ? 'text-vscode-charts-green' 
                : 'text-vscode-errorForeground'
            }`}>
              {subscription.status.toUpperCase()}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-vscode-descriptionForeground">
              Monthly Requests
            </p>
            <p className="font-medium text-vscode-foreground">
              {formatNumber(subscription.usage_limits.monthly_requests)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-vscode-descriptionForeground">
              Monthly Tokens
            </p>
            <p className="font-medium text-vscode-foreground">
              {formatNumber(subscription.usage_limits.monthly_tokens)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-vscode-descriptionForeground">
              Rate Limit
            </p>
            <p className="font-medium text-vscode-foreground">
              {subscription.usage_limits.rate_limit_per_minute}/min
            </p>
          </div>
        </div>

        {subscription.billing && (
          <div className="mt-4 pt-4 border-t border-vscode-widget-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-vscode-descriptionForeground">
                  Next Billing
                </p>
                <p className="font-medium text-vscode-foreground">
                  {new Date(subscription.billing.next_billing_date!).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-vscode-descriptionForeground">
                  Cost
                </p>
                <p className="font-medium text-vscode-foreground">
                  ${subscription.billing.cost}/{subscription.billing.billing_cycle}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Overview */}
      <div className="bg-vscode-editor-background border border-vscode-widget-border rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium text-vscode-foreground mb-4">
          Usage Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Requests Usage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-vscode-descriptionForeground">
                Requests
              </span>
              <span className="text-sm font-medium text-vscode-foreground">
                {subscription.current_usage.requests_used.toLocaleString()} / {formatNumber(subscription.usage_limits.monthly_requests)}
              </span>
            </div>
            <div className="w-full bg-vscode-progressBar-background rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(subscription.usage_percentage.requests, 100)}%`,
                  backgroundColor: getUsageColor(subscription.usage_percentage.requests)
                }}
              />
            </div>
            <p className="text-xs text-vscode-descriptionForeground">
              {subscription.usage_percentage.requests}% used
            </p>
          </div>

          {/* Tokens Usage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-vscode-descriptionForeground">
                Tokens
              </span>
              <span className="text-sm font-medium text-vscode-foreground">
                {subscription.current_usage.tokens_used.toLocaleString()} / {formatNumber(subscription.usage_limits.monthly_tokens)}
              </span>
            </div>
            <div className="w-full bg-vscode-progressBar-background rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(subscription.usage_percentage.tokens, 100)}%`,
                  backgroundColor: getUsageColor(subscription.usage_percentage.tokens)
                }}
              />
            </div>
            <p className="text-xs text-vscode-descriptionForeground">
              {subscription.usage_percentage.tokens}% used
            </p>
          </div>
        </div>

        {subscription.warnings?.approaching_limit && (
          <div className="mt-4 p-3 bg-vscode-inputValidation-warningBackground border border-vscode-inputValidation-warningBorder rounded">
            <p className="text-sm text-vscode-inputValidation-warningForeground">
              ⚠️ {subscription.warnings.message}
            </p>
          </div>
        )}
      </div>

      {/* Available Features */}
      <div className="bg-vscode-editor-background border border-vscode-widget-border rounded-lg p-4">
        <h2 className="text-lg font-medium text-vscode-foreground mb-4">
          Available Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {subscription.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="text-vscode-charts-green">✓</span>
              <span className="text-sm text-vscode-foreground">
                {feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <VSCodeButton appearance="primary">
          Upgrade Plan
        </VSCodeButton>
        <VSCodeButton appearance="secondary">
          Manage Billing
        </VSCodeButton>
        <VSCodeButton appearance="secondary">
          View Usage Details
        </VSCodeButton>
      </div>
    </div>
  );
};

export default SubscriptionDashboard;