-- Migration: Add image columns to phong table
-- Created: 2025-11-17
-- Description: Adds anh_chinh (main image URL) and anh_phu (gallery image URLs) to phong table

-- Add anh_chinh column for main room image
ALTER TABLE public.phong 
ADD COLUMN IF NOT EXISTS anh_chinh text NULL;

-- Add anh_phu column for gallery images (array of text URLs)
ALTER TABLE public.phong 
ADD COLUMN IF NOT EXISTS anh_phu text[] NULL DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN public.phong.anh_chinh IS 'URL của ảnh chính phòng (stored on Cloudinary)';
COMMENT ON COLUMN public.phong.anh_phu IS 'Mảng URLs của ảnh phụ/gallery phòng (stored on Cloudinary)';

-- Verify the changes
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'phong' 
-- AND column_name IN ('anh_chinh', 'anh_phu');
