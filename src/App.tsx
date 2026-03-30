import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ChatWidget } from "@/components/layout/ChatWidget";
import { FavoriteStorePromotionNotifier } from "@/components/layout/FavoriteStorePromotionNotifier";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import BusinessDetail from "./pages/BusinessDetail";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import CreateBusiness from "./pages/CreateBusiness";
import EditBusiness from "./pages/EditBusiness";
import NotFound from "./pages/NotFound";
import { ProductCard } from "./components/business/Product";

const queryClient = new QueryClient();

const AuthenticatedChatWidget = () => {
  const { user } = useAuth();
  return user ? <ChatWidget /> : null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ChatProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/home" element={<Home />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/business/:id" element={<BusinessDetail />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create-business" element={<CreateBusiness />} />
              <Route path="/edit-business" element={<EditBusiness />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FavoriteStorePromotionNotifier />
            <AuthenticatedChatWidget />
          </ChatProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
