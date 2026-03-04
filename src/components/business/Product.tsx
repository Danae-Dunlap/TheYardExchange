import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Product as ProductType } from "@/lib/interfaces";
import { insertProduct, updateProduct } from "@/lib/data/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const productSchema = z.object({
  name: z.string().trim().min(1, "Product/Service name is required").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  price: z.number().min(0, "Price must be positive"),
  duration: z.string().optional().or(z.literal("")),
  tags: z.string().optional(),
  is_service: z.boolean(),
  image: z.instanceof(File).optional().refine(file => {
    if (!file) return true;
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    return validTypes.includes(file.type);
  }, "Invalid file type. Must be PNG or JPEG.").optional(),
});

interface AddProductProps {
  businessId: string;
  businessName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddProduct = ({ businessId, businessName, open, onOpenChange, onSuccess }: AddProductProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    tags: "",
    is_service: true,
    image: null as File | null,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = productSchema.parse({
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        duration: formData.duration || undefined,
        tags: formData.tags || undefined,
        is_service: formData.is_service,
        image: formData.image || undefined,
      });

      setLoading(true);

      const productId = crypto.randomUUID();
      const tagsArray = validated.tags
        ? validated.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      const product: ProductType = {
        id: productId,
        name: validated.name,
        business_id: businessId,
        business_name: businessName,
        description: validated.description || null,
        price: validated.price,
        duration: validated.duration || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        is_service: validated.is_service,
        image: validated.image ? validated.image.name : null,
        user_views: 0,
        users_favorited: 0,
        is_fav: false,
      };

      await insertProduct(product, validated.image || undefined);

      toast({
        title: "Product/Service added!",
        description: `${validated.is_service ? "Service" : "Product"} has been added to your business.`,
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        duration: "",
        tags: "",
        is_service: true,
        image: null,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to add product/service",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Product/Service</DialogTitle>
          <DialogDescription>
            Add a new product or service to your business listing
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Box Braids, Haircut, Consultation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={formData.is_service ? "default" : "outline"}
                onClick={() => setFormData({ ...formData, is_service: true })}
              >
                Service
              </Button>
              <Button
                type="button"
                variant={!formData.is_service ? "default" : "outline"}
                onClick={() => setFormData({ ...formData, is_service: false })}
              >
                Product
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your product or service..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            {formData.is_service && (
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 2 hours, 30 minutes"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., braids, natural hair, quick service"
            />
            <p className="text-sm text-muted-foreground">Separate tags with commas</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Product/Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface EditProductProps {
  businessId: string;
  product: ProductType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditProduct = ({ businessId, product, open, onOpenChange, onSuccess }: EditProductProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    tags: "",
    is_service: true,
    image: null as File | null,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open && product) {
      setFormData({
        name: product.name,
        description: product.description ?? "",
        price: product.price.toString(),
        duration: product.duration ?? "",
        tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
        is_service: product.is_service ?? true,
        image: null,
      });
    }
  }, [open, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    try {
      const validated = productSchema.parse({
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        duration: formData.duration || undefined,
        tags: formData.tags || undefined,
        is_service: formData.is_service,
        image: formData.image || undefined,
      });

      setLoading(true);

      const tagsArray = validated.tags
        ? validated.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      const updatedProduct: ProductType = {
        ...product,
        name: validated.name,
        business_id: businessId,
        description: validated.description || null,
        price: validated.price,
        duration: validated.duration || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        is_service: validated.is_service,
        image: product.image ?? (validated.image ? validated.image.name : undefined),
      };

      await updateProduct(updatedProduct, validated.image || undefined);

      toast({
        title: "Product/Service updated",
        description: `${validated.is_service ? "Service" : "Product"} has been updated.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update product/service",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product/Service</DialogTitle>
          <DialogDescription>
            Update the details of your product or service
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Box Braids, Haircut, Consultation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-type">Type *</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={formData.is_service ? "default" : "outline"}
                onClick={() => setFormData({ ...formData, is_service: true })}
              >
                Service
              </Button>
              <Button
                type="button"
                variant={!formData.is_service ? "default" : "outline"}
                onClick={() => setFormData({ ...formData, is_service: false })}
              >
                Product
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your product or service..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price ($) *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            {formData.is_service && (
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration</Label>
                <Input
                  id="edit-duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 2 hours, 30 minutes"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tags">Tags</Label>
            <Input
              id="edit-tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., braids, natural hair, quick service"
            />
            <p className="text-sm text-muted-foreground">Separate tags with commas</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-image">Image</Label>
            {product.image && !formData.image && (
              <p className="text-sm text-muted-foreground mb-1">Current image: shown on listing</p>
            )}
            <Input
              id="edit-image"
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Product = ({ service }: { service: ProductType }) => {
  const { profile, user, refreshProfileData } = useAuth();
  const [isFavorite, setIsFavorite] = useState(profile?.favorite_products?.includes(service.id) || false);

  useEffect(() => {
    const addFavoriteProduct = async () => {
      if (!profile || !user) return;
      profile.favorite_products = Array.from(new Set<string>(
        isFavorite ? [...(profile.favorite_products || []), service.id] : (profile.favorite_products || []).filter(id => id !== service.id)
      ));

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ favorite_products: profile.favorite_products })
        .eq('id', user.id);
      if (profileError) { console.error("Error updating favorite products:", profileError.message); }

      if (refreshProfileData) {
        await refreshProfileData();
      }
    };
    addFavoriteProduct();
  }, [isFavorite, profile, user, refreshProfileData, service.id]);

  return (
    <div key={service.id} className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
      <div>
        <p className="font-medium text-foreground">{service.name}</p>
        <p className="text-sm text-muted-foreground">{service.description}</p>
      </div>
      <p className="font-semibold text-foreground">{service.price}</p>
      {service.duration && <p className="text-sm text-muted-foreground">{service.duration}</p>}

      <Button
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-colors duration-150 hover:bg-gray-200"
        size="icon"
        onClick={() => setIsFavorite(!isFavorite)}
        title={!isFavorite ? "Add to Favorites" : "Remove from Favorites"}
      >
        <Heart className="h-5 w-5" fill={isFavorite ? "#ff474c" : "none"} stroke={isFavorite ? "none" : "#a9a9a9"} />
      </Button>
    </div>
  );
};

interface FavoriteProductProps {
  service: ProductType;
  disableLink?: boolean;
}

const FavoriteProduct = ({ service, disableLink = false }: FavoriteProductProps) => {
  const { profile, user, refreshProfileData } = useAuth();
  const [isFavorite, setIsFavorite] = useState(profile?.favorite_products?.includes(service.id) || false);

  useEffect(() => {
    const addFavoriteProduct = async () => {
      if (!profile || !user) return;
      profile.favorite_products = Array.from(new Set<string>(
        isFavorite ? [...(profile.favorite_products || []), service.id] : (profile.favorite_products || []).filter(id => id !== service.id)
      ));

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ favorite_products: profile.favorite_products })
        .eq('id', user.id);
      if (profileError) { console.error("Error updating favorite products:", profileError.message); }

      if (refreshProfileData) {
        await refreshProfileData();
      }
    };
    addFavoriteProduct();
  }, [isFavorite, profile, user, refreshProfileData, service.id]);

  return (
    <div>
      <div className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
        <div>
          <p className="font-medium text-foreground">{service.name}</p>
          <p className="text-sm text-muted-foreground">{service.description}</p>
        </div>
        <p className="font-semibold text-foreground">{service.price}</p>
        {service.duration && <p className="text-sm text-muted-foreground">{service.duration}</p>}

        <div onClick={(e) => e.stopPropagation()}>
          <Button
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-colors duration-150 hover:bg-gray-200"
            size="icon"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            title="Remove from Favorites"
          >
            <Heart
              className="h-5 w-5"
              fill={isFavorite ? "#ff474c" : "none"}
              stroke={isFavorite ? "none" : "#a9a9a9"}
            />
          </Button>
        </div>

        {service.business_name && (
          <p className="text-sm text-muted-foreground inline-flex">From: {service.business_name}</p>
        )}
      </div>
    </div>
  );
};

export { AddProduct, EditProduct, Product, FavoriteProduct };
