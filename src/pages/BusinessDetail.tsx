import { useLocation, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { fetchProducts, fetchReview, fetchEvents, fetchBusiness } from "@/lib/data/utils";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Business, Product, Review, BusinessEvent } from "@/lib/interfaces";
import { BusinessDetailHeroSection } from "@/components/layout/Hero";
import { supabase } from "@/integrations/supabase/client";
import DetailSection from "@/components/business/Detail";
import Sidebar from "@/components/business/Sidebar";


const BusinessDetail = () => {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const {user, profile} = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBusinessData = async () => {
      const fetched = await fetchBusiness({ business_id: [id] });
      const businessRecord = fetched ? fetched[0] || null : null;
      setBusiness(businessRecord);

      // Fetch business details after business is loaded
      const servicesData = await fetchProducts(businessRecord.id);
      setServices(servicesData || []);
      const reviewsData = await fetchReview({ business_id: businessRecord.id });
      setReviews(reviewsData || []);
      const eventsData = await fetchEvents(businessRecord.id);
      setEvents(eventsData || []);
      const favoritesData = await fetchProducts(businessRecord.id, true);
      setFavorites(favoritesData || []);
      
      const { error } = await supabase.from('businesses').update({ user_views: businessRecord.user_views + 1 }).eq('id', businessRecord.id);
      if(error) {console.error("Error updating user views:", error.message);}

      // Update user behavior after business is loaded (only if auth info present)
      if (user && profile) {
        let newTags = new Set<string>(
          businessRecord.tags
            ? [...profile.recent_tags?.slice(businessRecord.tags.length - 1, 15), businessRecord.tags].flat()
            : profile.recent_tags
        );
        let recentlyViewedBusinesses = new Set<string>(
          profile.recently_viewed_businesses.includes(businessRecord.id)
            ? profile.recently_viewed_businesses
            : [...profile.recently_viewed_businesses, businessRecord.id]
        );
        
        const { error: behaviorError } = await supabase.from('profiles').update({ recent_tags: Array.from(newTags), recently_viewed_businesses: Array.from(recentlyViewedBusinesses) }).eq('id', user.id);
        if(behaviorError) {console.error("Error updating recent behavior:", behaviorError.message);}
      }

      setLoading(false);
    }

    loadBusinessData();
  }, [id, location.state, profile, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading business...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Business not found.</p>
      </div>
    );
  }

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
