import { supabase } from "@/integrations/supabase/client";
import type {Business, UserProfile, Product, Review, BusinessQuery, ReviewQuery} from "../interfaces";

/**
 * Fetch business data from the database.
 *
 * @param filters - The query parameters to filter businesses.
 * @param search_string - The string used to search in business name, description, category, and tags
 * @returns A promise that resolves to an array of business data
 * @throws Error if the fetch operation fails.
 */
export async function fetchBusiness(filters?: BusinessQuery, search_string?: string): Promise<Business[] | null> {
    
    let query = supabase.from('businesses').select('*');

    if(search_string){query = query.select().textSearch('find_business', search_string);}

    //Apply filters based on query parameters
    if (filters.id) { query = query.eq('id', filters.id); }
    if (filters.category) { query = query.eq('category', filters.category);  console.log("Category filter applied:", filters.category);}
    if (filters.min_price) { query = query.gte('price_range[0]', filters.min_price); console.log("Min price filter applied:", filters.min_price);}
    if (filters.max_price) { query = query.lte('price_range[1]', filters.max_price); console.log("Max price filter applied:", filters.max_price);}

    const {data, error} = await query;
    console.log("Fetch business query: ", query); 
    console.log("Fetch business data: ", data);
    console.log("Fetch business error: ", error);
    if (error) {throw new Error(`Error fetching businesses: ${error.message}`);}
    if (!data) {return null;}

    //Format data to match Business interface
    const businesses: Promise<Business[] | null> = Promise.all(data.map(async (business: any) => {
        return {
            id: business.id,
            name: business.name,
            owner_id: business.owner_id,
            owner_name: business.owner_name,
            category: business.category,
            description: business.description,
            logo_url: business.logo_url,
            contact_info: business.contact_info,
            products: business.products, //create function to get product by ids
            hours_of_operation: business.hours_of_operation,
            price_range: Array.isArray(business.price_range) ? business.price_range.join('-') : business.price_range,
            tags: business.tags,
            user_views: Number(business.user_views),
            most_popular_products: business.most_popular_products, // see above
            user_sentiments: business.user_sentiments,
            reviews: business.reviews,
        }
    }));

    return businesses;
}

/**
 * Insert a new business into the database.
 * 
 * @param business business data
 */
export async function insertBusiness(business: Business): Promise<void> {
    const fileName = `${business.id}/logo/${business.logo_url}`;
    const priceRange = business.price_range.split('-'); 
    const {error} = await supabase.from('businesses').insert({
        id: business.id,
        name: business.name, 
        owner_id: business.owner_id, 
        owner_name: business.owner_name,
        category: business.category, 
        description: business.description || null,
        logo_url: fileName || null,
        products: business.products || null,
        contact_info: business.contact_info || null,
        hours_of_operation: business.hours_of_operation || null,
        tags: business.tags || null,
        price_range: priceRange || null,
        user_views: business.user_views,
        most_popular_products: business.most_popular_products,
        user_sentiments: business.user_sentiments || null,
        reviews: business.reviews || null,
    }); 

    const {error: uploadError} = await supabase.storage.from('businesses').upload(fileName, business.logo_url);

    if(error){throw new Error(`Error inserting business: ${error.message}`);}
    if(uploadError){throw new Error(`Error uploading logo: ${uploadError.message}`);}
}

/**
 * Update an existing business in the database.
 * 
 * @param business business data
 */
export async function updateBusiness(business: Business): Promise<void> {
    const priceRange = business.price_range.split('-'); 
    const {error} = await supabase.from('businesses').update({
        name: business.name, 
        owner_id: business.owner_id,
        owner_name: business.owner_name,
        category: business.category, 
        description: business.description || null,
        logo_url: business.logo_url || null,
        products: business.products || null,
        contact_info: business.contact_info || null,
        hours_of_operation: business.hours_of_operation || null,
        tags: business.tags || null,
        price_range: priceRange || null,
        user_views: business.user_views,
        most_popular_products: business.most_popular_products,
        user_sentiments: business.user_sentiments || null,
        reviews: business.reviews || null,
    }).eq('id', business.id);

    const {error: uploadError} = await supabase.storage.from('businesses').upload(business.logo_url, business.logo_url);

    if(error){throw new Error(`Error updating business: ${error.message}`);}
    if(uploadError){throw new Error(`Error uploading logo: ${uploadError.message}`);}
}

/**
 * Delete a business from the database. All related rows are deleted automatically through cascade delete.
 * 
 * @param businessId 
 */
export async function deleteBusiness(businessId: string, user_id: string): Promise<void> {

    const {error: businessError} = await supabase.from('businesses').delete().eq('id', businessId);
    const {error: imageError} = await supabase.storage.from('businesses').remove([`${businessId}/logo/`]);

    if(businessError){throw new Error(`Error deleting business: ${businessError.message}`);}
    if(imageError){throw new Error(`Error deleting logo: ${imageError.message}`);}
}

