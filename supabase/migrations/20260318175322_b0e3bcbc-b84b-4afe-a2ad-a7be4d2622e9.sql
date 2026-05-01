-- Add unique index on phone to prevent duplicate profiles
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique ON profiles (phone) WHERE phone IS NOT NULL;