import {Product as ProductType} from "@/lib/interfaces"; 
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import z from "zod"; 
import { insertProduct, updateProduct } from "@/lib/data/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AddProductProps {
  businessId: string;
  open: boolean;
  productInfo?: ProductType;
  isEdit?: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

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

const AddProduct = ({ businessId, open, productInfo, isEdit = false, onOpenChange, onSuccess }: AddProductProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: productInfo?.name || "",
    description: productInfo?.description || "",
    price: productInfo?.price ? productInfo.price.toString() : "",
    duration: productInfo?.duration || "",
    tags: productInfo?.tags ? productInfo.tags : "",
    is_service: productInfo?.is_service !== undefined ? productInfo.is_service : true,
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

      const product: ProductType = {
        id: isEdit ? (productInfo?.id ?? productId) : productId,
        name: validated.name,
        business_id: businessId,
        description: validated.description || null,
        price: validated.price,
        duration: validated.duration || null,
        tags: validated.tags || null,
        is_service: validated.is_service,
        image: !isEdit && validated.image ? validated.image.name : (productInfo?.image ?? null),
        user_views: isEdit ? (productInfo?.user_views ?? 0) : 0,
        is_fav: isEdit ? (productInfo?.is_fav ?? false) : false,
        user_favorited: isEdit ? (productInfo?.user_favorited ?? 0) : 0
      };

      if(isEdit){
        await updateProduct(product, validated.image || undefined);
      }else{
        await insertProduct(product, validated.image || undefined);
      }

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
          <DialogTitle>{isEdit ? "Edit" : "Add"} Product/Service</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update your product or service details"
              : "Add a new product or service to your business listing"}
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
              {isEdit ? "Update Product/Service" : "Add Product/Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProduct; 