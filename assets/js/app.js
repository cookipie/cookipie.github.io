(() => {
  "use strict";
  let recipes = Object.entries(window.COOKIPIE_RECIPES || {}).map(([id,r]) => ({id,...r}));
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const grid=$("#recipeGrid"), search=$("#recipeSearch"), empty=$("#emptyState"), sort=$("#sortRecipes"), toast=$("#toast");
  const diet=$("#filterDiet"), time=$("#filterTime"), difficulty=$("#filterDifficulty");
  let activeCategory="all", query="", language=readLanguage(), saved=readSaved(), toastTimer, recipeLikes={};
  function readLanguage(){try{return localStorage.getItem("cookipie-language-v1")==="hi"?"hi":"en"}catch{return"en"}}
  function readSaved(){try{return JSON.parse(localStorage.getItem("cookipie-saved-v1")||"[]").filter(id=>typeof id==="string")}catch{return[]}}
  function saveSaved(){try{localStorage.setItem("cookipie-saved-v1",JSON.stringify(saved))}catch{}}
  function showToast(message){toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2400)}
  function searchableText(r){
    const ingredients=(r.ingredients||[]).flatMap(item=>Array.isArray(item)?item:item&&typeof item==="object"?Object.values(item):[item]);
    return [r.name,r.hi,r.tags,r.kind,...(r.groups||[]),...ingredients].filter(Boolean).join(" ").normalize("NFKC").toLocaleLowerCase();
  }
  function card(r){
    const level=r.difficulty||"easy";
    const levelLabel=language==="hi"?({easy:"आसान",medium:"मध्यम",hard:"कठिन"}[level]||"आसान"):({easy:"EASY",medium:"MEDIUM",hard:"HARD"}[level]||"EASY");
    return `<article class="recipe-card"><div class="recipe-image-wrap"><img src="${r.image}" alt="${r.alt}" loading="lazy" onerror="this.style.opacity='.15';this.alt='Recipe photo unavailable'"><span class="diet-badge ${r.kind==="nonveg"?"nonveg":""}"><i class="diet-dot"></i>${r.kind==="veg"?(language==="hi"?"शाकाहारी":"VEG"):(language==="hi"?"मांसाहारी":"NON-VEG")}</span><button class="save-recipe ${saved.includes(r.id)?"saved":""}" data-save="${r.id}" aria-label="${saved.includes(r.id)?"Remove saved recipe":"Save recipe"}" aria-pressed="${saved.includes(r.id)}">${saved.includes(r.id)?"♥":"♡"}</button></div><div class="recipe-body"><div class="recipe-meta"><span>◷ ${r.time} ${language==="hi"?"मिनट":"min"}</span><span class="meta-separator">•</span><span>${levelLabel}</span></div><h3 class="recipe-title">${r.name}</h3><p class="recipe-title-hi">${r.hi}</p><div class="recipe-bottom"><span class="recipe-time">${language==="hi"?"शुरुआती संग्रह":"Featured recipe"}</span><a class="recipe-open" href="recipe.html?id=${encodeURIComponent(r.id)}">${language==="hi"?"रेसिपी देखें":"View recipe"} ↗</a></div><button class="outline-button recipe-like-button" data-like="${r.id}" aria-pressed="${!!recipeLikes[r.id]?.liked}">♥ <span>${language==="hi"?"पसंद":"Like"}</span> <span class="like-count">${Number(recipeLikes[r.id]?.count||0)}</span></button><button class="outline-button recipe-share-button" data-share="${r.id}">${language==="hi"?"↗ शेयर करें":"↗ Share recipe"}</button></div></article>`;
  }
  function render(){
    let list=recipes.filter(r=>{
      const categoryOk=activeCategory==="all"||(activeCategory==="quick"?r.time<=30:(r.groups||[]).includes(activeCategory));
      const dietOk=diet.value==="all"||r.kind===diet.value;
      const timeOk=Number(time.value)===0||r.time<=Number(time.value);
      const difficultyOk=difficulty.value==="all"||(r.difficulty||"easy")===difficulty.value;
      const queryOk=!query||searchableText(r).includes(query.normalize("NFKC").toLocaleLowerCase());
      return categoryOk&&dietOk&&timeOk&&difficultyOk&&queryOk;
    });
    if(sort.value==="quick")list.sort((a,b)=>a.time-b.time);
    if(sort.value==="az")list.sort((a,b)=>a.name.localeCompare(b.name));
    grid.innerHTML=list.map(card).join("");
    empty.hidden=list.length>0;grid.hidden=list.length===0;
  }
  function updateCategoryButtons(){ $$("[data-category]").forEach(x=>x.classList.toggle("selected",x.dataset.category===activeCategory)); }
  function resetFilters(){
    activeCategory="all";query="";search.value="";diet.value="all";time.value="0";difficulty.value="all";sort.value="featured";updateCategoryButtons();render();
  }
  function setLanguage(next){
    language=next;document.body.classList.toggle("lang-hi",language==="hi");try{localStorage.setItem("cookipie-language-v1",language)}catch{}
    $$("[data-en][data-hi]").forEach(el=>{el.innerHTML=el.dataset[language]});
    $("#languageToggle").innerHTML=language==="en"?'हि <span class="toggle-divider">/</span> <strong>EN</strong>':'<strong>हि</strong> <span class="toggle-divider">/</span> EN';
    $("#languageToggle").setAttribute("aria-label",language==="en"?"Switch to Hindi":"Switch to English");
    search.placeholder=language==="hi"?"रेसिपी या सामग्री खोजें...":"Recipe या ingredients खोजें...";
    document.documentElement.lang=language==="hi"?"hi":"en";render();
  }
  $("#searchForm").addEventListener("submit",e=>{e.preventDefault();query=search.value.trim();render();$("#recipes").scrollIntoView({behavior:"smooth"})});
  search.addEventListener("input",()=>{query=search.value.trim();render()});
  $("#categoryGrid").addEventListener("click",e=>{
    const b=e.target.closest("[data-category]");if(!b)return;
    activeCategory=b.dataset.category;query="";search.value="";updateCategoryButtons();render();
  });
  [diet,time,difficulty].forEach(el=>el.addEventListener("change",render));
  sort.addEventListener("change",render);
  $("#resetFilters").addEventListener("click",resetFilters);
  $("#clearSearch").addEventListener("click",resetFilters);
  $("#languageToggle").addEventListener("click",()=>setLanguage(language==="en"?"hi":"en"));
  grid.addEventListener("click",async e=>{
    const share=e.target.closest("[data-share]");
    if(share){
      const recipe=recipes.find(item=>item.id===share.dataset.share);
      if(!recipe)return;
      const url=new URL("recipe.html?id="+encodeURIComponent(recipe.id),location.href).href;
      try{
        if(navigator.share){await navigator.share({title:recipe.name+" — Cookipie",text:recipe.name+" / "+(recipe.hi||""),url});}
        else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);showToast(language==="hi"?"रेसिपी लिंक कॉपी हो गया":"Recipe link copied");}
        else{showToast(language==="hi"?"रेसिपी खोलकर उसका लिंक शेयर करें":"Open the recipe to copy or share its link");}
      }catch(error){if(error.name!=="AbortError")showToast(language==="hi"?"रेसिपी लिंक शेयर नहीं हो सका":"Could not share the recipe link");}
      return;
    }
    const save=e.target.closest("[data-save]");
    if(save){
      const auth=window.COOKIPIE_AUTH, session=auth?await auth.requireLogin():null;
      if(!session)return;
      const id=save.dataset.save, wasSaved=saved.includes(id), next=wasSaved?saved.filter(x=>x!==id):[...saved,id];
      try{await auth.setSaved(id,!wasSaved);saved=next;saveSaved();render();showToast(wasSaved?(language==="hi"?"सेव से हटाया":"Removed from saved recipes"):(language==="hi"?"आपके अकाउंट में सेव हुआ":"Saved to your account"));}
      catch(error){showToast(error.message==="account_data_setup_required"?"Account features are being enabled. Please try again shortly.":"Could not update saved recipes. Please retry.");}
      return;
    }
    const like=e.target.closest("[data-like]");
    if(like){
      const auth=window.COOKIPIE_AUTH, session=auth?await auth.requireLogin():null;
      if(!session)return;
      try{recipeLikes[like.dataset.like]=await auth.toggleRecipeLike(like.dataset.like);render();}
      catch(error){showToast(error.message==="account_data_setup_required"?"Account features are being enabled. Please try again shortly.":"Could not update like. Please retry.");}
    }
  });
  async function syncAccountData(){
    const auth=window.COOKIPIE_AUTH;if(!auth)return;
    await auth.ready;
    const session=await auth.getSession();if(!session)return;
    try{
      const remote=await auth.getSaved(), remoteIds=Array.isArray(remote.recipeIds)?remote.recipeIds:[];
      for(const recipeId of saved){if(!remoteIds.includes(recipeId))await auth.setSaved(recipeId,true);}
      saved=[...new Set([...remoteIds,...saved])];saveSaved();render();
      await Promise.all(recipes.map(async recipe=>{try{recipeLikes[recipe.id]=await auth.getRecipeLikes(recipe.id)}catch{}}));
      render();
    }catch(error){console.warn("Cookipie account data sync failed",error?.message||"Error");}
  }
  window.addEventListener("storage",e=>{if(e.key==="cookipie-saved-v1"){saved=readSaved();render();}});
  async function loadPublicRecipes(){
    try{
      const base=location.hostname.endsWith("github.io")?"https://cookipie-github-io.uplakshapanwar.workers.dev":"";
      const response=await fetch(base+"/api/recipes-admin",{cache:"no-store"});
      if(!response.ok)return;
      const data=await response.json();
      const custom=(data.recipes||[]).map(r=>{const baseRecipe=window.COOKIPIE_RECIPES?.[r.id]||{};return {...baseRecipe,...r,ingredients:baseRecipe.ingredients||r.ingredients||[],steps:baseRecipe.steps||r.steps||[],intro:baseRecipe.intro||r.intro||r.name,introHi:baseRecipe.introHi||r.introHi||r.intro_hi||"",tip:baseRecipe.tip||r.tip,image:r.image||baseRecipe.image||"",alt:r.alt||baseRecipe.alt||r.name};});
      const ids=new Set(custom.map(r=>r.id));
      recipes=[...recipes.filter(r=>!ids.has(r.id)),...custom];
      render();
      if(window.COOKIPIE_AUTH)syncAccountData();
    }catch(error){console.warn("Cookipie public recipes could not load",error?.message||"Error");}
  }
  loadPublicRecipes();
  window.COOKIPIE_AUTH?.ready?.then(syncAccountData);
  document.addEventListener("cookipie-auth-ready",syncAccountData,{once:true});
  $$(".collection-card").forEach(b=>b.addEventListener("click",()=>{
    activeCategory=b.dataset.collection;query="";search.value="";diet.value="all";time.value="0";difficulty.value="all";
    updateCategoryButtons();render();$("#recipes").scrollIntoView({behavior:"smooth"});
  }));
  const menu=$("#menuToggle"),nav=$("#mainNav");
  menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));menu.setAttribute("aria-label",open?"Close navigation":"Open navigation");menu.textContent=open?"×":"☰"});
  $$(".nav-link").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menu.setAttribute("aria-expanded","false");menu.textContent="☰"}));
  $("#year").textContent=new Date().getFullYear();setLanguage(language);
})();