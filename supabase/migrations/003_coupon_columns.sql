-- Add coupon fields to deals table
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS coupon_description text,
  ADD COLUMN IF NOT EXISTS coupon_expiry timestamptz;
