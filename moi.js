// moi.js : l'espace personnel du fabricant connecté

VUES.moi = function () {
  var id = MOI.id;
  var s = solde(id);

  var h = '<div class="carte"><div style="display:flex;gap:12px;align-items:center">' +
    '<img class="avatar" style="width:80px;height:80px" src="' + (MOI.photo || PHOTO_VIDE) + '">' +
    '<div><h2 style="margin:0">' + echapper(MOI.nom) + '</h2>' +
    '<span class="gris">' + echapper(MOI.statut || "") + '</span></div></div></div>';

  h += '<div class="carte"><h3>Mon solde</h3><div class="grille">' +
    '<div class="case"><small class="gris">Reste à recevoir</small><b class="' + (s.reste > 0 ? "ko" : "ok") + '">' + argent(s.reste) + '</b></div>' +
    '<div class="case"><small class="gris">Déjà payé</small><b>' + argent(s.paye) + '</b></div></div>' +
    '<p class="gris" style="margin:8px 0 0">Gagné : ' + argent(s.gagne) +
    ' · ajustements : ' + argent(s.ajuste) + '</p></div>';

  // Ma production par jour
  var prods = D.productions.filter(function (p) { return p.fabricant == id; });
  var jours = {};
  prods.forEach(function (p) {
    if (!jours[p.date]) jours[p.date] = [];
    jours[p.date].push(p);
  });
  var dates = Object.keys(jours).sort().reverse().slice(0, 30);

  h += '<div class="carte"><h3>Ma production par jour</h3>';
  if (!dates.length) {
    h += '<p class="gris">Aucune production enregistrée.</p>';
  }
  dates.forEach(function (d) {
    var l = jours[d];
    h += '<div class="ligne" style="display:block"><div style="display:flex;justify-content:space-between">' +
      '<b>' + d + '</b><b>' + somme(l, "quantite") + ' pièces · ' + argent(somme(l, "montant")) + '</b></div>';
    l.forEach(function (p) {
      var e = ecart(p);
      h += '<div style="display:flex;justify-content:space-between"><span class="gris">' +
        nomArticle(p.article) + ' · ' + p.sacs + ' sac(s) · ' + p.quantite + ' pièces</span>' +
        (e === null ? '' : '<b class="' + (e < 0 ? "ko" : "ok") + '">' + texteEcart(e) + '</b>') + '</div>';
    });
    h += '</div>';
  });
  h += '</div>';

  // Mes paiements et ajustements
  var mv = [];
  D.paiements.filter(function (p) { return p.fabricant == id; }).forEach(function (p) {
    mv.push({ id: p.id, date: p.date, titre: "Paiement", note: "", montant: -p.montant });
  });
  D.ajustements.filter(function (a) { return a.fabricant == id; }).forEach(function (a) {
    mv.push({ id: a.id, date: a.date, titre: a.montant >= 0 ? "Prime" : "Retenue", note: a.motif, montant: a.montant });
  });
  mv.sort(function (x, y) {
    return x.date < y.date ? 1 : x.date > y.date ? -1 : y.id - x.id;
  });

  h += '<div class="carte"><h3>Mes paiements et ajustements</h3>';
  if (!mv.length) {
    h += '<p class="gris">Aucun paiement pour le moment.</p>';
  }
  mv.slice(0, 40).forEach(function (m) {
    h += '<div class="ligne"><div><b>' + m.titre + '</b><br><small class="gris">' + m.date +
      (m.note ? ' · ' + echapper(m.note) : '') + '</small></div>' +
      '<div class="droite"><b class="' + (m.titre == "Paiement" ? "ok" : "") + '">' +
      (m.montant < 0 ? "− " : "+ ") + argent(Math.abs(m.montant)) + '</b></div></div>';
  });
  return h + '</div>';
};