import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, TrendingUp, MessageCircle, Store } from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  const featuredBusinesses = [
    {
      id: 1,
      name: "StylesByJordan",
      category: "Hair & Beauty",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
      rating: 4.8,
      distance: "0.3 miles",
      promoted: true
    },
    {
      id: 2,
      name: "Campus Threads",
      category: "Clothing",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
      rating: 4.6,
      distance: "0.5 miles",
      promoted: false
    },
    {
      id: 3,
      name: "Tech Tutors HU",
      category: "Services",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop",
      rating: 4.9,
      distance: "0.2 miles",
      promoted: true
    },
    {
      id: 4,
      name: "Bison Bakes",
      category: "Food",
      image: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&h=300&fit=crop",
      rating: 4.7,
      distance: "0.4 miles",
      promoted: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">BisonMarket</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">Home</Link>
            <Link to="/discover" className="text-foreground hover:text-primary transition-colors">Discover</Link>
            <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">Dashboard</Link>
          </nav>
          <Button variant="outline">Sign In</Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/10 to-background py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">For Howard Students, By Howard Students</Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Discover & Support Student Businesses
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with talented entrepreneurs across campus. From hair styling to tech services, find and support your peers.
          </p>
          
          {/* Search Bar */}
          <div className="flex gap-2 max-w-2xl mx-auto mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search for businesses, services, products..." 
                className="pl-10 h-12"
              />
            </div>
            <Button size="lg" className="h-12">Search</Button>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {["Hair & Beauty", "Clothing", "Food", "Tech Services", "Tutoring", "Photography"].map((cat) => (
              <Badge key={cat} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Hotspots & Trending */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-2xl font-bold text-foreground">Trending Now</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            <Card className="min-w-[280px] border-primary/20 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Founders Library</p>
                    <p className="text-sm text-muted-foreground">5 businesses nearby</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="min-w-[280px] hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <Badge className="mb-2 bg-secondary text-secondary-foreground">50% OFF</Badge>
                <p className="font-semibold text-foreground">Weekend Specials</p>
                <p className="text-sm text-muted-foreground">12 deals available</p>
              </CardContent>
            </Card>
            <Card className="min-w-[280px] hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <Badge className="mb-2 bg-accent text-accent-foreground">NEW</Badge>
                <p className="font-semibold text-foreground">Fresh Businesses</p>
                <p className="text-sm text-muted-foreground">3 new this week</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-foreground">Featured Businesses</h3>
            <Link to="/discover">
              <Button variant="ghost">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBusinesses.map((business) => (
              <Link key={business.id} to={`/business/${business.id}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-shadow group cursor-pointer">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={business.image} 
                      alt={business.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {business.promoted && (
                      <Badge className="absolute top-2 right-2 bg-primary">Promoted</Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground">{business.name}</h4>
                        <p className="text-sm text-muted-foreground">{business.category}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-foreground">⭐ {business.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{business.distance}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant CTA */}
      <section className="py-12 px-4 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto max-w-4xl text-center">
          <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-3xl font-bold text-foreground mb-4">Need Help Finding Something?</h3>
          <p className="text-muted-foreground mb-6">
            Our AI assistant can help you discover the perfect business for your needs
          </p>
          <Button size="lg" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat with AI Assistant
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 px-4 mt-12">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 BisonMarket. Supporting Howard University Student Entrepreneurs.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
