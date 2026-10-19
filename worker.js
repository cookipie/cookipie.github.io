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

    if (url.pathname === "/api/account-data") {
      return onAccountDataRequest({ request, env, ctx });
    }

    if (url.pathname === "/api/reviews") {
      return onReviewsRequest({ request, env, ctx });
    }

    if (url.pathname === "/api/ai-cook") {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "https://cookipie.github.io",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
            "Vary": "Origin"
          }
        });
      }
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "method_not_allowed" }), {
          status: 405,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "https://cookipie.github.io",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Allow": "POST, OPTIONS"
          }
        });
      }

      return onRequestPost({ request, env, ctx });
    }

    return env.ASSETS.fetch(request);
  }
};
