-- Create enum type for user roles
CREATE TYPE public.app_role AS ENUM('owner', 'consumer'); 

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

-- Helper function to search feature for businesses
create function find_business(businesses) returns text as $$
  select $1.name || ' ' || $1.category || ' ' || $1.description || ' ' || $1.tags;
$$ language sql immutable;

