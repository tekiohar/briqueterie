// stock.js : stock de ciment et de produits finis

if (!D.stock) D.stock = [];

function mouvementsStock(cible, sens) {
  return D.stock.filter(function (m) {
    return m.cible == cible && m.sens == sens;
  });
}

function stockCiment() {
  return somme(mouvementsStock("ciment", "entree"), "quantite") -
    somme(mouvementsStock("ciment", "sortie"), "quantite") -
    somme(D.productions, "sacs");
}

function stockArticle(id) {
  var produit = somme(D.productions.filter(function (p) { return p.article == id; }), "quantite");
  var livre = somme(D.livraisons.filter(function (l) { return l.article == id; }), "quantite");
  return produit - livre +
    somme(mouvementsStock(id, "entree"), "quantite") -
    somme(mouvementsStock(id, "sortie"), "quantite");
}

function ajouterMouvementStock() {
  var cible = $("s-cible").value;
  var qte = Math.round(+$("s-qte").value);
  if (!(qte > 0)) {
    alert("Entre une quantité supérieure à 0.");
    return;
  }
  D.stock.push({
    id: D.n++,
    date: $("s-date").value || aujourdhui(),
    cible: cible == "ciment" ? "ciment" : +cible,
    sens: $("s-sens").value,
    quantite: qte,
    note: $("s-note").value.trim()
  });
  sauver();
  dessiner();
}

function supprimerMouvementStock(id) {
  if (!confirm("Supprimer ce mouvement ?")) return;
  D.stock = D.stock.filter(function (m) { return m.id != id; });
  sauver();
  dessiner();
}

VUES.stock = function () {
  var h = "";

  if (estAdmin()) {
    var opt = '<option value="ciment">Ciment (sacs)</option>' +
      D.articles.map(function (a) {
        return '<option value="' + a.id + '">' + echapper(a.nom) + '</option>';
      }).join("");

    h += '<div class="carte"><h3>Nouveau mouvement</h3>' +
      '<input id="s-date" type="date" value="' + aujourdhui() + '">' +
      '<select id="s-cible">' + opt + '</select>' +
      '<select id="s-sens"><option value="entree">Entrée (achat, ajout)</option>' +
      '<option value="sortie">Sortie (perte, vente sur place)</option></select>' +
      '<input id="s-qte" type="number" placeholder="Quantité">' +
      '<input id="s-note" placeholder="Note (ex. achat chez le fournisseur)">' +
      '<button class="btn" onclick="ajouterMouvementStock()">Enregistrer</button></div>';
  }

  var c = stockCiment();
  h += '<div class="carte"><h3>Ciment</h3><div class="grille">' +
    '<div class="case"><small class="gris">Sacs en stock</small><b class="' + (c <= 0 ? "ko" : "ok") + '">' + c + '</b></div>' +
    '<div class="case"><small class="gris">Sacs utilisés (total)</small><b>' + somme(D.productions, "sacs") + '</b></div></div>' +
    (c < 0 ? '<p class="ko" style="margin:8px 0 0">⚠ Stock négatif : il manque des achats enregistrés.</p>' : '') + '</div>';

  h += '<div class="carte"><h3>Produits finis</h3>';
  D.articles.forEach(function (a) {
    var s = stockArticle(a.id);
    h += '<div class="ligne"><div><b>' + echapper(a.nom) + '</b></div>' +
      '<div class="droite"><b class="' + (s < 0 ? "ko" : "") + '">' + s + '</b>' +
      (s < 0 ? '<br><small class="ko">⚠ à vérifier</small>' : '') + '</div></div>';
  });
  h += '</div>';

  h += '<div class="carte"><h3>Mouvements enregistrés</h3>';
  var liste = D.stock.slice().sort(function (x, y) {
    return x.date < y.date ? 1 : x.date > y.date ? -1 : y.id - x.id;
  }).slice(0, 40);
  if (!liste.length) {
    h += '<p class="gris">Aucun mouvement enregistré.</p>';
  }
  liste.forEach(function (m) {
    var nom = m.cible == "ciment" ? "Ciment" : nomArticle(m.cible);
    h += '<div class="ligne"><div><b>' + nom + '</b><br><small class="gris">' + m.date +
      (m.note ? ' · ' + echapper(m.note) : '') + '</small></div>' +
      '<div class="droite"><b class="' + (m.sens == "entree" ? "ok" : "ko") + '">' +
      (m.sens == "entree" ? "+ " : "− ") + m.quantite + '</b>' +
      (estAdmin() ? '<br><a class="ko" onclick="supprimerMouvementStock(' + m.id + ')">Supprimer</a>' : '') +
      '</div></div>';
  });
  return h + '</div>';
};