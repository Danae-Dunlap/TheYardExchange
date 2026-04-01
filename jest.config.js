// Provide Vite env vars for tests
process.env.VITE_SUPABASE_URL = "https://test-project.supabase.co";
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "test-anon-key-12345";

export default {
  transform: {
    "^.+\\.(ts|tsx)$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(png|jpg|jpeg|gif|webp|svg)$": "<rootDir>/src/test/__mocks__/fileMock.js",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test/jest.setup.ts"],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
};