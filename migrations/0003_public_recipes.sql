CREATE TABLE IF NOT EXISTS public_recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hi TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('veg','nonveg')),
  time INTEGER NOT NULL DEFAULT 30,
  servings INTEGER NOT NULL DEFAULT 2,
  groups_json TEXT NOT NULL DEFAULT '[]',
  tags TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  intro TEXT NOT NULL DEFAULT '',
  intro_hi TEXT NOT NULL DEFAULT '',
  ingredients_json TEXT NOT NULL DEFAULT '[]',
  steps_json TEXT NOT NULL DEFAULT '[]',
  tip_json TEXT NOT NULL DEFAULT '[]',
  difficulty TEXT NOT NULL DEFAULT 'easy',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_public_recipes_updated ON public_recipes(updated_at DESC);
