import { Card, CardContent } from "../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Product } from "./Product";
import Review from "./Review";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Event } from "./Event";
import { Clock, MapPin, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatHours } from "./Hours";
import { priceRange } from "@/lib/utils";
import { useState } from "react";


const DetailSection = ({ business, favorites, services, reviews, events }) => {
  const { user, profile, refreshProfileData } = useAuth();
  const [favoriteProducts, setFavoriteProducts] = useState(profile?.favorite_products || []);


  return (
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
                    <p className="text-base text-muted-foreground whitespace-pre-line">{formatHours(business.hours_of_operation)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Price Range</p>
                    <span className="text-base text-muted-foreground">{priceRange(business.price_range)}</span>
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
                      <Product key={index} service={favorite} />
                    ))}
                  </div>
                  <hr />
                </div>
              }
              <div className="space-y-4">
                {favorites.length > 0 && <h4 className="font-medium text-foreground my-4">All Services</h4>}
                {services.map((service, index) => (
                  <Product key={index} service={service} />
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
                  <Review key={index} review={review} />
                ))
              )}
              {user && user.id && !reviews.some(review => review.user_id === user.id) && (
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
                <Event key={index} event={event} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DetailSection;