/* Cookipie recipe image overrides.
   The images below are from Wikimedia Commons and are explicitly reusable
   under the licenses shown on their source pages. Keep Shahi Paneer and
   Dal Tadka unchanged because those images were approved by the owner.
*/
(function () {
  if (!window.COOKIPIE_RECIPES) return;

  var images = {
    poha: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kanda_poha.jpg?width=1200",
    paneer: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Paneer_Butter_Masala.jpg?width=1200",
    "masala-dosa": "https://commons.wikimedia.org/wiki/Special:Redirect/file/MasalaDosa.jpg?width=1200",
    chole: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Chickpea_Curry_-_Kolkata_2011-03-05_1910.JPG?width=1200",
    biryani: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Chicken-biryani-recipe.jpg?width=1200",
    pakora: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Onion_Pakora_01.jpg?width=1200",
    kheer: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Shahi_Rice_Kheer.jpg?width=1200",
    "aloo-paratha": "https://commons.wikimedia.org/wiki/Special:Redirect/file/ALOO_PARATHA.jpg?width=1200"
  };

  Object.keys(images).forEach(function (key) {
    if (window.COOKIPIE_RECIPES[key]) {
      window.COOKIPIE_RECIPES[key].image = images[key];
    }
  });
})();
