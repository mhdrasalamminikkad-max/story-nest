import { useQuery } from "@tanstack/react-query";
import { Clock, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

interface SubscriptionStatus {
  status: string;
  trialDaysRemaining?: number;
  hasActivePass: boolean;
  activePassEndDate?: number;
  coins: number;
}

export function TrialBanner() {
  const [, navigate] = useLocation();

  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
  });

  if (!subscriptionStatus) {
    return null;
  }

  // Show subscription info for active users (including admins)
  if (subscriptionStatus.hasActivePass && subscriptionStatus.status === "active") {
    return (
      <Card
        className="mb-4 border-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30"
        data-testid="banner-active"
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <Sparkles className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  ✨ Active Subscription
                </h3>
                <p className="text-sm text-muted-foreground">
                  {subscriptionStatus.activePassEndDate ? (
                    <>
                      Your subscription is active until{" "}
                      <span className="font-bold text-foreground">
                        {new Date(subscriptionStatus.activePassEndDate).toLocaleDateString()}
                      </span>
                    </>
                  ) : (
                    "You have full access to all features"
                  )}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/subscription")}
              variant="outline"
              className="gap-2"
              data-testid="button-manage-subscription"
            >
              <Sparkles className="w-4 h-4" />
              Manage Subscription
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show trial countdown during trial period
  if (subscriptionStatus.status === "trial" && subscriptionStatus.trialDaysRemaining !== undefined) {
    const daysRemaining = subscriptionStatus.trialDaysRemaining;
    const isLastDays = daysRemaining <= 2;

    return (
      <Card
        className={`mb-4 border-2 ${
          isLastDays
            ? "bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30"
            : "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30"
        }`}
        data-testid="banner-trial"
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${isLastDays ? "bg-orange-500/20" : "bg-blue-500/20"}`}>
                <Clock className={`w-5 h-5 ${isLastDays ? "text-orange-500" : "text-blue-500"}`} />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  {isLastDays ? "⚠️ Trial Ending Soon!" : "🎉 Free Trial Active"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {daysRemaining === 1 ? (
                    <>
                      <span className="font-bold text-foreground">Last day</span> of your free trial!
                    </>
                  ) : daysRemaining === 0 ? (
                    <>Your trial ends <span className="font-bold text-foreground">today</span></>
                  ) : (
                    <>
                      <span className="font-bold text-foreground">{daysRemaining} days</span> remaining in your
                      free trial
                    </>
                  )}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/subscription")}
              variant={isLastDays ? "default" : "outline"}
              className="gap-2"
              data-testid="button-view-plans"
            >
              <Sparkles className="w-4 h-4" />
              View Plans
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show subscription required banner if trial expired
  if (subscriptionStatus.status === "expired") {
    return (
      <Card
        className="mb-4 border-2 bg-gradient-to-r from-destructive/10 to-orange-500/10 border-destructive/30"
        data-testid="banner-expired"
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-destructive/20">
                <Clock className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Trial Expired</h3>
                <p className="text-sm text-muted-foreground">
                  Your free trial has ended. Purchase a subscription to continue enjoying StoryNest.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/subscription")}
              variant="default"
              className="gap-2"
              data-testid="button-subscribe-now"
            >
              Subscribe Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
