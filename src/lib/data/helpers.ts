export const DEFAULT_BUSINESS_LOGO_URL =
  "https://trpkzqwrjbmxlqftrosn.supabase.co/storage/v1/object/public/businesses/default/default-business-photo.png";

export type PriceRange = [number, number];

export function normalizePriceRangeBounds(minPrice?: string, maxPrice?: string): {
  min: number;
  max: number;
} {
  return {
    min: minPrice ? parseFloat(minPrice) : 0,
    max: maxPrice ? parseFloat(maxPrice) : Infinity,
  };
}
