import { useCallback, useEffect, useMemo, useState } from "react";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Product as ProductType, Business } from "@/lib/interfaces";
import { deleteProduct, fetchBusiness, fetchProducts } from "@/lib/data/utils";
import AddProduct from "./AddProduct";
import { cn } from "@/lib/utils";

function ProductPreviewBox({ product }: { product: ProductType | null }) {
  return (
    <div className="rounded-md border bg-muted/30 overflow-hidden">
      <div className="aspect-[4/3] w-full bg-muted flex items-center justify-center text-center px-3">
        {!product ? (
          <p className="text-sm text-muted-foreground">Choose a store and product to compare.</p>
        ) : product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <p className="text-sm text-muted-foreground">No image available</p>
        )}
      </div>
      {product && (
        <div className="p-3 space-y-1 border-t bg-background">
          <p className="font-medium text-sm leading-tight">{product.name}</p>
          <p className="text-lg font-semibold text-foreground">${product.price}</p>
          {product.description ? (
            <p className="text-xs text-muted-foreground line-clamp-3">{product.description}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

interface CompareColumnProps {
  label: string;
  businesses: Business[];
  businessId: string | null;
  productId: string | null;
  products: ProductType[];
  productsLoading: boolean;
  onBusinessChange: (id: string) => void;
  onProductChange: (id: string) => void;
  fallbackProduct: ProductType | null;
}

function CompareColumn({
  label,
  businesses,
  businessId,
  productId,
  products,
  productsLoading,
  onBusinessChange,
  onProductChange,
  fallbackProduct,
}: CompareColumnProps) {
  const storeItems = useMemo(
    () => businesses.map((b) => ({ value: b.id, label: b.name })),
    [businesses]
  );
  const productItems = useMemo(
    () => products.map((p) => ({ value: p.id, label: p.name })),
    [products]
  );

  const resolved: ProductType | null = useMemo(() => {
    if (!productId || !businessId) return null;
    if (fallbackProduct && fallbackProduct.id === productId && fallbackProduct.business_id === businessId) {
      return fallbackProduct;
    }
    return products.find((p) => p.id === productId) ?? null;
  }, [productId, businessId, products, fallbackProduct]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 bg-card">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="space-y-2">
        <SearchableSelect
          items={storeItems}
          value={businessId}
          onValueChange={onBusinessChange}
          placeholder="Select store"
          searchPlaceholder="Search stores…"
          emptyMessage="No stores found."
        />
        <SearchableSelect
          items={productItems}
          value={productId}
          onValueChange={onProductChange}
          placeholder={businessId ? (productsLoading ? "Loading items…" : "Select item") : "Select a store first"}
          searchPlaceholder="Search items…"
          emptyMessage="No items found."
          disabled={!businessId || productsLoading}
        />
      </div>
      <ProductPreviewBox product={resolved} />
    </div>
  );
}

const ProductCard = ({ product, onUpdate }: { product: ProductType; onUpdate?: () => void }) => {
  const { profile, user, refreshProfileData } = useAuth();
  const [isFavorite, setIsFavorite] = useState(
    profile?.favorite_products?.includes(product.id) || false
  );
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [compareExpanded, setCompareExpanded] = useState(false);

  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [compareLoadError, setCompareLoadError] = useState<string | null>(null);

  const [leftBusinessId, setLeftBusinessId] = useState<string | null>(product.business_id);
  const [leftProductId, setLeftProductId] = useState<string | null>(product.id);
  const [leftProducts, setLeftProducts] = useState<ProductType[]>([]);
  const [leftProductsLoading, setLeftProductsLoading] = useState(false);

  const [rightBusinessId, setRightBusinessId] = useState<string | null>(null);
  const [rightProductId, setRightProductId] = useState<string | null>(null);
  const [rightProducts, setRightProducts] = useState<ProductType[]>([]);
  const [rightProductsLoading, setRightProductsLoading] = useState(false);

  const isOwnProduct =
    profile?.business_id &&
    product.business_id &&
    String(profile.business_id).trim() === String(product.business_id).trim();

  const loadProductsForBusiness = useCallback(async (businessId: string) => {
    const data = await fetchProducts(businessId);
    return data ?? [];
  }, []);

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

  useEffect(() => {
    if (!viewOpen) {
      setCompareExpanded(false);
      setCompareLoadError(null);
      return;
    }
    setLeftBusinessId(product.business_id);
    setLeftProductId(product.id);
    setRightBusinessId(null);
    setRightProductId(null);
    setRightProducts([]);
    setAllBusinesses([]);
    setLeftProducts([]);
  }, [viewOpen, product.id, product.business_id]);

  useEffect(() => {
    if (!viewOpen || !compareExpanded) return;

    let cancelled = false;
    (async () => {
      setCompareLoadError(null);
      try {
        const businesses = await fetchBusiness();
        if (cancelled) return;
        setAllBusinesses(businesses ?? []);
      } catch {
        if (!cancelled) setCompareLoadError("Could not load stores for comparison.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [viewOpen, compareExpanded]);

  useEffect(() => {
    if (!viewOpen || !compareExpanded || !leftBusinessId) return;
    let cancelled = false;
    (async () => {
      setLeftProductsLoading(true);
      try {
        const list = await loadProductsForBusiness(leftBusinessId);
        if (cancelled) return;
        setLeftProducts(list);
      } finally {
        if (!cancelled) setLeftProductsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewOpen, compareExpanded, leftBusinessId, loadProductsForBusiness]);

  useEffect(() => {
    if (!leftProductId || leftProducts.length === 0) return;
    if (!leftProducts.some((p) => p.id === leftProductId)) {
      setLeftProductId(null);
    }
  }, [leftProducts, leftProductId]);

  useEffect(() => {
    if (!viewOpen || !compareExpanded || !rightBusinessId) {
      setRightProducts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setRightProductsLoading(true);
      try {
        const list = await loadProductsForBusiness(rightBusinessId);
        if (cancelled) return;
        setRightProducts(list);
      } finally {
        if (!cancelled) setRightProductsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [viewOpen, compareExpanded, rightBusinessId, loadProductsForBusiness]);

  useEffect(() => {
    if (!rightProductId || rightProducts.length === 0) return;
    if (!rightProducts.some((p) => p.id === rightProductId)) {
      setRightProductId(null);
    }
  }, [rightProducts, rightProductId]);

  const handleDelete = async () => {
    await deleteProduct(product.id);
    setDeleteOpen(false);
    onUpdate();
  };

  return (
    <>
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

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent
          className={cn(
            "max-h-[90vh] overflow-y-auto",
            compareExpanded ? "max-w-5xl w-[calc(100vw-2rem)]" : "max-w-lg"
          )}
        >
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription className="line-clamp-3">{product.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border bg-muted/20 p-3 text-sm space-y-1">
              <p>
                <span className="font-medium text-foreground">Price: </span>${product.price}
              </p>
              {product.duration ? (
                <p>
                  <span className="font-medium text-foreground">Duration: </span>
                  {product.duration}
                </p>
              ) : null}
              {product.tags?.length ? (
                <p>
                  <span className="font-medium text-foreground">Tags: </span>
                  {product.tags}
                </p>
              ) : null}
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setCompareExpanded((v) => !v)}
            >
              {compareExpanded ? "Hide comparison" : "Compare to other items"}
            </Button>

            {compareExpanded && (
              <div className="space-y-3 pt-1">
                {compareLoadError ? (
                  <p className="text-sm text-destructive">{compareLoadError}</p>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  Pick two stores and items to compare prices side by side. Search each dropdown to find stores and products faster.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CompareColumn
                    label="Item A"
                    businesses={allBusinesses}
                    businessId={leftBusinessId}
                    productId={leftProductId}
                    products={leftProducts}
                    productsLoading={leftProductsLoading}
                    onBusinessChange={(id) => {
                      setLeftBusinessId(id);
                      setLeftProductId(null);
                    }}
                    onProductChange={setLeftProductId}
                    fallbackProduct={product}
                  />
                  <CompareColumn
                    label="Item B"
                    businesses={allBusinesses}
                    businessId={rightBusinessId}
                    productId={rightProductId}
                    products={rightProducts}
                    productsLoading={rightProductsLoading}
                    onBusinessChange={(id) => {
                      setRightBusinessId(id);
                      setRightProductId(null);
                    }}
                    onProductChange={setRightProductId}
                    fallbackProduct={null}
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
