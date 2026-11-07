// rapport.js : rapport détaillé sur une période, imprimable

ONGLETS.splice(1, 0, ["rapport", "Rapport", ["admin", "proprietaire"]]);

var RAP_DEB = (function () {
  var d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-01";
})();
var RAP_FIN = aujourdhui();

(function () {
  var s = document.createElement("style");
  s.textContent =
    ".tab{width:100%;border-collapse:collapse;font-size:13px}" +
    ".tab th,.tab td{padding:6px 4px;border-bottom:1px solid var(--bordure);text-align:right}" +
    ".tab th:first-child,.tab td:first-child{text-align:left}" +
    ".tab th{color:var(--gris);font-weight:600}" +
    "@media print{header,nav,.np{display:none !important}body{background:#fff}" +
    ".carte{border:0;padding:0;break-inside:avoid}}";
  document.head.appendChild(s);
})();

function changerDates() {
  RAP_DEB = $("r-deb").value || RAP_DEB;
  RAP_FIN = $("r-fin").value || RAP_FIN;
  dessiner();
}

function entre(liste) {
  return liste.filter(function (x) { return x.date >= RAP_DEB && x.date <= RAP_FIN; });
}

function tableau(entetes, lignes) {
  var h = '<div style="overflow-x:auto"><table class="tab"><tr>';
  entetes.forEach(function (e) { h += '<th>' + e + '</th>'; });
  h += '</tr>';
  lignes.forEach(function (l) {
    h += '<tr>';
    l.forEach(function (c) { h += '<td>' + c + '</td>'; });
    h += '</tr>';
  });
  return h + '</table></div>';
}

function case1(titre, valeur) {
  return '<div class="case"><small class="gris">' + titre + '</small><b>' + valeur + '</b></div>';
}

VUES.rapport = function () {
  var prods = entre(D.productions);
  var pays = entre(D.paiements);
  var ajs = entre(D.ajustements);
  var livs = entre(D.livraisons);

  var h = '<div class="carte np"><h3>Période du rapport</h3>' +
    '<div class="grille"><div><small class="gris">Du</small>' +
    '<input id="r-deb" type="date" value="' + RAP_DEB + '" onchange="changerDates()"></div>' +
    '<div><small class="gris">Au</small>' +
    '<input id="r-fin" type="date" value="' + RAP_FIN + '" onchange="changerDates()"></div></div>' +
    '<button class="btn" onclick="window.print()">Imprimer / enregistrer en PDF</button></div>';

  h += '<div class="carte"><h2>Briqueterie Papa Moyo</h2>' +
    '<p class="gris" style="margin:0 0 10px">Rapport du ' + RAP_DEB + ' au ' + RAP_FIN + '</p>' +
    '<div class="grille">' +
    case1("Sacs de ciment utilisés", somme(prods, "sacs")) +
    case1("Pièces produites", somme(prods, "quantite")) +
    case1("Production due", argent(somme(prods, "montant"))) +
    case1("Ajustements", argent(somme(ajs, "montant"))) +
    case1("Payé", argent(somme(pays, "montant"))) +
    case1("Tours de livraison", somme(livs, "tours")) +
    '</div></div>';

  // Par fabricant
  var lf = fabricants().map(function (u) {
    var mp = prods.filter(function (p) { return p.fabricant == u.id; });
    var ma = ajs.filter(function (a) { return a.fabricant == u.id; });
    var my = pays.filter(function (p) { return p.fabricant == u.id; });
    return [echapper(u.nom), somme(mp, "quantite"), somme(mp, "sacs"),
      argent(somme(mp, "montant")), argent(somme(ma, "montant")),
      argent(somme(my, "montant")), '<b>' + argent(solde(u.id).reste) + '</b>'];
  });
  h += '<div class="carte"><h3>Par fabricant</h3>' +
    (lf.length ? tableau(["Nom", "Pièces", "Sacs", "Gagné", "Ajust.", "Payé", "Reste dû"], lf)
      : '<p class="gris">Aucun fabricant.</p>') +
    '<p class="gris" style="margin:6px 0 0"><small>« Reste dû » est le solde actuel, toutes périodes confondues.</small></p></div>';

  // Par article
  var la = [];
  D.articles.forEach(function (a) {
    var mp = prods.filter(function (p) { return p.article == a.id; });
    if (!mp.length) return;
    var ec = 0, avecEcart = false;
    mp.forEach(function (p) {
      var e = ecart(p);
      if (e !== null) { ec += e; avecEcart = true; }
    });
    la.push([echapper(a.nom), somme(mp, "sacs"), somme(mp, "quantite"),
      avecEcart ? '<b class="' + (ec < 0 ? "ko" : "ok") + '">' + texteEcart(ec) + '</b>' : "–",
      argent(somme(mp, "montant"))]);
  });
  h += '<div class="carte"><h3>Par article</h3>' +
    (la.length ? tableau(["Article", "Sacs", "Pièces", "Écart", "Montant"], la)
      : '<p class="gris">Aucune production sur cette période.</p>') + '</div>';

  // Livraisons par chauffeur
  var ch = {};
  livs.forEach(function (l) {
    if (!ch[l.chauffeur]) ch[l.chauffeur] = { tours: 0, pieces: 0 };
    ch[l.chauffeur].tours += l.tours;
    ch[l.chauffeur].pieces += l.quantite;
  });
  var lc = Object.keys(ch).map(function (n) {
    return [echapper(n), ch[n].tours, ch[n].pieces];
  });
  h += '<div class="carte"><h3>Livraisons par chauffeur</h3>' +
    (lc.length ? tableau(["Chauffeur", "Tours", "Pièces"], lc)
      : '<p class="gris">Aucune livraison sur cette période.</p>') + '</div>';

  // Situation actuelle
  var ouvertes = D.requetes.filter(function (r) { return r.statut != "résolu"; }).length;
  h += '<div class="carte"><h3>Situation actuelle</h3>' +
    '<div class="ligne"><span>Total encore dû aux fabricants</span><b class="ko">' +
    argent(fabricants().reduce(function (t, u) { return t + Math.max(solde(u.id).reste, 0); }, 0)) + '</b></div>' +
    (typeof stockCiment == "function" ?
      '<div class="ligne"><span>Ciment en stock (sacs)</span><b>' + stockCiment() + '</b></div>' : '') +
    '<div class="ligne"><span>Requêtes et manquements à traiter</span><b>' + ouvertes + '</b></div></div>';

  return h;
};