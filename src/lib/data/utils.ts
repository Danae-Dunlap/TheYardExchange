import { supabase } from "@/integrations/supabase/client";
import { deterministicRecommendIdsWithContext } from "@/lib/ai/aiFallback";
import { parseRecommendEdgeResponse } from "@/lib/ai/aiService";
import type { Business, UserProfile, Product, Review, BusinessQuery, ReviewQuery, Category, BusinessPromotion, BusinessEvent, ContactInfo } from "../interfaces";
import type { Json } from "@/integrations/supabase/types";
import type {
    ProfileViewRange,
    ProfileViewPoint,
    TopLikedPostSummary,
    InsightsResult,
    ViewPeriodComparison,
} from "@/lib/dashboard/storefrontInsights";
import { errResult, okResult, toUserFacingError } from "@/lib/dashboard/storefrontInsights";

/**
 * Fetch business data from the database.
 *
 * @param filters - The query parameters to filter businesses.
 * @param search_string - The string used to search in business name, description, category, and tags
 * @param is_featured - Used to fetch featured businesses
 * @param owner_id - Used to fetch businesses by owner ID
 * @returns A promise that resolves to an array of business data
 * @throws Error if the fetch operation fails.
 */
export async function fetchBusiness(filters?: BusinessQuery, search_string?: string, is_featured?: boolean, owner_id?: string): Promise<Business[] | null> {

    let query = supabase.from('businesses').select('*');

    if (search_string) { query = query.select().textSearch('find_business', search_string); }
    if (is_featured !== undefined) { query = query.eq('is_featured', is_featured); }

    //Apply filters based on query parameters
    if (filters) {
        if (filters.owner_id) { query = query.eq('owner_id', filters.owner_id); }
        if (filters.category) { query = query.eq('category', filters.category as Category); }
        if (filters.business_id) {
            query = query.in('id', filters.business_id);
        }
    }

    if (owner_id) { query = query.eq('owner_id', owner_id); }

    // Only show hidden businesses to their owner; hide from all other queries
    if (!owner_id && !filters?.owner_id) {
        query = query.eq('is_hidden', false);
    }
    const { data, error } = await query;
    if (error) { throw new Error(`Error fetching businesses: ${error.message}`); }
    if (!data) { return null; }

    //Format data to match Business interface
    const businesses: Promise<Business[] | null> = Promise.all(data.map(async (business: any) => {
        // Get owner name from profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name,username')
            .eq('id', business.owner_id)
            .single();

        const ownerName = profile?.full_name || profile?.username || 'Unknown';

        // Get logo URL if it exists
        let logoUrl = business.logo_url;
        if (logoUrl && !logoUrl.startsWith('http')) {
            const { data: logoData } = await supabase.storage
                .from('businesses')
                .getPublicUrl(logoUrl);
            logoUrl = logoData?.publicUrl || logoUrl;
        }

        return {
            id: business.id,
            name: business.name,
            owner_id: business.owner_id,
            owner_name: ownerName,
            category: business.category,
            location: business.location,
            description: business.description,
            logo_url: logoUrl,
            contact_info: business.contact_info ? (business.contact_info as ContactInfo) : undefined,
            price_range: business.price_range,
            hours_of_operation: business.hours_of_operation,
            tags: business.tags,
            rating: business.rating ? Number(business.rating) : 0,
            user_views: Number(business.user_views || 0),
            users_favorited: business.users_favorited,
            most_popular_products: business.most_popular_products || null,
            reviews: business.reviews,
        }
    }));

    let result = await businesses;

    // Client-side price filtering
    if (filters?.min_price || filters?.max_price) {
        const minPrice = filters.min_price ? parseFloat(filters.min_price) : 0;
        const maxPrice = filters.max_price ? parseFloat(filters.max_price) : Infinity;

        result = result?.filter(business => {
            if (!business.price_range || business.price_range.length < 2) return true;
            return business.price_range[0] >= minPrice && business.price_range[1] <= maxPrice;
        }) || null;
    }

    return result;
}

