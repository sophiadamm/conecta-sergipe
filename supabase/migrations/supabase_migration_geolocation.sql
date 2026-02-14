-- Migration: Add Geolocation Support for Sergipe
-- Description: Add location fields to profiles and opportunities tables

-- 1. Add locations column to profiles (volunteer can work in multiple cities)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS locations text[];

-- 2. Add location column to opportunities (opportunity is in a specific city)
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS location text;

-- Optional: Add comments for documentation
COMMENT ON COLUMN profiles.locations IS 'Array of cities in Sergipe where the volunteer can work';
COMMENT ON COLUMN opportunities.location IS 'City in Sergipe where the opportunity is located';

-- Optional: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_locations ON profiles USING GIN (locations);
CREATE INDEX IF NOT EXISTS idx_opportunities_location ON opportunities (location);
