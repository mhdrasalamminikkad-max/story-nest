import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Check, CreditCard, Shield, Lock, Coins } from "lucide-react";
import { motion } from "framer-motion";
import type { PublicSubscriptionPlan, ParentSettings } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  const [planId, setPlanId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("planId");
    setPlanId(id);
  }, []);

  const { data: plans = [] } = useQuery<PublicSubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  const { data: parentSettings } = useQuery<ParentSettings>({
    queryKey: ["/api/parent-settings"],
    enabled: !!user,
  });

  const { data: planCoinCosts = [] } = useQuery<Array<{ id: string; planId: string; coinCost: number }>>({
    queryKey: ["/api/plan-coin-costs"],
  });

  const selectedPlan = plans.find(p => p.id === planId);
  const planCoinCost = planCoinCosts.find(c => c.planId === planId);
  const userCoins = parentSettings?.coins || 0;

  const purchaseWithCoinsMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiRequest("POST", "/api/subscriptions/purchase-with-coins", { planId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent-settings"] });
      toast({
        title: "Purchase Successful!",
        description: "Your subscription has been activated.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      const errorData = error?.message || "Failed to purchase plan";
      toast({
        title: "Purchase Failed",
        description: errorData,
        variant: "destructive",
      });
    },
  });

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      weekly: "/week",
      monthly: "/month",
      yearly: "/year",
      lifetime: "one-time"
    };
    return labels[period] || "";
  };

  if (!selectedPlan && planId) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10">
          <header className="container mx-auto px-4 py-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setLocation("/pricing")}
              className="rounded-2xl"
              data-testid="button-back-pricing"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Plans
            </Button>
            <ThemeToggle />
          </header>
          <main className="container mx-auto px-4 py-16">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Loading plan details...</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10">
          <header className="container mx-auto px-4 py-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setLocation("/pricing")}
              className="rounded-2xl"
              data-testid="button-back-pricing"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Plans
            </Button>
            <ThemeToggle />
          </header>
          <main className="container mx-auto px-4 py-16">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No plan selected. Please choose a plan first.</p>
                <Button 
                  onClick={() => setLocation("/pricing")}
                  className="mt-4 rounded-2xl"
                  data-testid="button-choose-plan"
                >
                  Choose a Plan
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation("/pricing")}
            className="rounded-2xl"
            data-testid="button-back-pricing"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>
          <ThemeToggle />
        </header>

        <main className="container mx-auto px-4 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center py-8">
              <h1 className="font-heading text-3xl md:text-4xl mb-2 text-foreground">
                Complete Your Purchase
              </h1>
              <p className="text-muted-foreground">
                You're one step away from unlimited bedtime stories!
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-xl">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4 pb-4 border-b">
                      <div>
                        <p className="font-medium">{selectedPlan.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                      </div>
                      {selectedPlan.billingPeriod === "yearly" && (
                        <Badge variant="default">Best Value</Badge>
                      )}
                    </div>
                    
                    <ul className="space-y-2">
                      {selectedPlan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-4 border-t">
                      <div className="flex items-baseline justify-between">
                        <span className="text-muted-foreground">Total</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-foreground">
                            ₹{selectedPlan.price}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {getPeriodLabel(selectedPlan.billingPeriod)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>Secure payment processing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Your data is protected</span>
                  </div>
                </div>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-xl">Payment Details</CardTitle>
                    <CardDescription>
                      Choose your payment method
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {planCoinCost && planCoinCost.coinCost > 0 && (
                      <div className="bg-primary/5 rounded-2xl p-6 border-2 border-primary/20 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <Coins className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">Pay with Coins</p>
                              <p className="text-sm text-muted-foreground">Instant activation</p>
                            </div>
                          </div>
                          <Badge variant="default" className="text-lg px-3 py-1">
                            {planCoinCost.coinCost} <Coins className="w-4 h-4 ml-1 inline" />
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-primary/20">
                          <span className="text-sm text-muted-foreground">Your Balance:</span>
                          <span className="font-bold text-lg flex items-center gap-1">
                            {userCoins} <Coins className="w-5 h-5 text-primary" />
                          </span>
                        </div>

                        {userCoins < planCoinCost.coinCost && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                            <p className="text-sm text-destructive font-medium">
                              Insufficient coins. Need {planCoinCost.coinCost - userCoins} more.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-muted/50 rounded-2xl p-6 text-center space-y-4">
                      <CreditCard className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium mb-2">Payment Gateway Integration</p>
                        <p className="text-sm text-muted-foreground">
                          Connect Stripe, Razorpay, or another payment provider to accept payments.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                    {planCoinCost && planCoinCost.coinCost > 0 && (
                      <Button
                        className="w-full rounded-2xl"
                        size="lg"
                        onClick={() => purchaseWithCoinsMutation.mutate(planId!)}
                        disabled={!user || userCoins < planCoinCost.coinCost || purchaseWithCoinsMutation.isPending}
                        data-testid="button-pay-with-coins"
                      >
                        {purchaseWithCoinsMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-background border-t-transparent rounded-full mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Coins className="w-4 h-4 mr-2" />
                            Pay with {planCoinCost.coinCost} Coins
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full rounded-2xl"
                      size="lg"
                      disabled
                      data-testid="button-proceed-payment"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay with Card (Coming Soon)
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full rounded-2xl"
                      onClick={() => setLocation("/pricing")}
                      data-testid="button-change-plan"
                    >
                      Change Plan
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
