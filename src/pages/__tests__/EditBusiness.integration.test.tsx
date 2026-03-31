/**
 * Integration tests for /edit-business — loading existing listing data and empty-state routing.
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { MemoryRouter } from "react-router-dom";
import EditBusiness from "../EditBusiness";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBusiness } from "@/lib/data/utils";
import { createTestQueryClient, mockBusiness } from "@/test/integration/testUtils";
import { mockNavigate } from "@/test/integration/mockNavigate";

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual<typeof import("react-router-dom")>("react-router-dom");
  const nav = require("@/test/integration/mockNavigate");
  return {
    ...actual,
    useNavigate: () => nav.mockNavigate,
  };
});

jest.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: jest.fn(),
}));

jest.mock("@/lib/data/utils", () => ({
  fetchBusiness: jest.fn(),
}));

jest.mock("@/integrations/supabase/client", () => {
  const { createSupabaseMock } = require("../../test/integration/supabaseClientMock");
  return createSupabaseMock();
});

function renderEditPage() {
  const qc = createTestQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <MemoryRouter initialEntries={["/edit-business"]}>
          <EditBusiness />
        </MemoryRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

describe("EditBusiness page integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: "user-1", email: "owner@bison.howard.edu" },
      profile: null,
      loading: false,
      isBusinessOwner: true,
      signOut: jest.fn(),
      refreshRoles: jest.fn(),
      refreshProfileData: jest.fn(),
    });
  });

  it("validates successful load: edit form appears when owner business exists", async () => {
    (fetchBusiness as jest.Mock).mockResolvedValue([
      mockBusiness({
        owner_id: "user-1",
        name: "My Biz",
        description: "A long enough description for the form schema.",
      }),
    ]);

    renderEditPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Edit Business/i })
      ).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("My Biz")).toBeInTheDocument();
  });

  it("validates empty / missing listing: navigates away when no business row is returned", async () => {
    (fetchBusiness as jest.Mock).mockResolvedValue([]);

    renderEditPage();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });
});
