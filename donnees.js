// donnees.js : stockage et calculs de base

var CLE = "briqueterie_v1";
var D = charger();

function donneesInitiales() {
  return {
    n: 100,
    utilisateurs: [
      { id: 1, identifiant: "admin", mdp: "admin123", nom: "Administrateur", role: "admin" },
      { id: 2, identifiant: "papa", mdp: "papa123", nom: "Papa Moyo", role: "proprietaire" }
    ],
    articles: [
      { id: 1, nom: "Parpaing 12", prix: 2000, sacsMin: 1, parSac: 75 },
      { id: 2, nom: "Parpaing 15", prix: 2000, sacsMin: 1, parSac: 80 },
      { id: 3, nom: "Parpaing 20", prix: 2000, sacsMin: 1, parSac: 55 },
      { id: 4, nom: "Ourdis", prix: 2000, sacsMin: 1, parSac: 50 },
      { id: 5, nom: "Buses", prix: 2000, sacsMin: 2, parSac: 0 },
      { id: 6, nom: "Pavés", prix: 2500, sacsMin: 1, parSac: 0 },
      { id: 7, nom: "Bornes", prix: 2000, sacsMin: 1, parSac: 0 },
      { id: 8, nom: "Voûtes", prix: 0, sacsMin: 1, parSac: 0 },
      { id: 9, nom: "Poteaux", prix: 0, sacsMin: 1, parSac: 0 },
      { id: 10, nom: "Balustres", prix: 0, sacsMin: 1, parSac: 0 },
      { id: 11, nom: "Socles", prix: 0, sacsMin: 1, parSac: 0 }
    ],
    productions: [],
    paiements: [],
    ajustements: [],
    livraisons: [],
    requetes: []
  };
}

function charger() {
  try {
    var s = localStorage.getItem(CLE);
    if (s) return JSON.parse(s);
  } catch (e) {}
  return donneesInitiales();
}

function sauver() {
  try { localStorage.setItem(CLE, JSON.stringify(D)); } catch (e) {}
}

function $(id) { return document.getElementById(id); }

function echapper(t) {
  return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

function argent(n) {
  return (n || 0).toLocaleString("fr-FR") + " F";
}

function aujourdhui() {
  var d = new Date();
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function somme(liste, champ) {
  return liste.reduce(function (t, x) { return t + (+x[champ] || 0); }, 0);
}

function fabricants() {
  return D.utilisateurs.filter(function (u) { return u.role == "fabricant"; });
}

function trouverArticle(id) {
  return D.articles.filter(function (a) { return a.id == id; })[0];
}

function nomArticle(id) {
  var a = trouverArticle(id);
  return echapper(a ? a.nom : "?");
}

function nomUtilisateur(id) {
  var u = D.utilisateurs.filter(function (x) { return x.id == id; })[0];
  return echapper(u ? u.nom : "?");
}

// Écart de pièces : produites moins attendues (ex. 78 - 80 = -2)
function ecart(prod) {
  var a = trouverArticle(prod.article);
  if (!a || !a.parSac) return null;
  return prod.quantite - prod.sacs * a.parSac;
}

function texteEcart(e) {
  if (e === null) return "";
  if (e > 0) return "+" + e;
  if (e < 0) return "−" + Math.abs(e);
  return "0";
}

// Solde d'un fabricant : gagné + ajustements - paiements
function solde(idFab) {
  var gagne = somme(D.productions.filter(function (x) { return x.fabricant == idFab; }), "montant");
  var ajuste = somme(D.ajustements.filter(function (x) { return x.fabricant == idFab; }), "montant");
  var paye = somme(D.paiements.filter(function (x) { return x.fabricant == idFab; }), "montant");
  return { gagne: gagne, ajuste: ajuste, paye: paye, reste: gagne + ajuste - paye };
}