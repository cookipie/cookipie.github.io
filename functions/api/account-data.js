const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff", "Access-Control-Allow-Origin": "https://cookipie.github.io",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  }
});
const clean = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
const validRecipe = value => /^[a-z0-9-]{1,80}$/i.test(value);
const SUPABASE_URL = "https://htnziffczbgmaikzfiov.supabase.co";
const SUPABASE_KEY = "sb_publishable_sIFiT_rsIK2Eqa_RzkOvpQ_5RqTz5X0";
async function getUser(request) {
  const header = request.headers.get("Authorization") || "";
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1];
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
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "https://cookipie.github.io",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400"
  }});
  if (!env.DB) return json({ error: "account_data_setup_required" }, 503);
  const user = await getUser(request);
  if (!user) return json({ error: "login_required" }, 401);
  if (request.method === "GET") {
    const url = new URL(request.url), action = url.searchParams.get("action");
    try {
      if (action === "list-saved") {
        const rows = await env.DB.prepare("SELECT recipe_id AS recipeId FROM saved_recipes WHERE user_id = ? ORDER BY created_at DESC").bind(user.id).all();
        return json({ recipeIds: (rows.results || []).map(row => row.recipeId) });
      }
      if (action === "recipe-likes") {
        const recipeId = clean(url.searchParams.get("recipeId"), 80);
        if (!validRecipe(recipeId)) return json({ error: "invalid_recipe" }, 400);
        const total = await env.DB.prepare("SELECT COUNT(*) AS count FROM recipe_likes WHERE recipe_id = ?").bind(recipeId).first();
        const mine = await env.DB.prepare("SELECT 1 AS liked FROM recipe_likes WHERE recipe_id = ? AND user_id = ?").bind(recipeId, user.id).first();
        return json({ count: Number(total?.count || 0), liked: !!mine });
      }
      return json({ error: "invalid_action" }, 400);
    } catch (error) {
      console.error("Cookipie account data read failed", error?.name || "Error");
      return json({ error: "account_data_unavailable" }, 503);
    }
  }
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!(request.headers.get("content-type") || "").includes("application/json")) return json({ error: "json_required" }, 415);
  let body; try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const action = body?.action, recipeId = clean(body?.recipeId, 80);
  if (!validRecipe(recipeId)) return json({ error: "invalid_recipe" }, 400);
  try {
    if (action === "save") {
      await env.DB.prepare("INSERT OR IGNORE INTO saved_recipes (user_id, recipe_id) VALUES (?, ?)").bind(user.id, recipeId).run();
      return json({ ok: true, saved: true });
    }
    if (action === "unsave") {
      await env.DB.prepare("DELETE FROM saved_recipes WHERE user_id = ? AND recipe_id = ?").bind(user.id, recipeId).run();
      return json({ ok: true, saved: false });
    }
    if (action === "toggle-recipe-like") {
      const existing = await env.DB.prepare("SELECT 1 AS liked FROM recipe_likes WHERE user_id = ? AND recipe_id = ?").bind(user.id, recipeId).first();
      if (existing) await env.DB.prepare("DELETE FROM recipe_likes WHERE user_id = ? AND recipe_id = ?").bind(user.id, recipeId).run();
      else await env.DB.prepare("INSERT OR IGNORE INTO recipe_likes (user_id, recipe_id) VALUES (?, ?)").bind(user.id, recipeId).run();
      const total = await env.DB.prepare("SELECT COUNT(*) AS count FROM recipe_likes WHERE recipe_id = ?").bind(recipeId).first();
      return json({ ok: true, liked: !existing, count: Number(total?.count || 0) });
    }
    return json({ error: "invalid_action" }, 400);
  } catch (error) {
    console.error("Cookipie account data write failed", error?.name || "Error");
    return json({ error: "account_data_unavailable" }, 503);
  }
}
