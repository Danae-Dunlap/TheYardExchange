import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Business } from "@/lib/interfaces";
import { fetchBusiness, fetchRecommendedBusinesses } from "@/lib/data/utils";

// Layout & Components
import Header from "@/components/layout/Header";
import { HomeHeroSection } from "@/components/layout/Hero";
import PostsSection from "@/components/layout/PostsSection";
import FeaturedSection from "@/components/layout/Featured";
import { RecommendedSection } from "@/components/layout/Recommended";
import AIChatbot from "@/components/layout/AIChatbot";
import Footer from "@/components/layout/Footer";

const Home = () => {
  const { user, profile, loading } = useAuth();
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [recommendedBusinesses, setRecommendedBusinesses] = useState<Business[]>([]);
  const navigate = useNavigate();

  // Navigation Logic
  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  // Data Fetching Logic
  useEffect(() => {
    const fetchFeatured = async () => {
      const featured = await fetchBusiness(undefined, undefined, true);
      if (featured) setFeaturedBusinesses(featured);
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (!profile) return;
    fetchRecommendedBusinesses(profile).then(setRecommendedBusinesses);
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HomeHeroSection />
        <PostsSection limit={4} />
        <RecommendedSection recommendedBusinesses={recommendedBusinesses} />
        <FeaturedSection featuredBusinesses={featuredBusinesses} />
        <AIChatbot />
      </main>
      <Footer />
    </div>
  );
};

export default Home;