import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Coins, Clock, Check, Sparkles, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRazorpay, RazorpayOrderOptions } from "react-razorpay";

interface CoinPackage {
  id: string;
  name: string;
  description: string;
  coins: number;
  price: string;
  currency: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  billingPeriod: string;
  features: string[];
  maxStories?: number;
}

interface PlanCoinCost {
  id: string;
  planId: string;
  coinCost: number;
}

interface SubscriptionStatus {
  status: string;
  trialDaysRemaining?: number;
  hasActivePass: boolean;
  activePassEndDate?: number;
  coins: number;
}

export default function SubscriptionPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { Razorpay } = useRazorpay();
  const [selectedCoinPackage, setSelectedCoinPackage] = useState<string | null>(null);

  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
  });

  const { data: coinPackages = [] } = useQuery<CoinPackage[]>({
    queryKey: ["/api/coin-packages"],
  });

  const { data: plans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans/public"],
  });

  const { data: planCosts = [] } = useQuery<PlanCoinCost[]>({
    queryKey: ["/api/plan-coin-costs"],
  });

  const purchaseCoinsMutation = useMutation({
    mutationFn: async (coinPackageId: string) => {
      const response = await apiRequest("POST", "/api/razorpay/create-order", { coinPackageId });
      return response.json();
    },
    onSuccess: (data) => {
      handleRazorpayPayment(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest("POST", "/api/razorpay/verify-payment", paymentData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Successful!",
        description: `${data.coinsAdded} coins added to your account. Total: ${data.totalCoins} coins`,
        duration: 4000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parent-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  const redeemPassMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/subscriptions/purchase-with-coins", { planId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pass Activated!",
        description: "Your subscription pass has been activated successfully.",
        duration: 4000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parent-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Redemption Failed",
        description: error.message,
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  const handleRazorpayPayment = (orderData: any) => {
    if (!process.env.VITE_RAZORPAY_KEY_ID) {
      toast({
        title: "Configuration Error",
        description: "Payment system not configured",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    const options: RazorpayOrderOptions = {
      key: process.env.VITE_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "StoryNest",
      description: `Purchase ${orderData.coinPackage.coins} coins`,
      order_id: orderData.orderId,
      handler: (response: any) => {
        verifyPaymentMutation.mutate({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          coinPackageId: orderData.coinPackage.id,
        });
      },
      theme: {
        color: "#8B5CF6",
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  };

  const getPlanCost = (planId: string): number => {
    const cost = planCosts.find((c) => c.planId === planId);
    return cost?.coinCost || 0;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Subscription & Coins</h1>
          <p className="text-muted-foreground">
            Manage your subscription, buy coins, and redeem passes
          </p>
        </div>

        {subscriptionStatus && (
          <Card className="mb-6 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                Your Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Subscription Status</p>
                  <p className="text-lg font-semibold capitalize">{subscriptionStatus.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Coin Balance</p>
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-500" />
                    <p className="text-lg font-semibold">{subscriptionStatus.coins}</p>
                  </div>
                </div>
              </div>

              {subscriptionStatus.status === "trial" && subscriptionStatus.trialDaysRemaining !== undefined && (
                <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-md border border-blue-500/20">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <p className="text-sm">
                    <span className="font-semibold">{subscriptionStatus.trialDaysRemaining} days</span> remaining in your free trial
                  </p>
                </div>
              )}

              {subscriptionStatus.hasActivePass && subscriptionStatus.activePassEndDate && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-md border border-green-500/20">
                  <Check className="w-4 h-4 text-green-500" />
                  <p className="text-sm">
                    Active until <span className="font-semibold">{formatDate(subscriptionStatus.activePassEndDate)}</span>
                  </p>
                </div>
              )}

              {subscriptionStatus.status === "expired" && (
                <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
                  <p className="text-sm text-destructive">
                    Your trial has expired. Purchase coins and redeem a pass to continue using StoryNest.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Coins className="w-6 h-6 text-amber-500" />
              Buy Coins
            </h2>
            <div className="grid gap-4">
              {coinPackages.map((pkg) => (
                <Card key={pkg.id} className="hover-elevate" data-testid={`card-coinpackage-${pkg.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <CardDescription>{pkg.description}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-lg">
                      <Coins className="w-4 h-4 mr-1" />
                      {pkg.coins}
                    </Badge>
                  </CardHeader>
                  <CardFooter className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-2xl font-bold">
                      ₹{pkg.price}
                    </span>
                    <Button
                      onClick={() => purchaseCoinsMutation.mutate(pkg.id)}
                      disabled={purchaseCoinsMutation.isPending}
                      data-testid={`button-buy-coins-${pkg.id}`}
                    >
                      {purchaseCoinsMutation.isPending && selectedCoinPackage === pkg.id
                        ? "Processing..."
                        : "Buy Now"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Redeem Passes</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Use your coins to activate time-based passes
            </p>
            <div className="grid gap-4">
              {plans.map((plan) => {
                const coinCost = getPlanCost(plan.id);
                const hasEnoughCoins = (subscriptionStatus?.coins || 0) >= coinCost;

                return (
                  <Card key={plan.id} className="hover-elevate" data-testid={`card-plan-${plan.id}`}>
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <CardTitle>{plan.name}</CardTitle>
                          <CardDescription>{plan.description}</CardDescription>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {plan.billingPeriod}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-amber-500" />
                        <span className="text-xl font-bold">{coinCost}</span>
                      </div>
                      <Button
                        onClick={() => redeemPassMutation.mutate(plan.id)}
                        disabled={!hasEnoughCoins || redeemPassMutation.isPending}
                        data-testid={`button-redeem-${plan.id}`}
                      >
                        {!hasEnoughCoins ? "Insufficient Coins" : "Redeem Pass"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
