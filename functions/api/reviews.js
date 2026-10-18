const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff", "Access-Control-Allow-Origin": "https://cookipie.github.io",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  }
});
const clean = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
const id = () => crypto.randomUUID();
const validRecipe = value => /^[a-z0-9-]{1,80}$/i.test(value);
const SUPABASE_URL = "https://htnziffczbgmaikzfiov.supabase.co";
const SUPABASE_KEY = "sb_publishable_sIFiT_rsIK2Eqa_RzkOvpQ_5RqTz5X0";
async function getUser(request) {
  const token = (request.headers.get("Authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  try {
    const response = await fetch(SUPABASE_URL + "/auth/v1/user", {
      headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + token }
    });
    if (!response.ok) return null;
    const user = await response.json();
    return user?.id ? user : null;
  } catch { return null; }
}
function displayName(user, fallback = "Home cook") {
  const name = clean(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || fallback, 40);
  return name.length >= 2 ? name : "Home cook";
}
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "https://cookipie.github.io",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400"
  }});
  if (!env.DB) return json({ error: "reviews_setup_required" }, 503);
  if (request.method === "GET") {
    const url = new URL(request.url), recipeId = clean(url.searchParams.get("recipeId"), 80);
    if (!validRecipe(recipeId)) return json({ error: "invalid_recipe" }, 400);
    const user = await getUser(request);
    try {
      const reviews = await env.DB.prepare(
        "SELECT r.id, r.recipe_id AS recipeId, r.reviewer_name AS name, r.rating, r.review_text AS text, r.created_at AS createdAt, (SELECT COUNT(*) FROM review_likes l WHERE l.review_id = r.id) AS likesCount, CASE WHEN ? IS NOT NULL AND EXISTS(SELECT 1 FROM review_likes l WHERE l.review_id = r.id AND l.user_id = ?) THEN 1 ELSE 0 END AS likedByMe FROM recipe_reviews r WHERE r.recipe_id = ? ORDER BY r.created_at DESC LIMIT 100"
      ).bind(user?.id || null, user?.id || null, recipeId).all();
      const comments = await env.DB.prepare(
        "SELECT id, review_id AS reviewId, commenter_name AS name, comment_text AS text, created_at AS createdAt FROM recipe_review_comments WHERE review_id IN (SELECT id FROM recipe_reviews WHERE recipe_id = ?) ORDER BY created_at ASC LIMIT 500"
      ).bind(recipeId).all();
      const recipeLikes = await env.DB.prepare("SELECT COUNT(*) AS count FROM recipe_likes WHERE recipe_id = ?").bind(recipeId).first();
      const myRecipeLike = user ? await env.DB.prepare("SELECT 1 AS liked FROM recipe_likes WHERE recipe_id = ? AND user_id = ?").bind(recipeId, user.id).first() : null;
      return json({ reviews: reviews.results || [], comments: comments.results || [], recipeLikeCount: Number(recipeLikes?.count || 0), recipeLikedByMe: !!myRecipeLike });
    } catch (error) {
      console.error("Cookipie reviews read failed", error?.name || "Error");
      return json({ error: "reviews_unavailable" }, 503);
    }
  }
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!(request.headers.get("content-type") || "").includes("application/json")) return json({ error: "json_required" }, 415);
  let body; try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const user = await getUser(request);
  if (!user) return json({ error: "login_required" }, 401);
  const action = body?.action, recipeId = clean(body?.recipeId, 80);
  if (!validRecipe(recipeId)) return json({ error: "invalid_recipe" }, 400);
  const name = displayName(user), text = clean(body?.text, 1000);
  if (action === "toggle-review-like") {
    const reviewId = clean(body?.reviewId, 80);
    if (!reviewId) return json({ error: "invalid_review" }, 400);
    try {
      const parent = await env.DB.prepare("SELECT id FROM recipe_reviews WHERE id = ? AND recipe_id = ?").bind(reviewId, recipeId).first();
      if (!parent) return json({ error: "review_not_found" }, 404);
      const existing = await env.DB.prepare("SELECT 1 AS liked FROM review_likes WHERE user_id = ? AND review_id = ?").bind(user.id, reviewId).first();
      if (existing) await env.DB.prepare("DELETE FROM review_likes WHERE user_id = ? AND review_id = ?").bind(user.id, reviewId).run();
      else await env.DB.prepare("INSERT OR IGNORE INTO review_likes (user_id, review_id) VALUES (?, ?)").bind(user.id, reviewId).run();
      const total = await env.DB.prepare("SELECT COUNT(*) AS count FROM review_likes WHERE review_id = ?").bind(reviewId).first();
      return json({ ok: true, liked: !existing, count: Number(total?.count || 0) });
    } catch (error) {
      console.error("Cookipie review like failed", error?.name || "Error");
      return json({ error: "reviews_unavailable" }, 503);
    }
  }
  if (name.length < 2 || text.length < 2) return json({ error: "text_too_short" }, 400);
  if (action === "review") {
    const rating = Number(body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: "invalid_rating" }, 400);
    try {
      const reviewId = id();
      await env.DB.prepare(
        "INSERT INTO recipe_reviews (id, recipe_id, reviewer_name, rating, review_text, user_id) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(reviewId, recipeId, name, rating, text, user.id).run();
      return json({ ok: true, id: reviewId }, 201);
    } catch (error) {
      console.error("Cookipie review write failed", error?.name || "Error");
      return json({ error: "reviews_unavailable" }, 503);
    }
  }
  if (action === "comment") {
    const reviewId = clean(body?.reviewId, 80);
    if (!reviewId) return json({ error: "invalid_review" }, 400);
    try {
      const parent = await env.DB.prepare("SELECT id FROM recipe_reviews WHERE id = ? AND recipe_id = ?").bind(reviewId, recipeId).first();
      if (!parent) return json({ error: "review_not_found" }, 404);
      await env.DB.prepare(
        "INSERT INTO recipe_review_comments (id, review_id, commenter_name, comment_text, user_id) VALUES (?, ?, ?, ?, ?)"
      ).bind(id(), reviewId, name, text, user.id).run();
      return json({ ok: true }, 201);
    } catch (error) {
      console.error("Cookipie comment write failed", error?.name || "Error");
      return json({ error: "reviews_unavailable" }, 503);
    }
  }
  return json({ error: "invalid_action" }, 400);
}
