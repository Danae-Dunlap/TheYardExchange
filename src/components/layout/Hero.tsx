import { Search, Star, Heart } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Category } from "@/lib/interfaces";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const HomeHeroSection = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();

    const handleSearch = (cat?: string) => {
        setSearchParams((searchParams) => {
            searchParams.set("search", searchQuery);
            searchParams.set("category", cat ? cat : Category.Default);
            return searchParams;
        });
        navigate(`/discover?${searchParams.toString()}`);
    }

    return (
        <section className="bg-gradient-to-br from-primary/10 via-secondary/10 to-background py-20 px-4">
            <div className="container mx-auto max-w-4xl text-center">
                <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                    For Howard Students, By Howard Students
                </Badge>
                <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                    Discover & Support Student Businesses
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Connect with talented entrepreneurs across campus.
                </p>

                <div className="flex gap-2 max-w-2xl mx-auto mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search for businesses..."
                            className="pl-10 h-12 min-h-[44px]"
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button size="lg" className="h-12 min-h-[44px] min-w-[44px]" onClick={() => handleSearch()}>Search</Button>
                </div>

                <div className="flex flex-wrap justify-center gap-2 md:flex-wrap overflow-x-auto md:overflow-visible flex-nowrap md:flex-wrap scrollbar-hide pb-2">
                    {Object.values(Category).map((cat) => (
                        <Badge key={cat} onClick={() => handleSearch(cat)} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground whitespace-nowrap shrink-0">
                            {cat}
                        </Badge>
                    ))}
                </div>
            </div>
        </section>
    );
};

const BusinessDetailHeroSection = ({ business, reviewsLength }) => {
    const { user, profile, refreshProfileData } = useAuth();
    const [isFavorite, setIsFavorite] = useState(profile?.favorite_businesses.includes(business.id) || false);
    const [favoriteBusinesses, setFavoriteBusiness] = useState(profile?.favorite_businesses || []);
    useEffect(() => {
        const addFavoriteBusiness = async () => {
            let userFavorited = business.users_favorited;
            if (favoriteBusinesses.includes(business.id) && !isFavorite) {
                userFavorited -= 1;
            } else if (!favoriteBusinesses.includes(business.id) && isFavorite) {
                userFavorited += 1;
            }
            const newFavoriteBusinesses = isFavorite ? [...favoriteBusinesses, business.id] : favoriteBusinesses.filter(id => id !== business.id);
            setFavoriteBusiness(newFavoriteBusinesses);

            //Update Business Stat
            const { error: profileError } = await supabase.from('businesses').update({ users_favorited: userFavorited }).eq('id', business.id);
            if (profileError) { console.error("Error updating business favorites:", profileError.message); }

            //Update User Profile
            const { error: BusinessError } = await supabase.from('profiles').update({ favorite_businesses: newFavoriteBusinesses }).eq('id', user.id);
            if (BusinessError) { console.error("Error updating favorite businesses:", BusinessError.message); }

            refreshProfileData();
        }
        addFavoriteBusiness();
    }, [isFavorite]);


    return (
        <div className="relative h-[400px] overflow-hidden">
            <img
                src={business.logo_url}
                alt={business.name}
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8">
                {business.deal && (
                    <Badge className="mb-4 bg-secondary text-secondary-foreground">
                        🎉 {business.deal}
                    </Badge>
                )}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">{business.name}</h1>
                        <div className="flex items-center gap-4 text-foreground/90 mb-2">
                            <Badge variant="outline">{business.category.valueOf()}</Badge>
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-primary text-primary" />
                                <span className="font-semibold">{business.rating}</span>
                                <span className="text-muted-foreground">({reviewsLength} reviews)</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-colors duration-150 hover:bg-gray-200"
                            size="icon"
                            onClick={() => setIsFavorite(!isFavorite)}
                            title={!isFavorite ? "Add to Favorites" : "Remove from Favorites"}
                        >
                            <Heart className="h-5 w-5" fill={isFavorite ? "#ff474c" : "none"} stroke={isFavorite ? "none" : "#a9a9a9"} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { HomeHeroSection, BusinessDetailHeroSection };