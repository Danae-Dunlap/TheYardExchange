import { supabase } from "@/integrations/supabase/client";
import type {
  Business,
  BusinessQuery,
  Category,
  ContactInfo,
} from "../interfaces";
import type { Json } from "@/integrations/supabase/types";
import {
  DEFAULT_BUSINESS_LOGO_URL,
  normalizePriceRangeBounds,
} from "@/lib/data/helpers";

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
export async function fetchBusiness(
  filters?: BusinessQuery,
  search_string?: string,
  is_featured?: boolean,
  owner_id?: string
): Promise<Business[] | null> {
  let query = supabase.from("businesses").select("*");

  if (search_string) {
    query = query.select().textSearch("find_business", search_string);
  }
  if (is_featured !== undefined) {
    query = query.eq("is_featured", is_featured);
  }

  if (filters) {
    if (filters.owner_id) {
      query = query.eq("owner_id", filters.owner_id);
    }
    if (filters.category) {
      query = query.eq("category", filters.category as Category);
    }
    if (filters.business_id) {
      query = query.in("id", filters.business_id);
    }
  }

  if (owner_id) {
    query = query.eq("owner_id", owner_id);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Error fetching businesses: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  const businesses: Promise<Business[] | null> = Promise.all(
    data.map(async (business: any) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,username")
        .eq("id", business.owner_id)
        .single();

      const ownerName = profile?.full_name || profile?.username || "Unknown";

      let logoUrl = business.logo_url;
      if (logoUrl && !logoUrl.startsWith("http")) {
        const { data: logoData } = await supabase.storage
          .from("businesses")
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
        contact_info: business.contact_info
          ? (business.contact_info as ContactInfo)
          : undefined,
        price_range: business.price_range,
        hours_of_operation: business.hours_of_operation,
        tags: business.tags,
        user_views: Number(business.user_views || 0),
        users_favorited: business.users_favorited,
        most_popular_products: business.most_popular_products || null,
        reviews: business.reviews,
      };
    })
  );

  let result = await businesses;

  if (filters?.min_price || filters?.max_price) {
    const { min: minPrice, max: maxPrice } = normalizePriceRangeBounds(
      filters.min_price,
      filters.max_price
    );

    result =
      result?.filter((business) => {
        if (!business.price_range || business.price_range.length < 2) {
          return true;
        }
        return (
          business.price_range[0] >= minPrice &&
          business.price_range[1] <= maxPrice
        );
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
  let logoUrl = null;
  if (business.logo_url) {
    if (business.logo_url.startsWith("http")) {
      logoUrl = business.logo_url;
    } else {
      const fileName = `${business.id}/logo/${business.logo_url}`;
      logoUrl = fileName;
    }
  } else {
    logoUrl = DEFAULT_BUSINESS_LOGO_URL;
  }

  const { error } = await supabase.from("businesses").insert({
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

  const { error: userError } = await supabase
    .from("profiles")
    .update({
      business_id: business.id,
    })
    .eq("id", business.owner_id);

  if (error) {
    throw new Error(`Error inserting business: ${error.message}`);
  }
  if (userError) {
    throw new Error(`Error updating profile: ${userError.message}`);
  }
}

/**
 * Update an existing business in the database.
 *
 * @param business business data
 */
export async function updateBusiness(business: Business): Promise<void> {
  const { error } = await supabase
    .from("businesses")
    .update({
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
      users_favorited: business.users_favorited || 0,
    })
    .eq("id", business.id);

  if (error) {
    throw new Error(`Error updating business: ${error.message}`);
  }
}

/**
 * Delete a business from the database. All related rows are deleted automatically through cascade delete.
 *
 * @param businessId
 */
export async function deleteBusiness(
  businessId: string,
  user_id: string
): Promise<void> {
  const { error: businessError } = await supabase
    .from("businesses")
    .delete()
    .eq("id", businessId);
  const { error: userError } = await supabase
    .from("profiles")
    .update({ business_id: null })
    .eq("id", user_id);
  const { error: roleError } = await supabase
    .from("user_roles")
    .update({ role: "consumer" })
    .eq("user_id", user_id);
  const { error: imageError } = await supabase.storage
    .from("businesses")
    .remove([`${businessId}/logo/`]);
  const { error: productImageError } = await supabase.storage
    .from("products")
    .remove([`${businessId}/**`]);

  if (businessError) {
    throw new Error(`Error deleting business: ${businessError.message}`);
  }
  if (userError) {
    throw new Error(`Error updating profile: ${userError.message}`);
  }
  if (roleError) {
    throw new Error(`Error deleting role: ${roleError.message}`);
  }
  if (imageError) {
    throw new Error(`Error deleting logo: ${imageError.message}`);
  }
  if (productImageError) {
    throw new Error(`Error deleting product images: ${productImageError.message}`);
  }
}
