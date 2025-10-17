-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
);

-- RLS policies for payment proofs
CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Admins can view all payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

-- Add payment_proof_url column to orders table
ALTER TABLE orders
ADD COLUMN payment_proof_url TEXT;

-- Add admin_name to support_messages for tracking who replied
ALTER TABLE support_messages
ADD COLUMN admin_name TEXT;