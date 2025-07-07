import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center px-4">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <div className="h-4 w-4 rounded-full bg-primary-foreground"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">ShittyRoads</h1>
            <p className="text-xs text-muted-foreground">Community Road Reports</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 mx-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Post Issue Button */}
        <Button 
          variant="default" 
          className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Post Issue
        </Button>
      </div>
    </header>
  );
};

export default Header;