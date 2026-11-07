// paie.js : paiements, primes, retenues et historique

function payer(id) {
  var s = solde(id);
  var v = prompt("Montant payé (F)", s.reste > 0 ? s.reste : "");
  if (!v) return;
  v = Math.round(+v);
  if (!(v > 0)) {
    alert("Montant invalide.");
    return;
  }
  D.paiements.push({ id: D.n++, date: aujourdhui(), fabricant: id, montant: v });
  sauver();
  dessiner();
}

function ajuster(id) {
  var v = prompt("Montant de l’ajustement : positif pour une prime, négatif pour une retenue");
  if (!v) return;
  v = Math.round(+v);
  if (!v) {
    alert("Montant invalide.");
    return;
  }
  var motif = prompt("Motif ?") || "Sans motif";
  D.ajustements.push({ id: D.n++, date: aujourdhui(), fabricant: id, montant: v, motif: motif });
  sauver();
  dessiner();
}

function supprimerMouvement(type, id) {
  if (!confirm("Annuler cette ligne ?")) return;
  D[type] = D[type].filter(function (x) { return x.id != id; });
  sauver();
  dessiner();
}

VUES.paie = function () {
  var liste = fabricants();
  var h = '<div class="carte"><h3>Paie des fabricants</h3>';

  if (!liste.length) {
    h += '<p class="gris">Aucun fabricant pour le moment.</p>';
  }
  liste.forEach(function (u) {
    var s = solde(u.id);
    h += '<div class="ligne" style="display:block">' +
      '<div style="display:flex;justify-content:space-between"><b>' + echapper(u.nom) + '</b>' +
      '<b class="' + (s.reste > 0 ? "ko" : "ok") + '">' + argent(s.reste) + '</b></div>' +
      '<small class="gris">Gagné ' + argent(s.gagne) + ' · ajustements ' + argent(s.ajuste) +
      ' · payé ' + argent(s.paye) + '</small>';
    if (estAdmin()) {
      h += '<div style="margin-top:6px">' +
        '<button class="btn-petit" onclick="payer(' + u.id + ')">Payer</button>' +
        '<button class="btn-petit" onclick="ajuster(' + u.id + ')">Ajuster</button></div>';
    }
    h += '</div>';
  });
  h += '</div>';

  var mouvements = [];
  D.paiements.forEach(function (p) {
    mouvements.push({ type: "paiements", id: p.id, date: p.date, fab: p.fabricant,
      titre: "Paiement", note: "", montant: -p.montant });
  });
  D.ajustements.forEach(function (a) {
    mouvements.push({ type: "ajustements", id: a.id, date: a.date, fab: a.fabricant,
      titre: a.montant >= 0 ? "Prime" : "Retenue", note: a.motif, montant: a.montant });
  });
  mouvements.sort(function (x, y) {
    return x.date < y.date ? 1 : x.date > y.date ? -1 : y.id - x.id;
  });

  h += '<div class="carte"><h3>Historique</h3>';
  if (!mouvements.length) {
    h += '<p class="gris">Aucun paiement ni ajustement.</p>';
  }
  mouvements.slice(0, 40).forEach(function (m) {
    var signe = m.montant < 0 ? "− " : "+ ";
    h += '<div class="ligne"><div><b>' + m.titre + '</b> · ' + nomUtilisateur(m.fab) +
      '<br><small class="gris">' + m.date + (m.note ? ' · ' + echapper(m.note) : '') + '</small></div>' +
      '<div class="droite"><b class="' + (m.titre == "Paiement" ? "ok" : "") + '">' +
      signe + argent(Math.abs(m.montant)) + '</b>' +
      (estAdmin() ? '<br><a class="ko" onclick="supprimerMouvement(\'' + m.type + '\',' + m.id + ')">Annuler</a>' : '') +
      '</div></div>';
  });
  return h + '</div>';
};