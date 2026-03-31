/**
 * Integration tests for /auth — sign-in and sign-up flows with mocked Supabase Auth.
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Auth from "../Auth";
import { renderWithAppProviders } from "@/test/integration/testUtils";

const mockSignIn = jest.fn();
const mockSignUp = jest.fn();

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signInWithPassword: (...args: unknown[]) => mockSignIn(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })),
  },
}));

describe("Auth page integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignIn.mockResolvedValue({ error: null });
    mockSignUp.mockResolvedValue({ error: null });
  });

  it("validates initial render: marketing copy and tabbed sign-in / sign-up UI", () => {
    renderWithAppProviders(<Auth />, { route: "/auth" });

    expect(
      screen.getByRole("heading", { name: /Welcome to The Yard Exchange/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Sign Up/i })).toBeInTheDocument();
  });

  it("validates invalid sign-in input: Zod rejects bad email before calling Supabase", async () => {
    renderWithAppProviders(<Auth />, { route: "/auth" });

    const signInEmail = document.querySelector("#signin-email") as HTMLInputElement;
    const signInPassword = document.querySelector("#signin-password") as HTMLInputElement;
    fireEvent.change(signInEmail, { target: { value: "not-an-email" } });
    fireEvent.change(signInPassword, { target: { value: "123456" } });
    // Programmatic submit bypasses native email field blocking so Zod runs in the handler.
    const forms = document.querySelectorAll("form");
    expect(forms.length).toBeGreaterThan(0);
    fireEvent.submit(forms[0]);

    await waitFor(() => {
      expect(screen.getByText(/Validation Error/i)).toBeInTheDocument();
      expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("validates sign-up domain rule: non-Howard email is rejected client-side", async () => {
    const user = userEvent.setup();
    renderWithAppProviders(<Auth />, { route: "/auth" });

    await user.click(screen.getByRole("tab", { name: /Sign Up/i }));

    await screen.findByRole("button", { name: /Create Account/i });

    // Radix keeps a single mounted form for the active tab in this layout.
    const signupForm = document.querySelector("form") as HTMLFormElement;
    const signupEmail = signupForm.querySelector(
      'input[type="email"]'
    ) as HTMLInputElement;
    const signupPassword = signupForm.querySelector(
      'input[type="password"]'
    ) as HTMLInputElement;
    fireEvent.change(signupEmail, { target: { value: "someone@gmail.com" } });
    fireEvent.change(signupPassword, { target: { value: "abcdef" } });
    fireEvent.submit(signupForm);

    await waitFor(() => {
      expect(screen.getByText(/Validation Error/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Only Howard University students can sign up/i)
      ).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("validates API failure path: Supabase sign-in error surfaces in toast copy", async () => {
    mockSignIn.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    renderWithAppProviders(<Auth />, { route: "/auth" });

    const emailIn = document.querySelector("#signin-email") as HTMLInputElement;
    const passIn = document.querySelector("#signin-password") as HTMLInputElement;
    fireEvent.change(emailIn, { target: { value: "valid@bison.howard.edu" } });
    fireEvent.change(passIn, { target: { value: "Secret1!" } });
    fireEvent.click(screen.getByRole("button", { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid login credentials/i)).toBeInTheDocument();
    });

    expect(mockSignIn).toHaveBeenCalled();
  });
});
