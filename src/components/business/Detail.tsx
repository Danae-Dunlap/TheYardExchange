import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { fetchComparableProducts } from "@/lib/data/utils";

export function priceRange(price_range) {
    if (price_range && price_range.length > 1) {
      return <span className="text-base text-muted-foreground"> {price_range[0]}-{price_range[1]}</span>;
    } else if (price_range && price_range.length === 1) {
      return <span className="text-base text-muted-foreground"> {price_range[0]}</span>;
    }
}

const DetailSection = ({ business, favorites, services, reviews, events }) => {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisons, setComparisons] = useState<any[] | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | "all">("all");
  const [loadingComparisons, setLoadingComparisons] = useState(false);

  const openComparison = async (service: any) => {
    setSelectedService(service);
    setComparisonOpen(true);
    setLoadingComparisons(true);
    try {
      const data = await fetchComparableProducts(service.name);
      setComparisons(data);
      // Default to current store
      setSelectedStoreId(business.id);
    } catch (error) {
      console.error("Error fetching comparable products:", error);
      setComparisons(null);
    } finally {
      setLoadingComparisons(false);
    }
  };

  

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
                    {priceRange(business.price_range)}
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
                  <div key={service.id || index} onClick={() => openComparison(service)} className="cursor-pointer">
                    <Product service={service} />
                  </div>
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

      {/* Comparison dialog */}
      {selectedService && (
        <Dialog open={comparisonOpen} onOpenChange={setComparisonOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Compare prices for {selectedService.name}</DialogTitle>
              <DialogDescription>
                Compare this {selectedService.is_service ? "service" : "product"} across different stores.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-1">
                  {selectedService.name} – {business.name}
                </h3>
                {selectedService.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {selectedService.description}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Price: <span className="font-semibold">${selectedService.price.toFixed(2)}</span>
                  {selectedService.duration && <> • {selectedService.duration}</>}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Compare with store</Label>
                <Select
                  value={selectedStoreId}
                  onValueChange={(val) => setSelectedStoreId(val as string | "all")}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Select store to compare" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    {comparisons &&
                      Array.from(
                        new Map(
                          comparisons.map((c) => [
                            c.businesses?.id,
                            { id: c.businesses?.id, name: c.businesses?.name },
                          ]),
                        ).values(),
                      )
                        .filter((s) => s.id)
                        .map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Comparable offers</h4>
                {loadingComparisons ? (
                  <p className="text-sm text-muted-foreground">Loading comparisons...</p>
                ) : !comparisons || comparisons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No comparable products found yet.
                  </p>
                ) : (
                  comparisons
                    .filter((c) =>
                      selectedStoreId === "all"
                        ? true
                        : c.businesses?.id === selectedStoreId,
                    )
                    .sort((a, b) => Number(a.price) - Number(b.price))
                    .map((c) => (
                      <div
                        key={c.id}
                        className="flex items-start gap-4 p-3 border border-border rounded-lg"
                      >
                        {c.images && (
                          <img
                            src={Array.isArray(c.images) ? c.images[0] : c.images}
                            alt={c.product_name}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-foreground">
                              {c.product_name}
                            </p>
                            <span className="text-sm font-semibold text-foreground">
                              ${Number(c.price).toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Store: {c.businesses?.name || "Unknown"}
                          </p>
                          {c.description && (
                            <p className="text-sm text-muted-foreground">
                              {c.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default DetailSection;