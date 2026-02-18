/**
 * Interfaces to represent possible search filters for querying databases
 */
export type BusinessQuery = {
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
    category: Category; 
    description?: string | null;
    logo_url?: string | null;
    products?: Product[] | null;
    location?: string;
    contact_info?: ContactInfo;
    hours_of_operation: string;
    deal?: string;
    rating?: number;
    tags?: string[] | null;
    price_range?: string | null;
    user_views: number;
    most_popular_products: string[];
    user_sentiments: string | null;
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
    is_service: boolean;
    duration: string;
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
    user: string;
    user_logo: string;
    business_id: string;
    date: string;
    rating: number;
    comment?: string | null;
}

export type BusinessEvent = {
    id: string;
    business_id: string;
    title: string;
    description?: string | null;
    start_date: Date;
    end_date: Date;
}

export type ContactInfo = {
    email?: string, 
    tiktok?: string, 
    instagram?: string, 
    phone_number?: string, 
    website?: string,
    facebook?: string,
}

/** Interfaces for choice values used in front end */
export enum Category {
    Default = 'None',
    Beauty = "Beauty", 
    Hair = "Hair",
    Clothing = "Clothing", 
    Food = "Food",
    Services = "Services", 
    Tutoring = "Tutoring",
    Creative = "Creative",
    Technology = "Tech", 
    Goods = "Consumer Goods", 
    Entertainment = "Entertainment"
}


export enum SortingFilters {
    Highest_Rated = 'Highest Rated',
    Price_Low_High = 'Price: Low to High',
    Price_High_Low = 'Price: High to Low'
}

