import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProfileInfo from "@/components/profile/ProfileInfo";
import HandleBusinessOwner from "@/components/profile/HandleBusiness";
import {BusinessCard} from "@/components/business/BusinessCard";
import { ProductCard} from "@/components/business/Product";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { fetchBusiness, fetchProducts } from "@/lib/data/utils";
import { Business, Product as ProductType } from "@/lib/interfaces";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ProfilePage = () => {
  const {profile} = useAuth();
  const [favoriteProducts, setFavoriteProducts] = useState<ProductType[]>([]);
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    if (profile) {
      const fetchFavorites = async () => {
        const favProducts = await fetchProducts(undefined, undefined, profile.favorite_products);
        setFavoriteProducts(favProducts);
        const favBusinesses = await fetchBusiness({business_id: profile.favorite_businesses});
        setFavoriteBusinesses(favBusinesses);
      };
      fetchFavorites();
    }
  }, [profile]);

  const favoriteStoresWithDeals = useMemo(
    () => favoriteBusinesses.filter((b) => b.deal?.trim()),
    [favoriteBusinesses]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-2xl flex-1">
        <ProfileInfo />
        <HandleBusinessOwner />
      </div>
      {profile && favoriteStoresWithDeals.length > 0 && (
        <div className="container mx-auto px-4 max-w-7xl pb-4">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Promotions at your favorite stores</AlertTitle>
            <AlertDescription>
              <ul className="mt-3 space-y-2 list-none p-0">
                {favoriteStoresWithDeals.map((b) => (
                  <li key={b.id} className="text-sm">
                    <Link to={`/business/${b.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                      {b.name}
                    </Link>
                    <span className="text-muted-foreground"> — {b.deal}</span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}
      {profile && profile.favorite_businesses && profile.favorite_businesses.length > 0 && (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <h2 className="text-2xl font-bold mb-4">Favorite Businesses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteBusinesses.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </div>
      )}
      {profile && profile.favorite_products && profile.favorite_products.length > 0 && (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <h2 className="text-2xl font-bold mb-4">Favorite Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default ProfilePage;
