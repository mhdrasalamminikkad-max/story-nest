import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import HomePage from "@/pages/HomePage";
import AuthPage from "@/pages/AuthPage";
import ChildLockSetupPage from "@/pages/ChildLockSetupPage";
import ParentDashboard from "@/pages/ParentDashboard";
import ChildModeSelectionPage from "@/pages/ChildModeSelectionPage";
import ChildModeReadPage from "@/pages/ChildModeReadPage";
import AdminPanel from "@/pages/AdminPanel";
import SubscriptionPage from "@/pages/SubscriptionPage";
import PaymentPage from "@/pages/PaymentPage";
import Subscription from "@/pages/subscription";
import StoriesPage from "@/pages/StoriesPage";
import LibraryPage from "@/pages/LibraryPage";
import CheckpointsPage from "@/pages/CheckpointsPage";
import NotFound from "@/pages/not-found";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function Router() {
  const [, setLocation] = useLocation();
  const [keySequence, setKeySequence] = useState("");
  const [showAdminPasswordDialog, setShowAdminPasswordDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "Enter") {
        // Check if the sequence matches the admin code
        if (keySequence === "786786") {
          setShowAdminPasswordDialog(true);
          setKeySequence("");
        } else {
          setKeySequence("");
        }
      } else if (e.key.length === 1 && /[0-9]/.test(e.key)) {
        // Only track numeric keys
        setKeySequence((prev) => {
          const newSequence = prev + e.key;
          // Keep only last 6 digits
          return newSequence.slice(-6);
        });
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [keySequence]);

  const handleAdminPasswordSubmit = () => {
    if (adminPassword === "caliph786786") {
      setShowAdminPasswordDialog(false);
      setAdminPassword("");
      setLocation("/admin");
    } else {
      toast({
        title: "Incorrect Password",
        description: "The admin password you entered is incorrect.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/setup" component={ChildLockSetupPage} />
        <Route path="/dashboard" component={ParentDashboard} />
        <Route path="/child-mode" component={ChildModeSelectionPage} />
        <Route path="/child-mode-read" component={ChildModeReadPage} />
        <Route path="/admin" component={AdminPanel} />
        <Route path="/pricing" component={SubscriptionPage} />
        <Route path="/payment" component={PaymentPage} />
        <Route path="/subscription" component={Subscription} />
        <Route path="/stories" component={StoriesPage} />
        <Route path="/library" component={LibraryPage} />
        <Route path="/checkpoints" component={CheckpointsPage} />
        <Route component={NotFound} />
      </Switch>

      <Dialog open={showAdminPasswordDialog} onOpenChange={setShowAdminPasswordDialog}>
        <DialogContent className="rounded-3xl" data-testid="dialog-admin-password">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Admin Access</DialogTitle>
            <DialogDescription>
              Please enter the admin password to access the admin panel
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAdminPasswordSubmit();
                }
              }}
              className="rounded-2xl"
              data-testid="input-admin-password"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAdminPasswordDialog(false);
                setAdminPassword("");
              }}
              className="rounded-2xl"
              data-testid="button-cancel-admin-password"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdminPasswordSubmit}
              className="rounded-2xl"
              data-testid="button-submit-admin-password"
            >
              Access Admin Panel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
