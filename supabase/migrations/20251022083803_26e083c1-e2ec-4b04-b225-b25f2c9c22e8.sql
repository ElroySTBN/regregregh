-- Create referral codes table
CREATE TABLE public.referral_codes (
  telegram_user_id text PRIMARY KEY,
  code text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  referrals_count integer DEFAULT 0,
  total_earnings numeric DEFAULT 0
);

-- Create referral usage tracking table
CREATE TABLE public.referral_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_telegram_user_id text NOT NULL,
  referred_telegram_user_id text NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  discount_amount numeric NOT NULL,
  commission_amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Add referral code field to orders
ALTER TABLE public.orders ADD COLUMN used_referral_code text;

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_codes
CREATE POLICY "Enable read access for all users"
ON public.referral_codes FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.referral_codes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON public.referral_codes FOR UPDATE
USING (true);

-- RLS policies for referral_usage
CREATE POLICY "Enable read access for all users"
ON public.referral_usage FOR SELECT
USING (true);

CREATE POLICY "Enable insert for all users"
ON public.referral_usage FOR INSERT
WITH CHECK (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate code format: FG-XXXXX (5 random alphanumeric chars)
    new_code := 'FG-' || upper(substring(md5(random()::text) from 1 for 5));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;