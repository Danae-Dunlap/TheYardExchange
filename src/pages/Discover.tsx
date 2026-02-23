import { useState, useEffect} from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category, BusinessQuery, SortingFilters, Business } from "@/lib/interfaces";
import { BusinessCard } from "@/components/business/BusinessCard";
import { fetchBusiness } from "@/lib/data/utils";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/layout/Footer";
import { homeSearchQuery, selectedCategory } from "@/components/layout/Hero";

const Discover = () => {
  const { user, loading, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState(homeSearchQuery);
  const [deferredSearchQuery, setDeferredSearchQuery] = useState(searchQuery);
  const [searchFilters, setSearchFilters] = useState<BusinessQuery>({});
  const [sortingFilter, setSortingFilter] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([])

  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const getBusinesses = async () => {
      const selectedBusinesses = await fetchBusiness(searchFilters, searchQuery);
      if (selectedBusinesses) {
        if (sortingFilter) {
          const sorted = sortBusinesses([...selectedBusinesses], sortingFilter.toLowerCase());
          setBusinesses(sorted);
        } else {
          setBusinesses(selectedBusinesses);
        }
      }
    };
    getBusinesses();
  }, [searchFilters, searchQuery, sortingFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDeferredSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    if (!deferredSearchQuery.trim()) return;
    const updateRecentSearches = async () => {
      const {error} = await supabase.from('profiles').update({
        recent_searches: [...(profile?.recent_searches || []), deferredSearchQuery]
      }).eq('id', profile?.id);
      if (error) {
        console.error("Error updating recent searches:", error);
      }
    }
    updateRecentSearches();
  }, [deferredSearchQuery]);

  const sortBusinesses = (businessesToSort: Business[], sort_by: string): Business[] => {
    const sorted = [...businessesToSort];
    switch (sort_by) {
      case SortingFilters.Highest_Rated.toLowerCase():
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case SortingFilters.Price_Low_High.toLowerCase():
        sorted.sort((a, b) => {
          const aPrice = a.price_range?.[0] ? a.price_range[0] : 0;
          const bPrice = b.price_range?.[0] ? b.price_range[0] : 0;
          return aPrice - bPrice;
        });
        break;
      case SortingFilters.Price_High_Low.toLowerCase():
        sorted.sort((a, b) => {
          const aPrice = a.price_range?.[1] ? a.price_range[1] : 0;
          const bPrice = b.price_range?.[1] ? b.price_range[1] : 0;
          return bPrice - aPrice;
        });
        break;
    }
    return sorted;
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search businesses, services, products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 w-[180px]">
              <Label className="text-sm ml-2">Category</Label>
              <Select defaultValue={selectedCategory}
                onValueChange={(e) => setSearchFilters({ ...searchFilters, category: e != Category.Default ? e : undefined })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Category).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1 w-[180px]">
              <Label className="text-sm ml-2">Sort By</Label>
              <Select defaultValue={SortingFilters.Highest_Rated} 
              onValueChange={(e) => {setSortingFilter(e)}}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SortingFilters).map((filter) => (
                    <SelectItem key={filter} value={filter.toLowerCase()}>
                      {filter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <div className="flex flex-col gap-1 w-[120px]">
                <Label htmlFor="min-price" className="text-sm text-center"> Min Price </Label>
                <Input
                  type="number"
                  id="min-price"
                  onChange={(e) => setSearchFilters({ ...searchFilters, min_price: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1 w-[120px]">
                <Label htmlFor="max-price" className="text-sm text-center"> Max Price </Label>
                <Input
                  type="number"
                  id="max-price"
                  onChange={(e) => setSearchFilters({ ...searchFilters, max_price: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="mx-auto px-20 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Discover Businesses</h2>
          <p className="text-muted-foreground">{businesses.length} businesses found</p>
        </div>

        <div className="container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {businesses.map((business) => (
            <BusinessCard business={business} key={business.id} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Discover;
