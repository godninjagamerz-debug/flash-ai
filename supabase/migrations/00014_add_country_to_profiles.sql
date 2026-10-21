/*
# Add Country Field to Profiles

1. Changes
   - Add `country_code` column to profiles table (default: 'IN' for India)
   - Add `currency_code` column to profiles table (default: 'INR')

2. Purpose
   - Enable multi-currency support based on user's country
   - Allow users to see prices in their local currency
*/

-- Add country_code column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'IN' NOT NULL;

-- Add currency_code column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS currency_code text DEFAULT 'INR' NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.country_code IS 'ISO country code for user location';
COMMENT ON COLUMN profiles.currency_code IS 'Currency code based on country';