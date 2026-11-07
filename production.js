// production.js : enregistrement de la production et calcul de l'écart

function apercuProduction() {
  var a = trouverArticle($("p-article").value);
  var sacs = +$("p-sacs").value;
  var q = $("p-qte").value;
  var zone = $("p-apercu");
  if (!a || !sacs) {
    zone.innerHTML = "";
    return;
  }
  var txt = 'Montant dû : <b>' + argent(sacs * a.prix) + '</b>';
  if (a.parSac) {
    var attendu = sacs * a.parSac;
    txt += ' · Attendu : <b>' + attendu + '</b> pièces';
    if (q !== "") {
      var e = +q - attendu;
      txt += ' · Écart : <b class="' + (e < 0 ? "ko" : "ok") + '">' + texteEcart(e) + '</b>';
    }
  }
  zone.innerHTML = txt;
}

function ajouterProduction() {
  var fab = +$("p-fab").value;
  var a = trouverArticle($("p-article").value);
  var sacs = +$("p-sacs").value;
  var qte = +$("p-qte").value;
  if (!fab || !a || sacs < 1) {
    alert("Choisis un fabricant, un article et le nombre de sacs.");
    return;
  }
  if (sacs < a.sacsMin) {
    alert(a.nom + " : minimum " + a.sacsMin + " sacs de ciment.");
    return;
  }
  D.productions.push({
    id: D.n++,
    date: $("p-date").value || aujourdhui(),
    fabricant: fab,
    article: a.id,
    sacs: sacs,
    quantite: qte,
    prix: a.prix,
    montant: sacs * a.prix
  });
  sauver();
  dessiner();
}

function supprimerProduction(id) {
  if (!confirm("Supprimer cette production ?")) return;
  D.productions = D.productions.filter(function (p) { return p.id != id; });
  sauver();
  dessiner();
}

VUES.production = function () {
  var h = "";

  if (estAdmin()) {
    var optFab = fabricants().map(function (u) {
      return '<option value="' + u.id + '">' + echapper(u.nom) + '</option>';
    }).join("");
    var optArt = D.articles.map(function (a) {
      return '<option value="' + a.id + '">' + echapper(a.nom) + '</option>';
    }).join("");

    h += '<div class="carte"><h3>Nouvelle production</h3>' +
      '<input id="p-date" type="date" value="' + aujourdhui() + '">' +
      '<select id="p-fab">' + optFab + '</select>' +
      '<select id="p-article" onchange="apercuProduction()">' + optArt + '</select>' +
      '<input id="p-sacs" type="number" placeholder="Sacs de ciment utilisés" oninput="apercuProduction()">' +
      '<input id="p-qte" type="number" placeholder="Pièces produites" oninput="apercuProduction()">' +
      '<p id="p-apercu" class="gris" style="margin:0 0 8px"></p>' +
      '<button class="btn" onclick="ajouterProduction()">Enregistrer la production</button></div>';
  }

  var today = D.productions.filter(function (p) { return p.date == aujourdhui(); });
  h += '<div class="carte"><h3>Aujourd’hui</h3><div class="grille">' +
    '<div class="case"><small class="gris">Pièces</small><b>' + somme(today, "quantite") + '</b></div>' +
    '<div class="case"><small class="gris">Montant dû</small><b>' + argent(somme(today, "montant")) + '</b></div></div></div>';

  var liste = D.productions.slice().sort(function (x, y) {
    return x.date < y.date ? 1 : x.date > y.date ? -1 : y.id - x.id;
  }).slice(0, 40);

  h += '<div class="carte"><h3>Dernières productions</h3>';
  if (!liste.length) {
    h += '<p class="gris">Aucune production enregistrée.</p>';
  }
  liste.forEach(function (p) {
    var e = ecart(p);
    h += '<div class="ligne"><div><b>' + nomUtilisateur(p.fabricant) + '</b> · ' + nomArticle(p.article) +
      '<br><small class="gris">' + p.date + ' · ' + p.sacs + ' sac(s) · ' + p.quantite + ' pièces</small>' +
      (e === null ? '' : ' <b class="' + (e < 0 ? "ko" : "ok") + '">' + texteEcart(e) + '</b>') +
      '</div><div class="droite">' + argent(p.montant) +
      (estAdmin() ? '<br><a class="ko" onclick="supprimerProduction(' + p.id + ')">Supprimer</a>' : '') +
      '</div></div>';
  });
  return h + '</div>';
};
