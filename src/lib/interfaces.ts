import {z} from "zod"; 

/**
 * Interfaces to represent possible search filters for querying databases
 */
export type BusinessQuery = {
    owner_id?: string;
    business_id?: string;
    category?: string;
    min_price?: string;
    max_price?: string;
    tags?: string[];
    is_featured?:boolean;
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
    description?: string;
    logo_url?: string;
    products?: Product[];
    location: Location;
    contact_info?: ContactInfo;
    hours_of_operation: BusinessHours;
    deal?: string;
    rating?: number;
    tags?: string[];
    price_range?: number[];
    user_views: number;
    most_popular_products: string[];
    user_sentiments?: string;
}
   
export type UserProfile = {
    id: string; 
    username: string; 
    email: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    reviews?: string[];
    favorite_businesses?: string[]; 
    recently_viewed_businesses?: string[];
    favorite_products?: string[];
    recent_searches?:string[];
    recent_tags?: string[] 
}

export type Product = {
    id: string;
    name: string;
    business_id: string;
    is_service: boolean;
    duration: string;
    description?: string;
    image?: string;
    is_fav: boolean;
    price: number; 
    rating?: number;
    tags?: string[];
    reviews?: string[];
    user_views: number;
    user_sentiments?: string;
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
    product_id?: string | null;
    created_at?: string;
}

export type BusinessEvent = {
    id: string;
    business_id: string;
    title: string;
    description?: string;
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

interface DayHours {
  open: string;
  close: string;
  is_open: boolean;
}

export interface BusinessHours{
  sunday: DayHours, 
  monday: DayHours, 
  tuesday: DayHours, 
  wednesday: DayHours, 
  thursday: DayHours, 
  friday: DayHours, 
  saturday: DayHours,
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

export enum Location {
    Drew = "Drew Hall", 
    CHN = "College Hall North", 
    CHS = "College Hall South",
    Annex = "Annex",
    Cook = "Cook Hall",
    West = "Towers - West", 
    East = "Towers - East",
    Quad = "Quad",
    Axis = "Axis",
    MD = "Off Campus - Maryland", 
    VA = "Off Campus - Virginia",
    DC = "Off Campus - District of Columbia", 
    Other = "Other", 
    Anon = "Contact Owner for Details"
}