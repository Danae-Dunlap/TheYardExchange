import { useEffect, useState } from "react";
import { Heart, X, Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Product as ProductType } from "@/lib/interfaces";
import { deleteProduct } from "@/lib/data/utils";
import AddProduct from "./AddProduct";

const ProductCard = ({ product, onUpdate }: { product: ProductType; onUpdate?: () => void;}) => {
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
        className="relative p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
      >
        <div className="flex gap-4">
          {product.image && (
            <img
              src={product.image}
              className="w-1/3 h-auto object-cover rounded"
              alt={product.name}
            />
          )}
          <div className="flex-1">
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
            <p className="font-semibold mt-2">${product.price}</p>
          </div>
        </div>

        {/* Actions in top right corner */}
        <div className="absolute top-1 right-1 flex gap-2">
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
                className="h-3 w-3"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription>
              {product.description}
            </DialogDescription>
          </DialogHeader>

          {product.image && (
            <img
              src={product.image}
              className="w-full h-60 object-cover rounded"
            />
          )}

          <div className="space-y-2">
            <p><strong>Price:</strong> ${product.price}</p>
            {product.duration && (
              <p><strong>Duration:</strong> {product.duration}</p>
            )}
            {product.tags?.length ? (
              <p><strong>Tags:</strong> {product.tags}</p>
            ) : null}
          </div>
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
