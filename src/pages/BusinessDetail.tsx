import { useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import { fetchProducts, fetchReview, fetchEvents } from "@/lib/data/utils";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Business, Product, Review, BusinessEvent } from "@/lib/interfaces";
import { BusinessDetailHeroSection } from "@/components/layout/Hero";
import { supabase } from "@/integrations/supabase/client";
import DetailSection from "@/components/business/Detail";
import Sidebar from "@/components/business/Sidebar";


const BusinessDetail = () => {
  const location = useLocation();
  const {user, profile} = useAuth();
  const {business} = location.state as { business: Business };
  const [services, setServices] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [events, setEvents] = useState<BusinessEvent[]>([]);

  useEffect(() => {
    const getBusinessDetails = async () => {
      const services = await fetchProducts(business.id);
      setServices(services || []);
      const reviews = await fetchReview({ business_id: business.id });
      setReviews(reviews || []);
      const events = await fetchEvents(business.id);
      setEvents(events || []);
      const favorites = await fetchProducts(business.id, true);
      setFavorites(favorites || []);
      
      const { error } = await supabase.from('businesses').update({ user_views: business.user_views + 1 }).eq('id', business.id);
      if(error) {console.error("Error updating user views:", error.message);}
    };

    const updateUserBehavior = async () => {
      if (!profile || !user) return;
      const newTags = business.tags ? [...(profile.recent_tags ?? []).slice(business.tags.length - 1, 15), business.tags].flat() : (profile.recent_tags ?? []);
      const recentlyViewed = profile.recently_viewed_businesses ?? [];
      const recentlyViewedBusinesses = recentlyViewed.includes(business.id) ? recentlyViewed : [...recentlyViewed, business.id];
      const { error } = await supabase.from('profiles').update({ recent_tags: newTags, recently_viewed_businesses: recentlyViewedBusinesses }).eq('id', user.id);
      if(error) {console.error("Error updating recent behavior:", error.message);}
    }

    getBusinessDetails();
    updateUserBehavior();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BusinessDetailHeroSection business={business} reviewsLength={reviews.length} />
         
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <DetailSection business={business} favorites={favorites} services={services} events={events} />
          <Sidebar business={business} />
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
