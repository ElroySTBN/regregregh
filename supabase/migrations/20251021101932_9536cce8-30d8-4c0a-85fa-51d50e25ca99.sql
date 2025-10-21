-- Add user_id column to telegram_users to link with auth users
ALTER TABLE public.telegram_users
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;