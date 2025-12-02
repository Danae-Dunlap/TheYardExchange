import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import bisonLogo from "@/assets/bison-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const { user, isBusinessOwner, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out."
    });
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2">
          <img src={bisonLogo} alt="The Yard Exchange Bison Logo" className="h-8 w-8" />
          <h1 className="text-xl font-bold text-foreground">The Yard Exchange</h1>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/home" 
            className={isActive("/home") ? "text-primary font-semibold" : "text-foreground hover:text-primary transition-colors"}
          >
            Home
          </Link>
          <Link 
            to="/discover" 
            className={isActive("/discover") ? "text-primary font-semibold" : "text-foreground hover:text-primary transition-colors"}
          >
            Discover
          </Link>
          {isBusinessOwner && (
            <Link 
              to="/dashboard" 
              className={isActive("/dashboard") ? "text-primary font-semibold" : "text-foreground hover:text-primary transition-colors"}
            >
              Dashboard
            </Link>
          )}
          <Link 
            to="/profile" 
            className={isActive("/profile") ? "text-primary font-semibold" : "text-foreground hover:text-primary transition-colors"}
          >
            Profile
          </Link>
        </nav>
        {user ? (
          <div className="flex items-center gap-2">
            <Link to="/profile">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
          </div>
        ) : (
          <Link to="/">
            <Button variant="outline">Sign In</Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
