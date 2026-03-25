import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchBusiness } from "@/lib/data/utils";

const sessionKeyForUser = (userId: string) => `yard_favorite_deal_toast:${userId}`;

export function FavoriteStorePromotionNotifier() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.id || !profile?.favorite_businesses?.length) return;

    const key = sessionKeyForUser(user.id);
    if (sessionStorage.getItem(key)) return;

    let cancelled = false;

    void (async () => {
      try {
        const list = await fetchBusiness({ business_id: profile.favorite_businesses });
        if (cancelled) return;
        const withDeals = list?.filter((b) => b.deal?.trim()) ?? [];
        if (!withDeals.length) return;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
        toast({
          title: "Promotions at favorite stores",
          description: (
            <span>
              {withDeals.length} of your favorite stores {withDeals.length === 1 ? "has" : "have"} an active promotion or discount.{" "}
              <Link to="/profile" className="underline font-medium">
                View on profile
              </Link>
            </span>
          ),
        });
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, profile?.favorite_businesses, toast]);

  return null;
}