/**
 * Insert a new business into the database. Adds the business id to the user's profile
 * 
 * @param business business data
 */
export async function insertBusiness(business: Business): Promise<void> {

    // Handle logo upload if provided
    let logoUrl = null;
    if (business.logo_url) {
        // If logo_url is already a URL (from storage), use it directly
        // Otherwise, it's a file name and we need to construct the path
        if (business.logo_url.startsWith('http')) {
            logoUrl = business.logo_url;
        } else {
            const fileName = `${business.id}/logo/${business.logo_url}`;
            logoUrl = fileName;
        }
    } else {
        //Backup Photo URL
        logoUrl = "https://trpkzqwrjbmxlqftrosn.supabase.co/storage/v1/object/public/businesses/default/default-business-photo.png";
    }

    const { error } = await supabase.from('businesses').insert({
        id: business.id,
        name: business.name,
        owner_id: business.owner_id,
        category: business.category as Category,
        description: business.description || null,
        logo_url: logoUrl,
        contact_info: business.contact_info || null,
        hours_of_operation: business.hours_of_operation as unknown as Json,
        tags: business.tags || null,
        deal: business.deal || null,
        price_range: business.price_range || null,
        user_views: business.user_views || 0,
        users_favorited: business.users_favorited || 0,
        most_popular_products: business.most_popular_products || null,
        location: business.location,
    });

    const { error: userError } = await supabase.from('profiles').update({
        business_id: business.id
    }).eq('id', business.owner_id);

    if (error) { throw new Error(`Error inserting business: ${error.message}`); }
    if (userError) { throw new Error(`Error updating profile: ${userError.message}`); }
}

/**
 * Update an existing business in the database.
 * 
 * @param business business data
 */
export async function updateBusiness(business: Business): Promise<void> {
    const { error } = await supabase.from('businesses').update({
        name: business.name,
        category: business.category,
        description: business.description || null,
        logo_url: business.logo_url || null,
        deal: business.deal || null,
        contact_info: business.contact_info || null,
        hours_of_operation: business.hours_of_operation as unknown as Json,
        tags: business.tags || null,
        price_range: business.price_range || null,
        user_views: business.user_views || 0,
        most_popular_products: business.most_popular_products || null,
        users_favorited: business.users_favorited || 0
    }).eq('id', business.id);

    if (error) { throw new Error(`Error updating business: ${error.message}`); }
}


/**
 * Delete a business from the database. All related rows are deleted automatically through cascade delete.
 * 
 * @param businessId 
 */
export async function deleteBusiness(businessId: string, user_id: string): Promise<void> {
    const { error: businessError } = await supabase.from('businesses').delete().eq('id', businessId);
    const { error: userError } = await supabase.from('profiles').update({ business_id: null }).eq('id', user_id);
    const { error: roleError } = await supabase.from('user_roles').update({ role: 'consumer' }).eq('user_id', user_id);
    const { error: imageError } = await supabase.storage.from('businesses').remove([`${businessId}/logo/`]);
    const { error: productImageError } = await supabase.storage.from('products').remove([`${businessId}/**`]);

    if (businessError) { throw new Error(`Error deleting business: ${businessError.message}`); }
    if (userError) { throw new Error(`Error updating profile: ${userError.message}`); }
    if (roleError) { throw new Error(`Error deleting role: ${roleError.message}`); }
    if (imageError) { throw new Error(`Error deleting logo: ${imageError.message}`); }
    if (productImageError) { throw new Error(`Error deleting product images: ${productImageError.message}`); }
}

/**
 * Fetch product data from the database.
 *
 * @param business - The array of business IDs to fetch products for.
 * @param product_id - ID value used to fetch most popular products
 * @returns A promise that resolves to an array of product data
 * @throws Error if the fetch operation fails.
 */
