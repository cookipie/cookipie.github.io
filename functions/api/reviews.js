const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": "https://cookipie.github.io",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  }
});
const clean = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
const id = () => crypto.randomUUID();

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "https://cookipie.github.io",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
  if (!env.DB) return json({ error: "reviews_setup_required" }, 503);
  if (request.method === "GET") {
    const url = new URL(request.url);
    const recipeId = clean(url.searchParams.get("recipeId"), 80);
    if (!/^[a-z0-9-]{1,80}$/i.test(recipeId)) return json({ error: "invalid_recipe" }, 400);
    try {
      const reviews = await env.DB.prepare(
        "SELECT id, recipe_id AS recipeId, reviewer_name AS name, rating, review_text AS text, created_at AS createdAt FROM recipe_reviews WHERE recipe_id = ? ORDER BY created_at DESC LIMIT 100"
      ).bind(recipeId).all();
      const comments = await env.DB.prepare(
        "SELECT id, review_id AS reviewId, commenter_name AS name, comment_text AS text, created_at AS createdAt FROM recipe_review_comments WHERE review_id IN (SELECT id FROM recipe_reviews WHERE recipe_id = ?) ORDER BY created_at ASC LIMIT 500"
      ).bind(recipeId).all();
      return json({ reviews: reviews.results || [], comments: comments.results || [] });
    } catch (error) {
      console.error("Cookipie reviews read failed", error?.name || "Error");
      return json({ error: "reviews_unavailable" }, 503);
    }
  }
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!(request.headers.get("content-type") || "").includes("application/json")) return json({ error: "json_required" }, 415);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const action = body?.action;
  const recipeId = clean(body?.recipeId, 80);
  const name = clean(body?.name, 40) || "Home cook";
  const text = clean(body?.text, 1000);
  if (!/^[a-z0-9-]{1,80}$/i.test(recipeId)) return json({ error: "invalid_recipe" }, 400);
  if (name.length < 2) return json({ error: "name_too_short" }, 400);
  if (text.length < 2) return json({ error: "text_too_short" }, 400);
  if (action === "review") {
    const rating = Number(body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: "invalid_rating" }, 400);
    try {
      const reviewId = id();
      await env.DB.prepare(
        "INSERT INTO recipe_reviews (id, recipe_id, reviewer_name, rating, review_text) VALUES (?, ?, ?, ?, ?)"
      ).bind(reviewId, recipeId, name, rating, text).run();
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
        "INSERT INTO recipe_review_comments (id, review_id, commenter_name, comment_text) VALUES (?, ?, ?, ?)"
      ).bind(id(), reviewId, name, text).run();
      return json({ ok: true }, 201);
    } catch (error) {
      console.error("Cookipie comment write failed", error?.name || "Error");
      return json({ error: "reviews_unavailable" }, 503);
    }
  }
  return json({ error: "invalid_action" }, 400);
}
