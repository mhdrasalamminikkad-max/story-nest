import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Music2 } from "lucide-react";
import { useLocation } from "wouter";

export default function RhymesPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground />
      
      <div className="relative z-10">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/")}
                className="rounded-xl"
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Music2 className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Rhymes</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 py-12">
          <Card className="p-12 text-center max-w-2xl mx-auto">
            <div className="space-y-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Music2 className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold">Rhymes Coming Soon!</h2>
              <p className="text-lg text-muted-foreground">
                We're working on bringing you delightful nursery rhymes and songs. 
                Check back soon for wonderful musical content!
              </p>
              <Button
                onClick={() => setLocation("/")}
                className="rounded-xl"
                data-testid="button-back-to-home"
              >
                Back to Home
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
