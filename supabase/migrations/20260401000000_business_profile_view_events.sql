-- Time-series profile views for business dashboards (aggregate user_views remains on businesses).

CREATE TABLE IF NOT EXISTS public.business_profile_view_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_profile_view_events_business_viewed
  ON public.business_profile_view_events (business_id, viewed_at DESC);

ALTER TABLE public.business_profile_view_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owners can read profile view events"
  ON public.business_profile_view_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = (select auth.uid())
    )
  );

-- Increments businesses.user_views and records a timestamped event. Callable by anyone who can open the public profile.
CREATE OR REPLACE FUNCTION public.record_business_profile_view(p_business_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = p_business_id) THEN
    RETURN;
  END IF;

  UPDATE public.businesses
  SET user_views = COALESCE(user_views, 0) + 1
  WHERE id = p_business_id;

  INSERT INTO public.business_profile_view_events (business_id, viewed_at)
  VALUES (p_business_id, now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_business_profile_view(uuid) TO anon, authenticated;
