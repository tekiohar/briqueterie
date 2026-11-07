// modifier-fabricant.js : modification du profil d'un fabricant (admin)

var EDITION = false;
var profilOriginal = vueProfil;
var retourListeOriginal = retourListe;

retourListe = function () {
  EDITION = false;
  PHOTO_TEMP = "";
  retourListeOriginal();
};

function commencerEdition() {
  EDITION = true;
  PHOTO_TEMP = "";
  dessiner();
}

function annulerEdition() {
  EDITION = false;
  PHOTO_TEMP = "";
  dessiner();
}

function enregistrerEdition(id) {
  var u = D.utilisateurs.filter(function (x) { return x.id == id; })[0];
  var nom = $("e-nom").value.trim();
  if (!nom) {
    alert("Le nom ne peut pas être vide.");
    return;
  }
  u.nom = nom;
  u.tel = $("e-tel").value.trim();
  u.quartier = $("e-quartier").value.trim();
  u.statut = $("e-statut").value;
  u.depuis = $("e-date").value;
  var mdp = $("e-mdp").value;
  if (mdp) u.mdp = mdp;
  if (PHOTO_TEMP) u.photo = PHOTO_TEMP;
  PHOTO_TEMP = "";
  EDITION = false;
  sauver();
  dessiner();
}

vueProfil = function (id) {
  var u = D.utilisateurs.filter(function (x) { return x.id == id; })[0];
  if (!u) return profilOriginal(id);

  if (EDITION && estAdmin()) {
    return '<div class="carte"><h3>Modifier ' + echapper(u.nom) + '</h3>' +
      '<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">' +
      '<img id="apercu" class="avatar" style="width:64px;height:64px" src="' + (u.photo || PHOTO_VIDE) + '">' +
      '<input type="file" accept="image/*" onchange="choisirPhoto(this)" style="margin:0">' +
      '</div>' +
      '<input id="e-nom" placeholder="Nom complet" value="' + echapper(u.nom) + '">' +
      '<input id="e-tel" type="tel" placeholder="Numéro de téléphone" value="' + echapper(u.tel || "") + '">' +
      '<input id="e-quartier" placeholder="Quartier ou adresse" value="' + echapper(u.quartier || "") + '">' +
      '<select id="e-statut">' +
      '<option' + (u.statut == "Régulier" ? " selected" : "") + '>Régulier</option>' +
      '<option' + (u.statut == "Occasionnel" ? " selected" : "") + '>Occasionnel</option></select>' +
      '<input id="e-date" type="date" value="' + echapper(u.depuis || "") + '">' +
      '<input id="e-mdp" placeholder="Nouveau mot de passe (vide = inchangé)">' +
      '<button class="btn" onclick="enregistrerEdition(' + id + ')">Enregistrer</button> ' +
      '<button class="btn-petit" onclick="annulerEdition()">Annuler</button></div>';
  }

  var h = profilOriginal(id);
  if (estAdmin()) {
    h = h.replace("← Retour à la liste</button>",
      "← Retour à la liste</button> " +
      '<button class="btn-petit" onclick="commencerEdition()">Modifier</button>');
  }
  return h;
};