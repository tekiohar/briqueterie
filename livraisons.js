// livraisons.js : livraisons par tricycle

function remplirQuantite() {
  var a = trouverArticle($("l-article").value);
  var t = +$("l-tours").value;
  if (a && a.nom.indexOf("Parpaing") == 0 && t > 0) {
    $("l-qte").value = t * 100;
  }
}

function ajouterLivraison() {
  var chauffeur = $("l-chauffeur").value.trim();
  var dest = $("l-dest").value.trim();
  var qte = +$("l-qte").value;
  var tours = +$("l-tours").value;
  if (!chauffeur || !dest || qte < 1 || tours < 1) {
    alert("Renseigne le chauffeur, le nombre de tours, la quantité et la destination.");
    return;
  }
  D.livraisons.push({
    id: D.n++,
    date: $("l-date").value || aujourdhui(),
    chauffeur: chauffeur,
    article: +$("l-article").value,
    quantite: qte,
    tours: tours,
    destination: dest
  });
  sauver();
  dessiner();
}

function supprimerLivraison(id) {
  if (!confirm("Supprimer cette livraison ?")) return;
  D.livraisons = D.livraisons.filter(function (l) { return l.id != id; });
  sauver();
  dessiner();
}

VUES.livraisons = function () {
  var h = "";

  if (estAdmin()) {
    var noms = [];
    D.livraisons.forEach(function (l) {
      if (noms.indexOf(l.chauffeur) < 0) noms.push(l.chauffeur);
    });
    var optNoms = noms.map(function (n) {
      return '<option value="' + echapper(n) + '">';
    }).join("");
    var optArt = D.articles.map(function (a) {
      return '<option value="' + a.id + '">' + echapper(a.nom) + '</option>';
    }).join("");

    h += '<div class="carte"><h3>Nouvelle livraison</h3>' +
      '<input id="l-date" type="date" value="' + aujourdhui() + '">' +
      '<input id="l-chauffeur" list="l-noms" placeholder="Nom du chauffeur">' +
      '<datalist id="l-noms">' + optNoms + '</datalist>' +
      '<select id="l-article" onchange="remplirQuantite()">' + optArt + '</select>' +
      '<input id="l-tours" type="number" placeholder="Nombre de tours" value="1" oninput="remplirQuantite()">' +
      '<input id="l-qte" type="number" placeholder="Quantité livrée">' +
      '<input id="l-dest" placeholder="Destination">' +
      '<p class="gris" style="margin:0 0 8px"><small>Un tricycle porte en général 100 parpaings par tour. Tu peux modifier la quantité.</small></p>' +
      '<button class="btn" onclick="ajouterLivraison()">Enregistrer la livraison</button></div>';
  }

  var jour = D.livraisons.filter(function (l) { return l.date == aujourdhui(); });
  h += '<div class="carte"><h3>Aujourd’hui</h3><div class="grille">' +
    '<div class="case"><small class="gris">Tours</small><b>' + somme(jour, "tours") + '</b></div>' +
    '<div class="case"><small class="gris">Pièces livrées</small><b>' + somme(jour, "quantite") + '</b></div></div></div>';

  var liste = D.livraisons.slice().sort(function (x, y) {
    return x.date < y.date ? 1 : x.date > y.date ? -1 : y.id - x.id;
  }).slice(0, 40);

  h += '<div class="carte"><h3>Dernières livraisons</h3>';
  if (!liste.length) {
    h += '<p class="gris">Aucune livraison enregistrée.</p>';
  }
  liste.forEach(function (l) {
    h += '<div class="ligne"><div><b>' + nomArticle(l.article) + ' · ' + l.quantite + '</b>' +
      '<br><small class="gris">' + l.date + ' · ' + echapper(l.chauffeur) + ' · ' + l.tours +
      ' tour(s) · ' + echapper(l.destination) + '</small></div>' +
      '<div class="droite">' +
      (estAdmin() ? '<a class="ko" onclick="supprimerLivraison(' + l.id + ')">Supprimer</a>' : '') +
      '</div></div>';
  });
  return h + '</div>';
};