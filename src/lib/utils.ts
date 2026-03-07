import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function priceRange(price_range) {
  let priceRange = '';
    if (price_range && price_range.length > 1) {
      priceRange = `${price_range[0]}-${price_range[1]}`;
    } else if (price_range && price_range.length === 1) {
      priceRange = `${price_range[0]}`;
    }
    return priceRange;
}