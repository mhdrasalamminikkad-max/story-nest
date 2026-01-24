import { useQuery } from "@tanstack/react-query";
import { Clock, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

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
        className="mb-4 border-3 bg-gradient-to-r from-[#FFF8E7] to-[#FFE8CC] border-[#F5C518]"
        data-testid="banner-active"
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <motion.div className="p-2 rounded-full bg-gradient-to-br from-[#F5C518] to-[#FFD54F] animate-pulse">
                <Sparkles className="w-5 h-5 text-gray-800" />
              </motion.div>
              <div>
                <h3 className="font-bold text-lg mb-1 text-[#E5683A]">
                  ✨ Active Subscription
                </h3>
                <p className="text-sm text-[#d94f25]">
                  {subscriptionStatus.activePassEndDate ? (
                    <>
                      Your subscription is active until{" "}
                      <span className="font-bold text-[#E5683A]">
                        {new Date(subscriptionStatus.activePassEndDate).toLocaleDateString()}
                      </span>
                    </>
                  ) : (
                    "You have full access to all features"
                  )}
                </p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => navigate("/subscription")}
                className="gap-2 bg-gradient-to-r from-[#F5C518] via-[#FFD54F] to-[#FFC107] hover:from-[#febc2d] hover:via-[#FFD166] hover:to-[#FFBF00] text-gray-800 font-bold shadow-lg hover:shadow-xl transition-all rounded-2xl"
                data-testid="button-manage-subscription"
              >
                <Sparkles className="w-4 h-4" />
                Manage Subscription
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
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
        className={`mb-4 border-3 rounded-3xl ${
          isLastDays
            ? "bg-gradient-to-r from-[#FFE8CC] to-[#FFF4D6] border-[#E5683A]"
            : "bg-gradient-to-r from-[#FFF8E7] to-[#FFFBF0] border-[#F5C518]"
        }`}
        data-testid="banner-trial"
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <motion.div 
                className={`p-2 rounded-full ${isLastDays ? "bg-gradient-to-br from-[#E5683A] to-[#F5A962]" : "bg-gradient-to-br from-[#F5C518] to-[#FFD54F]"}`}
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Clock className={`w-5 h-5 ${isLastDays ? "text-white" : "text-gray-800"}`} />
              </motion.div>
              <div>
                <h3 className={`font-bold text-lg mb-1 ${isLastDays ? "text-[#E5683A]" : "text-[#E5683A]"}`}>
                  {isLastDays ? "⚠️ Trial Ending Soon!" : "🎉 Free Trial Active"}
                </h3>
                <p className={`text-sm font-semibold ${isLastDays ? "text-[#d94f25]" : "text-[#d94f25]"}`}>
                  {daysRemaining === 1 ? (
                    <>
                      <span className="font-bold">{daysRemaining} day</span> remaining in your free trial!
                    </>
                  ) : daysRemaining === 0 ? (
                    <>Your trial ends <span className="font-bold">today</span></>
                  ) : (
                    <>
                      <span className="font-bold">{daysRemaining} days</span> remaining in your
                      free trial
                    </>
                  )}
                </p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => navigate("/subscription")}
                className={`gap-2 font-bold shadow-lg hover:shadow-xl transition-all rounded-2xl ${
                  isLastDays
                    ? "bg-gradient-to-r from-[#E5683A] to-[#F5A962] hover:from-[#d94f25] hover:to-[#e8915a] text-white"
                    : "bg-gradient-to-r from-[#F5C518] via-[#FFD54F] to-[#FFC107] hover:from-[#febc2d] hover:via-[#FFD166] hover:to-[#FFBF00] text-gray-800"
                }`}
                data-testid="button-view-plans"
              >
                <Sparkles className="w-4 h-4" />
                View Plans
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show subscription required banner if trial expired
  if (subscriptionStatus.status === "expired") {
    return (
      <Card
        className="mb-4 border-3 bg-gradient-to-r from-[#FFE8CC] to-[#FFFBF0] border-[#E5683A] rounded-3xl"
        data-testid="banner-expired"
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <motion.div 
                className="p-2 rounded-full bg-gradient-to-br from-[#E5683A] to-[#F5A962]"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Clock className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h3 className="font-bold text-lg mb-1 text-[#E5683A]">Trial Expired</h3>
                <p className="text-sm font-semibold text-[#d94f25]">
                  Your free trial has ended. Purchase a subscription to continue enjoying TELL MAMMA! 🎉
                </p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => navigate("/subscription")}
                className="gap-2 bg-gradient-to-r from-[#E5683A] to-[#F5A962] hover:from-[#d94f25] hover:to-[#e8915a] text-white font-bold shadow-lg hover:shadow-xl transition-all rounded-2xl"
                data-testid="button-subscribe-now"
              >
                Subscribe Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
