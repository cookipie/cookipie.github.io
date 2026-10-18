-- Cookipie account-linked features. Existing review/comment rows are preserved.
ALTER TABLE recipe_reviews ADD COLUMN user_id TEXT;
ALTER TABLE recipe_review_comments ADD COLUMN user_id TEXT;

CREATE TABLE IF NOT EXISTS saved_recipes (
  user_id TEXT NOT NULL,
  recipe_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, recipe_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_created ON saved_recipes(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS recipe_likes (
  user_id TEXT NOT NULL,
  recipe_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, recipe_id)
);
CREATE INDEX IF NOT EXISTS idx_recipe_likes_recipe ON recipe_likes(recipe_id);

CREATE TABLE IF NOT EXISTS review_likes (
  user_id TEXT NOT NULL,
  review_id TEXT NOT NULL REFERENCES recipe_reviews(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, review_id)
);
CREATE INDEX IF NOT EXISTS idx_review_likes_review ON review_likes(review_id);
