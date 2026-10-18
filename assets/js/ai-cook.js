(() => {
  "use strict";
  const $ = (s, root=document) => root.querySelector(s);
  const form=$("#aiCookForm");
  if(!form)return;
  const ingredients=$("#aiIngredients"), meal=$("#aiMeal"), diet=$("#aiDiet");
  const status=$("#aiStatus"), button=$("#aiGenerateButton"), result=$("#aiResult");
  const savedArea=$("#aiSavedArea"), savedList=$("#aiSavedList");
  const STORAGE_KEY="cookipie-ai-saved-v1";
  const endpoint=window.COOKIPIE_AI_ENDPOINT||(location.hostname.endsWith("github.io")?"":"/api/ai-cook");
  let currentRecipe=null, language="en";
  const labels={
    en:{loading:"Creating your recipe…",setup:"AI Cook needs its secure server connection before it can generate recipes. The page design is ready, but the AI service has not been connected yet.",error:"Sorry, the recipe could not be created. Please try again in a moment.",gemini_permission:"Gemini rejected the API key or the key does not have access. Check the key and Gemini API access in Google AI Studio.",gemini_quota:"Gemini API quota or rate limit reached. Check your Google AI Studio usage and limits.",gemini_model:"The configured Gemini model was not found or is unavailable for this API key.",gemini_request:"Gemini rejected the request. Check the API configuration and request details.",gemini_unavailable:"Gemini is temporarily unavailable. Please try again later.",ingredients:"Ingredients",steps:"Steps",tip:"Cook's tip",save:"Save privately on this device",saved:"Saved privately on this device.",remove:"Remove",meal:"Meal",mins:"min",serves:"servings",savedTitle:"Your private AI recipes",empty:"No AI recipes saved yet."},
    hi:{loading:"आपकी रेसिपी बनाई जा रही है…",setup:"रेसिपी बनाने से पहले AI Cook को सुरक्षित सर्वर से जोड़ना होगा। पेज तैयार है, लेकिन AI सेवा अभी कनेक्ट नहीं हुई है।",error:"माफ़ कीजिए, रेसिपी नहीं बन पाई। थोड़ी देर बाद फिर कोशिश करें।",gemini_permission:"Gemini ने API key अस्वीकार की है या उसे अनुमति नहीं है। Google AI Studio में key और Gemini API access जाँचें।",gemini_quota:"Gemini API की quota या rate limit पूरी हो गई है। Google AI Studio में usage और limits जाँचें।",gemini_model:"चुना गया Gemini model उपलब्ध नहीं है या इस API key से इस्तेमाल नहीं हो सकता।",gemini_request:"Gemini ने request अस्वीकार की। API configuration जाँचनी होगी।",gemini_unavailable:"Gemini सेवा अभी उपलब्ध नहीं है। थोड़ी देर बाद फिर कोशिश करें।",ingredients:"सामग्री",steps:"बनाने का तरीका",tip:"कुक की सलाह",save:"इस डिवाइस पर निजी तौर पर सेव करें",saved:"इस डिवाइस पर निजी तौर पर सेव हो गई।",remove:"हटाएँ",meal:"खाना",mins:"मिनट",serves:"लोगों के लिए",savedTitle:"आपकी निजी AI रेसिपी",empty:"अभी कोई AI रेसिपी सेव नहीं है।"}
  };
  function t(key){return labels[language][key]||labels.en[key]||key}
  function readSaved(){try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");return Array.isArray(x)?x.filter(v=>v&&typeof v.name==="string"&&Array.isArray(v.ingredients)&&Array.isArray(v.steps)):[]}catch{return[]}}
  function writeSaved(items){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(items))}catch{status.textContent=language==="hi"?"डिवाइस में स्टोरेज उपलब्ध नहीं है।":"Device storage is unavailable."}}
  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function pair(v){return typeof v==="string"?{en:v,hi:v}:v||{en:"",hi:""}}
  function renderRecipe(r){
    const ingredientsHtml=r.ingredients.map(x=>{x=pair(x);return '<li>'+esc(x.en)+'<span class="ai-recipe-hi-line" lang="hi">'+esc(x.hi)+'</span></li>'}).join("");
    const stepsHtml=r.steps.map(x=>{x=pair(x);return '<li>'+esc(x.en)+'<span class="ai-recipe-hi-line" lang="hi">'+esc(x.hi)+'</span></li>'}).join("");
    const intro=pair({en:r.intro||"",hi:r.introHi||""}),tip=pair({en:r.tip||"",hi:r.tipHi||""});
    result.innerHTML='<h3>'+esc(r.name)+'</h3><p class="ai-recipe-hi" lang="hi">'+esc(r.nameHi||"")+'</p><p class="ai-recipe-intro">'+esc(intro.en)+'<span class="ai-recipe-hi-line" lang="hi">'+esc(intro.hi)+'</span></p><div class="ai-recipe-meta"><span>◷ '+esc(r.prepTime||0)+' '+t("mins")+' '+(language==="hi"?"तैयारी":"prep")+'</span><span>♨ '+esc(r.cookTime||0)+' '+t("mins")+' '+(language==="hi"?"पकाने":"cook")+'</span><span>♙ '+esc(r.servings||2)+' '+t("serves")+'</span></div><h4>'+t("ingredients")+'</h4><ul>'+ingredientsHtml+'</ul><h4>'+t("steps")+'</h4><ol>'+stepsHtml+'</ol>'+(tip.en||tip.hi?'<h4>'+t("tip")+'</h4><p>'+esc(tip.en)+'<span class="ai-recipe-hi-line" lang="hi">'+esc(tip.hi)+'</span></p>':"")+'<button class="ai-save-result" id="aiSaveResult" type="button">'+t("save")+'</button>';
    result.hidden=false;
    $("#aiSaveResult").addEventListener("click",()=>saveRecipe(r));
  }
  function saveRecipe(r){
    const items=readSaved();if(!items.some(x=>x.id===r.id)){items.unshift({...r,id:r.id||("ai-"+Date.now())});writeSaved(items);renderSaved()}
    status.textContent=t("saved");
  }
  function renderSaved(){
    const items=readSaved();savedArea.hidden=items.length===0;
    savedList.innerHTML=items.length?'<div class="ai-saved-list">'+items.map((x,i)=>'<div class="ai-saved-item"><div><strong>'+esc(x.name)+'</strong><small lang="hi">'+esc(x.nameHi||"")+'</small></div><button type="button" data-ai-remove="'+i+'">'+t("remove")+'</button></div>').join("")+'</div>':'<p>'+t("empty")+'</p>';
    savedList.querySelectorAll("[data-ai-remove]").forEach(b=>b.addEventListener("click",()=>{const all=readSaved();all.splice(Number(b.dataset.aiRemove),1);writeSaved(all);renderSaved()}));
  }
  form.addEventListener("submit",async e=>{
    e.preventDefault();status.textContent="";const text=ingredients.value.trim();
    if(text.length<2){status.textContent=language==="hi"?"कम से कम एक-दो सामग्री लिखें।":"Please enter at least one or two ingredients.";return}
    if(!endpoint){status.textContent=t("setup");return}
    button.disabled=true;status.textContent=t("loading");
    try{
      const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ingredients:text,meal:meal.value,diet:diet.value,language})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"request_failed");
      if(!data.recipe||!Array.isArray(data.recipe.ingredients)||!Array.isArray(data.recipe.steps))throw new Error("invalid_recipe");
      currentRecipe={...data.recipe,id:"ai-"+Date.now(),source:"ai"};renderRecipe(currentRecipe);status.textContent="";result.scrollIntoView({behavior:"smooth",block:"start"});
    }catch(err){const code=err.message||"error";status.textContent=code==="setup_required"?t("setup"):(labels[language][code]||t("error"))}
    finally{button.disabled=false}
  });
  function syncLanguage(){language=document.documentElement.lang==="hi"?"hi":"en";renderSaved();if(currentRecipe&& !result.hidden)renderRecipe(currentRecipe)}
  new MutationObserver(syncLanguage).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  renderSaved();syncLanguage();
})();