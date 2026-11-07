// connexion.js : connexion, menu et affichage des écrans

var MOI = null;
var ONGLET = "";
var VUES = {};

var ONGLETS = [
  ["accueil", "Accueil", ["admin", "proprietaire"]],
  ["production", "Production", ["admin", "proprietaire"]],
  ["paie", "Paie", ["admin", "proprietaire"]],
  ["livraisons", "Livraisons", ["admin", "proprietaire"]],
  ["requetes", "Requêtes", ["admin", "proprietaire"]],
  ["fabricants", "Fabricants", ["admin", "proprietaire"]],
  ["prix", "Prix", ["admin", "proprietaire"]],
  ["moi", "Mon espace", ["fabricant"]]
];

function onglets() {
  return ONGLETS.filter(function (o) { return o[2].indexOf(MOI.role) >= 0; });
}

function estAdmin() {
  return MOI && MOI.role == "admin";
}

function seConnecter() {
  var id = $("champ-id").value.trim().toLowerCase();
  var mdp = $("champ-mdp").value;
  var u = D.utilisateurs.filter(function (x) {
    return x.identifiant == id && x.mdp == mdp;
  })[0];
  if (!u) {
    $("erreur").textContent = "Identifiant ou mot de passe incorrect.";
    return;
  }
  MOI = u;
  ONGLET = onglets()[0][0];
  dessiner();
}

function seDeconnecter() {
  MOI = null;
  dessiner();
}

function aller(id) {
  ONGLET = id;
  dessiner();
}

function dessiner() {
  var app = $("app");

  if (!MOI) {
    app.innerHTML =
      '<div class="connexion">' +
      '<h2>Briqueterie Papa Moyo</h2>' +
      '<p class="gris">Connecte-toi pour accéder à la gestion.</p>' +
      '<div class="carte">' +
      '<input id="champ-id" placeholder="Identifiant" autocapitalize="none">' +
      '<input id="champ-mdp" type="password" placeholder="Mot de passe">' +
      '<p id="erreur" class="ko"></p>' +
      '<button class="btn" style="width:100%" onclick="seConnecter()">Se connecter</button>' +
      '</div>' +
      '<small class="gris">Comptes d’essai : admin / admin123 et papa / papa123</small>' +
      '</div>';
    return;
  }

  var roles = {
    admin: "Administrateur",
    proprietaire: "Propriétaire · lecture seule",
    fabricant: "Fabricant"
  };

  var html =
    '<header><div><b>Briqueterie Papa Moyo</b><br><small>' +
    echapper(MOI.nom) + ' · ' + roles[MOI.role] + '</small></div>' +
    '<button class="btn-petit" style="color:#fff;border-color:#fff;margin:0" onclick="seDeconnecter()">Quitter</button>' +
    '</header><nav>';

  onglets().forEach(function (o) {
    html += '<button class="' + (o[0] == ONGLET ? "actif" : "") +
      '" onclick="aller(\'' + o[0] + '\')">' + o[1] + '</button>';
  });

  var vue = VUES[ONGLET];
  html += '</nav><main>' +
    (vue ? vue() : '<div class="carte gris">Cette page arrive bientôt.</div>') +
    '</main>';

  app.innerHTML = html;
}

window.addEventListener("load", dessiner);