# Review System Implementation Plan

## Context

TheYardExchange is a student marketplace where Howard University students can discover and purchase products/services from fellow student entrepreneurs. Currently, the platform has a reviews table in the database but no UI for users to submit reviews. Business and product pages show mock review data instead of real data from the database.

**User Need**: Users should be able to leave reviews on specific products and businesses overall, with these reviews impacting the displayed ratings for both entities.

**Current State**:

- ✅ Reviews table exists in Supabase with support for both business and product reviews (optional `product_id` field)
- ✅ Basic CRUD functions exist (`fetchReview`, `insertReview`, `deleteReview`)
- ❌ Review type missing `product_id` and `created_at` fields
- ❌ No UI components for submitting/displaying reviews
- ❌ BusinessDetail page uses hardcoded mock reviews (lines 43-68)
- ❌ No product detail page exists
- ❌ No rating calculation logic
- ❌ RLS policies exist but functions don't fully utilize product_id filtering

## Implementation Plan

### 1. Update Data Layer

**File**: [src/lib/interfaces.ts](src/lib/interfaces.ts)

**Changes**:

- Add `product_id?: string | null` to Review type (line 66-72)
- Add `created_at?: string` to Review type for displaying review dates

**File**: [src/lib/data/utils.ts](src/lib/data/utils.ts)

**Updates to Existing Functions**:

1. **fetchReview** (line 291): Add product_id filter support
   - Add `if (filters.product_id) { query = query.eq('product_id', filters.product_id); }` after line 296
   - Add `.order('created_at', { ascending: false })` to sort by newest first

2. **insertReview** (line 319): Add product_id support
   - Add `product_id: review.product_id || null` to the insert object after line 325

**New Functions to Add**:

1. **calculateAverageRating**: Calculate average rating from reviews

   ```typescript
   export async function calculateAverageRating(
     businessId: string,
     productId?: string,
   ): Promise<number>;
   ```

   - Query reviews table with business_id
   - If productId provided, filter by product_id
   - Use Supabase `.select('rating')` and calculate average in JS
   - Return rounded to 1 decimal place, or 0 if no reviews

2. **checkUserReviewExists**: Check for duplicate reviews
   ```typescript
   export async function checkUserReviewExists(
     userId: string,
     businessId: string,
     productId?: string,
   ): Promise<Review | null>;
   ```

   - Query reviews with user_id, business_id, and optional product_id
   - Return existing review or null

### 2. Create UI Components

**Component 1**: [src/components/ui/star-rating.tsx](src/components/ui/star-rating.tsx) (NEW FILE)

**Purpose**: Reusable star rating display and selector

**Props**:

- `value: number` - Rating value (0-5)
- `onChange?: (value: number) => void` - For interactive mode
- `readonly?: boolean` - Display-only mode (default: true)
- `size?: "sm" | "md" | "lg"` - Size variant (default: "md")
- `showValue?: boolean` - Show numeric value (default: false)

**Features**:

- Display mode: Shows filled stars based on value
- Interactive mode: Click stars to select rating (1-5)
- Hover effects for interactive mode
- Uses Lucide Star icon with `fill-primary` for filled stars
- Accessible with aria-labels

---

**Component 2**: [src/components/ui/review-form.tsx](src/components/ui/review-form.tsx) (NEW FILE)

**Purpose**: Form for submitting new reviews

**Props**:

- `businessId: string` - Required
- `productId?: string` - If provided, creates product review
- `onSuccess?: () => void` - Callback after successful submission
- `onCancel?: () => void` - Callback for cancel

**Features**:

- Star rating selector using StarRating component (required field)
- Textarea for optional comment (max 500 chars)
- Character counter for comment field
- Zod validation schema
- Submit/Cancel buttons with loading states
- Toast notifications for success/error
- Uses Dialog component for modal display

**Validation**:

```typescript
z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z.string().max(500).optional(),
});
```

**Flow**:

1. User selects rating (1-5 stars)
2. Optionally adds comment
3. On submit: validate → insertReview → show success toast → trigger onSuccess
4. Handles errors with toast notifications

---

**Component 3**: [src/components/ui/review-list.tsx](src/components/ui/review-list.tsx) (NEW FILE)

