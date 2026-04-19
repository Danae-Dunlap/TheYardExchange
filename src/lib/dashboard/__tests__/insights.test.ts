import { describe, expect, it } from "@jest/globals";
import { buildInsightCards, buildStatsData, getPopularProducts, getTopLikedPostsWithLikes, type DashboardStats } from "@/lib/dashboard/insights";
import type { Product, Review } from "@/lib/interfaces";
import type { TopLikedPostSummary } from "@/lib/data/utils";

const baseStats: DashboardStats = {
  views: 1200,
  messages: 0,
  favorites: 22,
  avgRating: 4.5,
};

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "product-1",
  name: "Product",
  business_id: "biz-1",
  is_service: false,
  duration: "N/A",
  is_fav: false,
  price: 25,
  user_views: 0,
  user_favorited: 0,
  ...overrides,
});

const makeReview = (overrides: Partial<Review> = {}): Review => ({
  id: "review-1",
  user_id: "user-1",
  user: "Tester",
  user_logo: "",
  business_id: "biz-1",
  date: "2026-01-01",
  rating: 5,
  ...overrides,
});

const makePost = (overrides: Partial<TopLikedPostSummary> = {}): TopLikedPostSummary => ({
  id: "post-1",
  content: "Post content",
  created_at: "2026-01-01T00:00:00.000Z",
  likeCount: 0,
  ...overrides,
});

describe("dashboard insights helpers", () => {
  it("returns top 5 products sorted by views", () => {
    const products = [
      makeProduct({ id: "p1", user_views: 5 }),
      makeProduct({ id: "p2", user_views: 20 }),
      makeProduct({ id: "p3", user_views: 10 }),
    ];

    const popular = getPopularProducts(products);
    expect(popular.map((p) => p.id)).toEqual(["p2", "p3", "p1"]);
  });

  it("filters top-liked posts to positive likes only", () => {
    const posts = [makePost({ id: "a", likeCount: 0 }), makePost({ id: "b", likeCount: 2 })];
    expect(getTopLikedPostsWithLikes(posts).map((p) => p.id)).toEqual(["b"]);
  });

  it("builds insight cards with momentum and social highlights", () => {
    const cards = buildInsightCards({
      viewTrend: { recent: 40, previous: 20 },
      popularProducts: [makeProduct({ name: "Top Item", user_views: 88 })],
      products: [makeProduct({ name: "Top Item", user_views: 88 })],
      topLikedPosts: [makePost({ likeCount: 9 })],
      reviews: [makeReview()],
      stats: baseStats,
    });

    expect(cards.length).toBeGreaterThanOrEqual(3);
    expect(cards.some((card) => card.title === "30-day momentum")).toBe(true);
    expect(cards.some((card) => card.title === "Popular offering")).toBe(true);
    expect(cards.some((card) => card.title === "Community engagement")).toBe(true);
  });

  it("builds dashboard stats labels without changing values", () => {
    const statsData = buildStatsData(baseStats);
    expect(statsData.map((s) => s.label)).toEqual(["Total Views", "Messages", "Favorites", "Avg Rating"]);
    expect(statsData[0].value).toBe("1,200");
    expect(statsData[3].value).toBe("4.5");
  });
});