/**
 * Fetch product data from the database.
 *
 * @param product_ids - The array of product IDs to fetch.
 * @returns A promise that resolves to an array of product data
 * @throws Error if the fetch operation fails.
 */
export async function fetchProducts(product_ids: string[]): Promise<Product[] | null> {
    const {data, error} = await supabase.from('products').select('*').in('id', product_ids);

    if (error) {throw new Error(`Error fetching products: ${error.message}`);}
    if(!data) {return null;}

    //Format data to match Product interface
    const products: Promise<Product[] | null> = Promise.all(data.map(async (product: any) => {
        return{
            id: product.id,
            name: product.name,
            business_id: product.business_id,
            description: product.description,
            images: product.images,
            price: Number(product.price),
            rating: product.rating ? Number(product.rating) : null,
            tags: product.tags,
            reviews: product.reviews || null,
            user_views: Number(product.user_views),
            user_sentiments: product.user_sentiments || null,
        }
    }));

    return products;
}

/**
 * Insert a new product into the database.
 * 
 * @param product 
 * @throws Error if the insert operation fails.
 */
export async function insertProduct(product: Product): Promise<void> {
    const fileName = `${product.id}/image/${product.image}`;
    const {error} = await supabase.from('products').insert({
        id: product.id,
        product_name: product.name,
        business_id: product.business_id,
        description: product.description || null,
        images:  product.image ? `${product.business_id}/images/${product.image}` : null,
        price: product.price,
        rating: product.rating || null,
        tags: product.tags || null,
        reviews: product.reviews || null,
        user_views: product.user_views,
        user_sentiments: product.user_sentiments || null,
    }); 

    const {error: uploadError} = await supabase.storage.from('products').upload(fileName, product?.image); 
    if(error){throw new Error(`Error inserting product: ${error.message}`);}
    if(uploadError){throw new Error(`Error uploading product image: ${uploadError.message}`);}
}

/**
 * Update an existing product in the database.
 * 
 * @param product 
 * @throws Error if the update operation fails.
 */
export async function updateProduct(product: Product): Promise<void> {
    const fileName = `${product.id}/image/${product.image}`;
    const {error} = await supabase.from('products').update({
        name: product.name,
        business_id: product.business_id,
        description: product.description || null,
        images:  product.image ? `${product.business_id}/images/${product.image}` : null,
        price: product.price,
        rating: product.rating || null,
        tags: product.tags || null,
        reviews: product.reviews || null,
        user_views: product.user_views,
        user_sentiments: product.user_sentiments || null,
    }).eq('id', product.id);

    const {error: uploadError} = await supabase.storage.from('products').upload(fileName, product.image); 
    if(error){throw new Error(`Error updating product: ${error.message}`);}
    if(uploadError){throw new Error(`Error uploading product image: ${uploadError.message}`);}
}

/**
 * Delete a product from the database.
 * 
 * @param productId 
 * @throws Error if the delete operation fails.
 */
export async function deleteProduct(productId: string): Promise<void> {
    const {error: deleteImageError} = await supabase.storage.from('products').remove([`${productId}/image/`]);
    const {error} = await supabase.from('products').delete().eq('id', productId);

    if(deleteImageError){throw new Error(`Error deleting product image: ${deleteImageError.message}`);}
    if(error){throw new Error(`Error deleting product: ${error.message}`);}
}

/**
 * Fetch profile data from the database.
 *
 * @param query - The query parameters to filter profiles.
 * @returns A promise that resolves to an array of profile data
 * @throws Error if the fetch operation fails.
 */
export async function fetchProfile(user_id: string): Promise<UserProfile | null> {
    const {data, error} = await supabase.from('profiles').select('*').eq('id', user_id);

    if (error) {throw new Error(`Error fetching profile: ${error.message}`);}
    if (!data || data.length === 0) {return null;}

    //Format data to match Profile interface
    const profiles = await Promise.all(data.map(async (profile: any) => {
        return {
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            email: profile.student_email,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            reviews: profile.reviews,
            favorite_businesses: profile.favorite_businesses,
            recently_viewed_businesses: profile.recently_viewed_businesses,
            favorite_products: profile.favorite_products,
        }
    }));
    
    return profiles[0] || null;
}

/**
 * Delete a profile from the database.
 * 
 * @param profileId - id of user to be deleted
 * @throws Error if the delete operation fails in any table.
 */
