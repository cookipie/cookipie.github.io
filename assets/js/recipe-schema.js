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
poha:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Poha,_at_home,_Uttar_Pradesh.jpg",
paneer:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Paneer_Butter_Masala.jpg",
"masala-dosa":"https://commons.wikimedia.org/wiki/Special:Redirect/file/Masala_Dosa,_South_Indian_Food.jpg",
chole:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Chana-masala.jpg",
biryani:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Chicken-biryani-recipe.jpg",
pakora:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Onion_pakoda.JPG",
kheer:"https://commons.wikimedia.org/wiki/Special:Redirect/file/Kheer_or_rice_pudding.jpg",
"aloo-paratha":"https://commons.wikimedia.org/wiki/Special:Redirect/file/ALOO_PARATHA.jpg"
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