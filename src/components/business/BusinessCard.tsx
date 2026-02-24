import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "../ui/badge";
import { DollarSign } from "lucide-react";

type Business = {
  id: string | number;
  name?: string | null;
  logo_url?: string | null;
  rating?: number | null;
  category?: string | null;
  description?: string | null;
  price_range?: Array<number> | null;
};

interface BusinessCardProps {
  business: Business;
}

function formatPriceRange(priceRange?: Array<number> | null): string {
  if (!Array.isArray(priceRange) || priceRange.length < 2) return "Price not available";
  const [min, max] = priceRange;
  if (typeof min !== "number" || typeof max !== "number") return "Price not available";
  return `${min}-${max}`;
}

export const BusinessCard = ({ business }: BusinessCardProps): React.ReactElement => {
  const name = business.name?.trim() || "Unnamed business";
  const category = business.category?.trim() || "Uncategorized";
  const description = business.description?.trim() || "No description available";
  const priceText = formatPriceRange(business.price_range);

  const hasLogo = typeof business.logo_url === "string" && business.logo_url.trim().length > 0;

  return (
    <Link to={`/business/${business.id}`} state={{ business }} className="h-full">
      <Card className="overflow-hidden hover:shadow-xl transition-all group cursor-pointer h-full">
        <div className="relative h-48 overflow-hidden bg-muted">
          {hasLogo ? (
            <img
              src={business.logo_url as string}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="mb-3">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-foreground text-lg">{name}</h3>

              {business.rating === null || business.rating === undefined ? (
                <p className="text-sm text-muted-foreground ml-2">No reviews yet</p>
              ) : (
                <span className="text-sm font-semibold text-foreground ml-2">
                  ⭐ {Number(business.rating).toFixed(1)}
                </span>
              )}
            </div>

            <Badge variant="outline" className="text-xs mb-2">
              {category}
            </Badge>

            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span>{priceText}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
