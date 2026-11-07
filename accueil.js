// accueil.js : tableau de bord et rapports (jour, semaine, mois)

var PERIODE = "j";

function changerPeriode(v) {
  PERIODE = v;
  dessiner();
}

function debutPeriode() {
  var d = new Date();
  if (PERIODE == "s") {
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  } else if (PERIODE == "m") {
    d.setDate(1);
  }
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function dansPeriode(liste) {
  var debut = debutPeriode();
  return liste.filter(function (x) { return x.date >= debut; });
}

VUES.accueil = function () {
  var prods = dansPeriode(D.productions);
  var pays = dansPeriode(D.paiements);
  var livs = dansPeriode(D.livraisons);

  var totalDu = fabricants().reduce(function (t, u) {
    return t + Math.max(solde(u.id).reste, 0);
  }, 0);

  var h = '<div class="carte"><h3>Rapport</h3>' +
    '<select onchange="changerPeriode(this.value)">' +
    '<option value="j"' + (PERIODE == "j" ? " selected" : "") + '>Aujourd’hui</option>' +
    '<option value="s"' + (PERIODE == "s" ? " selected" : "") + '>Cette semaine</option>' +
    '<option value="m"' + (PERIODE == "m" ? " selected" : "") + '>Ce mois</option>' +
    '</select><div class="grille">' +
    '<div class="case"><small class="gris">Sacs de ciment</small><b>' + somme(prods, "sacs") + '</b></div>' +
    '<div class="case"><small class="gris">Pièces produites</small><b>' + somme(prods, "quantite") + '</b></div>' +
    '<div class="case"><small class="gris">Production due</small><b>' + argent(somme(prods, "montant")) + '</b></div>' +
    '<div class="case"><small class="gris">Payé</small><b>' + argent(somme(pays, "montant")) + '</b></div>' +
    '<div class="case"><small class="gris">Tours de livraison</small><b>' + somme(livs, "tours") + '</b></div>' +
    '<div class="case"><small class="gris">Total encore dû</small><b class="ko">' + argent(totalDu) + '</b></div>' +
    '</div></div>';

  h += '<div class="carte"><h3>Par fabricant</h3>';
  var liste = fabricants();
  if (!liste.length) {
    h += '<p class="gris">Aucun fabricant pour le moment.</p>';
  }
  liste.forEach(function (u) {
    var mesProds = prods.filter(function (p) { return p.fabricant == u.id; });
    var s = solde(u.id);
    h += '<div class="ligne"><div><b>' + echapper(u.nom) + '</b><br>' +
      '<small class="gris">' + somme(mesProds, "quantite") + ' pièces · ' +
      argent(somme(mesProds, "montant")) + ' sur la période</small></div>' +
      '<div class="droite"><b class="' + (s.reste > 0 ? "ko" : "ok") + '">' + argent(s.reste) + '</b><br>' +
      '<small class="gris">' + (s.reste > 0 ? "à payer" : "à jour") + '</small></div></div>';
  });
  h += '</div>';

  return h + '<button class="btn" onclick="window.print()">Imprimer / enregistrer en PDF</button>';
};