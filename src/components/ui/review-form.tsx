import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { StarRating } from "@/components/ui/star-rating";
import { useToast } from "@/hooks/use-toast";
import { insertReview } from "@/lib/data/utils";
import { moderateReviewText } from "@/lib/moderation";
import type { Review } from "@/lib/interfaces";

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z.string().max(500, "Comment must be 500 characters or less").optional(),
});

interface ReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  productId?: string;
  userId: string;
  onSuccess?: () => void;
}

export function ReviewForm({
  open,
  onOpenChange,
  businessId,
  productId,
  userId,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      reviewSchema.parse({ rating, comment: comment || undefined });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: error.errors[0].message });
        return;
      }
    }

    if (comment) {
      const moderation = moderateReviewText(comment);
      if (!moderation.passed) {
        toast({ title: "Review not submitted", description: moderation.reason });
        return;
      }
    }

    setLoading(true);
    try {
      const review: Review = {
        id: crypto.randomUUID(),
        user_id: userId,
        business_id: businessId,
        product_id: productId || null,
        rating,
        comment: comment || null,
        user: "",
        user_logo: "",
        date: ""
      };
      await insertReview(review);
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      setRating(0);
      setComment("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Rating *</span>
            <StarRating value={rating} onChange={setRating} readonly={false} size="lg" />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Comment (optional)</span>
            <Textarea
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <span className="text-xs text-muted-foreground text-right">{comment.length}/500</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || rating === 0}>
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
