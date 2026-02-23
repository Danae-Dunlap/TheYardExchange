import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Business, Category } from "@/lib/interfaces";
import { fetchBusiness } from "@/lib/data/utils";

// Layout & Components
import Header from "@/components/layout/Header";
import HeroSection from "@/components/layout/Hero";
import TrendingSection from "@/components/layout/Trending";
import FeaturedSection from "@/components/layout/Featured";
import AIChatbot from "@/components/layout/AIChatbot";
import Footer from "@/components/layout/Footer";

const Home = () => {
  const { user, loading } = useAuth();
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
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
        <HeroSection />
        <TrendingSection />
        <FeaturedSection featuredBusinesses={featuredBusinesses} />
        <AIChatbot />
      </main>
      <Footer />
    </div>
  );
};

export default Home;