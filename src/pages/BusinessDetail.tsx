import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, Phone, Mail, MessageCircle,
  Clock, Star, DollarSign, Calendar, Share2,
  Flag, Heart, ChevronLeft, LayoutDashboard
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ReviewSummary } from "@/components/ui/review-summary";
import { ReviewList } from "@/components/ui/review-list";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBusiness, calculateAverageRating, fetchReview } from "@/lib/data/utils";
import type { Business } from "@/lib/interfaces";
import bisonLogo from "@/assets/bison-logo.png";

const services = [
  { name: "Box Braids", price: "$150-200", duration: "3-4 hours" },
  { name: "Silk Press", price: "$80-120", duration: "2-3 hours" },
  { name: "Knotless Braids", price: "$180-250", duration: "4-5 hours" },
  { name: "Natural Hair Care", price: "$60-100", duration: "1-2 hours" }
];

const businessHours = [
  { day: "Monday", hours: "9:00 AM - 6:00 PM" },
  { day: "Tuesday", hours: "9:00 AM - 6:00 PM" },
  { day: "Wednesday", hours: "9:00 AM - 6:00 PM" },
  { day: "Thursday", hours: "9:00 AM - 8:00 PM" },
  { day: "Friday", hours: "9:00 AM - 8:00 PM" },
  { day: "Saturday", hours: "10:00 AM - 5:00 PM" },
  { day: "Sunday", hours: "Closed" },
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

const BusinessDetail = () => {
  const navigate = useNavigate();
  const { id: businessId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const loadBusiness = async () => {
      setLoading(true);
      try {
        const data = await fetchBusiness({ id: businessId });
        if (data && data.length > 0) {
          setBusiness(data[0]);
        }
        const [rating, reviews] = await Promise.all([
          calculateAverageRating(businessId),
          fetchReview({ business_id: businessId }),
        ]);
        setAverageRating(rating);
        setReviewCount(reviews?.length ?? 0);
      } catch (err) {
        console.error("Failed to load business:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, [businessId]);

  const handleReviewChange = async () => {
    if (!businessId) return;
    try {
      const [rating, reviews] = await Promise.all([
        calculateAverageRating(businessId),
        fetchReview({ business_id: businessId }),
      ]);
      setAverageRating(rating);
      setReviewCount(reviews?.length ?? 0);
    } catch (err) {
      console.error("Failed to recalculate rating:", err);
    }
  };

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
                    <Link to="/home">Home</Link>
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
                  <BreadcrumbPage>{business?.name ?? "Business"}</BreadcrumbPage>
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

      {/* Hero Section */}
      <div className="relative h-[400px] overflow-hidden bg-muted">
        {business?.logo_url && (
          <img
            src={business.logo_url}
            alt={business.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8">
          <div className="flex items-start justify-between">
            <div>
              {loading ? (
                <>
                  <Skeleton className="h-10 w-64 mb-2" />
                  <Skeleton className="h-5 w-48" />
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-bold text-foreground mb-2">{business?.name}</h1>
                  <div className="flex items-center gap-4 text-foreground/90 mb-2">
                    {business?.category && <Badge variant="outline">{business.category}</Badge>}
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-semibold">{averageRating > 0 ? averageRating.toFixed(1) : "No ratings"}</span>
                      {reviewCount > 0 && (
                        <span className="text-muted-foreground">({reviewCount} reviews)</span>
                      )}
                    </div>
                  </div>
                </>
              )}
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
                    {loading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                      </div>
                    ) : (
                      <p className="text-muted-foreground mb-6">{business?.description ?? "No description available."}</p>
                    )}

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Hours</p>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            {businessHours.map(({ day, hours }) => (
                              <p key={day}><span className="capitalize">{day}</span>: {hours}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Price Range</p>
                          {loading ? (
                            <Skeleton className="h-4 w-16 mt-1" />
                          ) : (
                            <p className="text-sm text-muted-foreground">{business?.price_range ? "$" + business.price_range : "—"}</p>
                          )}
                        </div>
                      </div>
                      {business?.tags && business.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {business.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      )}
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
                <div className="space-y-6">
                  <ReviewSummary rating={averageRating} reviewCount={reviewCount} />
                  {businessId && (
                    <ReviewList
                      businessId={businessId}
                      currentUserId={user?.id}
                      onReviewChange={handleReviewChange}
                    />
                  )}
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
                  {business?.contact_info?.phone && (
                    <Button variant="outline" className="w-full gap-2" asChild>
                      <a href={`tel:${business.contact_info.phone}`}>
                        <Phone className="h-4 w-4" />
                        Call
                      </a>
                    </Button>
                  )}
                  {business?.contact_info?.email && (
                    <Button variant="outline" className="w-full gap-2" asChild>
                      <a href={`mailto:${business.contact_info.email}`}>
                        <Mail className="h-4 w-4" />
                        Email
                      </a>
                    </Button>
                  )}
                  {!business?.contact_info?.phone && !business?.contact_info?.email && (
                    <>
                      <Button variant="outline" className="w-full gap-2">
                        <Phone className="h-4 w-4" />
                        Call
                      </Button>
                      <Button variant="outline" className="w-full gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Button>
                    </>
                  )}
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