export async function fetchProducts(business_id?: string, is_fav?: boolean, product_id?: string[]): Promise<Product[] | null> {
    let query = supabase.from('products').select('*')

    if (business_id) { query = query.eq('business_id', business_id); }
    if (is_fav) { query = query.eq('is_favorite', is_fav); }
    if (product_id && product_id.length > 0) { query = query.in('id', product_id); }

    const { data, error } = await query;
    if (error) { throw new Error(`Error fetching products: ${error.message}`); }
    if (!data) { return null; }

    //Format data to match Product interface
    const products: Promise<Product[] | null> = Promise.all(data.map(async (product: any) => {
        return {
            id: product.id,
            name: product.product_name,
            business_id: product.business_id,
            business_name: product.business_name,
            description: product.description,
            image: product.images,
            price: Number(product.price),
            rating: product.rating ? Number(product.rating) : null,
            tags: product.tags ? product.tags.join(", ") : null,
            is_fav: product.is_favorite,
            is_service: product.is_service,
            duration: product.duration,
            category: product.category,
            reviews: product.reviews || null,
            user_views: Number(product.user_views),
            user_favorited: product.users_favorited,
        }
    }));

    return products;
}

/**
 * Insert a new product into the database.
 * 
 * @param product Product data
 * @param imageFile Optional image file to upload
 * @throws Error if the insert operation fails.
 */
