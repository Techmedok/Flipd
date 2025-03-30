-- CREATE TABLE users (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL,
--     email TEXT NOT NULL UNIQUE,
--     password TEXT NOT NULL,
--     is_verified BOOLEAN DEFAULT FALSE,
--     last_login TIMESTAMPTZ,
--     created_at TIMESTAMPTZ DEFAULT now()
-- );

-- -- Index on email for faster authentication and lookup
-- CREATE INDEX idx_users_email ON users(email);

-- -- Index on last_login for tracking user activity
-- CREATE INDEX idx_users_last_login ON users(last_login);

-- -- Composite index for verification and login tracking
-- CREATE INDEX idx_users_verified_login ON users(is_verified, last_login);

CREATE TABLE users (
    user_id TEXT PRIMARY KEY, 
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, 
    password TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT false, 
    last_login TIMESTAMPTZ, 
    created_at TIMESTAMPTZ DEFAULT now() 
);

-- Speeds up lookups by email
CREATE INDEX idx_users_email ON users (email);

-- Speeds up sorting/filtering by creation time
CREATE INDEX idx_users_created_at ON users (created_at);
