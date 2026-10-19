const corsHeaders = { "Access-Control-Allow-Origin":"https://cookipie.github.io", "Access-Control-Allow-Methods":"POST, OPTIONS", "Access-Control-Allow-Headers":"Content-Type", "Access-Control-Max-Age":"86400", "Vary":"Origin" };

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const json = (body, status=200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff" } });
  if (!env.GEMINI_API_KEY) return json({ error:"setup_required" }, 503);
  const contentType=request.headers.get("content-type")||"";
  if (!contentType.includes("application/json")) return json({error:"Send JSON only."},415);
  let input;
  try { input=await request.json(); } catch { return json({error:"Invalid JSON."},400); }
  const ingredients=typeof input.ingredients==="string"?input.ingredients.trim():"";
  const allowedMeals=["any","breakfast","lunch","dinner","snack"];
  const allowedDiets=["any","vegetarian","non-vegetarian","vegan"];
  const meal=allowedMeals.includes(input.meal)?input.meal:"any";
  const diet=allowedDiets.includes(input.diet)?input.diet:"any";
  const language=input.language==="hi"?"hi":"en";
  if(ingredients.length<2||ingredients.length>500) return json({error:"Enter ingredients (2–500 characters)."},400);

  const prompt = `You are Cookipie's careful Indian home-cooking assistant. Create ONE practical recipe primarily using the user's listed ingredients. Do not claim ingredients exist if not listed; mark any optional pantry staples clearly. Meal: ${meal}. Diet preference: ${diet}. Ingredients available: ${ingredients}. The UI language is ${language==="hi"?"Hindi":"English"}, but return BOTH English and natural Hindi for all user-facing recipe text. Respect dietary preference strictly. Never recommend raw or unsafe food handling. Return the recipe as structured JSON matching the supplied response schema. Use 4–10 ingredients and 3–8 clear cooking steps. prepTime and cookTime must be numbers. Do not add markdown or extra fields.`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      name: { type: "STRING" },
      nameHi: { type: "STRING" },
      intro: { type: "STRING" },
      introHi: { type: "STRING" },
      prepTime: { type: "INTEGER" },
      cookTime: { type: "INTEGER" },
      servings: { type: "INTEGER" },
      ingredients: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: { en: { type: "STRING" }, hi: { type: "STRING" } },
          required: ["en", "hi"]
        }
      },
      steps: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: { en: { type: "STRING" }, hi: { type: "STRING" } },
          required: ["en", "hi"]
        }
      },
      tip: { type: "STRING" },
      tipHi: { type: "STRING" }
    },
    required: ["name","nameHi","intro","introHi","prepTime","cookTime","servings","ingredients","steps","tip","tipHi"]
  };

  try {
    const upstream=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},
      body:JSON.stringify({
        contents:[{parts:[{text:prompt}]}],
        generationConfig:{temperature:0.7,maxOutputTokens:1800,responseMimeType:"application/json",responseSchema}
      })
    });
    const payload=await upstream.json();
    if(!upstream.ok) {
      const upstreamStatus=payload?.error?.status||"";
      const upstreamCode=payload?.error?.code||upstream.status;
      console.error("Cookipie Gemini API error", {httpStatus:upstream.status, code:upstreamCode, status:upstreamStatus});
      let error="gemini_request";
      if(upstream.status===401 || upstream.status===403) error="gemini_permission";
      else if(upstream.status===429) error="gemini_quota";
      else if(upstream.status===404) error="gemini_model";
      else if(upstream.status>=500) error="gemini_unavailable";
      return json({error, upstreamStatus:upstream.status},502);
    }
    const text=payload?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("").trim();
    if(!text) return json({error:"gemini_empty_response"},502);

    let recipe;
    try {
      recipe=JSON.parse(text);
    } catch {
      try {
        const cleaned=text.replace(/^\s*```(?:json)?\s*/i,"").replace(/\s*```\s*$/i,"").trim();
        recipe=JSON.parse(cleaned);
      } catch {
        try {
          const start=text.indexOf("{");
          const end=text.lastIndexOf("}");
          if(start>=0 && end>start) recipe=JSON.parse(text.slice(start,end+1));
          else throw new Error("No JSON object found");
        } catch {
          console.error("Cookipie Gemini response was not valid JSON", {preview:text.slice(0,500)});
          return json({error:"gemini_invalid_json"},502);
        }
      }
    }

    if(typeof recipe.name!=="string"||typeof recipe.nameHi!=="string"||!Array.isArray(recipe.ingredients)||!Array.isArray(recipe.steps)) {
      console.error("Cookipie Gemini response missing recipe fields");
      return json({error:"gemini_incomplete"},502);
    }
    return json({recipe});
  } catch (err) {
    console.error("Cookipie Gemini fetch failed", {name:err?.name||"Error", message:err?.message||""});
    return json({error:"gemini_network"},502);
  }
}
