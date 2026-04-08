import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Menu } from "lucide-react";
import bisonLogo from "@/assets/bison-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const Header = () => {
  const { user, isBusinessOwner, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out."
    });
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: "/home", label: "Home" },
    { to: "/discover", label: "Discover" },
    { to: "/community", label: "Community" },
    ...(isBusinessOwner ? [{ to: "/dashboard", label: "Dashboard" }] : []),
    { to: "/profile", label: "Profile" },
  ];

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to={user ? "/home" : "/"} className="flex items-center gap-2">
          <img src={bisonLogo} alt="The Yard Exchange Bison Logo" className="h-8 w-8" />
          <h1 className="text-xl font-bold text-foreground">The Yard Exchange</h1>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {user && navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={isActive(link.to) ? "text-primary font-semibold" : "text-foreground hover:text-primary transition-colors"}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link to="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        {isMobile && (
          user ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 flex flex-col">
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.to}>
                      <Link
                        to={link.to}
                        className={`text-lg px-2 py-2 rounded-md ${isActive(link.to) ? "text-primary font-semibold bg-primary/10" : "text-foreground hover:text-primary"}`}
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <div className="mt-auto mb-8">
                  <SheetClose asChild>
                    <Button variant="outline" className="w-full" onClick={handleSignOut}>Sign Out</Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
          )
        )}
      </div>
    </header>
  );
};

export default Header;
