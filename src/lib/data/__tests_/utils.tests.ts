// Mock the Supabase client before importing anything that uses it
jest.mock('@/integrations/supabase/client', () => {
  // These are the chainable methods that Supabase query builders use.
  // Each one returns the same object so you can chain: supabase.from('table').select('*').eq('id', 1)
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    // These simulate the final response from Supabase
    then: undefined, // will be set per-test
  };

  return {
    supabase: {
      from: jest.fn(() => mockChain),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn().mockResolvedValue({ error: null }),
          remove: jest.fn().mockResolvedValue({ error: null }),
          getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/image.png' } }),
        })),
      },
      auth: {
        getSession: jest.fn(),
        onAuthStateChange: jest.fn(),
        signOut: jest.fn(),
      },
    },
  };
});

import { supabase } from '@/integrations/supabase/client';
import {
  fetchBusiness,
  insertBusiness,
  updateBusiness,
  deleteBusiness,
  fetchProducts,
  insertProduct,
  deleteProduct,
  fetchProfile,
  deleteProfile,
  fetchReview,
  insertReview,
  deleteReview,
  calculateAverageRating,
  checkUserReviewExists,
  fetchEvents,
  insertEvent,
  updateEvent,
  deleteEvent,
  recalculatePriceRange,
} from '../utils';

// Helper: get the mock chain returned by supabase.from()
function getMockChain() {
  return (supabase.from as jest.Mock)('anything');
}

// Before each test, clear all mock call history so tests don't leak into each other
beforeEach(() => {
  jest.clearAllMocks();
});

// ========================
// BUSINESS FUNCTIONS
// ========================
describe('fetchBusiness', () => {
  it('should return formatted business data on success', async () => {
    const mockBusinessData = [
      {
        id: 'b1',
        name: 'Test Biz',
        owner_id: 'u1',
        category: 'Food',
        location: 'Drew Hall',
        description: 'A test business',
        logo_url: 'https://example.com/logo.png',
        contact_info: null,
        price_range: [5, 20],
        hours_of_operation: {},
        tags: ['food'],
        user_views: 10,
        users_favorited: 3,
        most_popular_products: null,
        reviews: null,
      },
    ];

    const mockProfile = { full_name: 'Test Owner', username: 'testowner' };

    // Make the main query resolve with business data
    const chain = getMockChain();
    chain.select.mockReturnThis();
    chain.eq.mockImplementation(() => {
      // Return the chain but also make it resolve as a promise
      return {
        ...chain,
        then: (resolve) => resolve({ data: mockBusinessData, error: null }),
      };
    });

    // Override supabase.from to return different results based on table
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'businesses') {
        return {
          select: jest.fn().mockReturnValue({
            textSearch: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            then: (resolve) => resolve({ data: mockBusinessData, error: null }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
            }),
          }),
        };
      }
      return chain;
    });

    const result = await fetchBusiness();

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test Biz');
    expect(result[0].owner_name).toBe('Test Owner');
    expect(result[0].user_views).toBe(10);
  });

  it('should throw an error when Supabase returns an error', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        textSearch: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: (resolve) => resolve({ data: null, error: { message: 'DB error' } }),
      }),
    }));

    await expect(fetchBusiness()).rejects.toThrow('Error fetching businesses: DB error');
  });

  it('should return null when no data is found', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        textSearch: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: (resolve) => resolve({ data: null, error: null }),
      }),
    }));

    const result = await fetchBusiness();
    expect(result).toBeNull();
  });
});

describe('insertBusiness', () => {
  it('should insert a business and update the profile', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'businesses') return { insert: mockInsert };
      if (table === 'profiles') return { update: mockUpdate };
      return {};
    });

    const business = {
      id: 'b1',
      name: 'Test Biz',
      owner_id: 'u1',
      owner_name: 'Owner',
      category: 'Food' as any,
      location: 'Drew Hall' as any,
      hours_of_operation: {} as any,
      user_views: 0,
      users_favorited: 0,
      most_popular_products: [],
    };

    await expect(insertBusiness(business)).resolves.not.toThrow();
    expect(mockInsert).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should throw when the insert fails', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: { message: 'Insert failed' } });
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'businesses') return { insert: mockInsert };
      if (table === 'profiles') return { update: mockUpdate };
      return {};
    });

    const business = {
      id: 'b1',
      name: 'Test Biz',
      owner_id: 'u1',
      owner_name: 'Owner',
      category: 'Food' as any,
      location: 'Drew Hall' as any,
      hours_of_operation: {} as any,
      user_views: 0,
      users_favorited: 0,
      most_popular_products: [],
    };

    await expect(insertBusiness(business)).rejects.toThrow('Error inserting business: Insert failed');
  });
});

