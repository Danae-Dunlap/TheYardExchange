import { useEffect, useState, useCallback } from "react";
import { Heart, X, Ellipsis, Star } from "lucide-react";
import {VisuallyHidden} from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Product as ProductType, Review as ReviewType } from "@/lib/interfaces";
import { deleteProduct, calculateAverageRating} from "@/lib/data/utils";
import { ReviewList } from "../layout/Reviews/review-list";
import AddProduct from "./AddProduct";

const ProductCard = ({ product, onUpdate }: { product: ProductType; onUpdate?: () => void; }) => {
  const { profile, user, refreshProfileData } = useAuth();
  const [isFavorite, setIsFavorite] = useState(
    profile?.favorite_products?.includes(product.id) || false
  );
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isOwnProduct =
    profile?.business_id &&
    product.business_id &&
    String(profile.business_id).trim() === String(product.business_id).trim();

  const updateProductRating = async () => {
    const rating = await calculateAverageRating(product.business_id, product.id); 
    const { error } = await supabase.from('products').update({ rating }).eq('id', product.id);
    product.rating = rating;
    if(error){console.error("Error updating product rating:", error);}
  };


  useEffect(() => {
    const updateProductViews = async () => {
      const { error } = await supabase.from('products').update({ user_views: product.user_views + 1 }).eq('id', product.id);
      if(error){console.error("Error updating product views:", error);}
    }
    updateProductViews();
  }, [viewOpen]);

 
  // Favorite Logic
  useEffect(() => {
    const updateFavorites = async () => {
      if (!profile || !user) return;

      const updated = Array.from(
        new Set<string>(
          isFavorite
            ? [...profile.favorite_products, product.id]
            : profile.favorite_products.filter((id) => id !== product.id)
        )
      );

      await supabase
        .from("profiles")
        .update({ favorite_products: updated })
        .eq("id", user.id);

      refreshProfileData && (await refreshProfileData());
    };
    updateFavorites();
  }, [isFavorite]);


  // Delete
  const handleDelete = async () => {
    await deleteProduct(product.id);
    setDeleteOpen(false);
    onUpdate();
  };


  return (
    <>
      {/* CARD */}
      <div
        onClick={() => setViewOpen(true)}
        className="relative flex gap-4 p-4 border rounded-xl hover:bg-muted/50 cursor-pointer transition"
      >
        {/* IMAGE */}
        <div className="w-28 h-28 shrink-0 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* TEXT CONTENT */}
        <div className="flex flex-col flex-1 justify-between">
          <div>
            <p className="text-lg font-semibold">{product.name}</p>
            <p className="text-md text-muted-foreground line-clamp-3">
              {product.description}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="font-semibold text-base">${product.price}</p>

            {/* Optional Rating */}
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{product.rating?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="absolute top-2 right-2 flex gap-2">
          {!isOwnProduct && (
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setIsFavorite(!isFavorite);
              }}
            >
              <Heart
                className="h-4 w-4"
                fill={isFavorite ? "#ff474c" : "none"}
              />
            </Button>
          )}

          {isOwnProduct && (
            <>
              <Ellipsis
                className="cursor-pointer size-4"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditOpen(true);
                }}
              />
              <X
                className="cursor-pointer size-4"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteOpen(true);
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* VIEW DIALOG */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <VisuallyHidden>
          <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
          <DialogDescription>{product.description}</DialogDescription>
        </VisuallyHidden>
        <DialogContent>
          <Dialog open={viewOpen} onOpenChange={setViewOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between my-4">
                <h2 className="text-2xl font-bold">{product.name}</h2>
                <p className="text-lg font-semibold">${product.price}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="w-full h-64 md:h-80 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                  {product.image && (
                    <img
                      src={product.image}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="text-base text-muted-foreground leading-relaxed">
                  {product.description}
                </div>
              </div>


              <div className="mt-6 space-y-2 text-sm">
                {product.duration && (
                  <p><strong>Duration:</strong> {product.duration}</p>
                )}

                {product.tags?.length ? (
                  <p><strong>Tags:</strong> {product.tags}</p>
                ) : null}
              </div>

              {/* REVIEWS PLACEHOLDER */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">Reviews</h3>
                <ReviewList
                  businessId={product.business_id}
                  productId={product.id}
                  currentUserId={user.id}
                  onReviewChange={updateProductRating}
                />
              </div>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>

      {/* EDIT */}
      <AddProduct
        businessId={product.business_id}
        open={editOpen}
        productInfo={product}
        isEdit={true}
        onOpenChange={setEditOpen}
        onSuccess={() => {
          setEditOpen(false);
          onUpdate();
        }}
      />

      {/* DELETE */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {product.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};


export { ProductCard };