export async function deleteProfile(profileId: string): Promise<void> {
    const {error: businessError} = await supabase.from('businesses').delete().eq('owner_id', profileId);
    const {error: reviewsError} = await supabase.from('reviews').delete().eq('user_id', profileId);
    const {error: roleError } = await supabase.from('user_roles').delete().eq('user_id', profileId);
    const {error: profileError} = await supabase.from('profiles').delete().eq('id', profileId);
    const {error: imageError} = await supabase.storage.from('account_images').remove([`${profileId}/avatar/`]);

    if(businessError){throw new Error(`Error deleting business: ${businessError?.message}`);}
    if(reviewsError){throw new Error(`Error deleting reviews: ${reviewsError?.message}`);}
    if(roleError){throw new Error(`Error deleting user roles: ${roleError?.message}`);}
    if(profileError){throw new Error(`Error deleting profile: ${profileError?.message}`);}
    if(imageError){throw new Error(`Error deleting profile image: ${imageError.message}`);}
}

/**
 * Fetches review data from the database.
 *
 * @param filters - The query parameters to filter reviews.
 * @returns A promise that resolves to an array of review data
 * @throws Error if the fetch operation fails.
 */
export async function fetchReview(filters: ReviewQuery): Promise<Review[] | null> {
    // cast to any to avoid deeply nested / recursive type instantiation from Supabase query builder
    let query: any = supabase.from('reviews').select('*');

    if (filters.id) { query = query.eq('id', filters.id); }
    if (filters.user_id) { query = query.eq('user_id', filters.user_id); }
    if (filters.business_id) { query = query.eq('business_id', filters.business_id); }
    if (filters.product_id) { query = query.eq('product_id', filters.product_id); }
    query = query.order('created_at', {ascending: false}); // Order reviews by most recent first

    const {data, error} = await query;
    if (!data) {return null;}
    if (error) {throw new Error(`Error fetching reviews: ${error.message}`);}

    //Format data to match Review interface
    const reviews: Review[] = data.map((review: any) => {
        return {
            ...review,
            rating: Number(review.rating),
        }
    });

    return reviews;
}

/**
 * Inserts a new review into the database.
 * 
 * @param review - Review object to be added to the database
 * @throws Error if the insert operation fails. 
 */
export async function insertReview(review: Review): Promise<void> {
    const {error} = await supabase.from('reviews').insert({
        id: review.id, 
        user_id: review.user_id,
        business_id: review.business_id,
        product_id: review.product_id || null,
        rating: review.rating,
        comment: review.comment || null,

    }); 
    if(error){throw new Error(`Error inserting review: ${error.message}`);}
}

/**
 * Deletes a review from the database.
 * 
 * @param reviewId 
 * @throws Error if the delete operation fails.
 */
export async function deleteReview(reviewId: string): Promise<void> {
    const {error} = await supabase.from('reviews').delete().eq('id', reviewId);
    if(error){throw new Error(`Error deleting review: ${error.message}`);}
}

/**
 * Calculates the average rating for a business or product.
 * @param businessId - The ID of the business.
 * @param productId - The ID of the product (optional).
 * @returns Average rating rounded to 1 decimal place, or 0 if no reviews.
 */
export async function calculateAverageRating(businessId: string, productId?: string): Promise<number> {
    // cast to any to avoid deeply nested / recursive type instantiation from Supabase query builder
    let query: any = supabase.from('reviews').select('rating').eq('business_id', businessId);

    // If productId is provided, filter for product-specific reviews
    if (productId) {
        query = query.eq('product_id', productId);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Error calculating average rating: ${error.message}`);
    }

    if (!data || data.length === 0) {
        return 0;
    }

    // Calculate average
    const sum = data.reduce((acc: number, review: any) => acc + Number(review.rating), 0);
    const average = sum / data.length;

    // Round to 1 decimal place
    return Math.round(average * 10) / 10;
}


/**
 * Checks if a user has already reviewed a specific business or product.
 * @param userId - The ID of the user.
 * @param businessId - The ID of the business.
 * @param productId - The ID of the product (optional).
 * @returns The existing review if found, null otherwise.
 */
export async function checkUserReviewExists(userId: string, businessId: string, productId?: string): Promise<Review | null> {
    // cast to any to avoid deeply nested / recursive type instantiation from Supabase query builder
    let query: any = supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId)
        .eq('business_id', businessId);

    // If productId is provided, filter for product-specific reviews
    // If productId is null/undefined, we're checking for business-only reviews
    if (productId) {
        query = query.eq('product_id', productId);
    } else {
        query = query.is('product_id', null);
    }

    const { data, error } = await query.single();

    if (error) {
        // If no rows found, return null (user hasn't reviewed yet)
        if (error.code === 'PGRST116') {
            return null;
        }
        throw new Error(`Error checking user review: ${error.message}`);
    }

    if (!data) {
        return null;
    }

    // Return the review with proper typing
    return {
        ...data,
        rating: Number(data.rating),
    };
}