describe('updateBusiness', () => {
  it('should update a business successfully', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

    (supabase.from as jest.Mock).mockImplementation(() => ({
      update: mockUpdate,
    }));

    const business = {
      id: 'b1',
      name: 'Updated Biz',
      owner_id: 'u1',
      owner_name: 'Owner',
      category: 'Food' as any,
      location: 'Drew Hall' as any,
      hours_of_operation: {} as any,
      user_views: 5,
      users_favorited: 2,
      most_popular_products: [],
    };

    await expect(updateBusiness(business)).resolves.not.toThrow();
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'b1');
  });

  it('should throw when the update fails', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: { message: 'Update failed' } });

    (supabase.from as jest.Mock).mockImplementation(() => ({
      update: jest.fn().mockReturnValue({ eq: mockEq }),
    }));

    const business = {
      id: 'b1',
      name: 'Updated Biz',
      owner_id: 'u1',
      owner_name: 'Owner',
      category: 'Food' as any,
      location: 'Drew Hall' as any,
      hours_of_operation: {} as any,
      user_views: 0,
      users_favorited: 0,
      most_popular_products: [],
    };

    await expect(updateBusiness(business)).rejects.toThrow('Error updating business: Update failed');
  });
});

describe('deleteBusiness', () => {
  it('should delete a business and clean up related data', async () => {
    const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'businesses') return { delete: jest.fn().mockReturnValue({ eq: mockDeleteEq }) };
      if (table === 'profiles') return { update: jest.fn().mockReturnValue({ eq: mockUpdateEq }) };
      if (table === 'user_roles') return { update: jest.fn().mockReturnValue({ eq: mockUpdateEq }) };
      return {};
    });

    (supabase.storage.from as jest.Mock).mockReturnValue({
      remove: jest.fn().mockResolvedValue({ error: null }),
    });

    await expect(deleteBusiness('b1', 'u1')).resolves.not.toThrow();
  });

  it('should throw when business deletion fails', async () => {
    const mockDeleteEq = jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
    const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'businesses') return { delete: jest.fn().mockReturnValue({ eq: mockDeleteEq }) };
      if (table === 'profiles') return { update: jest.fn().mockReturnValue({ eq: mockUpdateEq }) };
      if (table === 'user_roles') return { update: jest.fn().mockReturnValue({ eq: mockUpdateEq }) };
      return {};
    });

    (supabase.storage.from as jest.Mock).mockReturnValue({
      remove: jest.fn().mockResolvedValue({ error: null }),
    });

    await expect(deleteBusiness('b1', 'u1')).rejects.toThrow('Error deleting business: Delete failed');
  });
});

// ========================
// PRODUCT FUNCTIONS
// ========================
describe('fetchProducts', () => {
  it('should return formatted product data', async () => {
    const mockProductData = [
      {
        id: 'p1',
        product_name: 'Test Product',
        business_id: 'b1',
        business_name: 'Test Biz',
        description: 'A product',
        images: 'https://example.com/img.png',
        price: 15,
        rating: 4.5,
        tags: ['food'],
        is_favorite: true,
        is_service: false,
        duration: null,
        reviews: null,
        user_views: 5,
        users_favorited: 2,
      },
    ];

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: (resolve) => resolve({ data: mockProductData, error: null }),
      }),
    }));

    const result = await fetchProducts('b1');

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test Product');
    expect(result[0].price).toBe(15);
  });

  it('should throw on error', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: (resolve) => resolve({ data: null, error: { message: 'Fetch failed' } }),
      }),
    }));

    await expect(fetchProducts('b1')).rejects.toThrow('Error fetching products: Fetch failed');
  });
});

describe('deleteProduct', () => {
  it('should delete a product and recalculate price range', async () => {
    // Mock fetching the product to get business_id
    const mockSingle = jest.fn().mockResolvedValue({ data: { business_id: 'b1' }, error: null });

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'products') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'businesses') {
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {};
    });

    (supabase.storage.from as jest.Mock).mockReturnValue({
      remove: jest.fn().mockResolvedValue({ error: null }),
    });

    await expect(deleteProduct('p1')).resolves.not.toThrow();
  });
});

// ========================
// PROFILE FUNCTIONS
// ========================
describe('fetchProfile', () => {
  it('should return formatted profile data', async () => {
    const mockProfileData = [
      {
        id: 'u1',
        username: 'testuser',
        full_name: 'Test User',
        student_email: 'test@howard.edu',
        avatar_url: null,
        bio: 'Hello',
        reviews: [],
        favorite_businesses: [],
        recently_viewed_businesses: [],
        favorite_products: [],
      },
    ];

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: mockProfileData, error: null }),
      }),
    }));

    const result = await fetchProfile('u1');

    expect(result).not.toBeNull();
    expect(result.username).toBe('testuser');
    expect(result.email).toBe('test@howard.edu');
  });

  it('should return null when profile not found', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }));

    const result = await fetchProfile('nonexistent');
    expect(result).toBeNull();
  });
});

