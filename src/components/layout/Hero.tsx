import { Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Category } from "@/lib/interfaces";

// Note: In a production app, these should be handled via a State Management library or Context
export let homeSearchQuery = ""; 
export let selectedCategory: Category = Category.Default;

const HeroSection = () => {
  const navigate = useNavigate();
  const handleSearch = () => navigate('/discover');

  return (
    <section className="bg-gradient-to-br from-primary/10 via-secondary/10 to-background py-20 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
          For Howard Students, By Howard Students
        </Badge>
        <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
          Discover & Support Student Businesses
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Connect with talented entrepreneurs across campus.
        </p>
        
        <div className="flex gap-2 max-w-2xl mx-auto mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search for businesses..." 
              className="pl-10 h-12"
              onChange={(e) => homeSearchQuery = e.target.value}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button size="lg" className="h-12" onClick={handleSearch}>Search</Button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {Object.values(Category).map((cat) => (
            <Link key={cat} to={`/discover`} onClick={() => selectedCategory = cat}>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                {cat}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;