import { useLocation, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { fetchBusiness, fetchProducts, fetchReview, fetchEvents } from "@/lib/data/utils";
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
  const { user, profile } = useAuth();
  const [business, setBusiness] = useState<Business | null>(
    (location.state as { business?: Business })?.business ?? null
  );
  const [loading, setLoading] = useState(!(location.state as { business?: Business })?.business && !!id);
  const [services, setServices] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [events, setEvents] = useState<BusinessEvent[]>([]);

  useEffect(() => {
    if (!id) return;
    const loadBusiness = async () => {
      if (business) return;
      setLoading(true);
      try {
        const data = await fetchBusiness({ business_id: id });
        if (data && data.length > 0) setBusiness(data[0]);
      } catch (e) {
        console.error("Error loading business:", e);
      } finally {
        setLoading(false);
      }
    };
    loadBusiness();
  }, [id, business]);

  useEffect(() => {
    if (!business) return;
    const getBusinessDetails = async () => {
      const [servicesData, reviewsData, eventsData, favoritesData] = await Promise.all([
        fetchProducts(business.id),
        fetchReview({ business_id: business.id }),
        fetchEvents(business.id),
        fetchProducts(business.id, true),
      ]);
      setServices(servicesData ?? []);
      setReviews(reviewsData ?? []);
      setEvents(eventsData ?? []);
      setFavorites(favoritesData ?? []);

      const { error } = await supabase
        .from("businesses")
        .update({ user_views: (business.user_views || 0) + 1 })
        .eq("id", business.id);
      if (error) console.error("Error updating user views:", error.message);
    };
    getBusinessDetails();
  }, [business]);

  useEffect(() => {
    if (!business || !user || !profile) return;
    const updateUserBehavior = async () => {
      const recentTags = profile.recent_tags ?? [];
      const newTags = business.tags
        ? [...recentTags.slice(-14), business.tags].flat()
        : recentTags;
      const recent = profile.recently_viewed_businesses ?? [];
      const recentlyViewedBusinesses = recent.includes(business.id)
        ? recent
        : [...recent, business.id];
      const { error } = await supabase
        .from("profiles")
        .update({
          recent_tags: newTags,
          recently_viewed_businesses: recentlyViewedBusinesses,
        })
        .eq("id", user.id);
      if (error) console.error("Error updating recent behavior:", error.message);
    };
    updateUserBehavior();
  }, [business, user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Header />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Business not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BusinessDetailHeroSection business={business} reviewsLength={reviews.length} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <DetailSection
            business={business}
            favorites={favorites}
            services={services}
            reviews={reviews}
            events={events}
          />
          <Sidebar business={business} />
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
