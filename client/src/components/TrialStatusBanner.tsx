import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Crown } from 'lucide-react';

interface TrialStatusBannerProps {
  onUpgradeClick?: () => void;
}

export function TrialStatusBanner({ onUpgradeClick }: TrialStatusBannerProps) {
  const { user } = useAuth();

  // This would typically come from subscription info from the server
  // For now, we'll simulate it - in a real implementation, 
  // you'd fetch this from /api/user/subscription-info
  const [subscriptionInfo, setSubscriptionInfo] = React.useState<{
    status: 'trial' | 'active' | 'expired' | 'canceled';
    trialDaysRemaining?: number;
  } | null>(null);

  React.useEffect(() => {
    // Fetch subscription info from server
    const fetchSubscriptionInfo = async () => {
      try {
        const response = await fetch('/api/user/subscription-info');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch subscription info:', error);
      }
    };

    if (user) {
      fetchSubscriptionInfo();
    }
  }, [user]);

  if (!subscriptionInfo || subscriptionInfo.status === 'active' || subscriptionInfo.status === 'canceled') {
    return null;
  }

  const isTrial = subscriptionInfo.status === 'trial';
  const isExpired = subscriptionInfo.status === 'expired';
  const daysRemaining = subscriptionInfo.trialDaysRemaining || 0;

  if (isExpired) {
    return (
      <Alert className="mb-4 border-red-200 bg-red-50">
        <Crown className="h-4 w-4 text-red-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-red-800">
            Your free trial has ended. Upgrade to premium to continue accessing all stories.
          </span>
          <Button 
            onClick={onUpgradeClick}
            className="ml-4 bg-red-600 hover:bg-red-700"
            size="sm"
          >
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isTrial && daysRemaining <= 2) {
    return (
      <Alert className={`mb-4 ${daysRemaining === 0 ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
        <Clock className="h-4 w-4 text-amber-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className={daysRemaining === 0 ? 'text-red-800' : 'text-amber-800'}>
            {daysRemaining === 0 
              ? "Your free trial ends today!"
              : `Your free trial ends in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
            }
          </span>
          <Button 
            onClick={onUpgradeClick}
            className="ml-4 bg-amber-600 hover:bg-amber-700"
            size="sm"
          >
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isTrial) {
    return (
      <Alert className="mb-4 border-blue-200 bg-blue-50">
        <Crown className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          🎉 You have {daysRemaining} days left in your free trial. Enjoy unlimited access to all stories!
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
