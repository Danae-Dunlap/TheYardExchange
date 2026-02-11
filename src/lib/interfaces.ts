/**
 * Interfaces to represent possible search filters for querying databases
 */
export type BusinessQuery = {
    id?: string[] | null;
    name?: string;
    owner_id?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    tags?: string[];
}

export type ReviewQuery = {
    id?: string;
    user_id?: string;
    business_id?: string;
    product_id?: string;
}

/** Interfaces for representing data entities */
export type Business = {
    id: string; 
    name: string; 
    owner_id: string; 
    owner_name: string;
    category: string; 
    description?: string | null;
    logo_url?: string | null;
    products?: string[] | null; //array of product ids
    contact_info?: Record<string, any> | null;
    hours_of_operation?: Record<string, any> | null;
    tags?: string[] | null;
    price_range?: string[] | null;
    user_views: number;
    most_popular_products: string[];
    user_sentiments: string | null;
    reviews: string[] | null;
}
   
export type UserProfile = {
    id: string; 
    username: string; 
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    reviews?: string[] | null;
    favorite_businesses?: string[] | null; 
    recently_viewed_businesses?: string[] | null;
    favorite_products?: string[] | null;
}

export type Product = {
    id: string;
    name: string;
    business_id: string;
    description?: string | null;
    image?: string | null;
    price: number; 
    rating?: number | null;
    tags?: string[] | null;
    reviews?: string[] | null;
    user_views: number;
    user_sentiments?: string | null;
}

export type Review = {
    id: string;
    user_id: string;
    business_id: string;
    rating: number;
    comment?: string | null;
}

