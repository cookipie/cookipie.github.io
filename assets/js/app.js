(() => {
  "use strict";
  const recipes = [
    {id:"poha",name:"Kanda Poha",hi:"कांदा पोहा",time:20,kind:"veg",groups:["veg","breakfast","quick"],tags:"poha flattened rice onion peanuts breakfast",image:"https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",alt:"Indian breakfast bowl"},
    {id:"paneer",name:"Paneer Butter Masala",hi:"पनीर बटर मसाला",time:35,kind:"veg",groups:["veg","lunch","dinner"],tags:"paneer tomato creamy curry lunch dinner indian",image:"https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",alt:"Paneer curry in a bowl"},
    {id:"masala-dosa",name:"Masala Dosa",hi:"मसाला डोसा",time:30,kind:"veg",groups:["veg","breakfast","snacks","quick"],tags:"dosa potato rice lentil south indian breakfast",image:"https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",alt:"Golden dosa served with chutney"},
    {id:"chole",name:"Punjabi Chole",hi:"पंजाबी छोले",time:40,kind:"veg",groups:["veg","lunch","dinner"],tags:"chickpea chana curry tomato indian lunch dinner",image:"https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&q=80",alt:"Chickpea curry"},
    {id:"biryani",name:"Chicken Biryani",hi:"चिकन बिरयानी",time:55,kind:"nonveg",groups:["nonveg","lunch","dinner"],tags:"chicken rice biryani spices non vegetarian",image:"https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=800&q=80",alt:"Aromatic chicken biryani with herbs"},
    {id:"pakora",name:"Onion Pakora",hi:"प्याज़ के पकौड़े",time:25,kind:"veg",groups:["veg","snacks","quick"],tags:"onion pakoda gram flour tea time snack",image:"https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=800&q=80",alt:"Crispy Indian fritters"},
    {id:"kheer",name:"Rice Kheer",hi:"चावल की खीर",time:35,kind:"veg",groups:["veg","dessert"],tags:"rice milk dessert sweet cardamom kheer",image:"https://images.unsplash.com/photo-1571167530149-c1105c6a9b77?auto=format&fit=crop&w=800&q=80",alt:"Indian rice pudding dessert"},
    {id:"aloo-paratha",name:"Aloo Paratha",hi:"आलू पराठा",time:30,kind:"veg",groups:["veg","breakfast","lunch"],tags:"potato flatbread paratha breakfast curd",image:"https://images.unsplash.com/photo-1600628422019-6a6b7d8e2e4d?auto=format&fit=crop&w=800&q=80",alt:"Indian flatbread served with accompaniments"}
  ];
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const grid=$("#recipeGrid"), search=$("#recipeSearch"), empty=$("#emptyState"), sort=$("#sortRecipes"), toast=$("#toast");
  let activeCategory="all", query="", language="en", saved=readSaved(), toastTimer;
  function readSaved(){try{return JSON.parse(localStorage.getItem("cookipie-saved-v1")||"[]").filter(id=>typeof id==="string")}catch{return[]}}
  function saveSaved(){try{localStorage.setItem("cookipie-saved-v1",JSON.stringify(saved))}catch{}}
  function showToast(message){toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2400)}
  function card(r){return `<article class="recipe-card"><div class="recipe-image-wrap"><img src="${r.image}" alt="${r.alt}" loading="lazy" onerror="this.style.opacity='.15';this.alt='Recipe photo unavailable'"><span class="diet-badge ${r.kind==="nonveg"?"nonveg":""}"><i class="diet-dot"></i>${r.kind==="veg"?(language==="hi"?"शाकाहारी":"VEG"):(language==="hi"?"मांसाहारी":"NON-VEG")}</span><button class="save-recipe ${saved.includes(r.id)?"saved":""}" data-save="${r.id}" aria-label="${saved.includes(r.id)?"Remove saved recipe":"Save recipe"}" aria-pressed="${saved.includes(r.id)}">${saved.includes(r.id)?"♥":"♡"}</button></div><div class="recipe-body"><div class="recipe-meta"><span>◷ ${r.time} ${language==="hi"?"मिनट":"min"}</span><span class="meta-separator">•</span><span>${language==="hi"?"आसान":"EASY"}</span></div><h3 class="recipe-title">${r.name}</h3><p class="recipe-title-hi">${r.hi}</p><div class="recipe-bottom"><span class="recipe-time">${language==="hi"?"शुरुआती संग्रह":"Featured recipe"}</span><a class="recipe-open" href="recipe.html?id=${encodeURIComponent(r.id)}">${language==="hi"?"रेसिपी देखें":"View recipe"} ↗</a></div></div></article>`}
  function render(){
    let list=recipes.filter(r=>(activeCategory==="all"||(activeCategory==="quick"?r.time<=30:r.groups.includes(activeCategory)))&&(!query||[r.name,r.hi,r.tags,r.kind].join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase())));
    if(sort.value==="quick")list.sort((a,b)=>a.time-b.time);
    if(sort.value==="az")list.sort((a,b)=>a.name.localeCompare(b.name));
    grid.innerHTML=list.map(card).join("");empty.hidden=list.length>0;grid.hidden=list.length===0;
  }
  function setLanguage(next){
    language=next;document.body.classList.toggle("lang-hi",language==="hi");
    $$("[data-en][data-hi]").forEach(el=>{el.innerHTML=el.dataset[language]});
    $("#languageToggle").innerHTML=language==="en"?'हि <span class="toggle-divider">/</span> <strong>EN</strong>':'<strong>हि</strong> <span class="toggle-divider">/</span> EN';
    $("#languageToggle").setAttribute("aria-label",language==="en"?"Switch to Hindi":"Switch to English");
    search.placeholder=language==="hi"?"रेसिपी या सामग्री खोजें...":"Recipe या ingredients खोजें...";
    document.documentElement.lang=language==="hi"?"hi":"en";render();
  }
  $("#searchForm").addEventListener("submit",e=>{e.preventDefault();query=search.value.trim();render();$("#recipes").scrollIntoView({behavior:"smooth"})});
  search.addEventListener("input",()=>{query=search.value.trim();render()});
  $("#categoryGrid").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;activeCategory=b.dataset.category;$$("[data-category]").forEach(x=>x.classList.toggle("selected",x===b));query="";search.value="";render()});
  sort.addEventListener("change",render);
  $("#clearSearch").addEventListener("click",()=>{query="";search.value="";activeCategory="all";$$("[data-category]").forEach(x=>x.classList.toggle("selected",x.dataset.category==="all"));render()});
  $("#languageToggle").addEventListener("click",()=>setLanguage(language==="en"?"hi":"en"));
  grid.addEventListener("click",e=>{
    const save=e.target.closest("[data-save]");
    if(save){const id=save.dataset.save;saved=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];saveSaved();render();showToast(saved.includes(id)?(language==="hi"?"रेसिपी इस डिवाइस पर सेव हुई":"Recipe saved on this device"):(language==="hi"?"सेव की गई रेसिपी से हटाया":"Removed from saved recipes"));return}
    if(e.target.closest("[data-open]"))showToast(language==="hi"?"पूरी रेसिपी के पेज अगले चरण में बनेंगे।":"Full recipe pages are being built next.");
  });
  $("#savedLink").addEventListener("click",e=>{e.preventDefault();const list=recipes.filter(r=>saved.includes(r.id));if(!list.length){showToast(language==="hi"?"अभी कोई रेसिपी सेव नहीं है।":"You haven't saved a recipe yet.");return}query="";activeCategory="all";search.value="";grid.innerHTML=list.map(card).join("");empty.hidden=true;grid.hidden=false;$("#recipes").scrollIntoView({behavior:"smooth"});showToast(language==="hi"?"आपकी सेव की गई रेसिपी":"Your saved recipes")});
  $$(".collection-card").forEach(b=>b.addEventListener("click",()=>{activeCategory=b.dataset.collection;query="";search.value="";$$("[data-category]").forEach(x=>x.classList.toggle("selected",x.dataset.category===activeCategory));render();$("#recipes").scrollIntoView({behavior:"smooth"})}));
  const menu=$("#menuToggle"),nav=$("#mainNav");
  menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));menu.setAttribute("aria-label",open?"Close navigation":"Open navigation");menu.textContent=open?"×":"☰"});
  $$(".nav-link").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menu.setAttribute("aria-expanded","false");menu.textContent="☰"}));
  $("#year").textContent=new Date().getFullYear();render();
})();