/* Cookipie recipe image overrides.
   Sources: Wikimedia Commons files with reusable Creative Commons licenses.
   Do not replace the two user-approved images: Shahi Paneer and Dal Tadka.
*/
(function () {
  if (!window.COOKIPIE_RECIPES) return;

  var images = {
    poha: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Poha,_at_home,_Uttar_Pradesh.jpg",
    paneer: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Paneer_Butter_Masala.jpg",
    "masala-dosa": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Masala_Dosa,_South_Indian_Food.jpg",
    chole: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Chana-masala.jpg",
    biryani: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Chicken-biryani-recipe.jpg",
    pakora: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Onion_pakoda.JPG",
    kheer: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kheer_or_rice_pudding.jpg",
    "aloo-paratha": "https://commons.wikimedia.org/wiki/Special:Redirect/file/ALOO_PARATHA.jpg"
  };

  Object.keys(images).forEach(function (key) {
    if (window.COOKIPIE_RECIPES[key]) {
      window.COOKIPIE_RECIPES[key].image = images[key];
    }
  });
})();
