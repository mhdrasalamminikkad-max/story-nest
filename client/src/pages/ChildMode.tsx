import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, LogOut } from "lucide-react";

export default function ChildMode() {
  const [password, setPassword] = useState("");
  const [isExiting, setIsExiting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Enter Child Mode on mount
    if (window.Capacitor && window.Capacitor.Plugins.Device) {
      console.log("Entering Child Mode (Android)");
      // Custom JS interface for Android
      if (window.androidChildMode) {
        window.androidChildMode.enterChildMode();
      }
    }
    
    // Electron Kiosk entry would go here
    if (window.electronAPI) {
      window.electronAPI.enterChildMode();
    }

    // Block keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common exit shortcuts
      if ((e.altKey && e.key === 'F4') || (e.ctrlKey && e.key === 'w')) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleExit = () => {
    if (password === "1234") {
      if (window.androidChildMode) {
        window.androidChildMode.exitChildMode(password);
      }
      if (window.electronAPI) {
        window.electronAPI.exitChildMode(password);
      }
      toast({
        title: "Exiting Child Mode",
        description: "Returning to normal operation.",
      });
      // Redirect or handle exit
      window.location.href = "/";
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Password",
        description: "Please enter the correct parent password.",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center p-4 z-[9999]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Child Mode Active</CardTitle>
          <p className="text-muted-foreground">
            The app is locked. Parental supervision required to exit.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isExiting ? (
            <Button 
              className="w-full h-12 text-lg" 
              onClick={() => setIsExiting(true)}
              data-testid="button-exit-request"
            >
              Exit Child Mode
            </Button>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Enter Parent Password</label>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExit()}
                  className="h-12"
                  autoFocus
                  data-testid="input-parent-password"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsExiting(false)}
                  data-testid="button-cancel-exit"
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleExit}
                  data-testid="button-confirm-exit"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Exit
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
