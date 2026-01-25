-- Table for Caching Search Results
CREATE TABLE
  search_cache (
    id SERIAL PRIMARY KEY,
    school_name TEXT NOT NULL,
    sport_name TEXT NOT NULL,
    results JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

-- Table for Background Job Tracking
CREATE TABLE
  background_jobs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    payload JSONB NOT NULL,
    error_message TEXT,
    results JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