export async function insertProduct(product: Product, imageFile?: File): Promise<void> {
    let imagePath: string = null;

    // Upload image if provided
    if (imageFile) {
        const fileName = `${product.business_id}/${product.id}/image/${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(fileName, imageFile, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            throw new Error(`Error uploading product image: ${uploadError.message}`);
        }

        // Get public URL
        const { data: imageData } = await supabase.storage
            .from('products')
            .getPublicUrl(fileName);

        imagePath = imageData?.publicUrl || fileName;
    } else if (product.image) {
        // If image is already a URL, use it
        imagePath = product.image;
    }
    const productTags = product.tags ? product.tags.split(", ").map((tag) => tag.trim()) : null
    const { error } = await supabase.from('products').insert({
        id: product.id,
        product_name: product.name,
        business_id: product.business_id,
        business_name: product.business_name,
        description: product.description || null,
        images: imagePath ? imagePath : null,
        price: product.price,
        user_views: product.user_views || 0,
        is_service: product.is_service || false,
        duration: product.duration || null,
        tags: productTags,
        rating: 0,
        users_favorited: 0,
        category: productTags && productTags.length > 0 ? productTags[0] : null, // Use first tag as category if available
    });

    if (error) { throw new Error(`Error inserting product: ${error.message}`); }

    // Recalculate price range from all products to ensure accuracy
    await recalculatePriceRange(product.business_id);
}

/**
 * Update an existing product in the database.
 * 
 * @param product 
 * @throws Error if the update operation fails.
 */
export async function updateProduct(product: Product, imageFile?: File): Promise<void> {
    let imagePath: string = null;

    //Delete old image, if new image is provided
    if (product.image && imageFile) {
        const { error: deleteImageError } = await supabase.storage.from('products').remove([`${product.image}`]);
        if (deleteImageError) {
            throw new Error(`Error deleting old product image: ${deleteImageError.message}`);
        }
    }

    // Upload image if provided
    if (imageFile) {
        const fileName = `${product.business_id}/${product.id}/image/${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(fileName, imageFile, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            throw new Error(`Error uploading product image: ${uploadError.message}`);
        }

        // Get public URL
        const { data: imageData } = await supabase.storage
            .from('products')
            .getPublicUrl(fileName);

        imagePath = imageData?.publicUrl || fileName;
    } else if (product.image) {
        // If image is already a URL, use it
        imagePath = product.image;
    } else {
        imagePath = null;
    }

    const { error } = await supabase.from('products').update({
        product_name: product.name,
        business_name: product.business_name,
        description: product.description || null,
        duration: product.duration || null,
        is_service: product.is_service,
        images: imagePath,
        price: product.price,
        user_views: product.user_views,
        tags: product.tags ? product.tags.split(", ").map((tag) => tag.trim()) : null,
    }).eq('id', product.id);

    if (error) { throw new Error(`Error updating product: ${error.message}`); }

    // Recalculate price range from all products to ensure accuracy
    await recalculatePriceRange(product.business_id);
}

/**
 * Delete a product from the database.
 * 
 * @param productId 
 * @throws Error if the delete operation fails.
 */
export async function deleteProduct(productId: string): Promise<void> {
    // Get business_id before deleting product (needed for price range recalculation)
    const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('business_id')
        .eq('id', productId)
        .single();

    if (fetchError) {
        throw new Error(`Error fetching product: ${fetchError.message}`);
    }

    const businessId = product?.business_id;

    const { error: deleteImageError } = await supabase.storage.from('products').remove([`${businessId}/${productId}/*`]);
    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (deleteImageError) { throw new Error(`Error deleting product image: ${deleteImageError.message}`); }
    if (error) { throw new Error(`Error deleting product: ${error.message}`); }

    // Recalculate price range from remaining products
    if (businessId) {
        await recalculatePriceRange(businessId);
    }
}

export async function fetchSimilarProducts(product: Product): Promise<Product[]> {
    const allProducts = await fetchProducts();
    if (!allProducts || allProducts.length === 0) {
        return [];
    }

    //Build product context
    const productContext = {
        product_name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        tags: product.tags,
    };

    try {
        const { data, error } = await supabase.functions.invoke("recommendProduct", {
            body: { productContext, products: allProducts },
        });
        console.log("recommendProduct invoke result", { data, error });
        if (error) {
            console.warn(JSON.stringify({
                tag: "[AI:client]",
                event: "recommend_fallback",
                invokeError: true,
                invokeMessage: error.message,
                invokeDetails: error.details,
                data,
            }));
            return [];
        }

        if (data && typeof data === "object" && "error" in data) {
            console.warn(JSON.stringify({
                tag: "[AI:client]",
                event: "recommend_edge_error_payload",
                edgeError: (data as any).error,
                data,
            }));
            return [];
        }

        const parsed = parseRecommendEdgeResponse(data);
        const ids = parsed.recommendedIds;

        if (parsed.fallback) {
            console.warn(JSON.stringify({
                tag: "[AI:client]",
                event: "recommend_fallback",
                edgeFallback: true,
            }));
        }

        if (!ids || ids.length === 0) {
            return [];
        }

        const recommended = await fetchProducts(null, null, ids);
        return recommended || [];
    } catch (e) {
        throw new Error(`Error fetching similar products: ${e instanceof Error ? e.message : String(e)}`);
    }
}

/**
 * Fetch profile data from the database.
 *
 * @param query - The query parameters to filter profiles.
 * @returns A promise that resolves to an array of profile data
 * @throws Error if the fetch operation fails.
 */
export async function fetchProfile(user_id: string): Promise<UserProfile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user_id);

    if (error) { throw new Error(`Error fetching profile: ${error.message}`); }
    if (!data || data.length === 0) { return null; }

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
            interests: profile.user_interests || [],
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
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', profileId);
    const { error: imageError } = await supabase.storage.from('account_images').remove([`${profileId}/avatar/`]);

    if (profileError) { throw new Error(`Error deleting profile: ${profileError?.message}`); }
    if (imageError) { throw new Error(`Error deleting profile image: ${imageError.message}`); }
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
    query = query.order('created_at', { ascending: false }); // Order reviews by most recent first

    const { data, error } = await query;
    if (!data) { return null; }
    if (error) { throw new Error(`Error fetching reviews: ${error.message}`); }

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
    const { error } = await supabase.from('reviews').insert({
        id: review.id,
        user_id: review.user_id,
        business_id: review.business_id,
        product_id: review.product_id || null,
        rating: review.rating,
        comment: review.comment || null,

    });
    if (error) { throw new Error(`Error inserting review: ${error.message}`); }

    // Keep business-level rating in sync after every review write.
    await recalculateBusinessRating(review.business_id);
}

