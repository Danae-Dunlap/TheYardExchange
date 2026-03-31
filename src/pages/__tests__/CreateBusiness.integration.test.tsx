/**
 * Integration tests for /create-business (listing creation) — form shell and client-side validation.
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import CreateBusiness from "../CreateBusiness";
import { useAuth } from "@/contexts/AuthContext";
import { renderWithAppProviders } from "@/test/integration/testUtils";

jest.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: jest.fn(),
}));

jest.mock("@/integrations/supabase/client", () => {
  const { createSupabaseMock } = require("../../test/integration/supabaseClientMock");
  return createSupabaseMock();
});

describe("CreateBusiness page integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-1", email: "owner@bison.howard.edu" },
      profile: null,
      loading: false,
      isBusinessOwner: false,
      signOut: jest.fn(),
      refreshRoles: jest.fn().mockResolvedValue(undefined),
      refreshProfileData: jest.fn(),
    });
  });

  it("validates authenticated render: create form title and primary action", async () => {
    renderWithAppProviders(<CreateBusiness />, { route: "/create-business" });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Create Business/i })
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Create Business/i })).toBeInTheDocument();
  });

  it("validates invalid defaults: category still 'None' triggers validation toast on submit", async () => {
    renderWithAppProviders(<CreateBusiness />, { route: "/create-business" });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create Business/i })).toBeInTheDocument();
    });

    fireEvent.change(document.querySelector("#name") as HTMLInputElement, {
      target: { value: "Campus Shop" },
    });

    const form = document.querySelector("form");
    expect(form).toBeTruthy();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText(/Validation Error/i)).toBeInTheDocument();
      expect(screen.getByText(/Please select a category/i)).toBeInTheDocument();
    });
  });

  it("validates loading gate: shows loading while auth context is hydrating", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      profile: null,
      loading: true,
      isBusinessOwner: false,
      signOut: jest.fn(),
      refreshRoles: jest.fn(),
      refreshProfileData: jest.fn(),
    });

    renderWithAppProviders(<CreateBusiness />, { route: "/create-business" });

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
});