**Purpose**: Display list of reviews with user information

**Props**:

- `businessId: string` - Required
- `productId?: string` - If provided, shows only product reviews
- `currentUserId?: string` - To show delete button on user's own reviews
- `onReviewChange?: () => void` - Callback when reviews are added/deleted

**Features**:

- Fetches reviews using `fetchReview` and user profiles using `fetchProfile`
- Displays each review with:
  - User avatar (with fallback to initials)
  - User name
  - Star rating (readonly)
  - Date (relative format: "2 days ago")
  - Comment text
- Delete button (trash icon) for user's own reviews
- "Write a Review" button that opens ReviewForm dialog
- Empty state when no reviews ("Be the first to review!")
- Loading skeleton while fetching
- Handles authentication check before showing review form

**Layout**: Card components in vertical stack

---

**Component 4**: [src/components/ui/review-summary.tsx](src/components/ui/review-summary.tsx) (NEW FILE)

**Purpose**: Display rating summary statistics

**Props**:

- `rating: number` - Average rating
- `reviewCount: number` - Total number of reviews

**Features**:

- Large numeric rating display (e.g., "4.8")
- Star rating visualization
- Review count text (e.g., "Based on 124 reviews")
- Clean, compact design
- Can be placed above ReviewList component

### 3. Page Integration

**File**: [src/pages/BusinessDetail.tsx](src/pages/BusinessDetail.tsx)

**Changes**:

1. **Remove Mock Data** (lines 19-81):
   - Delete hardcoded `business`, `reviews`, `services`, `upcomingEvents` objects
   - These will be fetched from database instead

2. **Add State Management** (after line 17):

   ```typescript
   const { id: businessId } = useParams();
   const { user } = useAuth();
   const [business, setBusiness] = useState<Business | null>(null);
   const [reviews, setReviews] = useState<Review[]>([]);
   const [averageRating, setAverageRating] = useState<number>(0);
   const [loading, setLoading] = useState(true);
   ```

3. **Add Data Fetching** (useEffect):
   - Fetch business by ID using `fetchBusiness`
   - Fetch reviews using `fetchReview` with business_id filter
   - Calculate rating using `calculateAverageRating`
   - Handle loading and error states

4. **Update Reviews Tab** (lines 251-281):
   - Replace entire TabsContent for "reviews"
   - Add ReviewSummary component at top
   - Replace hardcoded review cards with ReviewList component
   - Pass business.id, current user, and callback

5. **Add Review Change Handler**:

   ```typescript
   const handleReviewChange = async () => {
     // Refetch reviews
     // Recalculate rating
     // Update state
   };
   ```

6. **Update Hero Section** (line 163-166):
   - Use actual `averageRating` and `reviews.length` instead of mock data

**Important**: Keep services and events tabs as-is for now (out of scope for reviews feature)

---

**File**: [src/pages/ProductDetail.tsx](src/pages/ProductDetail.tsx) (NEW FILE)

**Purpose**: Product detail page with review functionality

**Structure** (mirror BusinessDetail.tsx patterns):

1. **Header**: Same header component as BusinessDetail
2. **Breadcrumb**: Home > Discover > Business > Product
3. **Hero Section**:
   - Product image (large)
   - Product name (h1)
   - Price (prominent)
   - Star rating + review count
   - Business name link
   - Favorite/Share buttons

4. **Two-Column Layout**:
   - **Main Content** (left, 2/3 width):
     - Tabs: Details | Reviews
     - Details tab: Description, specs, tags
     - Reviews tab: ReviewSummary + ReviewList components

   - **Sidebar** (right, 1/3 width):
     - Contact business card (same as BusinessDetail)
     - Business info card with logo, name, rating
     - Link to business detail page

5. **Data Fetching**:
   - Fetch product by ID from URL params
   - Fetch product reviews (with product_id filter)
   - Fetch associated business info
   - Calculate product rating

6. **Review Integration**:
   - ReviewList with `productId` prop set
   - Reviews filtered to product only
   - Rating calculation scoped to product

**File**: [src/App.tsx](src/App.tsx)

**Add Route**:

