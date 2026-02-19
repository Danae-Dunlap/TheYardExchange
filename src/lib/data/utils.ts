import { supabase } from "@/integrations/supabase/client";
import type {Business, UserProfile, Product, Review, BusinessQuery, ReviewQuery, Category, BusinessEvent, ContactInfo} from "../interfaces";

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
    if (filters.category) { query = query.eq('category', filters.category as Category);  console.log("Category filter applied:", filters.category);}
    if (filters.min_price) { query = query.gte('price_range[0]', filters.min_price); console.log("Min price filter applied:", filters.min_price);}
    if (filters.max_price) { query = query.lte('price_range[1]', filters.max_price); console.log("Max price filter applied:", filters.max_price);}

    const {data, error} = await query;
    if (error) {throw new Error(`Error fetching businesses: ${error.message}`);}
    if (!data) {return null;}

    //Format data to match Business interface
    const businesses: Promise<Business[] | null> = Promise.all(data.map(async (business: any) => {
        // Get owner name from profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', business.owner_id)
            .single();
        
        const ownerName = profile?.full_name || 'Unknown';
        
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
            description: business.description,
            logo_url: logoUrl,
            contact_info: business.contact_info ? (business.contact_info as ContactInfo) : undefined,
            products: await fetchProducts(String(business.id)),
            price_range: business.price_range && Array.isArray(business.price_range) ? business.price_range.join('-') : business.price_range || '',
            hours_of_operation: business.hours_of_operation,
            tags: business.tags,
            user_views: Number(business.user_views || 0),
            most_popular_products: business.most_popular_products || null,
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
    const priceRange = business.price_range ? business.price_range.split('-') : null;
    
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
    }
    
    const {error} = await supabase.from('businesses').insert({
        id: business.id,
        name: business.name, 
        owner_id: business.owner_id,
        category: business.category as Category, 
        description: business.description || null,
        logo_url: logoUrl,
        contact_info: business.contact_info || null,
        hours_of_operation: business.hours_of_operation,
        tags: business.tags || null,
        deal: business.deal || null,
        price_range: priceRange || null,
        user_views: business.user_views || 0,
        most_popular_products: business.most_popular_products || null,
    }); 

    if(error){throw new Error(`Error inserting business: ${error.message}`);}
}

/**
 * Update an existing business in the database.
 * 
 * @param business business data
 */
export async function updateBusiness(business: Business): Promise<void> {
    const priceRange = business.price_range ? business.price_range.split('-') : null;
    const {error} = await supabase.from('businesses').update({
        name: business.name, 
        owner_id: business.owner_id,
        category: business.category, 
        description: business.description || null,
        logo_url: business.logo_url || null,
        deal: business.deal || null,
        contact_info: business.contact_info || null,
        hours_of_operation: business.hours_of_operation,
        tags: business.tags || null,
        price_range: priceRange || null,
        user_views: business.user_views,
        most_popular_products: business.most_popular_products,
        user_sentiments: business.user_sentiments || null,
    }).eq('id', business.id);

    if(error){throw new Error(`Error updating business: ${error.message}`);}
}

/**
 * Fetch business by owner ID
 * 
 * @param ownerId - The owner's user ID
 * @returns A promise that resolves to business data or null
 */
export async function fetchBusinessByOwner(ownerId: string): Promise<Business | null> {
    const {data, error} = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', ownerId)
        .maybeSingle();

    if (error) {throw new Error(`Error fetching business: ${error.message}`);}
    if (!data) {return null;}

    // Get owner name from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', ownerId)
        .single();
    
    const ownerName = profile?.full_name || 'Unknown';
    
    // Get logo URL if it exists
    let logoUrl = data.logo_url;
    if (logoUrl && !logoUrl.startsWith('http')) {
        const { data: logoData } = await supabase.storage
            .from('businesses')
            .getPublicUrl(logoUrl);
        logoUrl = logoData?.publicUrl || logoUrl;
    }

    return {
        id: data.id,
        name: data.name,
        owner_id: data.owner_id,
        owner_name: ownerName,
        category: data.category,
        description: data.description,
        logo_url: logoUrl,
        contact_info: data.contact_info ? (data.contact_info as ContactInfo) : undefined,
        products: await fetchProducts(String(data.id)),
        price_range: data.price_range && Array.isArray(data.price_range) ? data.price_range.join('-') : data.price_range || '',
        hours_of_operation: data.hours_of_operation,
        tags: data.tags,
        user_views: Number(data.user_views || 0),
        most_popular_products: data.most_popular_products || null,
        user_sentiments: data.user_sentiments,
        reviews: data.reviews,
    };
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
 * @param business - The array of business IDs to fetch products for.
 * @param product_id - ID value used to fetch most popular products
 * @returns A promise that resolves to an array of product data
 * @throws Error if the fetch operation fails.
 */
export async function fetchProducts(business_id?: string, product_id?: string): Promise<Product[] | null> {
    let query = supabase.from('products').select('*').eq('business_id', business_id);

    if(product_id) {query = query.eq('id', product_id);}
    const {data, error} = await query;

    if (error) {throw new Error(`Error fetching products: ${error.message}`);}
    if(!data) {return null;}

    //Format data to match Product interface
    const products: Promise<Product[] | null> = Promise.all(data.map(async (product: any) => {
        return{
            id: product.id,
            name: product.product_name,
            business_id: product.business_id,
            description: product.description,
            images: product.images,
            price: Number(product.price),
            rating: product.rating ? Number(product.rating) : null,
            tags: product.tags,
            is_service: product.is_service,
            duration: product.duration,
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
 * @param product Product data
 * @param imageFile Optional image file to upload
 * @throws Error if the insert operation fails.
 */
export async function insertProduct(product: Product, imageFile?: File): Promise<void> {
    let imagePath = null;
    
    // Upload image if provided
    if (imageFile) {
        const fileName = `${product.id}/image/${imageFile.name}`;
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
    
    const {error} = await supabase.from('products').insert({
        id: product.id,
        product_name: product.name,
        business_id: product.business_id,
        description: product.description || null,
        images: imagePath ? [imagePath] : null,
        price: product.price,
        rating: product.rating || null,
        tags: product.tags || null,
        reviews: product.reviews || null,
        user_views: product.user_views || 0,
        user_sentiments: product.user_sentiments || null,
        is_service: product.is_service || false,
        duration: product.duration || null,
        category: product.tags?.[0] || null, // Use first tag as category if available
    }); 

    if(error){throw new Error(`Error inserting product: ${error.message}`);}
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
    let query = supabase.from('reviews').select('*');

    if (filters.id) { query = query.eq('id', filters.id); }
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

/**
 * Fetches a businesses' event from the database.
 * 
 * @param business_id used to find events
 * @returns a list of events tied to the business
 */
export async function fetchEvents(business_id: string): Promise<BusinessEvent[] | null> {
    const {data, error} = await supabase.from('events').select('*').eq('business_id', business_id);
    if(error){throw new Error(`Error fetching events: ${error.message}`);}
    
    const events = data.map((event: any) => {
        return{
            id: event.id,
            business_id: event.business_id,
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
    const {error} = await supabase.from('events').insert({
        id: event.id,
        business_id: event.business_id,
        title: event.title,
        description: event.description || null,
        start_date: event.start_date.toISOString(),
        end_date: event.end_date.toISOString(),
    }); 
    if(error){throw new Error(`Error inserting event: ${error.message}`);}
}

/**
 * Updates an existing event in the database.
 * 
 * @param event event data
 * @throws Error if the update operation fails.
 */
export async function updateEvent(event: BusinessEvent): Promise<void> {
    const {error} = await supabase.from('events').update({
        title: event.title,
        description: event.description || null,
        start_date: event.start_date.toISOString(),
        end_date: event.end_date.toISOString(),
    }).eq('id', event.id);
    if(error){throw new Error(`Error updating event: ${error.message}`);}
}

/**
 * Deletes an event from the database.
 * 
 * @param eventId 
 * @throws Error if the delete operation fails.
 */
export async function deleteEvent(eventId: string): Promise<void> {
    const {error} = await supabase.from('events').delete().eq('id', eventId);
    if(error){throw new Error(`Error deleting event: ${error.message}`);}
}

function formatContactInfo(contact_info: string): ContactInfo {
    if (!contact_info) {
        return {};
    }
    try {
        const contacts = typeof contact_info === 'string' ? JSON.parse(contact_info) : contact_info;
        const business_contacts: ContactInfo = {
            email: contacts.email, 
            tiktok: contacts.tiktok,
            instagram: contacts.instagram,
            phone_number: contacts.phone_number,
            website: contacts.website,
            facebook: contacts.facebook,
        }
        return business_contacts;
    } catch (error) {
        console.error("Error parsing contact info:", error);
        return {};
    }
}