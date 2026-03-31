/**
 * Integration tests for the Profile page (/profile): favorites hydration and profile card.
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { screen, waitFor } from "@testing-library/react";

jest.mock("@/components/business/Product", () => ({
  ProductCard: ({ product }: { product: { name: string } }) => (
    <div data-testid="product-card">{product.name}</div>
  ),
}));

import Profile from "../Profile";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBusiness, fetchProducts } from "@/lib/data/utils";
import { renderWithAppProviders, mockBusiness } from "@/test/integration/testUtils";
import type { UserProfile } from "@/lib/interfaces";

jest.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: jest.fn(),
}));

jest.mock("@/lib/data/utils", () => ({
  fetchBusiness: jest.fn(),
  fetchProducts: jest.fn(),
}));

jest.mock("@/integrations/supabase/client", () => {
  const { createSupabaseMock } = require("../../test/integration/supabaseClientMock");
  return createSupabaseMock();
});

describe("Profile page integration", () => {
  const baseProfile: UserProfile = {
    id: "user-1",
    username: "student",
    email: "student@bison.howard.edu",
    full_name: "Test User",
    favorite_businesses: [],
    favorite_products: [],
    recent_searches: [],
    recent_tags: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-1", email: "student@bison.howard.edu" },
      profile: baseProfile,
      loading: false,
      isBusinessOwner: false,
      signOut: jest.fn(),
      refreshRoles: jest.fn(),
      refreshProfileData: jest.fn(),
    });
    (fetchProducts as jest.Mock).mockResolvedValue([]);
    (fetchBusiness as jest.Mock).mockResolvedValue([]);
  });

  it("validates successful load: profile header shows name from Supabase-backed ProfileInfo", async () => {
    renderWithAppProviders(<Profile />, { route: "/profile" });

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    expect(screen.getByText("student@bison.howard.edu")).toBeInTheDocument();
  });

  it("validates empty favorites: no favorite sections when lists are empty", async () => {
    renderWithAppProviders(<Profile />, { route: "/profile" });

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    expect(screen.queryByRole("heading", { name: /Favorite Businesses/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Favorite Products/i })).not.toBeInTheDocument();
  });

  it("validates favorites hydration: shows favorite business cards when API returns data", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-1", email: "student@bison.howard.edu" },
      profile: {
        ...baseProfile,
        favorite_businesses: ["biz-1"],
        favorite_products: [],
      },
      loading: false,
      isBusinessOwner: false,
      signOut: jest.fn(),
      refreshRoles: jest.fn(),
      refreshProfileData: jest.fn(),
    });

    (fetchBusiness as jest.Mock).mockResolvedValue([
      mockBusiness({ id: "biz-1", name: "Fav Shop" }),
    ]);

    renderWithAppProviders(<Profile />, { route: "/profile" });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Favorite Businesses/i })).toBeInTheDocument();
    });

    expect(screen.getByText("Fav Shop")).toBeInTheDocument();
  });

  it("validates empty product rows: favorite IDs exist but API returns no product records", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-1", email: "student@bison.howard.edu" },
      profile: {
        ...baseProfile,
        favorite_businesses: [],
        favorite_products: ["missing-id"],
      },
      loading: false,
      isBusinessOwner: false,
      signOut: jest.fn(),
      refreshRoles: jest.fn(),
      refreshProfileData: jest.fn(),
    });

    (fetchProducts as jest.Mock).mockResolvedValue([]);

    renderWithAppProviders(<Profile />, { route: "/profile" });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Favorite Products/i })).toBeInTheDocument();
    });
  });
});
