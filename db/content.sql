CREATE TABLE content (
    content_id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    thumbnail TEXT,
    content_type TEXT,
    content_text TEXT,
    first_saved TIMESTAMPTZ DEFAULT now()
);

-- Unique index for URL (to enforce uniqueness and speed up lookups)
CREATE UNIQUE INDEX idx_content_url ON content (url);

-- Index for title (for faster filtering/sorting by title)
CREATE INDEX idx_content_title ON content (title);

-- Index for content_type (for filtering by type)
CREATE INDEX idx_content_type ON content (content_type);

-- Index for first_saved (for sorting by save time)
CREATE INDEX idx_content_first_saved ON content (first_saved);

-- Full-text search index for title and content_text
CREATE INDEX idx_content_search ON content USING GIN (to_tsvector('english', title || ' ' || content_text));