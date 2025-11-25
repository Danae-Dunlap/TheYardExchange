import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, Phone, Mail, MessageCircle, 
  Clock, Star, DollarSign, Calendar, Share2,
  Flag, Heart, ChevronLeft, LayoutDashboard
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import bisonLogo from "@/assets/bison-logo.png";

const BusinessDetail = () => {
  const navigate = useNavigate();
  
  const business = {
    name: "StylesByJordan",
    category: "Hair & Beauty",
    owner: "Jordan Smith",
    description: "Professional braiding, silk press, and natural hair care services. Specializing in protective styles and healthy hair maintenance for all hair types.",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=500&fit=crop",
    rating: 4.8,
    reviews: 124,
    distance: "0.3 miles",
    priceRange: "$$",
    location: "Near Founders Library",
    phone: "(202) 555-0123",
    email: "stylesbyjordan@email.com",
    hours: "Mon-Sat: 9AM-7PM, Sun: Closed",
    deal: "20% off first visit"
  };

  const services = [
    { name: "Box Braids", price: "$150-200", duration: "3-4 hours" },
    { name: "Silk Press", price: "$80-120", duration: "2-3 hours" },
    { name: "Knotless Braids", price: "$180-250", duration: "4-5 hours" },
    { name: "Natural Hair Care", price: "$60-100", duration: "1-2 hours" }
  ];

  const reviews = [
    {
      id: 1,
      author: "Sarah M.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      rating: 5,
      date: "2 days ago",
      text: "Amazing service! Jordan is so talented and professional. My braids lasted for weeks and looked perfect."
    },
    {
      id: 2,
      author: "Marcus T.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      rating: 5,
      date: "1 week ago",
      text: "Best silk press I've ever gotten! Will definitely be coming back."
    },
    {
      id: 3,
      author: "Tasha W.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      rating: 4,
      date: "2 weeks ago",
      text: "Great experience overall. Very clean workspace and friendly atmosphere."
    }
  ];

  const upcomingEvents = [
    {
      title: "Spring Hair Care Workshop",
      date: "March 15, 2024",
      description: "Learn protective styling techniques and hair care tips"
    },
    {
      title: "Pop-up at Campus Event",
      date: "March 22, 2024",
      description: "Special campus pricing and quick styles available"
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
            <Link to="/discover" className="text-foreground hover:text-primary transition-colors">Discover</Link>
            <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">Dashboard</Link>
          </nav>
          <Button variant="outline">Sign In</Button>
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/discover">Discover</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{business.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Link to="/dashboard">
            <Button className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-[400px] overflow-hidden">
        <img 
          src={business.image} 
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8">
          {business.deal && (
            <Badge className="mb-4 bg-secondary text-secondary-foreground">
              🎉 {business.deal}
            </Badge>
          )}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{business.name}</h1>
              <div className="flex items-center gap-4 text-foreground/90 mb-2">
                <Badge variant="outline">{business.category}</Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-semibold">{business.rating}</span>
                  <span className="text-muted-foreground">({business.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{business.distance}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>

              <TabsContent value="about">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4">About</h3>
                    <p className="text-muted-foreground mb-6">{business.description}</p>
                    
                    <Separator className="my-6" />
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Location</p>
                          <p className="text-sm text-muted-foreground">{business.location}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Hours</p>
                          <p className="text-sm text-muted-foreground">{business.hours}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Price Range</p>
                          <p className="text-sm text-muted-foreground">{business.priceRange}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4">Services</h3>
                    <div className="space-y-4">
                      {services.map((service, index) => (
                        <div key={index} className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                          <div>
                            <p className="font-medium text-foreground">{service.name}</p>
                            <p className="text-sm text-muted-foreground">{service.duration}</p>
                          </div>
                          <p className="font-semibold text-foreground">{service.price}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage src={review.avatar} />
                            <AvatarFallback>{review.author[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-foreground">{review.author}</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex">
                                    {[...Array(review.rating)].map((_, i) => (
                                      <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                                    ))}
                                  </div>
                                  <span className="text-sm text-muted-foreground">{review.date}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-muted-foreground">{review.text}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="events">
                <div className="space-y-4">
                  {upcomingEvents.map((event, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground mb-1">{event.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{event.date}</p>
                            <p className="text-sm text-foreground">{event.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Contact Business</h3>
                <div className="space-y-3 mb-6">
                  <Button className="w-full gap-2" size="lg">
                    <MessageCircle className="h-4 w-4" />
                    Message Owner
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <Phone className="h-4 w-4" />
                    Call
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-3">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <MapPin className="h-4 w-4" />
                    Get Directions
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
                    <Flag className="h-4 w-4" />
                    Report Business
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-2">Business Owner?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Claim this listing to access AI insights and manage your business
                </p>
                <Button variant="outline" className="w-full">Claim Business</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