```typescript
<Route path="/product/:id" element={<ProductDetail />} />
```

### 4. Review Submission Flow

**Complete User Flow**:

1. **User clicks "Write a Review" button** on ReviewList
2. **Authentication check**:
   - If not logged in: Show toast "Please sign in to leave a review" + redirect to /auth
   - If logged in: Continue
3. **Duplicate check**:
   - Call `checkUserReviewExists(user.id, businessId, productId)`
   - If review exists: Show message "You've already reviewed this. Delete your existing review to write a new one."
   - If no review: Open ReviewForm dialog
4. **User fills form**:
   - Selects rating (required)
   - Adds comment (optional)
   - Zod validates client-side
5. **User submits**:
   - Generate review ID: `crypto.randomUUID()`
   - Call `insertReview({ id, user_id, business_id, product_id, rating, comment })`
   - On success:
     - Show toast: "Review submitted successfully!"
     - Close dialog
     - Call `onReviewChange()` to refresh review list
     - Recalculate and update rating display
   - On error:
     - Show toast with error message
     - Keep dialog open

**Rating Update Logic**:

- After review submission, call `calculateAverageRating`
- Update state immediately (optimistic UI update)
- Display new rating in hero section and ReviewSummary

**Delete Review Flow**:

1. User clicks delete button (trash icon) on their review
2. Confirm dialog: "Are you sure you want to delete this review?"
3. On confirm:
   - Call `deleteReview(reviewId)`
   - Remove review from list
   - Recalculate rating
   - Show toast: "Review deleted"

### 5. Critical Files Reference

| File                                                                         | Purpose                     | Changes                                        |
| ---------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------- |
| [src/lib/interfaces.ts](src/lib/interfaces.ts)                               | Type definitions            | Update Review type (add product_id, created_at)|
| [src/lib/data/utils.ts](src/lib/data/utils.ts)                               | Database operations         | Update existing functions, add 2 new functions |
| [src/pages/BusinessDetail.tsx](src/pages/BusinessDetail.tsx)                 | Business page               | Replace mock data, integrate ReviewList        |
| [src/pages/ProductDetail.tsx](src/pages/ProductDetail.tsx)                   | Product page (new)          | Create new page with reviews tab               |
| [src/components/ui/star-rating.tsx](src/components/ui/star-rating.tsx)       | Star rating component (new) | Create reusable rating component               |
| [src/components/ui/review-form.tsx](src/components/ui/review-form.tsx)       | Review submission (new)     | Create form with validation                    |
| [src/components/ui/review-list.tsx](src/components/ui/review-list.tsx)       | Review display (new)        | Create review list component                   |
| [src/components/ui/review-summary.tsx](src/components/ui/review-summary.tsx) | Rating summary (new)        | Create summary display                         |
| [src/App.tsx](src/App.tsx)                                                   | Routing                     | Add product detail route                       |

### 6. Implementation Sequence

**Phase 1: Data Layer** (Foundation)

1. Update Review interface in interfaces.ts (add product_id and created_at fields)
2. Update fetchReview to support product_id filtering
3. Update insertReview to include product_id
4. Implement calculateAverageRating
5. Implement checkUserReviewExists

**Phase 2: StarRating Component** (Building Block)

1. Create star-rating.tsx
2. Implement readonly mode
3. Implement interactive mode with hover effects
4. Test in isolation

**Phase 3: Review Components** (UI Layer)

1. Create review-summary.tsx (simplest)
2. Create review-form.tsx with validation
3. Create review-list.tsx with data fetching
4. Wire up form submission and delete

**Phase 4: BusinessDetail Integration** (First Integration)

1. Add state management for reviews
2. Add data fetching logic
3. Replace mock data in reviews tab
4. Integrate ReviewSummary and ReviewList
5. Test submission and delete flows
6. Update hero section rating display

**Phase 5: ProductDetail Page** (Second Integration)

1. Create ProductDetail.tsx
2. Implement layout and tabs
3. Add data fetching for product and reviews
4. Integrate review components
5. Add routing in App.tsx
6. Test product-specific reviews

**Phase 6: Polish & Testing** (Finalization)

