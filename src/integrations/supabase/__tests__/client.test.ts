import { createClient } from "@supabase/supabase-js";

// Mock createClient before importing the module under test
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({ mocked: true })),
}));

// Mock Vite's import.meta.env
const TEST_URL = "https://test-project.supabase.co";
const TEST_KEY = "test-anon-key-12345";

beforeAll(() => {
  // @ts-ignore – import.meta.env is provided by Vite at runtime
  globalThis.import_meta_env = {
    VITE_SUPABASE_URL: TEST_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: TEST_KEY,
  };
});

// Vite uses import.meta.env which Jest doesn't support natively.
// We transform it via the moduleNameMapper or babel plugin in your Jest config,
// but the simplest approach is to define it on globalThis and
// override import.meta.env in the jest config's globals or setup file.
// Since client.ts reads import.meta.env at module load time,
// we need to handle this carefully.

// Instead of importing client.ts directly (which would run at import time
// with potentially undefined env vars), we test the configuration
// that was passed to createClient.

describe("Supabase client (client.ts)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call createClient from @supabase/supabase-js", () => {
    // Re-import to trigger module execution
    jest.isolateModules(() => {
      require("../client");
    });

    expect(createClient).toHaveBeenCalled();
  });

  it("should pass the URL and anon key from environment variables", () => {
    jest.isolateModules(() => {
      require("../client");
    });

    const [url, key] = (createClient as jest.Mock).mock.calls[0];
    expect(url).toBeDefined();
    expect(key).toBeDefined();
    expect(typeof url).toBe("string");
    expect(typeof key).toBe("string");
  });

  it("should configure auth with persistSession enabled", () => {
    jest.isolateModules(() => {
      require("../client");
    });

    const options = (createClient as jest.Mock).mock.calls[0][2];
    expect(options).toBeDefined();
    expect(options.auth).toBeDefined();
    expect(options.auth.persistSession).toBe(true);
  });

  it("should configure auth with autoRefreshToken enabled", () => {
    jest.isolateModules(() => {
      require("../client");
    });

    const options = (createClient as jest.Mock).mock.calls[0][2];
    expect(options.auth.autoRefreshToken).toBe(true);
  });

  it("should configure auth to use localStorage for storage", () => {
    jest.isolateModules(() => {
      require("../client");
    });

    const options = (createClient as jest.Mock).mock.calls[0][2];
    expect(options.auth.storage).toBe(localStorage);
  });

  it("should export a supabase client instance", () => {
    let client: unknown;
    jest.isolateModules(() => {
      const mod = require("../client");
      client = mod.supabase;
    });

    expect(client).toBeDefined();
  });
});