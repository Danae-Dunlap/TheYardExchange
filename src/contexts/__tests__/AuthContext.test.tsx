/**
 * @jest-environment jsdom
 */

// Mock Supabase before importing anything that uses it
jest.mock('@/integrations/supabase/client', () => {
  const mockSubscription = { unsubscribe: jest.fn() };

  return {
    supabase: {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: null },
        }),
        onAuthStateChange: jest.fn().mockReturnValue({
          data: { subscription: mockSubscription },
        }),
        signOut: jest.fn().mockResolvedValue({}),
      },
      from: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })),
    },
  };
});

import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { supabase } from '@/integrations/supabase/client';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthContext', () => {
  it('should start with no user and loading true initially', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially loading
    expect(result.current.user).toBeNull();

    // After session check resolves, loading becomes false
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should set user when a session exists', async () => {
    const mockUser = { id: 'u1', email: 'test@howard.edu' };
    const mockProfile = {
      id: 'u1',
      username: 'testuser',
      full_name: 'Test User',
      student_email: 'test@howard.edu',
      avatar_url: null,
      bio: null,
      favorite_businesses: [],
      recently_viewed_businesses: [],
      favorite_products: [],
      recent_searches: [],
      recent_tags: [],
    };

    // Mock getSession to return a logged-in user
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: mockUser } },
    });

    // Mock user_roles query (no owner role)
    // Mock profiles query (return profile data)
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'user_roles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [{ role: 'consumer' }], error: null }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [mockProfile], error: null }),
          }),
        };
      }
      return {};
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isBusinessOwner).toBe(false);
  });

  it('should identify a business owner', async () => {
    const mockUser = { id: 'u1', email: 'owner@howard.edu' };

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: mockUser } },
    });

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'user_roles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [{ role: 'owner' }], error: null }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [{ id: 'u1', username: 'owner' }], error: null }),
          }),
        };
      }
      return {};
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isBusinessOwner).toBe(true);
    });
  });

  it('should call signOut on Supabase when signOut is called', async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('should throw an error when useAuth is used outside AuthProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    spy.mockRestore();
  });

  it('should unsubscribe from auth changes on unmount', async () => {
    const mockUnsubscribe = jest.fn();
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });

    const { unmount } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {});

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});