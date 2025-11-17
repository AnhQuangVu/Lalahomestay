-- Migration: Add image fields to co_so table
-- Purpose: Store representative image and gallery for each location
-- Date: 2024

-- Add image columns to co_so table
ALTER TABLE co_so 
ADD COLUMN IF NOT EXISTS anh_dai_dien text NULL,
ADD COLUMN IF NOT EXISTS anh_phu text[] NULL DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN co_so.anh_dai_dien IS 'Cloudinary URL for main representative image of the location';
COMMENT ON COLUMN co_so.anh_phu IS 'Array of Cloudinary URLs for additional gallery images';

-- Example usage:
-- UPDATE co_so SET 
--   anh_dai_dien = 'https://res.cloudinary.com/.../location-main.jpg',
--   anh_phu = ARRAY['https://res.cloudinary.com/.../gallery1.jpg', 'https://res.cloudinary.com/.../gallery2.jpg']
-- WHERE id = 1;
