// fiche-paie.js : fiche de paie d'un fabricant, imprimable
// (à charger après rapport.js et modifier-fabricant.js)

var FICHE = null;
var FICHE_DEB = debutSemaineFiche();
var FICHE_FIN = aujourdhui();

function debutSemaineFiche() {
  var d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function ouvrirFiche(id) {
  FICHE = id;
  FICHE_DEB = debutSemaineFiche();
  FICHE_FIN = aujourdhui();
  dessiner();
}

function fermerFiche() {
  FICHE = null;
  dessiner();
}

function changerDatesFiche() {
  FICHE_DEB = $("fi-deb").value || FICHE_DEB;
  FICHE_FIN = $("fi-fin").value || FICHE_FIN;
  dessiner();
}

function depuisDernierPaiement(id) {
  var dates = D.paiements.filter(function (p) { return p.fabricant == id; })
    .map(function (p) { return p.date; }).sort();
  if (!dates.length) {
    alert("Aucun paiement enregistré pour ce fabricant.");
    return;
  }
  FICHE_DEB = dates[dates.length - 1];
  FICHE_FIN = aujourdhui();
  dessiner();
}

function dansFiche(liste, id) {
  return liste.filter(function (x) {
    return x.fabricant == id && x.date >= FICHE_DEB && x.date <= FICHE_FIN;
  }).sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id; });
}

function vueFiche(id) {
  var u = D.utilisateurs.filter(function (x) { return x.id == id; })[0];
  if (!u) return '<div class="carte">Fabricant introuvable.</div>';

  var prods = dansFiche(D.productions, id);
  var ajs = dansFiche(D.ajustements, id);
  var pays = dansFiche(D.paiements, id);
  var gagne = somme(prods, "montant");
  var ajuste = somme(ajs, "montant");
  var paye = somme(pays, "montant");
  var periode = gagne + ajuste - paye;

  var h = '<div class="carte np">' +
    '<button class="btn-petit" onclick="fermerFiche()">' +
    (MOI.role == "fabricant" ? "← Retour" : "← Retour au profil") + '</button>' +
    '<h3 style="margin-top:10px">Période</h3>' +
    '<div class="grille"><div><small class="gris">Du</small>' +
    '<input id="fi-deb" type="date" value="' + FICHE_DEB + '" onchange="changerDatesFiche()"></div>' +
    '<div><small class="gris">Au</small>' +
    '<input id="fi-fin" type="date" value="' + FICHE_FIN + '" onchange="changerDatesFiche()"></div></div>' +
    '<button class="btn-petit" onclick="depuisDernierPaiement(' + id + ')">Depuis le dernier paiement</button> ' +
    '<button class="btn" onclick="window.print()">Imprimer / PDF</button></div>';

  h += '<div class="carte"><h2>Fiche de paie</h2>' +
    '<p style="margin:0"><b>' + echapper(u.nom) + '</b>' +
    (u.tel ? ' · ' + echapper(u.tel) : '') + '</p>' +
    '<p class="gris" style="margin:0">Briqueterie Papa Moyo · du ' + FICHE_DEB + ' au ' + FICHE_FIN + '</p></div>';

  var lp = prods.map(function (p) {
    var e = ecart(p);
    return [p.date, nomArticle(p.article), p.sacs, p.quantite,
      e === null ? "–" : '<b class="' + (e < 0 ? "ko" : "ok") + '">' + texteEcart(e) + '</b>',
      argent(p.montant)];
  });
  if (lp.length) {
    lp.push(["<b>Total</b>", "", "<b>" + somme(prods, "sacs") + "</b>",
      "<b>" + somme(prods, "quantite") + "</b>", "", "<b>" + argent(gagne) + "</b>"]);
  }
  h += '<div class="carte"><h3>Production</h3>' +
    (lp.length ? tableau(["Date", "Article", "Sacs", "Pièces", "Écart", "Montant"], lp)
      : '<p class="gris">Aucune production sur cette période.</p>') + '</div>';

  h += '<div class="carte"><h3>Primes et retenues</h3>' +
    (ajs.length ? tableau(["Date", "Motif", "Montant"], ajs.map(function (a) {
      return [a.date, echapper(a.motif || ""), (a.montant < 0 ? "− " : "+ ") + argent(Math.abs(a.montant))];
    })) : '<p class="gris">Aucun ajustement sur cette période.</p>') + '</div>';

  h += '<div class="carte"><h3>Paiements reçus</h3>' +
    (pays.length ? tableau(["Date", "Montant"], pays.map(function (p) {
      return [p.date, argent(p.montant)];
    })) : '<p class="gris">Aucun paiement sur cette période.</p>') + '</div>';

  h += '<div class="carte"><h3>Résumé</h3>' +
    '<div class="ligne"><span>Gagné sur la période</span><b>' + argent(gagne) + '</b></div>' +
    '<div class="ligne"><span>Primes et retenues</span><b>' + (ajuste < 0 ? "− " : "") + argent(Math.abs(ajuste)) + '</b></div>' +
    '<div class="ligne"><span>Payé sur la période</span><b>' + argent(paye) + '</b></div>' +
    '<div class="ligne"><span>Solde de la période</span><b class="' + (periode > 0 ? "ko" : "ok") + '">' + argent(periode) + '</b></div>' +
    '<div class="ligne"><span><b>Reste dû au total</b><br><small class="gris">toutes périodes confondues</small></span>' +
    '<b class="' + (solde(id).reste > 0 ? "ko" : "ok") + '" style="font-size:18px">' + argent(solde(id).reste) + '</b></div></div>';

  h += '<div class="carte"><div class="grille">' +
    '<div><small class="gris">Signature du fabricant</small><div style="height:60px;border-bottom:1px solid var(--gris)"></div></div>' +
    '<div><small class="gris">Signature du responsable</small><div style="height:60px;border-bottom:1px solid var(--gris)"></div></div>' +
    '</div></div>';

  return h;
}

// Bouton "Fiche de paie" sur le profil (admin et propriétaire)
var profilAvantFiche = vueProfil;
vueProfil = function (id) {
  var h = profilAvantFiche(id);
  return h.replace("← Retour à la liste</button>",
    '← Retour à la liste</button> <button class="btn-petit" onclick="ouvrirFiche(' + id + ')">Fiche de paie</button>');
};

// Affichage de la fiche depuis l'onglet Fabricants
var fabricantsAvantFiche = VUES.fabricants;
VUES.fabricants = function () {
  if (FICHE) return vueFiche(FICHE);
  return fabricantsAvantFiche();
};

// Espace du fabricant
var moiAvantFiche = VUES.moi;
VUES.moi = function () {
  if (FICHE) return vueFiche(MOI.id);
  return '<button class="btn-petit" style="margin-bottom:10px" onclick="ouvrirFiche(' + MOI.id + ')">Ma fiche de paie</button>' +
    moiAvantFiche();
};

// On referme la fiche quand on change d'onglet
var allerAvantFiche = aller;
aller = function (id) {
  FICHE = null;
  allerAvantFiche(id);
};