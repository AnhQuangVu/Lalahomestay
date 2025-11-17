-- Migration: Add 'dinh_chi' status to phong table
-- Purpose: Allow rooms to be suspended instead of deleted when they have transaction history
-- Date: 2024

-- Drop existing constraint if it exists
ALTER TABLE phong DROP CONSTRAINT IF EXISTS phong_trang_thai_check;

-- Add new constraint that includes 'dinh_chi' status
ALTER TABLE phong ADD CONSTRAINT phong_trang_thai_check 
  CHECK (trang_thai IN ('trong', 'dang_dung', 'sap_nhan', 'sap_tra', 'bao_tri', 'dinh_chi'));

-- Update comment
COMMENT ON COLUMN phong.trang_thai IS 'Room status: trong (empty), dang_dung (occupied), sap_nhan (incoming), sap_tra (outgoing), bao_tri (maintenance), dinh_chi (suspended)';
