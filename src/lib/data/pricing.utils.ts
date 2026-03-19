import { supabase } from "@/integrations/supabase/client";
import type { PriceRange } from "@/lib/data/helpers";

/**
 * Recalculates the price range for a business based on ALL its products.
 * This ensures the price range is always accurate and derived only from products.
 *
 * @param businessId - The ID of the business to recalculate
 * @returns The updated price range [min, max] or null if no products
 * @throws Error if fetch or update fails
 */
export async function recalculatePriceRange(
  businessId: string
): Promise<PriceRange | null> {
  const { data: products, error: fetchError } = await supabase
    .from("products")
    .select("price")
    .eq("business_id", businessId);

  if (fetchError) {
    throw new Error(`Error fetching products for price range: ${fetchError.message}`);
  }

  if (!products || products.length === 0) {
    const { error: updateError } = await supabase
      .from("businesses")
      .update({ price_range: null })
      .eq("id", businessId);

    if (updateError) {
      throw new Error(`Error updating business price range: ${updateError.message}`);
    }
    return null;
  }

  const prices = products.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const updatedPriceRange: PriceRange = [minPrice, maxPrice];

  const { error: updateError } = await supabase
    .from("businesses")
    .update({ price_range: updatedPriceRange })
    .eq("id", businessId);

  if (updateError) {
    throw new Error(`Error updating business price range: ${updateError.message}`);
  }

  return updatedPriceRange;
}
