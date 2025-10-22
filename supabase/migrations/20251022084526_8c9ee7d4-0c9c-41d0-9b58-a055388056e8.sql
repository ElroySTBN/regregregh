-- Add available_balance to referral_codes table
ALTER TABLE public.referral_codes 
ADD COLUMN IF NOT EXISTS available_balance numeric DEFAULT 0;

-- Update referral_usage to track when commission was paid
ALTER TABLE public.referral_usage
ADD COLUMN IF NOT EXISTS commission_paid boolean DEFAULT false;

-- Add column to orders to track wallet amount used
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS wallet_amount_used numeric DEFAULT 0;