/**
 * Deletes a review from the database.
 * 
 * @param reviewId 
 * @throws Error if the delete operation fails.
 */
export async function deleteReview(reviewId: string, businessId?: string): Promise<void> {
    let resolvedBusinessId = businessId;

    if (!resolvedBusinessId) {
        const { data: reviewData, error: reviewFetchError } = await supabase
            .from('reviews')
            .select('business_id')
            .eq('id', reviewId)
            .single();

        if (reviewFetchError) {
            throw new Error(`Error fetching review before delete: ${reviewFetchError.message}`);
        }
        resolvedBusinessId = reviewData?.business_id;
    }

    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) { throw new Error(`Error deleting review: ${error.message}`); }

    if (resolvedBusinessId) {
        // Recompute average after delete so listing/detail ratings stay accurate.
        await recalculateBusinessRating(resolvedBusinessId);
    }
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

/**
* Fetches a businesses' event from the database.
* 
* @param business_id used to find events
* @returns a list of events tied to the business
*/
export async function fetchEvents(business_id: string): Promise<BusinessEvent[] | null> {
    const { data, error } = await supabase.from('events').select('*').eq('business_id', business_id);
    if (error) { throw new Error(`Error fetching events: ${error.message}`); }

    const events = data.map((event: any) => {
        return {
            id: event.id,
            business_id: event.business_id,
            business_name: event.business_name,
            title: event.title,
            description: event.description,
            start_date: new Date(event.start_date),
            end_date: new Date(event.end_date),
        }
    });

    return events;
}

/**
 * Inserts a new event into the database.
 * 
 * @param event event data
 * @throws Error if the insert operation fails.
 */
export async function insertEvent(event: BusinessEvent): Promise<void> {
    const { error } = await supabase.from('events').insert({
        id: event.id,
        business_id: event.business_id,
        business_name: event.business_name,
        title: event.title,
        description: event.description || null,
        start_date: event.start_date.toISOString(),
        end_date: event.end_date.toISOString(),
    });
    if (error) { throw new Error(`Error inserting event: ${error.message}`); }
}

/**
 * Updates an existing event in the database.
 * 
 * @param event event data
 * @throws Error if the update operation fails.
 */
export async function updateEvent(event: BusinessEvent): Promise<void> {
    const { error } = await supabase.from('events').update({
        title: event.title,
        description: event.description || null,
        start_date: event.start_date.toISOString(),
        end_date: event.end_date.toISOString(),
    }).eq('id', event.id);
    if (error) { throw new Error(`Error updating event: ${error.message}`); }
}

/**
 * Deletes an event from the database.
 * 
 * @param eventId 
 * @throws Error if the delete operation fails.
 */
export async function deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) { throw new Error(`Error deleting event: ${error.message}`); }
}

/**
 * Fetches AI-powered business recommendations based on the user's past activity.
 *
 * @param profile - The user's profile containing activity data
 * @returns Up to 4 recommended businesses
 */
