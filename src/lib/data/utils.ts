import { supabase } from "@/integrations/supabase/client";
import type {Business, UserProfile, Product, Review, BusinessQuery, ReviewQuery} from "../interfaces";

/** UPDATE IMAGES column IN DATABASE */

/**
 * Fetch business data from the database.
 *
 * @param filters - The query parameters to filter businesses.
 * @param search_string - Search term used to look for businesses
 * @returns A promise that resolves to an array of business data
 * @throws Error if the fetch operation fails.
 */
export async function fetchBusiness(filters?: BusinessQuery, search_string?: string): Promise<Business[] | null> {
    if(!filters && !search_string){throw new Error('Must provide either filters and/or search term')}

    let query = supabase.from('businesses').select('*');

    if(search_string){query = query.select().textSearch('find_business', search_string)}

    //Apply filters based on query parameters
    if (filters.owner_id) { query = query.eq('owner_id', filters.owner_id); }
    if (filters.category) { query = query.eq('category', filters.category); }
    if (filters.min_price) { query = query.gte('price_range[0]', filters.min_price); }
    if (filters.max_price) { query = query.lte('price_range[1]', filters.max_price); }

    const {data, error} = await query;
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
    const {error} = await supabase.from('businesses').insert({
        id: business.id,
        name: business.name, 
        owner_id: business.owner_id, 
        owner_name: business.owner_name,
        category: business.category, 
        description: business.description || null,
        logo_url: business.logo_url ? `${business.id}/logo_url/${business.logo_url}` : null,
        products: business.products || null,
        contact_info: business.contact_info || null,
        hours_of_operation: business.hours_of_operation || null,
        tags: business.tags || null,
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
    
    const {error} = await supabase.from('businesses').update({
        name: business.name, 
        owner_id: business.owner_id,
        owner_name: business.owner_name,
        category: business.category, 
        description: business.description || null,
        logo_url: business.logo_url ? `${business.id}/logo_url/${business.logo_url}` : null,
        products: business.products || null,
        contact_info: business.contact_info || null,
        hours_of_operation: business.hours_of_operation || null,
        tags: business.tags || null,
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
 * Delete a business from the database.
 * 
 * @param businessId 
 */
export async function deleteBusiness(businessId: string, user_id: string): Promise<void> {

    const {error: businessError} = await supabase.from('businesses').delete().eq('id', businessId);
    const {error: productError} = await supabase.from('products').delete().eq('business_id', businessId);
    const {error: reviewError} = await supabase.from('reviews').delete().eq('business_id', businessId);
    const {error: profileError} = await supabase.from('user_roles').update({'role': 'consumer'}).eq('id', user_id);
    const {error: imageError} = await supabase.storage.from('businesses').remove([`${businessId}/logo/`]);

    if(businessError){throw new Error(`Error deleting business: ${businessError.message}`);}
    if(productError){throw new Error(`Error deleting products: ${productError.message}`);}  
    if(reviewError){throw new Error(`Error deleting reviews: ${reviewError.message}`);}
    if(profileError){throw new Error(`Error updating profile: ${profileError.message}`);}
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
        images:  product.images ? `${product.business_id}/images/${product.images}` : null,
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
        images:  product.images ? `${product.business_id}/images/${product.images}` : null,
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
export async function fetchReview(filters?: ReviewQuery): Promise<Review[] | null> {
    let query = supabase.from('reviews').select('*');

    if (filters.user_id) { query = query.eq('user_id', filters.user_id); }
    if (filters.business_id) { query = query.eq('business_id', filters.business_id); }

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