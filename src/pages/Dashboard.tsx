import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  TrendingUp, MessageCircle,
  Eye, Heart, Star, Calendar, Settings,
  BarChart3, Clock, Lightbulb, Store, Plus, Pencil, Trash2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBusiness, fetchReview, fetchProducts, fetchEvents, deleteBusiness } from "@/lib/data/utils";
import { Business, Review, Product, BusinessEvent } from "@/lib/interfaces";
import { AddProduct } from "@/components/business/Product";
import { AddEvent } from "@/components/business/Event";
import Footer from "@/components/layout/Footer";

const Dashboard = () => {
  const { user, isBusinessOwner, loading } = useAuth();
  const navigate = useNavigate();
  const [business, setbusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    views: 0,
    messages: 0,
    favorites: 0,
    avgRating: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
      return;
    }

    if (!loading && user) {
      if (!isBusinessOwner) {
        navigate("/profile");
        return;
      }
      loadBusinessData();
    }
  }, [user, loading, isBusinessOwner, navigate]);

  const handleDeleteBusiness = async () => {
    if (!business || !user) return;
    try {
      await deleteBusiness(business.id, user.id);
      navigate("/");
    } catch (error) {
      console.error("Error deleting business:", error);
    }
  };

  const loadBusinessData = async () => {
    if (!user) return;

    setLoadingBusiness(true);
    try {
      // Fetch business
      const businessData = await fetchBusiness({owner_id: user.id});
      if (businessData && businessData.length > 0) {
        setbusiness(businessData[0]);

        // Fetch reviews
        const reviewsData = await fetchReview({ business_id: businessData[0].id });
        setReviews(reviewsData  || []);

        // Fetch products
        const productsData = await fetchProducts(businessData[0].id);
        setProducts(productsData || []);

        // Fetch events
        const eventsData = await fetchEvents(businessData[0].id);
        setEvents(eventsData || []);

        // Calculate average rating
        const avgRating = reviewsData && reviewsData.length > 0
          ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
          : 0;

        // Count messages (placeholder - would need a messages table)
        const messagesCount = 0;

        setStats({
          views: businessData[0].user_views || 0,
          messages: messagesCount,
          favorites: businessData[0].users_favorited || 0,
          avgRating: Math.round(avgRating * 10) / 10,
        });
      }
    } catch (error) {
      console.error("Error loading business data:", error);
    } finally {
      setLoadingBusiness(false);
    }
  };

  const statsData = [
    { label: "Total Views", value: stats.views.toLocaleString(), change: "", icon: Eye },
    { label: "Messages", value: stats.messages.toString(), change: "", icon: MessageCircle },
    { label: "Favorites", value: stats.favorites.toString(), change: "", icon: Heart },
    { label: "Avg Rating", value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A", change: "", icon: Star }
  ];

  const aiInsights = [
    {
      title: "Peak Activity Hours",
      description: "Your customers are most active between 2PM-6PM on weekdays",
      action: "Schedule posts during peak hours",
      icon: Clock,
      color: "text-primary"
    },
    {
      title: "Popular Services",
      description: "Box braids get 40% more inquiries than other services",
      action: "Consider highlighting this service",
      icon: TrendingUp,
      color: "text-secondary"
    },
    {
      title: "Customer Feedback",
      description: "95% of customers mention 'professional' and 'friendly'",
      action: "Keep up the great service!",
      icon: Lightbulb,
      color: "text-accent"
    }
  ];

  const recentMessages = [
    {
      id: 1,
      from: "Sarah M.",
      message: "Hi! Do you have availability this Saturday?",
      time: "2 hours ago",
      unread: true
    },
    {
      id: 2,
      from: "Marcus T.",
      message: "Can I schedule a consultation?",
      time: "5 hours ago",
      unread: true
    },
    {
      id: 3,
      from: "Tasha W.",
      message: "Thank you! The braids look amazing!",
      time: "1 day ago",
      unread: false
    }
  ];

  if (loading || loadingBusiness) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  // Show create business prompt if no business exists
  if (!business && isBusinessOwner) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardContent className="p-8 text-center">
              <Store className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">No Business Listed Yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your business profile to start showcasing your services to the Howard community.
              </p>
              <Button onClick={() => navigate("/create-business")} size="lg">
                Create Your Business
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {business?.name || "Business Dashboard"}
            </h2>
            <p className="text-muted-foreground">Manage your business and track performance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate("/edit-business")}>
              <Pencil className="h-4 w-4" />
              Edit Business
            </Button>
            {business && (
              <Button className="gap-2" asChild>
                <Link to={`/business/${business.id}`} state={{ business: business }}>
                  View Public Profile
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsData.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                  {stat.change && (
                    <Badge variant={stat.change.includes('+') ? 'default' : 'secondary'}>
                      {stat.change}
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Insights */}
        <Card className="mb-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>AI-Powered Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiInsights.map((insight, index) => (
                <div key={index} className="bg-card rounded-lg p-4 border border-border">
                  <insight.icon className={`h-6 w-6 mb-3 ${insight.color}`} />
                  <h4 className="font-semibold text-foreground mb-2">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                  <Button variant="link" className="p-0 h-auto text-primary">
                    {insight.action} →
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="messages" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>

              <TabsContent value="messages">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.messages === 0 ? (
                        <div className="text-center py-8">
                          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No messages yet</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Messages from customers will appear here
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Messages feature coming soon</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Products & Services</CardTitle>
                      {business && (
                        <Button onClick={() => setAddProductOpen(true)} size="sm" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Product/Service
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {products.length === 0 ? (
                        <div className="text-center py-8">
                          <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No products or services yet</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Add products and services to showcase what you offer
                          </p>
                          {business && (
                            <Button onClick={() => setAddProductOpen(true)} className="mt-4">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Your First Product/Service
                            </Button>
                          )}
                        </div>
                      ) : (
                        products.map((product) => (
                          <div key={product.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                            <div className="flex items-center gap-4">
                              {product.image && (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-16 w-16 rounded-lg object-cover"
                                />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-foreground">{product.name}</p>
                                  <Badge variant="outline">{product.is_service ? "Service" : "Product"}</Badge>
                                </div>
                                {product.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span>${product.price.toFixed(2)}</span>
                                  {product.duration && <span>• {product.duration}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Manage Events</CardTitle>
                      {business && (
                        <Button onClick={() => setAddEventOpen(true)} size="sm" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Create Event
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {events.length === 0 ? (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No events yet</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Create events to promote your business
                          </p>
                          {business && (
                            <Button onClick={() => setAddEventOpen(true)} className="mt-4">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Your First Event
                            </Button>
                          )}
                        </div>
                      ) : (
                        events.map((event) => (
                          <div key={event.id} className="p-4 border border-border rounded-lg">
                            <h4 className="font-semibold text-foreground mb-2">{event.title}</h4>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                {new Date(event.start_date).toLocaleDateString()} {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span>→</span>
                              <span>
                                {new Date(event.end_date).toLocaleDateString()} {new Date(event.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule Post
                </Button>
<Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => navigate("/edit-business")}
                >
                  <Settings className="h-4 w-4" />
                  Update Business
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Business
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardContent className="p-6">
                <Lightbulb className="h-8 w-8 text-primary mb-3" />
                <h4 className="font-semibold text-foreground mb-2">Pro Tip</h4>
                <p className="text-sm text-muted-foreground">
                  Businesses that respond to messages within 1 hour get 3x more bookings!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      {business && (
        <>
          <AddProduct
            businessId={business.id}
            businessName={business.name}
            open={addProductOpen}
            onOpenChange={setAddProductOpen}
            onSuccess={loadBusinessData}
          />
          <AddEvent
            businessId={business.id}
            businessName={business.name}
            open={addEventOpen}
            onOpenChange={setAddEventOpen}
            onSuccess={loadBusinessData}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{business?.name}</strong>? This action cannot be undone and will permanently remove your business and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteBusiness}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default Dashboard;
