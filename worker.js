import { onRequestPost } from "./functions/api/ai-cook.js";
import { onRequest as onReviewsRequest } from "./functions/api/reviews.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

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
