-- Add is_hidden flag to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Create business_reports table
CREATE TABLE public.business_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert reports"
  ON public.business_reports FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = reporter_id);

-- Trigger: auto-hide business when report count reaches 2
CREATE OR REPLACE FUNCTION public.check_business_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.business_reports WHERE business_id = NEW.business_id) >= 2 THEN
    UPDATE public.businesses SET is_hidden = true WHERE id = NEW.business_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER auto_hide_reported_business
  AFTER INSERT ON public.business_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.check_business_report_count();
