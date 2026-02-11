import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { fetchBusiness } from "@/lib/data/utils";
import { Oval } from "react-loader-spinner";
import { homeSearchQuery } from "./Home";

const Discover = () => {
  const [searchQuery, setSearchQuery] = useState(homeSearchQuery);
  const [searchFilters, setSearchFilters] = useState<BusinessQuery>({});
  const [sortingFilter, setSortingFilter] = useState<SortingFilters | null>(null);
  const { user, loading } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    setLoadingBusinesses(true);
    const getBusinesses = async () => {
      const selectedBusinesses = await fetchBusiness(searchFilters, searchQuery);
      setBusinesses(selectedBusinesses)
    };
    getBusinesses();
    setLoadingBusinesses(false);
  }, [searchFilters, searchQuery]);

  useEffect(() => {
    if (sortingFilter) {
      sortBusinesses(sortingFilter.toLowerCase());
    }
  }, [sortingFilter]);

  const sortBusinesses = (sort_by: string) => {
    switch (sort_by) {
      case SortingFilters.Highest_Rated:
        businesses.sort((a, b) => b.rating - a.rating);
        break;
      case SortingFilters.Price_Low_High:
        businesses.sort((a, b) => a.price_range.localeCompare(b.price_range));
        break;
      case SortingFilters.Price_High_Low:
        businesses.sort((a, b) => b.price_range.localeCompare(a.price_range));
        break;
    }
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
              <Select defaultValue={Category.Default}
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
              <Select defaultValue={SortingFilters.Highest_Rated}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SortingFilters).map((filter) => (
                    <SelectItem onClick={() => setSortingFilter(filter)} key={filter} value={filter.toLowerCase() || ''}>
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
                  id="min-price"
                  onChange={(e) => setSearchFilters({ ...searchFilters, min_price: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-1 w-[120px]">
                <Label htmlFor="max-price" className="text-sm text-center"> Max Price </Label>
                <Input
                  id="max-price"
                  onChange={(e) => setSearchFilters({ ...searchFilters, max_price: Number(e.target.value) })}
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

        {loadingBusinesses ?
          <div className="flex justify-center items-center h-64">
            <Oval
              width={40}
              height={40}
              strokeWidth={2}
              color="#353536"
              ariaLabel="loading" />
          </div> :

          <div className="container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {businesses.map((business) => (
              <Link key={business.id} to={`/business/${business.id}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-all group cursor-pointer h-full">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={business.logo_url}
                      alt={business.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-foreground text-lg">{business.name}</h3>
                        <span className="text-sm font-semibold text-foreground ml-2">⭐ {business.rating}</span>
                      </div>
                      <Badge variant="outline" className="text-xs mb-2">{business.category}</Badge>
                      <p className="text-sm text-muted-foreground line-clamp-2">{business.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{business.price_range}</span>
                        <span>•</span>
                        <span>{business.reviews} reviews</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        }
      </div>


       {/* AI Recommendations */}
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 container mb-4">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Get Personalized Recommendations</h3>
            <p className="text-muted-foreground mb-4">
              Our AI learns from your preferences to suggest businesses you'll love
            </p>
            <Button>Enable Smart Recommendations</Button>
          </CardContent>
        </Card>
    </div>
  );
};

export default Discover;
