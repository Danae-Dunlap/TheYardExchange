import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Discover = () => {
  const { user, loading, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [deferredSearchQuery, setDeferredSearchQuery] = useState(searchQuery);
  const [searchFilters, setSearchFilters] = useState<BusinessQuery>({category: searchParams.get("category") || ""});
  const [sortingFilter, setSortingFilter] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isMobile = useIsMobile();
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
      const recentSearches = new Set<string>(profile?.recent_searches.slice(1, 15) || []);
      recentSearches.add(deferredSearchQuery);

      const { error } = await supabase.from('profiles').update({
        recent_searches: Array.from(recentSearches)
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
    return <div className="bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="container mx-auto px-4 py-6 flex-1">
        {/* Search and Filters */}
        <div className="mb-4">
          <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search businesses, services, products..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchParams(prev => { prev.set("search", e.target.value); return prev; });
                }}
              />
            </div>
            <div className="flex flex-col gap-1 w-[180px]">
              <Label className="text-sm ml-2">Category</Label>
              <Select defaultValue={searchParams.get("category") || Category.Default}
                onValueChange={(e) => {
                  setSearchFilters({ ...searchFilters, category: e != Category.Default ? e : undefined });
                  setSearchParams(prev => { prev.set("category", e != Category.Default ? e : Category.Default); return prev; });
                }}>
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
              <Select defaultValue={searchParams.get("sort_by") || SortingFilters.Highest_Rated}
                onValueChange={(e) => {
                  setSortingFilter(e);
                  setSearchParams(prev => { prev.set("sort_by", e); return prev; });
                }}>
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
                  defaultValue={searchParams.get('min_price') || null}
                  onChange={(e) => {
                    setSearchFilters({ ...searchFilters, min_price: e.target.value });
                    setSearchParams(prev => { prev.set("min_price", e.target.value); return prev; });
                  }}
                />
              </div>
              <div className="flex flex-col gap-1 w-[120px]">
                <Label htmlFor="max-price" className="text-sm text-center"> Max Price </Label>
                <Input
                  type="number"
                  id="max-price"
                  defaultValue={searchParams.get('max_price') || null}
                  onChange={(e) => {
                    setSearchFilters({ ...searchFilters, max_price: e.target.value });
                    setSearchParams(prev => { prev.set("max_price", e.target.value); return prev; });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="mx-auto block w-full p-6">
        <div className="mb-6 ml-6">
          <h2 className="text-2xl font-bold text-foreground mb-2 relative">Discover Businesses</h2>
          <p className="text-muted-foreground">{businesses.length} businesses found</p>
        </div>

        <div className="container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 min-h-[500px]">
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
