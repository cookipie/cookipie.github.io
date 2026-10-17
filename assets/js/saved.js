(()=> {
"use strict";
const recipes=window.COOKIPIE_RECIPES||{};
const grid=document.querySelector("#savedGrid"),empty=document.querySelector("#savedEmpty"),count=document.querySelector("#savedCount"),toast=document.querySelector("#toast");
let language="en",timer;
const $=(s,r=document)=>r.querySelector(s);
function readSaved(){try{const v=JSON.parse(localStorage.getItem("cookipie-saved-v1")||"[]");return Array.isArray(v)?v.filter(id=>typeof id==="string"):[]}catch{return[]}}
function writeSaved(ids){try{localStorage.setItem("cookipie-saved-v1",JSON.stringify(ids))}catch{}}
function note(s){toast.textContent=s;toast.classList.add("show");clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove("show"),2200)}
function render(){
 const ids=readSaved(),items=ids.filter(id=>recipes[id]).map(id=>({id,...recipes[id]}));
 count.textContent=language==="hi"?items.length+" रेसिपी":items.length+" "+(items.length===1?"recipe":"recipes");
 empty.hidden=items.length>0;grid.hidden=items.length===0;
 grid.innerHTML=items.map(r=>'<article class="recipe-card"><div class="recipe-image-wrap"><img src="'+r.image+'" alt="'+r.alt+'" loading="lazy"><span class="diet-badge '+(r.kind==="nonveg"?"nonveg":"")+'"><i class="diet-dot"></i>'+(r.kind==="veg"?(language==="hi"?"शाकाहारी":"VEG"):(language==="hi"?"मांसाहारी":"NON-VEG"))+'</span><button class="save-recipe saved" data-remove="'+r.id+'" aria-label="'+(language==="hi"?"सेव से हटाएँ":"Remove saved recipe")+'" aria-pressed="true">♥</button></div><div class="recipe-body"><div class="recipe-meta"><span>◷ '+r.time+' '+(language==="hi"?"मिनट":"min")+'</span><span class="meta-separator">•</span><span>'+(language==="hi"?"सेव की गई":"SAVED")+'</span></div><h3 class="recipe-title">'+r.name+'</h3><p class="recipe-title-hi">'+r.hi+'</p><div class="saved-card-actions"><a class="recipe-open" href="recipe.html?id='+encodeURIComponent(r.id)+'">'+(language==="hi"?"रेसिपी देखें":"View recipe")+' ↗</a><button class="saved-remove" data-remove="'+r.id+'">'+(language==="hi"?"हटाएँ":"Remove")+'</button></div></div></article>').join("");
}
function setLanguage(next){language=next;document.body.classList.toggle("lang-hi",language==="hi");document.querySelectorAll("[data-en][data-hi]").forEach(el=>el.innerHTML=el.dataset[language]);$("#languageToggle").innerHTML=language==="hi"?"<strong>हि</strong> <span class='toggle-divider'>/</span> EN":"हि <span class='toggle-divider'>/</span> <strong>EN</strong>";$("#languageToggle").setAttribute("aria-label",language==="hi"?"Switch to English":"Switch to Hindi");document.documentElement.lang=language==="hi"?"hi":"en";render()}
$("#languageToggle").addEventListener("click",()=>setLanguage(language==="en"?"hi":"en"));
grid.addEventListener("click",e=>{const b=e.target.closest("[data-remove]");if(!b)return;const id=b.dataset.remove;writeSaved(readSaved().filter(x=>x!==id));render();note(language==="hi"?"रेसिपी सेव की गई सूची से हटा दी गई":"Recipe removed from saved list")});
$("#year").textContent=new Date().getFullYear();render();
})();