export async function fetchRecommendedBusinesses(profile: UserProfile): Promise<Business[]> {
    // Fetch all visible businesses
    const allBusinesses = await fetchBusiness();
    if (!allBusinesses || allBusinesses.length === 0) return [];

    // Exclude user's own business
    const catalog = allBusinesses.filter((b) => b.id !== profile.business_id);

    // Build user context
    const recentTags = profile.recent_tags ?? [];
    const recentSearches = (profile.recent_searches ?? []).slice(0, 5);

    // Derive favorite categories from favorited businesses
    let favoriteCategories: string[] = [];
    if (profile.favorite_businesses && profile.favorite_businesses.length > 0) {
        const favBusinesses = await fetchBusiness({ business_id: profile.favorite_businesses });
        favoriteCategories = [...new Set((favBusinesses ?? []).map((b) => b.category as string))];
    }

    const userContext = { recent_tags: recentTags, favorite_categories: favoriteCategories, recent_searches: recentSearches };

    // Build trimmed catalog for AI (keep payload small)
    const trimmedCatalog = catalog.map((b) => ({
        id: b.id,
        name: b.name,
        category: b.category,
        tags: b.tags ?? [],
        price_range: b.price_range ?? null,
        users_favorited: b.users_favorited,
    }));

    try {
        const { data, error } = await supabase.functions.invoke("recommend", {
            body: { userContext, businesses: trimmedCatalog },
        });

        const parsed = parseRecommendEdgeResponse(error ? null : data);
        let ids = parsed.recommendedIds;

        // Redundancy: deterministic fallback when invoke fails or no ids (Edge may still set fallback: true with ids)
        if (error || ids.length === 0) {
            console.warn(
                JSON.stringify({
                    tag: "[AI:client]",
                    event: "recommend_fallback",
                    invokeError: Boolean(error),
                    emptyIds: ids.length === 0,
                    edgeFallback: parsed.fallback,
                }),
            );
            ids = deterministicRecommendIdsWithContext(trimmedCatalog, userContext, 4);
        }

        if (ids.length === 0) return [];

        const recommended = await fetchBusiness({ business_id: ids });
        return recommended ?? [];
    } catch (e) {
        console.warn(
            JSON.stringify({
                tag: "[AI:client]",
                event: "recommend_invoke_exception",
                error: e instanceof Error ? e.message : String(e),
            }),
        );
        const ids = deterministicRecommendIdsWithContext(trimmedCatalog, userContext, 4);
        if (ids.length === 0) return [];
        const recommended = await fetchBusiness({ business_id: ids });
        return recommended ?? [];
    }
}

/**
 * Recalculates the price range for a business based on ALL its products.
 * This ensures the price range is always accurate and derived only from products.
 * 
 * @param businessId - The ID of the business to recalculate
 * @returns The updated price range [min, max] or null if no products
 * @throws Error if fetch or update fails
 */
export async function recalculatePriceRange(businessId: string): Promise<number[] | null> {
    // Fetch all products for this business
    const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('price')
        .eq('business_id', businessId);

    if (fetchError) {
        throw new Error(`Error fetching products for price range: ${fetchError.message}`);
    }

    // If no products, set price_range to null
    if (!products || products.length === 0) {
        const { error: updateError } = await supabase
            .from('businesses')
            .update({ price_range: null })
            .eq('id', businessId);

        if (updateError) {
            throw new Error(`Error updating business price range: ${updateError.message}`);
        }
        return null;
    }

    // Calculate min and max from ALL products
    const prices = products.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const updatedPriceRange = [minPrice, maxPrice];

    // Update the business
    const { error: updateError } = await supabase
        .from('businesses')
        .update({ price_range: updatedPriceRange })
        .eq('id', businessId);

    if (updateError) {
        throw new Error(`Error updating business price range: ${updateError.message}`);
    }

    return updatedPriceRange;
}

/**
 * Recalculates and persists business rating from all business-level reviews.
 *
 * @param businessId - The business to update
 * @returns The calculated average rating
 */
export async function recalculateBusinessRating(businessId: string): Promise<number> {
    const averageRating = await calculateAverageRating(businessId);
    const { error } = await supabase
        .from('businesses')
        .update({ rating: averageRating })
        .eq('id', businessId);

    if (error) {
        throw new Error(`Error updating business rating: ${error.message}`);
    }

    return averageRating;
}

/**
 * Fetches all promotions for a given business.
 * 
 * @param businessId business to search for
 * @returns a list of promotion data
 */
