-- Migration: Add CCCD image fields to khach_hang table
-- Purpose: Store customer ID card (CCCD/CMND) images for verification
-- Date: 2025-11-17

-- Note: These columns already exist in production database
-- This is a documentation migration file

-- The actual schema:
-- ALTER TABLE khach_hang ADD COLUMN cccd_mat_truoc text NULL;
-- ALTER TABLE khach_hang ADD COLUMN cccd_mat_sau text NULL;

-- Verify columns exist:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'khach_hang'
  AND column_name IN ('cccd_mat_truoc', 'cccd_mat_sau');

-- Add comments
COMMENT ON COLUMN khach_hang.cccd_mat_truoc IS 'URL ảnh CCCD/CMND mặt trước (Cloudinary)';
COMMENT ON COLUMN khach_hang.cccd_mat_sau IS 'URL ảnh CCCD/CMND mặt sau (Cloudinary)';
