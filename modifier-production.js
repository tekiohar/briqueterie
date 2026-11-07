// modifier-production.js : correction d'une production (admin)

var EDIT_PROD = null;
var vueProductionOriginale = VUES.production;
var allerOriginal = aller;

aller = function (id) {
  EDIT_PROD = null;
  allerOriginal(id);
};

function modifierProduction(id) {
  EDIT_PROD = id;
  dessiner();
}

function annulerModifProd() {
  EDIT_PROD = null;
  dessiner();
}

function enregistrerModifProd(id) {
  var p = D.productions.filter(function (x) { return x.id == id; })[0];
  var a = trouverArticle($("m-article").value);
  var sacs = +$("m-sacs").value;
  if (!p || !a || sacs < 1) {
    alert("Vérifie l’article et le nombre de sacs.");
    return;
  }
  if (sacs < a.sacsMin) {
    alert(a.nom + " : minimum " + a.sacsMin + " sacs de ciment.");
    return;
  }
  var prix = ($("m-prixactuel").checked || a.id != p.article) ? a.prix : p.prix;
  p.date = $("m-date").value || p.date;
  p.fabricant = +$("m-fab").value;
  p.article = a.id;
  p.sacs = sacs;
  p.quantite = +$("m-qte").value || 0;
  p.prix = prix;
  p.montant = sacs * prix;
  EDIT_PROD = null;
  sauver();
  dessiner();
}

VUES.production = function () {
  if (EDIT_PROD && estAdmin()) {
    var p = D.productions.filter(function (x) { return x.id == EDIT_PROD; })[0];
    if (!p) {
      EDIT_PROD = null;
    } else {
      var optFab = fabricants().map(function (u) {
        return '<option value="' + u.id + '"' + (u.id == p.fabricant ? " selected" : "") + '>' +
          echapper(u.nom) + '</option>';
      }).join("");
      var optArt = D.articles.map(function (a) {
        return '<option value="' + a.id + '"' + (a.id == p.article ? " selected" : "") + '>' +
          echapper(a.nom) + '</option>';
      }).join("");
      return '<div class="carte"><h3>Corriger la production</h3>' +
        '<input id="m-date" type="date" value="' + p.date + '">' +
        '<select id="m-fab">' + optFab + '</select>' +
        '<select id="m-article">' + optArt + '</select>' +
        '<input id="m-sacs" type="number" placeholder="Sacs de ciment" value="' + p.sacs + '">' +
        '<input id="m-qte" type="number" placeholder="Pièces produites" value="' + p.quantite + '">' +
        '<label style="display:block;margin-bottom:8px"><input type="checkbox" id="m-prixactuel" style="width:auto;margin:0 6px 0 0">' +
        'Utiliser le prix actuel de l’article (prix enregistré : ' + argent(p.prix) + ' par sac)</label>' +
        '<button class="btn" onclick="enregistrerModifProd(' + p.id + ')">Enregistrer</button> ' +
        '<button class="btn-petit" onclick="annulerModifProd()">Annuler</button></div>';
    }
  }

  var h = vueProductionOriginale();
  if (estAdmin()) {
    h = h.replace(/<a class="ko" onclick="supprimerProduction\((\d+)\)">Supprimer<\/a>/g,
      '<a onclick="modifierProduction($1)">Modifier</a> · $&');
  }
  return h;
};