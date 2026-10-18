import { onRequestPost } from "./functions/api/ai-cook.js";
import { onRequest as onReviewsRequest } from "./functions/api/reviews.js";
import { onRequest as onAccountDataRequest } from "./functions/api/account-data.js";
import { onRequest as onRecipesAdminRequest } from "./functions/api/recipes-admin.js";
import { onRequest as onRecipeImageRequest } from "./functions/api/recipe-image.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/recipes-admin") {
      return onRecipesAdminRequest({ request, env, ctx });
    }

    if (url.pathname === "/api/recipe-image") {
      return onRecipeImageRequest({ request, env, ctx });
    }

    if (url.pathname.startsWith("/recipe-images/")) {
      if (!env.RECIPE_IMAGES) return new Response("Image storage is not configured", { status: 503 });
      const key = url.pathname.slice("/recipe-images/".length);
      if (!/^[0-9a-f-]{36}\\.(jpg|png|webp|avif)$/.test(key)) return new Response("Not found", { status: 404 });
      const object = await env.RECIPE_IMAGES.get(key);
      if (!object) return new Response("Not found", { status: 404 });
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(object.body, { headers });
    }

    if (url.pathname === "/api/account-data") {
      return onAccountDataRequest({ request, env, ctx });
    }

    if (url.pathname === "/api/reviews") {
      return onReviewsRequest({ request, env, ctx });
    }

    if (url.pathname === "/api/ai-cook") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "method_not_allowed" }), {
          status: 405,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "Allow": "POST"
          }
        });
      }

      return onRequestPost({ request, env, ctx });
    }

    return env.ASSETS.fetch(request);
  }
};
