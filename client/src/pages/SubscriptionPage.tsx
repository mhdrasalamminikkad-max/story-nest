import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Check, ArrowLeft, Coins, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { PublicSubscriptionPlan, PublicCoinPackage } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

export default function SubscriptionPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: plans = [], isLoading: plansLoading } = useQuery<PublicSubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  const { data: coinPackages = [], isLoading: packagesLoading } = useQuery<PublicCoinPackage[]>({
    queryKey: ["/api/coin-packages"],
  });

  const isLoading = plansLoading || packagesLoading;

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      weekly: "/week",
      monthly: "/month",
      yearly: "/year",
      lifetime: "one-time"
    };
    return labels[period] || "";
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation(user ? "/dashboard" : "/")}
            className="rounded-2xl"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {user ? "Back to Dashboard" : "Back to Home"}
          </Button>
          <ThemeToggle />
        </header>

        <main className="container mx-auto px-4 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-12"
          >
            <h1 className="font-heading text-4xl md:text-5xl mb-4 text-foreground">
              Choose Your Plan
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Unlock unlimited bedtime stories and premium features for your family
            </p>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" data-testid="loading-spinner" />
              </div>
            ) : plans.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground" data-testid="text-no-plans">
                    No subscription plans available at the moment. Please check back later!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
                {plans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="h-full flex flex-col" data-testid={`card-plan-${index}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                          <CardTitle className="font-heading text-2xl">{plan.name}</CardTitle>
                          {plan.billingPeriod === "yearly" && (
                            <Badge variant="default">Best Value</Badge>
                          )}
                        </div>
                        <CardDescription className="text-base">{plan.description}</CardDescription>
                        <div className="pt-4">
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-foreground" data-testid={`text-price-${index}`}>
                              ₹{plan.price}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {getPeriodLabel(plan.billingPeriod)}
                            </span>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1">
                        <ul className="space-y-3">
                          {plan.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-start gap-2" data-testid={`feature-${index}-${featureIndex}`}>
                              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                          {plan.maxStories && (
                            <li className="flex items-start gap-2">
                              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-muted-foreground">
                                Up to {plan.maxStories} stories
                              </span>
                            </li>
                          )}
                        </ul>
                      </CardContent>

                      <CardFooter>
                        <Button
                          className="w-full rounded-2xl"
                          size="lg"
                          onClick={() => {
                            setLocation(`/payment?planId=${plan.id}`);
                          }}
                          data-testid={`button-subscribe-${index}`}
                        >
                          Get Started
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Coin Packages Section */}
            {!isLoading && coinPackages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-20"
              >
                <div className="text-center mb-12">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Coins className="w-8 h-8 text-primary" />
                    <h2 className="font-heading text-3xl md:text-4xl text-foreground">
                      Buy Coins
                    </h2>
                  </div>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Purchase coins to unlock subscription plans or use them for premium features
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
                  {coinPackages.map((pkg, index) => (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: (plans.length + index) * 0.1 }}
                    >
                      <Card className="h-full flex flex-col" data-testid={`card-coin-package-${index}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                            <CardTitle className="font-heading text-2xl">{pkg.name}</CardTitle>
                            {pkg.coins >= 500 && (
                              <Badge variant="default">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-base">{pkg.description}</CardDescription>
                          <div className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-foreground" data-testid={`text-coin-price-${index}`}>
                                  ₹{pkg.price}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 bg-primary/10 rounded-2xl px-3 py-1.5">
                                <Coins className="w-5 h-5 text-primary" />
                                <span className="text-lg font-bold text-primary" data-testid={`text-coin-amount-${index}`}>
                                  {pkg.coins}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="flex-1">
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Use coins to:
                            </p>
                            <ul className="space-y-2">
                              <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-muted-foreground">Purchase subscription plans</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-muted-foreground">Unlock premium features</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-muted-foreground">Never expire</span>
                              </li>
                            </ul>
                          </div>
                        </CardContent>

                        <CardFooter>
                          <Button
                            className="w-full rounded-2xl"
                            size="lg"
                            variant="outline"
                            onClick={() => {
                              setLocation(`/payment?coinPackageId=${pkg.id}`);
                            }}
                            data-testid={`button-buy-coins-${index}`}
                          >
                            <Coins className="w-4 h-4 mr-2" />
                            Buy Now
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
