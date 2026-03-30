-- Create enum type for user roles
CREATE TYPE public.app_role AS ENUM('owner', 'consumer'); 

--Create enum type for business categories
CREATE TYPE public.business_category AS ENUM('Hair', 'Beauty', 'Clothing', 'Food', 'Entertainment', 'Services', 'Tutoring', 'Creative', 'Tech');

-- Create public tables
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  student_email TEXT, 
  avatar_url TEXT,
  bio TEXT,
  reviews TEXT[],
  business_id UUID DEFAULT NULL, 
  favorite_businesses UUID[],
  recently_viewed_businesses UUID[],
  favorite_products UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  products UUID[] REFERENCES public.products(id) ON DELETE CASCADE,
  contact_info JSON,
  hours_of_operation JSONB,
  tags TEXT[],
  reviews UUID[],
  price_range TEXT[],
  user_views INT DEFAULT 0,
  most_popular_products UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  description TEXT,
  images TEXT[],
  rating FLOAT DEFAULT 0,
  price MONEY NOT NULL,
  category TEXT,
  user_views INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  rating INT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ( (select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- Businesses policies
CREATE POLICY "Everyone can view businesses"
  ON public.businesses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Business owners can insert their business"
  ON public.businesses FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "Business owners can update their business"
  ON public.businesses FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = owner_id);

CREATE POLICY "Business owners can delete their business"
  ON public.businesses FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = owner_id);

-- Products policies
CREATE POLICY "Everyone can view products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Business owners can insert products for their business"
  ON public.products FOR INSERT
  TO authenticated 
  WITH CHECK ((select auth.uid()) = (SELECT owner_id FROM public.businesses WHERE id = business_id));

CREATE POLICY "Business owners can update their own products"
  ON public.products FOR update
  TO authenticated
  USING ((select auth.uid()) = (SELECT owner_id FROM public.businesses WHERE id = business_id));

CREATE POLICY "Business owners can delete their own products"
  ON public.products FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = (SELECT owner_id FROM public.businesses WHERE id = business_id));

-- Reviews policies
CREATE POLICY "Users can view all reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert reviews for businesses"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE 
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- User roles policies
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Everyone can view events"
  ON public.events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Business owners can insert events for their business"
  ON public.events FOR INSERT
  TO authenticated 
  WITH CHECK ((select auth.uid()) = (SELECT owner_id FROM public.businesses WHERE id = business_id));

CREATE POLICY "Business owners can update their own events"
  ON public.events FOR update
  TO authenticated
  USING ((select auth.uid()) = (SELECT owner_id FROM public.businesses WHERE id = business_id));

CREATE POLICY "Business owners can delete their own events"
  ON public.events FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = (SELECT owner_id FROM public.businesses WHERE id = business_id));

-- Storage: allow authenticated users to upload business logos
CREATE POLICY "Authenticated users can upload business logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'businesses');

-- Storage: allow public read of business logos (for display)
CREATE POLICY "Business logos are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'businesses');

-- Storage: allow authenticated users to update their uploads in businesses bucket
CREATE POLICY "Authenticated users can update business logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'businesses');

CREATE POLICY "Authenticated users can delete business logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'businesses');

CREATE OR REPLACE FUNCTION public.is_promotion_valid()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If current time is outside [start_date, end_date], mark inactive
  IF (now() < NEW.start_date OR now() > NEW.end_date) THEN
    NEW.is_active := false;
  ELSE
    NEW.is_active := true;
  END IF;

  RETURN NEW;
END;
$$;

-- If you already created the trigger before, drop it first to avoid duplicates
DROP TRIGGER IF EXISTS check_promotion ON public.promotions;

CREATE TRIGGER check_promotion
BEFORE INSERT OR UPDATE ON public.promotions
FOR EACH ROW