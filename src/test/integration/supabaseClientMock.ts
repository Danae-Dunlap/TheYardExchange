/**
 * Shared Supabase client mock for page integration tests.
 * Extend per suite via jest.mock factory overrides when needed.
 */
export function createSupabaseMock(options: {
  profile?: Record<string, unknown> | null;
  postsData?: unknown[];
  profileUpdateError?: boolean;
} = {}) {
  const profile =
    options.profile ??
    ({
      id: "user-1",
      username: "testuser",
      full_name: "Test User",
      student_email: "student@bison.howard.edu",
      avatar_url: null,
      bio: "Campus connector",
      favorite_businesses: [],
      favorite_products: [],
      recent_searches: [],
      recent_tags: [],
    } as Record<string, unknown>);

  const postsResult = { data: options.postsData ?? [], error: null, count: 0 };

  const mockFrom = jest.fn((table: string) => {
    if (table === "posts") {
      const builder: Record<string, jest.Mock> & { then?: typeof Promise.prototype.then } = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(postsResult),
      };
      builder.then = (onFulfilled: (v: typeof postsResult) => unknown) =>
        Promise.resolve(postsResult).then(onFulfilled);
      return builder;
    }
    if (table === "profiles") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: profile, error: null }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: options.profileUpdateError ? { message: "Update failed" } : null,
          }),
        }),
      };
    }
    if (table === "post_likes") {
      return {
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    }
    if (table === "businesses") {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    }
    return {};
  });

  const mockStorageFrom = jest.fn(() => ({
    getPublicUrl: jest.fn(() => ({ data: { publicUrl: "https://example.com/avatar.png" } })),
    update: jest.fn().mockResolvedValue({ error: null }),
    upload: jest.fn().mockResolvedValue({ error: null }),
  }));

  return {
    supabase: {
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: jest.fn().mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        }),
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
      },
      from: mockFrom,
      functions: {
        invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
      },
      storage: { from: mockStorageFrom },
    },
  };
}
