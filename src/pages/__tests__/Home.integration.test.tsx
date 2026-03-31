/**
 * Integration tests for the authenticated Home page (/home):
 * data hooks, layout sections, and Supabase-backed community posts feed.
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { screen, waitFor } from "@testing-library/react";
import Home from "../Home";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBusiness, fetchRecommendedBusinesses } from "@/lib/data/utils";
import { renderWithAppProviders, mockBusiness } from "@/test/integration/testUtils";
import type { UserProfile } from "@/lib/interfaces";

jest.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: jest.fn(),
}));

jest.mock("@/lib/data/utils", () => ({
  fetchBusiness: jest.fn(),
  fetchRecommendedBusinesses: jest.fn(),
}));

jest.mock("@/integrations/supabase/client", () => {
  const { createSupabaseMock } = require("../../test/integration/supabaseClientMock");
  return createSupabaseMock();
});

const mockProfile: UserProfile = {
  id: "user-1",
  username: "student",
  email: "student@bison.howard.edu",
  full_name: "Test Student",
  favorite_businesses: [],
  favorite_products: [],
  recent_searches: [],
  recent_tags: [],
};

describe("Home page integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-1", email: "student@bison.howard.edu" },
      profile: mockProfile,
      loading: false,
      isBusinessOwner: false,
      signOut: jest.fn(),
      refreshRoles: jest.fn(),
      refreshProfileData: jest.fn(),
    });

    (fetchBusiness as jest.Mock).mockImplementation(
      (_filters: unknown, _search: unknown, isFeatured?: boolean) => {
        if (isFeatured) {
          return Promise.resolve([mockBusiness({ name: "Featured Biz" })]);
        }
        return Promise.resolve([]);
      }
    );
    (fetchRecommendedBusinesses as jest.Mock).mockResolvedValue([
      mockBusiness({ id: "rec-1", name: "Recommended Biz" }),
    ]);
  });

  it("validates successful load: featured businesses and recommendations render after API data resolves", async () => {
    renderWithAppProviders(<Home />, { route: "/home" });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Featured Businesses/i })).toBeInTheDocument();
    });

    expect(screen.getByText("Featured Biz")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Recommended for You Based on Your Activity/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Recommended Biz")).toBeInTheDocument();
  });

  it("validates empty featured state: section heading still renders when featured list is empty", async () => {
    (fetchBusiness as jest.Mock).mockImplementation(
      (_a: unknown, _b: unknown, isFeatured?: boolean) => {
        if (isFeatured) return Promise.resolve([]);
        return Promise.resolve([]);
      }
    );
    (fetchRecommendedBusinesses as jest.Mock).mockResolvedValue([]);

    renderWithAppProviders(<Home />, { route: "/home" });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Featured Businesses/i })).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("heading", { name: /Recommended for You Based on Your Activity/i })
    ).not.toBeInTheDocument();
  });

  it("validates loading gate: shows loading copy while auth is resolving", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      profile: null,
      loading: true,
      isBusinessOwner: false,
      signOut: jest.fn(),
      refreshRoles: jest.fn(),
      refreshProfileData: jest.fn(),
    });

    renderWithAppProviders(<Home />, { route: "/home" });

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("validates navigation: header links to Discover for browsing listings", async () => {
    renderWithAppProviders(<Home />, { route: "/home" });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /^Discover$/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /^Discover$/i })).toHaveAttribute("href", "/discover");
  });
});