1. Add loading states and skeletons
2. Improve error handling and messages
3. Test authentication flow
4. Test duplicate prevention
5. Test rating calculations
6. Test edge cases (no reviews, long comments, etc.)

### 7. Validation & Error Handling

**Client-Side Validation**:

- Rating: Required, 1-5 range (Zod schema)
- Comment: Optional, max 500 characters
- Form displays validation errors inline

**Error Scenarios**:

1. **Not authenticated**: Redirect to /auth with toast message
2. **Duplicate review**: Show message with delete option
3. **Network error**: Toast "Failed to submit review. Please try again."
4. **Database error**: Toast with error message
5. **Invalid data**: Show validation errors

**Loading States**:

- Skeleton loaders for review list
- Disabled submit button during submission
- Loading spinner on buttons
- Optimistic UI updates (show review immediately, rollback on error)

### 8. Testing Checklist

**Manual Test Scenarios**:

1. ✅ **Submit Business Review**:
   - Go to business detail page
   - Click "Write a Review"
   - Select rating and add comment
   - Submit and verify review appears
   - Check rating updates in header

2. ✅ **Submit Product Review**:
   - Go to product detail page
   - Submit review
   - Verify review appears in product reviews
   - Check product rating updates

3. ✅ **Duplicate Prevention**:
   - Submit a review
   - Try to submit another review
   - Verify "already reviewed" message

4. ✅ **Delete Own Review**:
   - Find your review in list
   - Click delete
   - Confirm deletion
   - Verify review removed and rating recalculated

5. ✅ **View as Different Users**:
   - Login as User A, submit review
   - Login as User B
   - Verify no delete button on User A's review
   - Verify User B can submit their own review

6. ✅ **Edge Cases**:
   - Submit review with no comment (should work)
   - Submit 500-character comment (should work)
   - Try 501-character comment (should fail validation)
   - View business/product with no reviews (empty state)
   - Not logged in (should redirect to auth)

**Rating Calculation Tests**:

- Business with no reviews: rating = 0
- Business with 1 review (5 stars): rating = 5.0
- Business with reviews of 5, 4, 3: rating = 4.0
- Product reviews should not affect business rating
- Business reviews should affect business rating

### 9. Design Patterns to Follow

**Existing Patterns from Codebase**:

- Use Radix UI components (Dialog, Card, Avatar, etc.)
- Toast notifications via `useToast()` from sonner
- Zod for validation (see Auth.tsx)
- Direct Supabase queries (no API layer)
- useState for local state
- AuthContext for user info
- Lucide icons for all icons
- Tailwind utility classes for styling

**Component Patterns**:

- ReviewForm: Modal with Dialog component (like potential modals in Profile.tsx)
- ReviewList: Card-based list (like business cards in Discover.tsx)
- Error handling: Try-catch with toast (like Auth.tsx)
- Loading: useState(false) with conditional rendering

**Naming Conventions**:

- Components: PascalCase (StarRating, ReviewForm)
- Functions: camelCase (fetchReview, calculateAverageRating)
- Types: PascalCase (Review, Product, Business)
- Props: camelCase with TypeScript interface

### 10. Future Enhancements (Out of Scope)

These features can be added later:

- Edit existing reviews
- Review photos/attachments
- Review reactions (helpful/not helpful)
- Business owner responses to reviews
- Rating distribution chart (5 stars: 60%, 4 stars: 30%, etc.)
- Review sorting (most recent, highest rated, etc.)
- Review pagination for businesses with 100+ reviews
- Verified purchase badges
- Report inappropriate reviews
- Email notifications to business owners

## Summary

This implementation adds a complete review system to TheYardExchange by:

1. Enhancing the existing data layer with rating calculations
2. Creating 4 reusable UI components for reviews and ratings
3. Integrating reviews into BusinessDetail page (replacing mock data)
4. Creating a new ProductDetail page with review functionality
5. Implementing proper validation, error handling, and user flows

The foundation (reviews table, RLS policies) already exists, so this plan focuses on the UI/UX layer and business logic. All components follow existing codebase patterns for consistency. User profiles will be fetched separately in the ReviewList component to display reviewer names and avatars.
