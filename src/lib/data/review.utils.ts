import { supabase } from "@/integrations/supabase/client";
import type { Review, ReviewQuery } from "../interfaces";

/**
 * Fetches review data from the database.
 *
 * @param filters - The query parameters to filter reviews.
 * @returns A promise that resolves to an array of review data
 * @throws Error if the fetch operation fails.
 */
export async function fetchReview(filters: ReviewQuery): Promise<Review[] | null> {
  let query: any = supabase.from("reviews").select("*");

  if (filters.id) {
    query = query.eq("id", filters.id);
  }
  if (filters.user_id) {
    query = query.eq("user_id", filters.user_id);
  }
  if (filters.business_id) {
    query = query.eq("business_id", filters.business_id);
  }
  if (filters.product_id) {
    query = query.eq("product_id", filters.product_id);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (!data) {
    return null;
  }
  if (error) {
    throw new Error(`Error fetching reviews: ${error.message}`);
  }

  const reviews: Review[] = data.map((review: any) => {
    return {
      ...review,
      rating: Number(review.rating),
    };
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
  const { error } = await supabase.from("reviews").insert({
    id: review.id,
    user_id: review.user_id,
    business_id: review.business_id,
    product_id: review.product_id || null,
    rating: review.rating,
    comment: review.comment || null,
  });
  if (error) {
    throw new Error(`Error inserting review: ${error.message}`);
  }
}

/**
 * Deletes a review from the database.
 *
 * @param reviewId
 * @throws Error if the delete operation fails.
 */
export async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) {
    throw new Error(`Error deleting review: ${error.message}`);
  }
}

/**
 * Calculates the average rating for a business or product.
 * @param businessId - The ID of the business.
 * @param productId - The ID of the product (optional).
 * @returns Average rating rounded to 1 decimal place, or 0 if no reviews.
 */
export async function calculateAverageRating(
  businessId: string,
  productId?: string
): Promise<number> {
  let query: any = supabase.from("reviews").select("rating").eq("business_id", businessId);

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error calculating average rating: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return 0;
  }

  const sum = data.reduce(
    (acc: number, review: any) => acc + Number(review.rating),
    0
  );
  const average = sum / data.length;

  return Math.round(average * 10) / 10;
}

/**
 * Checks if a user has already reviewed a specific business or product.
 * @param userId - The ID of the user.
 * @param businessId - The ID of the business.
 * @param productId - The ID of the product (optional).
 * @returns The existing review if found, null otherwise.
 */
export async function checkUserReviewExists(
  userId: string,
  businessId: string,
  productId?: string
): Promise<Review | null> {
  let query: any = supabase
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("business_id", businessId);

  if (productId) {
    query = query.eq("product_id", productId);
  } else {
    query = query.is("product_id", null);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Error checking user review: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    rating: Number(data.rating),
  };
}
