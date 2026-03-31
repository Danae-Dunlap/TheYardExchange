/**
 * Integration tests for Discover (/discover) — the main business listings browse experience.
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import Discover from "../Discover";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBusiness, fetchRecommendedBusinesses } from "@/lib/data/utils";
import { renderWithAppProviders, renderWithRoutes, mockBusiness } from "@/test/integration/testUtils";
import Home from "../Home";
import type { UserProfile } from "@/lib/interfaces";

jest.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: jest.fn(),
}));

jest.mock("@/lib/data/utils", () => ({
  fetchBusiness: jest.fn(),
  fetchRecommendedBusinesses: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/integrations/supabase/client", () => {
  const { createSupabaseMock } = require("../../test/integration/supabaseClientMock");
  return createSupabaseMock();
});

const mockProfile: UserProfile = {
  id: "user-1",
  username: "student",
  email: "student@bison.howard.edu",
  favorite_businesses: [],
  favorite_products: [],
  recent_searches: [],
  recent_tags: [],
};

describe("Discover page integration", () => {
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
    (fetchBusiness as jest.Mock).mockResolvedValue([
      mockBusiness({ name: "Listed Store" }),
    ]);
    (fetchRecommendedBusinesses as jest.Mock).mockResolvedValue([]);
  });

  it("validates successful data load: result count and business name render", async () => {
    renderWithAppProviders(<Discover />, { route: "/discover" });

    await waitFor(() => {
      expect(screen.getByText(/1 businesses found/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Listed Store")).toBeInTheDocument();
  });

  it("validates empty listings state: zero results message without business cards", async () => {
    (fetchBusiness as jest.Mock).mockResolvedValue([]);

    renderWithAppProviders(<Discover />, { route: "/discover" });

    await waitFor(() => {
      expect(screen.getByText(/0 businesses found/i)).toBeInTheDocument();
    });

    expect(screen.queryByText("Listed Store")).not.toBeInTheDocument();
  });

  it("validates null/malformed API response: listings stay empty when fetch resolves to null", async () => {
    (fetchBusiness as jest.Mock).mockResolvedValue(null);

    renderWithAppProviders(<Discover />, { route: "/discover" });

    await waitFor(() => {
      expect(screen.getByText(/0 businesses found/i)).toBeInTheDocument();
    });
  });

  it("validates routing: Discover link from Home navigates to listings view", async () => {
    renderWithRoutes(
      [
        { path: "/home", element: <Home /> },
        { path: "/discover", element: <Discover /> },
      ],
      "/home"
    );

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /^Discover$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("link", { name: /^Discover$/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Discover Businesses/i })).toBeInTheDocument();
    });
  });
});
