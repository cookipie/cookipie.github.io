CREATE TABLE IF NOT EXISTS recipe_reviews (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_recipe_reviews_recipe_created
  ON recipe_reviews (recipe_id, created_at DESC);

CREATE TABLE IF NOT EXISTS recipe_review_comments (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES recipe_reviews(id) ON DELETE CASCADE,
  commenter_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_review_comments_review_created
  ON recipe_review_comments (review_id, created_at ASC);
