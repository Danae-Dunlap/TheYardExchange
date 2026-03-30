import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import PostsSection from "@/components/layout/PostsSection";
import Footer from "@/components/layout/Footer";
import { Users } from "lucide-react";

const Community = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

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
        <div className="container mx-auto px-4 pt-10 pb-2">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Community</h2>
          </div>
          <p className="text-muted-foreground mt-1">
            Share what's on your mind and connect with the community.
          </p>
        </div>
        <PostsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Community;
