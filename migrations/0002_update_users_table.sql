-- Drop the username constraint and column
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE users DROP COLUMN IF EXISTS username;

-- Make password nullable
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Add provider columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'local';
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id);