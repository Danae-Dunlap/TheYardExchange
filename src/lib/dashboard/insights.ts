import { BarChart3, Eye, Heart, MessageCircle, Star, Store, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import type { Product, Review } from "@/lib/interfaces";
import type { TopLikedPostSummary } from "@/lib/data/utils";

export type DashboardStats = {
  views: number;
  messages: number;
  favorites: number;
  avgRating: number;
};

export type InsightCard = {
  title: string;
  body: string;
  icon: LucideIcon;
};

type BuildInsightCardsParams = {
  viewTrend: { recent: number; previous: number } | null;
  popularProducts: Product[];
  products: Product[];
  topLikedPosts: TopLikedPostSummary[];
  reviews: Review[];
  stats: DashboardStats;
};

export const getPopularProducts = (products: Product[]): Product[] => {
  return [...products].sort((a, b) => b.user_views - a.user_views).slice(0, 5);
};

export const getTopLikedPostsWithLikes = (posts: TopLikedPostSummary[]): TopLikedPostSummary[] => {
  return posts.filter((post) => post.likeCount > 0);
};

export const buildInsightCards = ({
  viewTrend,
  popularProducts,
  products,
  topLikedPosts,
  reviews,
  stats,
}: BuildInsightCardsParams): InsightCard[] => {
  const cards: InsightCard[] = [];

  if (viewTrend) {
    const { recent, previous } = viewTrend;
    if (recent === 0 && previous === 0) {
      cards.push({
        title: "Profile traffic",
        body: "Share your public profile link so you can track visits and trends here.",
        icon: Eye,
      });
    } else if (previous > 0) {
      const pct = Math.round(((recent - previous) / previous) * 100);
      const up = recent >= previous;
      cards.push({
        title: "30-day momentum",
        body: up
          ? `Profile views are up ${pct}% vs the prior 30 days (${recent.toLocaleString()} vs ${previous.toLocaleString()}).`
          : `Profile views are down ${Math.abs(pct)}% vs the prior 30 days (${recent.toLocaleString()} vs ${previous.toLocaleString()}).`,
        icon: up ? TrendingUp : TrendingDown,
      });
    } else {
      cards.push({
        title: "30-day views",
        body: `Your profile was viewed ${recent.toLocaleString()} times in the last 30 days.`,
        icon: Eye,
      });
    }
  }

  const topProduct = popularProducts[0];
  if (topProduct && topProduct.user_views > 0) {
    cards.push({
      title: "Popular offering",
      body: `"${topProduct.name}" leads your catalog with ${topProduct.user_views.toLocaleString()} product views.`,
      icon: BarChart3,
    });
  } else if (products.length > 0) {
    cards.push({
      title: "Catalog visibility",
      body: "When shoppers open your products, your most-viewed items will rank here.",
      icon: Store,
    });
  }

  const bestPost = topLikedPosts[0];
  if (bestPost && bestPost.likeCount > 0) {
    cards.push({
      title: "Community engagement",
      body: `Your most-liked post has ${bestPost.likeCount.toLocaleString()} likes.`,
      icon: Heart,
    });
  } else {
    cards.push({
      title: "Community",
      body: "Post updates on Community so your audience can engage and like your content.",
      icon: MessageCircle,
    });
  }

  if (reviews.length > 0 && stats.avgRating >= 4) {
    cards.push({
      title: "Customer sentiment",
      body: `Strong average rating of ${stats.avgRating.toFixed(1)} across ${reviews.length} review${reviews.length === 1 ? "" : "s"}.`,
      icon: Star,
    });
  }

  return cards.slice(0, 4);
};

export const buildStatsData = (stats: DashboardStats) => {
  return [
    { label: "Total Views", value: stats.views.toLocaleString(), change: "", icon: Eye },
    { label: "Messages", value: stats.messages.toString(), change: "", icon: MessageCircle },
    { label: "Favorites", value: stats.favorites.toString(), change: "", icon: Heart },
    {
      label: "Avg Rating",
      value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A",
      change: "",
      icon: Star,
    },
  ];
};
