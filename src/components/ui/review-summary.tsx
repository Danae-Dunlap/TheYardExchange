import { StarRating } from "@/components/ui/star-rating";

interface ReviewSummaryProps {
  rating: number;
  reviewCount: number;
}

export function ReviewSummary({ rating, reviewCount }: ReviewSummaryProps) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-4xl font-bold">{rating > 0 ? rating.toFixed(1) : "—"}</span>
      <div className="flex flex-col gap-1">
        <StarRating value={rating} size="md" />
        <span className="text-sm text-muted-foreground">
          {reviewCount === 0
            ? "No reviews yet"
            : `Based on ${reviewCount} review${reviewCount !== 1 ? "s" : ""}`}
        </span>
      </div>
    </div>
  );
}
