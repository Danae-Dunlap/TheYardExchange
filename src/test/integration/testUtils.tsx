import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { ReactElement } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ChatProvider } from "@/contexts/ChatContext";
import { Category, Location, Business, BusinessHours } from "@/lib/interfaces";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

type ProviderOpts = {
  route?: string;
  queryClient?: QueryClient;
};

export function renderWithAppProviders(
  ui: ReactElement,
  { route = "/", queryClient = createTestQueryClient() }: ProviderOpts = {}
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ChatProvider>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </ChatProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

/** Renders multiple routes so navigation links can move between pages in tests. */
export function renderWithRoutes(
  routes: { path: string; element: ReactElement }[],
  initialPath: string,
  options?: Omit<ProviderOpts, "route">
) {
  const queryClient = options?.queryClient ?? createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ChatProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
              {routes.map((r) => (
                <Route key={r.path} path={r.path} element={r.element} />
              ))}
            </Routes>
          </MemoryRouter>
        </ChatProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export const defaultBusinessHours: BusinessHours = {
  sunday: { open: "9", close: "5", is_open: true },
  monday: { open: "9", close: "5", is_open: true },
  tuesday: { open: "9", close: "5", is_open: true },
  wednesday: { open: "9", close: "5", is_open: true },
  thursday: { open: "9", close: "5", is_open: true },
  friday: { open: "9", close: "5", is_open: true },
  saturday: { open: "9", close: "5", is_open: true },
};

export function mockBusiness(overrides: Partial<Business> = {}): Business {
  return {
    id: "biz-1",
    name: "Campus Cuts",
    owner_id: "user-1",
    owner_name: "Owner",
    category: Category.Hair,
    location: Location.Quad,
    description: "Student-run hair studio on campus.",
    logo_url: "https://example.com/logo.png",
    hours_of_operation: defaultBusinessHours,
    user_views: 10,
    users_favorited: 2,
    most_popular_products: [],
    price_range: [10, 80],
    rating: 4.5,
    tags: ["hair", "campus"],
    ...overrides,
  };
}
