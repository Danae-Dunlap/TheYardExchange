import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Clock, Star, DollarSign, 
  Share2, Flag, Heart
} from "lucide-react";
import { useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import { fetchProducts, fetchReview, fetchEvents } from "@/lib/data/utils";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Business, Product, Review, BusinessEvent } from "@/lib/interfaces";
import { Product as ProductComponent } from "@/components/business/Product";
import ReviewComponent from "@/components/business/Review";
import { Event as EventComponent } from "@/components/business/Event";
import ContactInfo from "@/components/business/ContactInfo";
import { supabase } from "@/integrations/supabase/client";

const BusinessDetail = () => {
  const location = useLocation();
  const {user, profile} = useAuth();
  const {business} = location.state as { business: Business };
  const [services, setServices] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFavorite, setIsFavorite] = useState(profile?.favorite_businesses.includes(business.id) || false);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [events, setEvents] = useState<BusinessEvent[]>([]);

  useEffect(() => {
    const getBusinessDetails = async () => {
      const services = await fetchProducts(business.id);
      setServices(services);
      const reviews = await fetchReview({ business_id: business.id });
      setReviews(reviews);
      const events = await fetchEvents(business.id);
      setEvents(events);
      const favorites = await fetchProducts(business.id, true); 
      setFavorites(favorites);
      
      const { error } = await supabase.from('businesses').update({ user_views: business.user_views + 1 }).eq('id', business.id);
      if(error) {console.error("Error updating user views:", error.message);}
    };

    const updateUserBehavior = async () => {
      const newTags = business.tags ? [...profile.recent_tags.slice(business.tags.length - 1, 15), business.tags].flat() : profile.recent_tags;
      const recentlyViewedBusinesses = profile.recently_viewed_businesses.includes(business.id) ? profile.recently_viewed_businesses : [...profile.recently_viewed_businesses, business.id];
      const { error } = await supabase.from('profiles').update({ recent_tags: newTags, recently_viewed_businesses: recentlyViewedBusinesses }).eq('id', user.id);
      if(error) {console.error("Error updating recent behavior:", error.message);}
    }

    getBusinessDetails();
    updateUserBehavior();
  }, []);

  const addFavoriteBusiness = async () => {
      setIsFavorite(!isFavorite);
      if(isFavorite){
        const favoriteBusinesses = [...profile.favorite_businesses, business.id];
        const { error } = await supabase.from('profiles').update({ favorite_businesses: favoriteBusinesses }).eq('id', user.id);
        if(error) {console.error("Error updating favorite businesses:", error.message);}
      }else{
        const favoriteBusinesses = profile.favorite_businesses.filter(id => id !== business.id);
        const { error } = await supabase.from('profiles').update({ favorite_businesses: favoriteBusinesses }).eq('id', user.id);
        if(error) {console.error("Error updating favorite businesses:", error.message);}
      }
      console.log('isFavorite:', isFavorite);
    }


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Hero Image */}
      <div className="relative h-[400px] overflow-hidden">
        <img
          src={business.logo_url}
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
                <Badge variant="outline">{business.category.valueOf()}</Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-semibold">{business.rating}</span>
                  <span className="text-muted-foreground">({reviews.length} reviews)</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className={isFavorite ? "bg-red-500 hover:bg-red-600" : "bg-gray-200 hover:bg-gray-300"} variant="outline" size="icon" onClick={addFavoriteBusiness} title="Add to Favorites">
                <Heart className="h-4 w-4" />
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
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{business.hours_of_operation}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Price Range</p>
                          <p className="text-sm text-muted-foreground">{business.price_range}</p>
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
                    {favorites.length > 0 &&
                      <div>
                        <div className="space-y-4 mb-6">
                          <h4 className="font-medium text-foreground mb-4">Crowd Favorites</h4>
                          {favorites.map((favorite, index) => (
                            <ProductComponent key={index} service={favorite} />
                          ))}
                        </div>
                        <hr />
                      </div>
                    }
                    <div className="space-y-4">
                      {favorites.length > 0 && <h4 className="font-medium text-foreground my-4">All Services</h4>}
                      {services.map((service, index) => (
                        <ProductComponent key={index} service={service} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4">Reviews</h3>
                    {reviews.length === 0 ? (
                      <p className="text-muted-foreground">No reviews yet.</p>
                    ) : (
                      reviews.map((review, index) => (
                        <ReviewComponent key={index} review={review} />
                      ))
                    )}
                    {user.id && !reviews.some(review => review.user_id === user.id) && (
                      <Button className="mt-4" variant="outline" size="sm">
                        Add Review
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4">Events</h3>
                    {events.map((event, index) => (
                      <EventComponent key={index} event={event} />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Contact Business</h3>
                <ContactInfo contacts={business.contact_info} />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
