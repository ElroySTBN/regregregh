-- Create storage bucket for order instructions/consignes
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-instructions', 'order-instructions', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for order instructions
CREATE POLICY "Anyone can view order instructions"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-instructions');

CREATE POLICY "Service role can upload order instructions"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-instructions');

-- Add column to orders table to store instruction file URL
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS instruction_file_url TEXT;