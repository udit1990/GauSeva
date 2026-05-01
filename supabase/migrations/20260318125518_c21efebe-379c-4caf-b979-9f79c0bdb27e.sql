-- Create storage bucket for seva images
INSERT INTO storage.buckets (id, name, public) VALUES ('seva-images', 'seva-images', true);

-- Allow public read access
CREATE POLICY "Seva images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'seva-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload seva images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'seva-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update seva images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'seva-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete seva images"
ON storage.objects FOR DELETE
USING (bucket_id = 'seva-images' AND auth.role() = 'authenticated');

-- Create seva_images table to track which images are used where
CREATE TABLE public.seva_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_key TEXT NOT NULL UNIQUE,
  storage_path TEXT NOT NULL,
  alt_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seva_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seva images"
ON public.seva_images FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert seva images"
ON public.seva_images FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update seva images"
ON public.seva_images FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete seva images"
ON public.seva_images FOR DELETE USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_seva_images_updated_at
BEFORE UPDATE ON public.seva_images
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();