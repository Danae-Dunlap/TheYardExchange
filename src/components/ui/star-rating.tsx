import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

const sizeMap = {
  sm: "h-3 w-3",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export function StarRating({
  value,
  onChange,
  readonly = true,
  size = "md",
  showValue = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const isInteractive = !readonly && onChange;

  const displayValue = hovered ?? value;

  return (
    <div className="flex items-center gap-1" aria-label={`Rating: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!isInteractive}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          onClick={() => isInteractive && onChange(star)}
          onMouseEnter={() => isInteractive && setHovered(star)}
          onMouseLeave={() => isInteractive && setHovered(null)}
          className={cn(
            "transition-colors",
            isInteractive ? "cursor-pointer hover:scale-110" : "cursor-default pointer-events-none"
          )}
        >
          <Star
            className={cn(
              sizeMap[size],
              star <= displayValue
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground"
            )}
          />
        </button>
      ))}
      {showValue && (
        <span className="ml-1 text-sm text-muted-foreground">{value.toFixed(1)}</span>
      )}
    </div>
  );
}
