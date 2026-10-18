export async function onRequestPost(context) {
  const { request, env } = context;
  const json = (body, status=200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff" } });
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
  const prompt = `You are Cookipie's careful Indian home-cooking assistant. Create ONE practical recipe primarily using the user's listed ingredients. Do not claim ingredients exist if not listed; mark any optional pantry staples clearly. Meal: ${meal}. Diet preference: ${diet}. Ingredients available: ${ingredients}. The UI language is ${language==="hi"?"Hindi":"English"}, but return BOTH English and natural Hindi for all user-facing recipe text. Respect dietary preference strictly. Never recommend raw or unsafe food handling. Return ONLY valid JSON with this exact structure: {"name":"English recipe name","nameHi":"Hindi recipe name","intro":"Short English description","introHi":"Short Hindi description","prepTime":5,"cookTime":15,"servings":2,"ingredients":[{"en":"quantity and ingredient","hi":"quantity and ingredient in Hindi"}],"steps":[{"en":"one clear cooking step","hi":"same step in Hindi"}],"tip":"English practical tip","tipHi":"Hindi practical tip"}. Use 4–10 ingredients and 3–8 numbered cooking steps. prepTime and cookTime must be numbers. Avoid markdown and extra fields.`;
  try {
    const upstream=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",{
      method:"POST",
      headers:{"Content-Type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.7,maxOutputTokens:1800,responseMimeType:"application/json"}})
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
    if(!text) return json({error:"No recipe was returned."},502);
    let recipe;
    try { recipe=JSON.parse(text.replace(/^\x60\x60\x60(?:json)?\s*/i,"").replace(/\s*\x60\x60\x60$/,"")); } catch { return json({error:"The AI response was not valid recipe data."},502); }
    if(typeof recipe.name!=="string"||!Array.isArray(recipe.ingredients)||!Array.isArray(recipe.steps)) return json({error:"The AI response was incomplete."},502);
    return json({recipe});
  } catch { return json({error:"AI service is temporarily unavailable."},502); }
}
