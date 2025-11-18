import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MapPin, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import bisonLogo from "@/assets/bison-logo.png";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Discover = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const businesses = [
    {
      id: 1,
      name: "StylesByJordan",
      category: "Hair & Beauty",
      description: "Professional braiding, silk press, and natural hair care",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
      rating: 4.8,
      reviews: 124,
      distance: "0.3 miles",
      priceRange: "$$",
      promoted: true,
      deal: "20% off first visit"
    },
    {
      id: 2,
      name: "Campus Threads",
      category: "Clothing",
      description: "Custom Howard apparel and streetwear designs",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
      rating: 4.6,
      reviews: 89,
      distance: "0.5 miles",
      priceRange: "$$",
      promoted: false
    },
    {
      id: 3,
      name: "Tech Tutors HU",
      category: "Services",
      description: "Computer science, coding, and tech help",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop",
      rating: 4.9,
      reviews: 156,
      distance: "0.2 miles",
      priceRange: "$",
      promoted: true
    },
    {
      id: 4,
      name: "Bison Bakes",
      category: "Food",
      description: "Fresh baked goods and custom cakes",
      image: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&h=300&fit=crop",
      rating: 4.7,
      reviews: 203,
      distance: "0.4 miles",
      priceRange: "$",
      promoted: false,
      deal: "Buy 2 get 1 free"
    },
    {
      id: 5,
      name: "HU Photography",
      category: "Photography",
      description: "Portraits, events, and graduation photos",
      image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=300&fit=crop",
      rating: 4.8,
      reviews: 67,
      distance: "0.6 miles",
      priceRange: "$$"
    },
    {
      id: 6,
      name: "Study Buddy Tutoring",
      category: "Tutoring",
      description: "Math, science, and writing tutoring services",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop",
      rating: 4.9,
      reviews: 142,
      distance: "0.1 miles",
      priceRange: "$"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={bisonLogo} alt="The Yard Exchange Bison Logo" className="h-8 w-8" />
            <h1 className="text-xl font-bold text-foreground">The Yard Exchange</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">Home</Link>
            <Link to="/discover" className="text-primary font-semibold">Discover</Link>
            <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">Dashboard</Link>
          </nav>
          <Button variant="outline">Sign In</Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search businesses, services, products..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="hair">Hair & Beauty</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="tutoring">Tutoring</SelectItem>
                </SelectContent>
              </Select>
              
              <Select defaultValue="distance">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Nearest</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="cursor-pointer">
              Near Me <span className="ml-1">×</span>
            </Badge>
            <Badge variant="secondary" className="cursor-pointer">
              Deals Available <span className="ml-1">×</span>
            </Badge>
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Discover Businesses</h2>
          <p className="text-muted-foreground">{businesses.length} businesses found</p>
        </div>

        {/* Business Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {businesses.map((business) => (
            <Link key={business.id} to={`/business/${business.id}`}>
              <Card className="overflow-hidden hover:shadow-xl transition-all group cursor-pointer h-full">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={business.image} 
                    alt={business.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {business.promoted && (
                    <Badge className="absolute top-2 left-2 bg-primary">Promoted</Badge>
                  )}
                  {business.deal && (
                    <Badge className="absolute top-2 right-2 bg-secondary">
                      {business.deal}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="mb-3">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-foreground text-lg">{business.name}</h3>
                      <span className="text-sm font-semibold text-foreground ml-2">⭐ {business.rating}</span>
                    </div>
                    <Badge variant="outline" className="text-xs mb-2">{business.category}</Badge>
                    <p className="text-sm text-muted-foreground line-clamp-2">{business.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{business.distance}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{business.priceRange}</span>
                      <span>•</span>
                      <span>{business.reviews} reviews</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* AI Recommendations */}
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Get Personalized Recommendations</h3>
            <p className="text-muted-foreground mb-4">
              Our AI learns from your preferences to suggest businesses you'll love
            </p>
            <Button>Enable Smart Recommendations</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Discover;
