import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MessageCircle,
  Eye, Heart, Star, Calendar, Settings,
  Lightbulb, Store, Plus, Pencil, Trash2, BadgePercent, Sparkles,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchBusiness,
  fetchReview,
  fetchProducts,
  fetchEvents,
  fetchPromotions,
  deleteBusiness,
  fetchProfileViewPeriodComparison,
  fetchTopLikedPostsForOwner,
  isProfileViewRange,
  toUserFacingError,
  type ProfileViewRange,
  type TopLikedPostSummary,
} from "@/lib/data/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Promotion, PromotionForm } from '@/components/business/Promotion';
import { Business, Review, Product, BusinessEvent, BusinessPromotion } from "@/lib/interfaces";
import AddProduct from "@/components/business/AddProduct";
import { ProductCard } from "@/components/business/Product";
import { AddEvent, EditEvent } from "@/components/business/Event";
import Footer from "@/components/layout/Footer";
import {
  buildInsightCards,
  buildStatsData,
  getPopularProducts,
  getTopLikedPostsWithLikes,
  type DashboardStats,
} from "@/lib/dashboard/insights";
import { useProfileViewSeries } from "@/hooks/useProfileViewSeries";

const Dashboard = () => {
  const { user, isBusinessOwner, loading, refreshProfileData, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [business, setbusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [promotions, setPromotions] = useState<BusinessPromotion[]>([]);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addPromotionOpen, setAddPromotionOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<BusinessEvent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    views: 0,
    messages: 0,
    favorites: 0,
    avgRating: 0,
  });
  const [viewRange, setViewRange] = useState<ProfileViewRange>("month");
  const [viewTrend, setViewTrend] = useState<{ recent: number; previous: number } | null>(null);
  const [topLikedPosts, setTopLikedPosts] = useState<TopLikedPostSummary[]>([]);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [dashboardLoadError, setDashboardLoadError] = useState<string | null>(null);

  const popularProducts = useMemo(() => {
    return getPopularProducts(products);
  }, [products]);

  const insightCards = useMemo(() => {
    return buildInsightCards({ viewTrend, popularProducts, products, topLikedPosts, reviews, stats });
  }, [viewTrend, popularProducts, products, topLikedPosts, reviews, stats]);

  const topLikedPostsWithLikes = useMemo(() => getTopLikedPostsWithLikes(topLikedPosts), [topLikedPosts]);

  const viewsChartConfig = {
    views: { label: "Views", color: "hsl(var(--primary))" },
  } satisfies ChartConfig;

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
      await refreshRoles();
      await refreshProfileData();

      navigate("/");
    } catch (error) {
      console.error("Error deleting business:", error);
    }
  };

  const handleEditEvent = (event: BusinessEvent) => {
    setEditingEvent(event);
    setEditEventOpen(true);
  };

  const isEventActive = (event: BusinessEvent) => {
    return new Date(event.end_date) >= new Date();
  };

  const getProducts = async () => {
    if (!business?.id) return;
    try {
      const productsData = await fetchProducts(business.id);
      setProducts(productsData || []);
    } catch (e) {
      console.error("Error refreshing products:", e);
    }
  };

  const loadBusinessData = async () => {
    if (!user) return;

    setLoadingBusiness(true);
    setDashboardLoadError(null);
    setInsightsError(null);
    try {
      const businessData = await fetchBusiness({ owner_id: user.id });
      if (businessData && businessData.length > 0) {
        setbusiness(businessData[0]);

        const reviewsData = await fetchReview({ business_id: businessData[0].id });
        setReviews(reviewsData || []);

        const productsData = await fetchProducts(businessData[0].id);
        setProducts(productsData || []);

        const eventsData = await fetchEvents(businessData[0].id);
        setEvents(eventsData || []);

        const promotionData = await fetchPromotions(businessData[0].id);
        setPromotions(promotionData || []);

        const avgRating =
          reviewsData && reviewsData.length > 0
            ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
            : 0;

        const messagesCount = 0;

        setStats({
          views: businessData[0].user_views || 0,
          messages: messagesCount,
          favorites: businessData[0].users_favorited || 0,
          avgRating: Math.round(avgRating * 10) / 10,
        });

        const [trendResult, likedResult] = await Promise.all([
          fetchProfileViewPeriodComparison(businessData[0].id),
          fetchTopLikedPostsForOwner(businessData[0].owner_id),
        ]);

        const insightMessages: string[] = [];
        if (trendResult.ok) {
          setViewTrend(trendResult.data);
        } else {
          setViewTrend(null);
          insightMessages.push(trendResult.error);
        }

        if (likedResult.ok) {
          setTopLikedPosts(likedResult.data);
        } else {
          setTopLikedPosts([]);
          insightMessages.push(likedResult.error);
        }

        setInsightsError(insightMessages.length > 0 ? insightMessages.join(" ") : null);
      }
    } catch (error) {
      console.error("Error loading business data:", error);
      setDashboardLoadError(toUserFacingError(error));
    } finally {
      setLoadingBusiness(false);
    }
  };

  const { viewSeries, viewSeriesLoading, viewSeriesError } = useProfileViewSeries({
    businessId: business?.id,
    viewRange,
  });

  const statsData = buildStatsData(stats);

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

        {dashboardLoadError && (
          <Alert variant="destructive" className="mb-6" role="alert">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not load dashboard</AlertTitle>
            <AlertDescription>{dashboardLoadError}</AlertDescription>
          </Alert>
        )}

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

        {/* Storefront insights: views, signals, popular items, top posts */}
        <div className="mb-8 space-y-6">
          <Card className="border-primary/15 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Storefront insights</CardTitle>
                    <CardDescription>
                      Data from your public profile, catalog, and community posts
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <p className="text-sm font-medium text-foreground">Profile views</p>
                  <Tabs
                    value={viewRange}
                    onValueChange={(v) => {
                      if (isProfileViewRange(v)) setViewRange(v);
                    }}
                    className="w-auto"
                  >
                    <TabsList className="h-9">
                      <TabsTrigger value="month" className="text-xs sm:text-sm">
                        Last month
                      </TabsTrigger>
                      <TabsTrigger value="6months" className="text-xs sm:text-sm">
                        6 months
                      </TabsTrigger>
                      <TabsTrigger value="year" className="text-xs sm:text-sm">
                        Last year
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                {viewSeriesError && (
                  <Alert variant="destructive" className="mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Chart unavailable</AlertTitle>
                    <AlertDescription>{viewSeriesError}</AlertDescription>
                  </Alert>
                )}
                {viewSeriesLoading ? (
                  <div className="h-[280px] flex items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground text-sm">
                    Loading chart…
                  </div>
                ) : viewSeriesError ? (
                  <div className="h-[280px] flex items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground text-sm text-center px-4">
                    Fix the issue above or try again later.
                  </div>
                ) : viewSeries.length === 0 ? (
                  <div className="h-[280px] flex items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground text-sm text-center px-4">
                    No view data in this range yet. Views are recorded when visitors open your public profile.
                  </div>
                ) : (
                  <ChartContainer config={viewsChartConfig} className="h-[280px] w-full aspect-auto">
                    <AreaChart data={viewSeries} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        interval="preserveStartEnd"
                        minTickGap={16}
                      />
                      <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        dataKey="views"
                        type="monotone"
                        fill="var(--color-views)"
                        stroke="var(--color-views)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Total profile views (all time): {stats.views.toLocaleString()}
                </p>
              </div>

              {insightsError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Some insight data could not be loaded</AlertTitle>
                  <AlertDescription>{insightsError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insightCards.map((insight, index) => (
                  <div
                    key={`${insight.title}-${index}`}
                    className="flex gap-3 rounded-lg border border-border bg-card/80 p-4"
                  >
                    <insight.icon className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground text-sm mb-1">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{insight.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                <div className="rounded-lg border border-border bg-card p-4">
                  <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    Most popular items
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">Ranked by product profile views</p>
                  {popularProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Add products or services to see what resonates.</p>
                  ) : (
                    <ul className="space-y-2">
                      {popularProducts.map((p, i) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between gap-2 text-sm border-b border-border/60 last:border-0 pb-2 last:pb-0"
                        >
                          <span className="truncate">
                            <span className="text-muted-foreground mr-2">{i + 1}.</span>
                            {p.name}
                          </span>
                          <span className="text-muted-foreground shrink-0 tabular-nums">
                            {p.user_views.toLocaleString()} views
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    Most liked posts
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">From your Community posts</p>
                  {topLikedPostsWithLikes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No likes yet — share an update from Quick Actions to build engagement.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {topLikedPostsWithLikes.map((post) => (
                          <li key={post.id} className="text-sm border-b border-border/60 last:border-0 pb-3 last:pb-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-muted-foreground text-xs">
                                {new Date(post.created_at).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                              <span className="text-muted-foreground tabular-nums text-xs">
                                {post.likeCount.toLocaleString()} likes
                              </span>
                            </div>
                            <p className="text-foreground line-clamp-3">{post.content}</p>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="messages" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="promotions">Promotions</TabsTrigger>
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
                        products.map((product) => <ProductCard key={product.id} product={product} onUpdate={getProducts} />)
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
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-foreground">{event.title}</h4>
                                  {isEventActive(event) ? (
                                    <Badge variant="default">Active</Badge>
                                  ) : (
                                    <Badge variant="secondary">Ended</Badge>
                                  )}
                                </div>
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
                              {isEventActive(event) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 ml-4 flex-shrink-0"
                                  onClick={() => handleEditEvent(event)}
                                >
                                  <Pencil className="h-3 w-3" />
                                  Edit
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="promotions">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Manage Promotions</CardTitle>
                      {business && (
                        <Button onClick={() => setAddPromotionOpen(true)} size="sm" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Create Promotion
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {promotions.length === 0 ? (
                        <div className="text-center py-8">
                          <BadgePercent className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No promotions yet</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Create promotions to promote your business
                          </p>
                          {business && (
                            <Button onClick={() => setAddPromotionOpen(true)} className="mt-4">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Your First Promotion
                            </Button>
                          )}
                        </div>
                      ) : (
                      <div>
                        
                        <p className="text-lg text-muted-foreground m-2">Upcoming Promotions</p>
                          {promotions.filter((p) => p.is_upcoming).map((promotion) => (
                            <Promotion key={promotion.id} promotion={promotion} onUpdate={loadBusinessData} />
                        ))}

                          <p className="text-lg text-muted-foreground m-2">Current Promotions</p>
                          {promotions.filter((p) => !p.is_upcoming).map((promotion) => (
                            <Promotion key={promotion.id} promotion={promotion} onUpdate={loadBusinessData} />
                        ))}
                      </div>
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
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/community')}>
                  <Calendar className="h-4 w-4" />  
                  Make A Post
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
                  className="w-full justify-start gap-2 text-destructive hover:bg-red-500"
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
            open={addProductOpen}
            onOpenChange={setAddProductOpen}
            onSuccess={loadBusinessData}
          />
          <PromotionForm
            businessId={business.id}
            open={addPromotionOpen}
            onOpenChange={setAddPromotionOpen}
            onSuccess={loadBusinessData}
          />
          <AddEvent
            businessId={business.id}
            businessName={business.name}
            open={addEventOpen}
            onOpenChange={setAddEventOpen}
            onSuccess={loadBusinessData}
          />
          {editingEvent && (
            <EditEvent
              event={editingEvent}
              open={editEventOpen}
              onOpenChange={(open) => {
                setEditEventOpen(open);
                if (!open) setEditingEvent(null);
              }}
              onSuccess={loadBusinessData}
            />
          )}
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