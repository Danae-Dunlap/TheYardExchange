import { useState, useEffect, useCallback } from "react";
import { Trash2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StarRating } from "@/components/ui/star-rating";
import { ReviewForm } from "@/components/layout/Reviews/review-form";
import { useToast } from "@/hooks/use-toast";
import { fetchReview, fetchProfile, deleteReview, checkUserReviewExists } from "@/lib/data/utils";
import type { Review, UserProfile } from "@/lib/interfaces";

interface ReviewWithProfile extends Review {
  profile: UserProfile | null;
}

interface ReviewListProps {
  businessId: string;
  productId?: string;
  currentUserId?: string;
  isProduct?: boolean;
  onReviewChange?: () => void;
}

function formatRelativeDate(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? "s" : ""} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) !== 1 ? "s" : ""} ago`;
}

export function ReviewList({ businessId, productId, currentUserId, onReviewChange, isProduct }: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<ReviewWithProfile | null>(null);
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const { toast } = useToast();

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReview({ business_id: businessId, product_id: productId });
      if (!data) {
        setReviews([]);
        return;
      }

      const reviewsWithProfiles = await Promise.all(
        data.map(async (review) => {
          const profile = await fetchProfile(review.user_id).catch(() => null);
          return { ...review, profile };
        })
      );
      setReviews(reviewsWithProfiles);
    } catch {
      toast({ title: "Error", description: "Failed to load reviews." });
    } finally {
      setLoading(false);
    }
  }, [businessId, productId, toast]);

  const checkExistingReview = useCallback(async () => {
    if (!currentUserId) return;
    const existing = await checkUserReviewExists(currentUserId, businessId, productId).catch(() => null);
    setHasExistingReview(!!existing);
  }, [currentUserId, businessId, productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    checkExistingReview();
  }, [checkExistingReview]);

  const handleReviewSuccess = () => {
    loadReviews();
    checkExistingReview();
    onReviewChange?.();
  };

  const handleWriteReview = () => {
    if (!currentUserId) {
      toast({ title: "Sign in required", description: "Please sign in to leave a review." });
      return;
    }
    if (hasExistingReview) {
      toast({
        title: "Already reviewed",
        description: "You've already reviewed this. Delete your existing review to write a new one.",
      });
      return;
    }
    setReviewFormOpen(true);
  };

  const handleDeleteClick = (review: ReviewWithProfile) => {
    setReviewToDelete(review);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteReview(reviewToDelete!.id, reviewToDelete.business_id);
      toast({ title: "Review deleted" });
      loadReviews();
      checkExistingReview();
      onReviewChange?.();
    } catch {
      toast({ title: "Error", description: "Failed to delete review." });
    } finally {
      setReviewToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className={!isProduct ? "flex flex-col gap-4" : "flex flex-row gap-2 overflow-x-scroll"}>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className={!isProduct ? "flex flex-col gap-4" : "flex flex-row gap-2 overflow-x-scroll"}>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </span>
        <Button variant="outline" size="sm" onClick={handleWriteReview}>
          <PenLine className="h-4 w-4 mr-2" />
          Write a Review
        </Button>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Be the first to review!
          </CardContent>
        </Card>
      ) : (
        <div className={isProduct ? "flex flex-row gap-4 overflow-x-auto" : "flex flex-col gap-1"}>
            
        {reviews.map((review) => {
          const name = review.profile?.full_name || review.profile?.username || "Anonymous";
          const initials = name.slice(0, 2).toUpperCase();
          return (
          <Card key={review.id} className={isProduct ? "w-80 flex-shrink-0" : ""}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  {review.profile?.avatar_url && (
                    <AvatarImage src={review.profile.avatar_url} alt={name} />
                  )}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{name}</span>
                      <div className="flex items-center gap-2">
                        <StarRating value={review.rating} size="sm" />
                        {review.created_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeDate(review.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    {currentUserId === review.user_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteClick(review)}
                        aria-label="Delete review"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {review.comment && (
                    <p className="text-sm mt-2 text-foreground">{review.comment}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
        </div>
      )}

      {currentUserId && (
        <ReviewForm
          open={reviewFormOpen}
          onOpenChange={setReviewFormOpen}
          businessId={businessId}
          productId={productId}
          userId={currentUserId}
          onSuccess={handleReviewSuccess}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
