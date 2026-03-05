import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProfileInfo from "@/components/profile/ProfileInfo";
import HandleBusinessOwner from "@/components/profile/HandleBusiness";
import {BusinessCard} from "@/components/business/BusinessCard";
import { FavoriteProduct } from "@/components/business/Product";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { fetchBusiness, fetchProducts } from "@/lib/data/utils";
import { Business, Product as ProductType } from "@/lib/interfaces";

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
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-2xl flex-1">
        <ProfileInfo />
        <HandleBusinessOwner />
      </div>
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
              <FavoriteProduct
                key={product.id}
                service={product}
                //disableLink={true} // don't navigate when used on profile page
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