export async function fetchPromotions(businessId: string): Promise<BusinessPromotion[]> {
    const now: Date = new Date();

    const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('business_id', businessId)
        .or('is_active.eq.true,start_date.lte.' + now.toISOString());

    if (error) {
        throw new Error(`Error fetching promotions: ${error.message}`);
    }

    const promotion: Promise<BusinessPromotion[] | null> = Promise.all(data.map(async (promotion: any) => {
        return {
            id: promotion.id,
            business_id: promotion.business_id,
            start_date: promotion.start_date,
            end_date: promotion.end_date,
            title: promotion.title,
            is_upcoming: promotion.start_date >= now,
            description: promotion.description,
        }
    }));

    return promotion;
}

function isViewEventRow(row: unknown): row is { viewed_at: string } {
    return (
        typeof row === "object" &&
        row !== null &&
        "viewed_at" in row &&
        typeof (row as { viewed_at: unknown }).viewed_at === "string"
    );
}

function isPostSummaryRow(row: unknown): row is { id: string; content: string; created_at: string } {
    if (typeof row !== "object" || row === null) return false;
    const r = row as Record<string, unknown>;
    return (
        typeof r.id === "string" &&
        typeof r.content === "string" &&
        typeof r.created_at === "string"
    );
}

function isPostLikeRow(row: unknown): row is { post_id: string } {
    return (
        typeof row === "object" &&
        row !== null &&
        "post_id" in row &&
        typeof (row as { post_id: unknown }).post_id === "string"
    );
}

function formatLocalDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function startOfWeekMonday(d: Date): Date {
    const x = new Date(d);
    const day = x.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    x.setDate(x.getDate() + diff);
    x.setHours(0, 0, 0, 0);
    return x;
}

type BucketDef = { key: string; label: string };

function buildViewBuckets(range: ProfileViewRange): BucketDef[] {
    const now = new Date();
    const buckets: BucketDef[] = [];
    if (range === 'month') {
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            buckets.push({
                key: formatLocalDateKey(d),
                label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            });
        }
    } else if (range === '6months') {
        const thisWeekStart = startOfWeekMonday(now);
        for (let i = 25; i >= 0; i--) {
            const ws = new Date(thisWeekStart);
            ws.setDate(ws.getDate() - i * 7);
            buckets.push({
                key: formatLocalDateKey(ws),
                label: ws.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            });
        }
    } else {
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            buckets.push({
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
            });
        }
    }
    return buckets;
}

