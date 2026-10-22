(()=>{
"use strict";
const recipes=window.COOKIPIE_RECIPES||{};
const meta={
poha:{prepTime:5,cookTime:15,difficulty:"easy",related:["masala-dosa","pakora","aloo-paratha"]},
paneer:{prepTime:10,cookTime:25,difficulty:"medium",related:["chole","biryani","masala-dosa"]},
"masala-dosa":{prepTime:10,cookTime:20,difficulty:"medium",related:["poha","aloo-paratha","pakora"]},
chole:{prepTime:10,cookTime:30,difficulty:"medium",related:["paneer","aloo-paratha","biryani"]},
biryani:{prepTime:20,cookTime:40,difficulty:"hard",related:["paneer","chole","masala-dosa"]},
pakora:{prepTime:10,cookTime:15,difficulty:"easy",related:["poha","masala-dosa","aloo-paratha"]},
kheer:{prepTime:5,cookTime:35,difficulty:"easy",related:["poha","aloo-paratha","paneer"]},
"aloo-paratha":{prepTime:15,cookTime:20,difficulty:"medium",related:["poha","masala-dosa","chole"]}
};

const imageOverrides={
poha:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Kanda_poha.jpg?width=1200",
paneer:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Paneer_Butter_Masala.jpg?width=1200",
"masala-dosa":"https://commons.wikimedia.org/wiki/Special:Redirect/file/MasalaDosa.jpg?width=1200",
chole:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Chickpea_Curry_-_Kolkata_2011-03-05_1910.JPG?width=1200",
biryani:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Chicken-biryani-recipe.jpg?width=1200",
pakora:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Onion_Pakora_01.jpg?width=1200",
kheer:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Shahi_Rice_Kheer.jpg?width=1200",
"aloo-paratha":"https://commons.wikimedia.org/wiki/Special:Redirect/file/ALOO_PARATHA.jpg?width=1200"
};

Object.keys(imageOverrides).forEach(id=>{
if(recipes[id]) recipes[id].image=imageOverrides[id];
});

Object.keys(recipes).forEach(id=>{
const r=recipes[id];
const m=meta[id]||{};
r.prepTime=Number.isFinite(m.prepTime)?m.prepTime:Math.max(5,Math.round(r.time*0.25));
r.cookTime=Number.isFinite(m.cookTime)?m.cookTime:Math.max(5,r.time-r.prepTime);
r.difficulty=m.difficulty||"easy";
r.related=Array.isArray(m.related)?m.related.filter(x=>recipes[x]):[];
r.schemaVersion=1;
});
window.COOKIPIE_RECIPE_SCHEMA={version:1,fields:["name","hi","kind","groups","tags","image","alt","intro","introHi","time","prepTime","cookTime","servings","difficulty","ingredients","steps","tip","related"]};
})();