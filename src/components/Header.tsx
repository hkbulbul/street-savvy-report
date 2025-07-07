import { Search, Plus, MapPin, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

const Header = ({ onSearch }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchQuery("");
      onSearch?.("");
    }
  };

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
      <div className="container flex h-16 items-center px-4 justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center" onClick={() => navigate('/')} style={{ cursor: "pointer" }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary mr-2.5">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">StreetSavvy</h1>
            <p className="text-xs text-muted-foreground">Community Road Reports</p>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center flex-1 justify-end space-x-4">
          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                className="pl-10 pr-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
              {searchQuery && (
                <button 
                  className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchQuery("");
                    onSearch?.("");
                  }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              Home
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/about')} 
              className="text-muted-foreground hover:text-foreground"
            >
              About
            </Button>
          </nav>

          {/* Post Issue Button */}
          <Button 
            onClick={() => navigate('/create-post')}
            variant="default" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" />
            Report Issue
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-card border-b shadow-lg p-4 flex flex-col gap-4 md:hidden animate-in slide-in-from-top-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                className="pl-10 pr-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary w-full"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
              {searchQuery && (
                <button 
                  className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchQuery("");
                    onSearch?.("");
                  }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-1">
              <Button 
                variant="ghost" 
                className="justify-start" 
                onClick={() => {
                  navigate('/');
                  setMobileMenuOpen(false);
                }}
              >
                Home
              </Button>
              <Button 
                variant="ghost" 
                className="justify-start" 
                onClick={() => {
                  navigate('/about');
                  setMobileMenuOpen(false);
                }}
              >
                About
              </Button>
              <Button 
                className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground w-full"
                onClick={() => {
                  navigate('/create-post');
                  setMobileMenuOpen(false);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Report Issue
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;