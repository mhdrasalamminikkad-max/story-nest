import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ParentSettings } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft, Lock, User, Clock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const settingsSchema = z.object({
  childName: z.string().min(1, "Child name is required"),
  readingTimeLimit: z.coerce.number().min(5, "Must be at least 5 minutes").max(120, "Must be 120 minutes or less"),
  theme: z.enum(["light", "dark"]),
  fullscreenLockEnabled: z.boolean(),
});

const pinChangeSchema = z.object({
  currentPin: z.string().length(4, "PIN must be 4 digits").regex(/^\d+$/, "PIN must contain only digits"),
  newPin: z.string().length(4, "PIN must be 4 digits").regex(/^\d+$/, "PIN must contain only digits"),
  confirmPin: z.string().length(4, "PIN must be 4 digits"),
}).refine((data) => data.newPin === data.confirmPin, {
  message: "PINs do not match",
  path: ["confirmPin"],
});

type SettingsFormData = z.infer<typeof settingsSchema>;
type PinChangeData = z.infer<typeof pinChangeSchema>;

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const { data: settings, isLoading } = useQuery<ParentSettings>({
    queryKey: ["/api/parent-settings"],
  });

  const settingsForm = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      childName: settings?.childName || "",
      readingTimeLimit: settings?.readingTimeLimit || 30,
      theme: settings?.theme || "light",
      fullscreenLockEnabled: settings?.fullscreenLockEnabled || false,
    },
    values: {
      childName: settings?.childName || "",
      readingTimeLimit: settings?.readingTimeLimit || 30,
      theme: settings?.theme || "light",
      fullscreenLockEnabled: settings?.fullscreenLockEnabled || false,
    },
  });

  const pinForm = useForm<PinChangeData>({
    resolver: zodResolver(pinChangeSchema),
    defaultValues: {
      currentPin: "",
      newPin: "",
      confirmPin: "",
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const res = await apiRequest("PATCH", "/api/parent-settings", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully",
        duration: 4000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/parent-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update settings",
        description: error?.message || "Something went wrong",
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  const changePinMutation = useMutation({
    mutationFn: async (data: PinChangeData) => {
      const res = await apiRequest("POST", "/api/change-pin", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "PIN changed",
        description: "Your PIN has been changed successfully",
        duration: 4000,
      });
      pinForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to change PIN",
        description: error?.message || "Invalid current PIN",
        variant: "destructive",
        duration: 4000,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent">
            Settings
          </h1>
        </div>

        {/* General Settings Card */}
        <Card className="mb-6 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              General Settings
            </CardTitle>
            <CardDescription>Update your child's name and reading preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...settingsForm}>
              <form
                onSubmit={settingsForm.handleSubmit((data) => updateSettingsMutation.mutate(data))}
                className="space-y-4"
              >
                <FormField
                  control={settingsForm.control}
                  name="childName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Child's Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your child's name"
                          {...field}
                          data-testid="input-child-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={settingsForm.control}
                  name="readingTimeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Reading Time Limit (minutes)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="5"
                          max="120"
                          {...field}
                          data-testid="input-reading-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={settingsForm.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-theme">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="light">Light Mode</SelectItem>
                          <SelectItem value="dark">Dark Mode</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={settingsForm.control}
                  name="fullscreenLockEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Fullscreen Lock in Child Mode</FormLabel>
                        <p className="text-sm text-muted-foreground">Require PIN to exit child mode</p>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          data-testid="checkbox-fullscreen-lock"
                          className="w-5 h-5"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="rounded-full w-full"
                  data-testid="button-save-settings"
                >
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Change PIN Card */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Child Lock PIN
            </CardTitle>
            <CardDescription>Change your 4-digit PIN for child mode access</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...pinForm}>
              <form
                onSubmit={pinForm.handleSubmit((data) => changePinMutation.mutate(data))}
                className="space-y-4"
              >
                <FormField
                  control={pinForm.control}
                  name="currentPin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current PIN</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showCurrentPin ? "text" : "password"}
                            placeholder="••••"
                            maxLength={4}
                            {...field}
                            data-testid="input-current-pin"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPin(!showCurrentPin)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pinForm.control}
                  name="newPin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New PIN</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showNewPin ? "text" : "password"}
                            placeholder="••••"
                            maxLength={4}
                            {...field}
                            data-testid="input-new-pin"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPin(!showNewPin)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={pinForm.control}
                  name="confirmPin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm PIN</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPin ? "text" : "password"}
                            placeholder="••••"
                            maxLength={4}
                            {...field}
                            data-testid="input-confirm-pin"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPin(!showConfirmPin)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          >
                            {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={changePinMutation.isPending}
                  className="rounded-full w-full"
                  data-testid="button-change-pin"
                >
                  {changePinMutation.isPending ? "Changing PIN..." : "Change PIN"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
