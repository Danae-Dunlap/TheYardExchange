import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Product } from "./Product";
import { Separator } from "../ui/separator";
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
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ReviewList } from "@/components/ui/review-list";
import { priceRange } from "@/lib/utils";
import { fetchBusiness, fetchProducts } from "@/lib/data/utils";


const DetailSection = ({ business, favorites, services, reviews, events }) => {
  const { user } = useAuth();
  const [productDetailOpen, setProductDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(null);
  const [storeProducts, setStoreProducts] = useState([]);
  const [loadingStoreProducts, setLoadingStoreProducts] = useState(false);
  const [compareWithProduct, setCompareWithProduct] = useState(null);

  const openProductDetail = (service) => {
    setSelectedProduct(service);
    setProductDetailOpen(true);
  };

  const openComparisonFromDetail = () => {
    if (!selectedProduct) return;
    setSelectedService(selectedProduct);
    setProductDetailOpen(false);
    setComparisonOpen(true);
    setSelectedStoreId(business.id);
    setCompareWithProduct(null);
    setStoreProducts(services);
  };

  const loadStores = async () => {
    try {
      const data = await fetchBusiness();
      if (data && data.length > 0) {
        setStores(data.map((b) => ({ id: b.id, name: b.name })));
      }
    } catch (e) {
      console.error("Error loading stores:", e);
    }
  };

  useEffect(() => {
    if (comparisonOpen) {
      if (stores.length === 0) {
        setStores([{ id: business.id, name: business.name }]);
        loadStores();
      }
    }
  }, [comparisonOpen]);

  useEffect(() => {
    if (!comparisonOpen || !selectedStoreId) return;
    if (selectedStoreId === business.id) {
      setStoreProducts(services);
      return;
    }
    setLoadingStoreProducts(true);
    fetchProducts(selectedStoreId)
      .then((list) => setStoreProducts(list ?? []))
      .catch(() => setStoreProducts([]))
      .finally(() => setLoadingStoreProducts(false));
  }, [comparisonOpen, selectedStoreId, business.id, services]);


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
                      <div
                        key={favorite.id || index}
                        onClick={() => openProductDetail(favorite)}
                        className="cursor-pointer"
                      >
                        <Product service={favorite} />
                      </div>
                    ))}
                  </div>
                  <hr />
                </div>
              }
              <div className="space-y-4">
                {favorites.length > 0 && <h4 className="font-medium text-foreground my-4">All Services</h4>}
                {services.map((service, index) => (
                  <div
                    key={service.id || index}
                    onClick={() => openProductDetail(service)}
                    className="cursor-pointer"
                  >
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
              <ReviewList businessId={business.id} currentUserId={user?.id} />
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

      {/* Product detail dialog */}
      {selectedProduct && (
        <Dialog open={productDetailOpen} onOpenChange={setProductDetailOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
              <DialogDescription>
                {business.name} · {selectedProduct.is_service ? "Service" : "Product"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedProduct.image && (
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {selectedProduct.is_service ? "Service" : "Product"}
                </Badge>
              </div>
              {selectedProduct.description && (
                <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
              )}
              <div className="flex gap-4 text-sm">
                <span className="font-semibold text-foreground">
                  ${Number(selectedProduct.price).toFixed(2)}
                </span>
                {selectedProduct.duration && (
                  <span className="text-muted-foreground">{selectedProduct.duration}</span>
                )}
              </div>
              {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedProduct.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <Button onClick={openComparisonFromDetail} className="w-full">
                Compare with another item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Comparison dialog: side-by-side with store dropdown and list */}
      {selectedService && (
        <Dialog
          open={comparisonOpen}
          onOpenChange={(open) => {
            setComparisonOpen(open);
            if (!open) setCompareWithProduct(null);
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Compare items</DialogTitle>
              <DialogDescription>
                Compare this item with another from any store. Select a store, then pick an item to compare side by side.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-border rounded-lg p-4">
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Selected item</h4>
                  <h3 className="font-semibold text-foreground mb-1">{selectedService.name}</h3>
                  <p className="text-xs text-muted-foreground mb-1">{business.name}</p>
                  {selectedService.description && (
                    <p className="text-sm text-muted-foreground mb-2">{selectedService.description}</p>
                  )}
                  <p className="text-sm">
                    Price: <span className="font-semibold">${Number(selectedService.price).toFixed(2)}</span>
                    {selectedService.duration && <> · {selectedService.duration}</>}
                  </p>
                  {selectedService.image && (
                    <img
                      src={selectedService.image}
                      alt={selectedService.name}
                      className="mt-2 h-24 w-full object-cover rounded"
                    />
                  )}
                </div>
                <div className="border border-border rounded-lg p-4">
                  {compareWithProduct ? (
                    <>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">Compare with</h4>
                      <h3 className="font-semibold text-foreground mb-1">{compareWithProduct.name}</h3>
                      <p className="text-xs text-muted-foreground mb-1">
                        {selectedStoreId === business.id ? business.name : stores.find((s) => s.id === selectedStoreId)?.name}
                      </p>
                      {compareWithProduct.description && (
                        <p className="text-sm text-muted-foreground mb-2">{compareWithProduct.description}</p>
                      )}
                      <p className="text-sm">
                        Price: <span className="font-semibold">${Number(compareWithProduct.price).toFixed(2)}</span>
                        {compareWithProduct.duration && <> · {compareWithProduct.duration}</>}
                      </p>
                      {compareWithProduct.image && (
                        <img
                          src={compareWithProduct.image}
                          alt={compareWithProduct.name}
                          className="mt-2 h-24 w-full object-cover rounded"
                        />
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a store and an item below to compare.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Store to compare with</Label>
                <Select
                  value={selectedStoreId ?? ""}
                  onValueChange={(val) => {
                    setSelectedStoreId(val);
                    setCompareWithProduct(null);
                  }}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                        {store.id === business.id ? " (this store)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedStoreId && (
                <div className="space-y-2">
                  <Label className="text-sm">Items from selected store</Label>
                  {loadingStoreProducts ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : storeProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items in this store.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {storeProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setCompareWithProduct(p)}
                          className={`flex items-start gap-2 p-3 border rounded-lg text-left transition-colors ${
                            compareWithProduct?.id === p.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
                          {p.image && (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-12 w-12 rounded object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground text-sm truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ${Number(p.price).toFixed(2)}
                              {p.duration && ` · ${p.duration}`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default DetailSection;