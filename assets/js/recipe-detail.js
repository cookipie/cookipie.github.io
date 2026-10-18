(()=>{
"use strict";
const recipes=window.COOKIPIE_RECIPES||{};
const id=new URLSearchParams(location.search).get("id");
const r=recipes[id];
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const toast=$("#toast");let timer;
function note(t){if(!toast)return;toast.textContent=t;toast.classList.add("show");clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove("show"),2200)}
function saved(){try{return JSON.parse(localStorage.getItem("cookipie-saved-v1")||"[]")}catch{return[]}}
function difficultyLabel(v){return v==="hard"?"Hard":v==="medium"?"Medium":"Easy"}
function esc(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}
function formatDate(value){try{return new Date(value.endsWith("Z")?value:value.replace(" ","T")+"Z").toLocaleDateString()}catch{return ""}}
async function loadReviews(){
 const list=$("#reviewsList"), summary=$("#reviewsSummary");
 if(!list||!summary)return;
 try{
  const response=await fetch("/api/reviews?recipeId="+encodeURIComponent(id),{headers:{"Accept":"application/json"}});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||"unavailable");
  const reviews=Array.isArray(data.reviews)?data.reviews:[];
  const comments=Array.isArray(data.comments)?data.comments:[];
  const average=reviews.length?reviews.reduce((sum,item)=>sum+Number(item.rating||0),0)/reviews.length:0;
  summary.textContent=reviews.length?average.toFixed(1)+" ★ · "+reviews.length+" review"+(reviews.length===1?"":"s"):"No reviews yet — be the first to review this recipe.";
  if(!reviews.length){list.innerHTML='<div class="reviews-empty">🥄<p>No reviews yet. Tried this recipe? Share how it went!</p></div>';return}
  list.innerHTML=reviews.map(review=>{
   const ownComments=comments.filter(comment=>comment.reviewId===review.id);
   return '<article class="review-card"><div class="review-card-top"><div><h3>'+esc(review.name)+'</h3><p class="review-date">'+esc(formatDate(review.createdAt))+'</p></div><span class="review-stars" aria-label="'+esc(review.rating)+' out of 5 stars">'+'★'.repeat(Math.max(0,Math.min(5,Number(review.rating)||0)))+'☆'.repeat(5-Math.max(0,Math.min(5,Number(review.rating)||0)))+'</span></div><p class="review-text">'+esc(review.text).replace(/\n/g,"<br>")+'</p><div class="review-comments">'+ownComments.map(comment=>'<div class="review-comment"><strong>'+esc(comment.name)+'</strong><p>'+esc(comment.text).replace(/\n/g,"<br>")+'</p></div>').join("")+'</div><form class="comment-form" data-review-id="'+esc(review.id)+'"><label>Reply / कमेंट</label><div class="comment-fields"><input name="name" maxlength="40" minlength="2" required placeholder="Your name"><input name="text" maxlength="1000" minlength="2" required placeholder="Write a comment"><button class="outline-button" type="submit">Reply</button></div><p class="comment-message" role="status"></p></form></article>';
  }).join("");
  list.querySelectorAll(".comment-form").forEach(form=>form.addEventListener("submit",async event=>{
   event.preventDefault();const button=form.querySelector("button"),msg=form.querySelector(".comment-message");button.disabled=true;msg.textContent="Posting…";
   try{const response=await fetch("/api/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"comment",recipeId:id,reviewId:form.dataset.reviewId,name:form.elements.name.value,text:form.elements.text.value})});const data=await response.json();if(!response.ok)throw new Error(data.error||"unavailable");await loadReviews();}
   catch{msg.textContent="Could not post comment. Please try again."}finally{button.disabled=false;}
  }));
 }catch{
  summary.textContent="Reviews are temporarily unavailable.";
  list.innerHTML='<div class="reviews-empty"><p>Reviews are being set up. Please check back soon.</p></div>';
 }
}
function render(){
 if(!r){$("#recipeNotFound").hidden=false;$("#recipeContent").hidden=true;document.title="Recipe not found — Cookipie";return}
 document.title=r.name+" ("+r.hi+") — Cookipie";$("#crumbTitle").textContent=r.name;
 const isSaved=saved().includes(id);
 const related=(r.related||[]).map(x=>recipes[x]).filter(Boolean);
 $("#recipeContent").innerHTML=`<article><div class="detail-hero"><div class="detail-copy"><p class="eyebrow">COOK SOMETHING LOVELY</p><h1>${r.name}</h1><p class="detail-title-hi" lang="hi">${r.hi}</p><p class="detail-intro">${r.intro}</p><p class="detail-intro detail-intro-hi" lang="hi">${r.introHi}</p><div class="detail-stats"><span>◷ Prep ${r.prepTime} min</span><span>◴ Cook ${r.cookTime} min</span><span>◷ Total ${r.time} min</span><span>♧ ${r.servings} servings</span><span>◇ ${difficultyLabel(r.difficulty)}</span></div><div class="detail-actions"><button class="primary-button" id="detailSave" aria-pressed="${isSaved}">${isSaved?"♥ Saved":"♡ Save recipe"}</button><button class="outline-button" id="shareRecipe">↗ Share</button></div></div><div class="detail-image"><img src="${r.image}" alt="${r.alt}" fetchpriority="high"><span class="diet-badge ${r.kind==="nonveg"?"nonveg":""}"><i class="diet-dot"></i>${r.kind==="veg"?"VEGETARIAN":"NON-VEG"}</span></div></div><div class="recipe-content-grid"><aside class="ingredients-panel"><div class="content-panel-heading"><p class="eyebrow">GET READY</p><h2>Ingredients <span lang="hi">/ सामग्री</span></h2><p>For ${r.servings} servings · ${r.servings} लोगों के लिए</p></div><ul class="ingredient-list">${r.ingredients.map(x=>`<li><label><input type="checkbox"><span><span class="ingredient-en">${x[0]}</span><span class="ingredient-hi" lang="hi">${x[1]}</span></span></label></li>`).join("")}</ul><p class="ingredient-hint">Tick ingredients as you prepare them. <span lang="hi">तैयारी के साथ सामग्री पर टिक करें।</span></p></aside><section class="method-panel"><div class="content-panel-heading"><p class="eyebrow">LET'S GET COOKING</p><h2>Step by step <span lang="hi">/ विधि</span></h2></div><ol class="method-list">${r.steps.map((x,i)=>`<li><span class="step-number">${String(i+1).padStart(2,"0")}</span><div><h3>Step ${i+1} <span lang="hi">/ चरण ${i+1}</span></h3><p>${x[0]}</p><p class="method-hi" lang="hi">${x[1]}</p></div></li>`).join("")}</ol><div class="cook-tip"><span class="tip-icon">✳</span><div><h3>Cookipie tip <span lang="hi">/ खास सुझाव</span></h3><p>${r.tip[0]}</p><p lang="hi">${r.tip[1]}</p></div></div></section></div>${}