function bucketKeyForViewEvent(viewedAt: string, range: ProfileViewRange): string {
    const d = new Date(viewedAt);
    if (range === 'month') {
        return formatLocalDateKey(d);
    }
    if (range === '6months') {
        return formatLocalDateKey(startOfWeekMonday(d));
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function rangeStartDate(range: ProfileViewRange): Date {
    const now = new Date();
    const start = new Date(now);
    if (range === 'month') {
        start.setDate(start.getDate() - 29);
    } else if (range === '6months') {
        start.setMonth(start.getMonth() - 6);
    } else {
        start.setFullYear(start.getFullYear() - 1);
    }
    start.setHours(0, 0, 0, 0);
    return start;
}

/**
 * Profile views over time for the business dashboard chart (owner-only read via RLS).
 */
export async function fetchProfileViewSeries(
    businessId: string,
    range: ProfileViewRange,
): Promise<InsightsResult<ProfileViewPoint[]>> {
    if (!businessId.trim()) {
        return errResult("Missing business identifier.");
    }

    try {
        const buckets = buildViewBuckets(range);
        const keySet = new Set(buckets.map((b) => b.key));
        const counts = new Map<string, number>();
        for (const b of buckets) {
            counts.set(b.key, 0);
        }

        const start = rangeStartDate(range);
        const { data, error } = await supabase
            .from("business_profile_view_events")
            .select("viewed_at")
            .eq("business_id", businessId)
            .gte("viewed_at", start.toISOString());

        if (error) {
            return errResult(`Could not load profile views: ${error.message}`);
        }

        for (const row of data ?? []) {
            if (!isViewEventRow(row)) continue;
            const k = bucketKeyForViewEvent(row.viewed_at, range);
            if (keySet.has(k)) {
                counts.set(k, (counts.get(k) || 0) + 1);
            }
        }

        const series: ProfileViewPoint[] = buckets.map((b) => ({
            label: b.label,
            views: counts.get(b.key) || 0,
        }));
        return okResult(series);
    } catch (e) {
        return errResult(toUserFacingError(e));
    }
}

/**
 * Compares the last 30 days of profile views to the prior 30 days.
 */
export async function fetchProfileViewPeriodComparison(
    businessId: string,
): Promise<InsightsResult<ViewPeriodComparison>> {
    if (!businessId.trim()) {
        return errResult("Missing business identifier.");
    }

    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date(now);
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const { count: recent, error: e1 } = await supabase
            .from("business_profile_view_events")
            .select("*", { count: "exact", head: true })
            .eq("business_id", businessId)
            .gte("viewed_at", thirtyDaysAgo.toISOString());

        const { count: previousWindow, error: e2 } = await supabase
            .from("business_profile_view_events")
            .select("*", { count: "exact", head: true })
            .eq("business_id", businessId)
            .gte("viewed_at", sixtyDaysAgo.toISOString())
            .lt("viewed_at", thirtyDaysAgo.toISOString());

        if (e1) {
            return errResult(`Could not load recent profile views: ${e1.message}`);
        }
        if (e2) {
            return errResult(`Could not load previous profile views: ${e2.message}`);
        }

        return okResult({ recent: recent ?? 0, previous: previousWindow ?? 0 });
    } catch (e) {
        return errResult(toUserFacingError(e));
    }
}

/**
 * Community posts for a user (business owner), ranked by like count.
 */
export async function fetchTopLikedPostsForOwner(
    ownerUserId: string,
    limit = 5,
): Promise<InsightsResult<TopLikedPostSummary[]>> {
    if (!ownerUserId.trim()) {
        return errResult("Missing owner identifier.");
    }
    if (!Number.isFinite(limit) || limit < 1) {
        return errResult("Invalid limit for top posts.");
    }

    try {
        const { data: rawPosts, error: postsError } = await supabase
            .from("posts")
            .select("id, content, created_at")
            .eq("user_id", ownerUserId)
            .order("created_at", { ascending: false });

        if (postsError) {
            return errResult(`Could not load community posts: ${postsError.message}`);
        }

        const posts = (rawPosts ?? []).filter(isPostSummaryRow);
        if (posts.length === 0) {
            return okResult([]);
        }

        const postIds = posts.map((p) => p.id);
        const { data: rawLikes, error: likesError } = await supabase
            .from("post_likes")
            .select("post_id")
            .in("post_id", postIds);

        if (likesError) {
            return errResult(`Could not load post likes: ${likesError.message}`);
        }

        const likeCount = new Map<string, number>();
        for (const id of postIds) {
            likeCount.set(id, 0);
        }
        for (const row of rawLikes ?? []) {
            if (!isPostLikeRow(row)) continue;
            likeCount.set(row.post_id, (likeCount.get(row.post_id) || 0) + 1);
        }

        const ranked: TopLikedPostSummary[] = posts
            .map((p) => ({
                id: p.id,
                content: p.content,
                created_at: p.created_at,
                likeCount: likeCount.get(p.id) || 0,
            }))
            .sort((a, b) => b.likeCount - a.likeCount)
            .slice(0, limit);

        return okResult(ranked);
    } catch (e) {
        return errResult(toUserFacingError(e));
    }
}

export type {
    ProfileViewRange,
    ProfileViewPoint,
    TopLikedPostSummary,
    InsightsResult,
    ViewPeriodComparison,
} from "@/lib/dashboard/storefrontInsights";
export { isProfileViewRange, toUserFacingError, PROFILE_VIEW_RANGES } from "@/lib/dashboard/storefrontInsights";