describe('deleteProfile', () => {
  it('should delete profile and avatar image', async () => {
    const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation(() => ({
      delete: jest.fn().mockReturnValue({ eq: mockDeleteEq }),
    }));

    (supabase.storage.from as jest.Mock).mockReturnValue({
      remove: jest.fn().mockResolvedValue({ error: null }),
    });

    await expect(deleteProfile('u1')).resolves.not.toThrow();
  });
});

// ========================
// REVIEW FUNCTIONS
// ========================
describe('fetchReview', () => {
  it('should return formatted reviews sorted by date', async () => {
    const mockReviewData = [
      { id: 'r1', user_id: 'u1', business_id: 'b1', rating: '4.5', comment: 'Great', created_at: '2025-01-01' },
    ];

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockReviewData, error: null }),
      }),
    }));

    const result = await fetchReview({ business_id: 'b1' });

    expect(result).toHaveLength(1);
    expect(result[0].rating).toBe(4.5);
  });

  it('should return null when no reviews found', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }));

    const result = await fetchReview({ business_id: 'b1' });
    expect(result).toBeNull();
  });
});

describe('insertReview', () => {
  it('should insert a review successfully', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation(() => ({
      insert: mockInsert,
    }));

    const review = {
      id: 'r1',
      user_id: 'u1',
      user: 'Test User',
      user_logo: '',
      business_id: 'b1',
      date: '2025-01-01',
      rating: 5,
      comment: 'Excellent',
    };

    await expect(insertReview(review)).resolves.not.toThrow();
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe('deleteReview', () => {
  it('should delete a review successfully', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation(() => ({
      delete: jest.fn().mockReturnValue({ eq: mockEq }),
    }));

    await expect(deleteReview('r1')).resolves.not.toThrow();
  });
});

describe('calculateAverageRating', () => {
  it('should calculate average rating correctly', async () => {
    const mockReviews = [{ rating: 4 }, { rating: 5 }, { rating: 3 }];

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: mockReviews, error: null }),
      }),
    }));

    const avg = await calculateAverageRating('b1');
    expect(avg).toBe(4);
  });

  it('should return 0 when there are no reviews', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }));

    const avg = await calculateAverageRating('b1');
    expect(avg).toBe(0);
  });
});

describe('checkUserReviewExists', () => {
  it('should return null when no review exists (PGRST116)', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            is: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows found' },
              }),
            }),
          }),
        }),
      }),
    }));

    const result = await checkUserReviewExists('u1', 'b1');
    expect(result).toBeNull();
  });
});

// ========================
// EVENT FUNCTIONS
// ========================
describe('fetchEvents', () => {
  it('should return formatted events', async () => {
    const mockEvents = [
      {
        id: 'e1',
        business_id: 'b1',
        business_name: 'Test Biz',
        title: 'Grand Opening',
        description: 'Come celebrate!',
        start_date: '2025-06-01T10:00:00Z',
        end_date: '2025-06-01T14:00:00Z',
      },
    ];

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: mockEvents, error: null }),
      }),
    }));

    const result = await fetchEvents('b1');

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Grand Opening');
    expect(result[0].start_date).toBeInstanceOf(Date);
  });
});

describe('insertEvent', () => {
  it('should insert an event successfully', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation(() => ({
      insert: mockInsert,
    }));

    const event = {
      id: 'e1',
      business_id: 'b1',
      business_name: 'Test Biz',
      title: 'Grand Opening',
      description: 'Come celebrate!',
      start_date: new Date('2025-06-01T10:00:00Z'),
      end_date: new Date('2025-06-01T14:00:00Z'),
    };

    await expect(insertEvent(event)).resolves.not.toThrow();
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe('deleteEvent', () => {
  it('should delete an event successfully', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation(() => ({
      delete: jest.fn().mockReturnValue({ eq: mockEq }),
    }));

    await expect(deleteEvent('e1')).resolves.not.toThrow();
  });
});

// ========================
// PRICE RANGE RECALCULATION
// ========================
describe('recalculatePriceRange', () => {
  it('should calculate min/max from all products', async () => {
    const mockProducts = [{ price: 10 }, { price: 25 }, { price: 5 }];
    const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'products') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: mockProducts, error: null }),
          }),
        };
      }
      if (table === 'businesses') {
        return {
          update: jest.fn().mockReturnValue({ eq: mockUpdateEq }),
        };
      }
      return {};
    });

    const result = await recalculatePriceRange('b1');

    expect(result).toEqual([5, 25]);
  });

  it('should return null and set price_range to null when no products', async () => {
    const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'products') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      if (table === 'businesses') {
        return {
          update: jest.fn().mockReturnValue({ eq: mockUpdateEq }),
        };
      }
      return {};
    });

    const result = await recalculatePriceRange('b1');

    expect(result).toBeNull();
    expect(mockUpdateEq).toHaveBeenCalled();
  });
});