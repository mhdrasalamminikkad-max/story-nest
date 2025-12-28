import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";
import tellMammaLogo from "@assets/ic_launcher_1766900793361.png";

interface MobileHeaderProps {
  title?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

export function MobileHeader({ title, showSearch = false, onSearch }: MobileHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <header className="md:hidden sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border z-40">
      <div className="flex items-center justify-between px-4 h-14">
        {title ? (
          <h1 className="font-heading text-xl font-bold text-foreground">{title}</h1>
        ) : (
          <img 
            src={tellMammaLogo} 
            alt="TELL MAMMA" 
            className="h-10 w-auto object-contain rounded-xl"
          />
        )}
        <ThemeToggle />
      </div>
      {showSearch && (
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 rounded-full"
              data-testid="input-search"
            />
          </div>
        </div>
      )}
    </header>
  );
}
