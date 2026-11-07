// fabricants.js : liste, création et profils des fabricants

var PROFIL = null;
var PHOTO_TEMP = "";
var PHOTO_VIDE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%23c5ccd1'/%3E%3Ccircle cx='24' cy='18' r='8' fill='%23fff'/%3E%3Crect x='10' y='30' width='28' height='18' rx='9' fill='%23fff'/%3E%3C/svg%3E";

function choisirPhoto(input) {
  var f = input.files[0];
  if (!f) return;
  var lecteur = new FileReader();
  lecteur.onload = function () {
    var img = new Image();
    img.onload = function () {
      var c = document.createElement("canvas");
      c.width = 200;
      c.height = 200;
      var t = Math.min(img.width, img.height);
      c.getContext("2d").drawImage(img, (img.width - t) / 2, (img.height - t) / 2, t, t, 0, 0, 200, 200);
      PHOTO_TEMP = c.toDataURL("image/jpeg", 0.7);
      $("apercu").src = PHOTO_TEMP;
    };
    img.src = lecteur.result;
  };
  lecteur.readAsDataURL(f);
}

function ajouterFabricant() {
  var nom = $("f-nom").value.trim();
  var ident = $("f-id").value.trim().toLowerCase();
  var mdp = $("f-mdp").value;
  if (!nom || !ident || !mdp) {
    alert("Remplis au moins le nom, l’identifiant et le mot de passe.");
    return;
  }
  var existe = D.utilisateurs.some(function (u) { return u.identifiant == ident; });
  if (existe) {
    alert("Cet identifiant existe déjà.");
    return;
  }
  D.utilisateurs.push({
    id: D.n++,
    identifiant: ident,
    mdp: mdp,
    nom: nom,
    role: "fabricant",
    tel: $("f-tel").value.trim(),
    quartier: $("f-quartier").value.trim(),
    statut: $("f-statut").value,
    depuis: $("f-date").value,
    photo: PHOTO_TEMP
  });
  PHOTO_TEMP = "";
  sauver();
  dessiner();
}

function voirProfil(id) {
  PROFIL = id;
  dessiner();
}

function retourListe() {
  PROFIL = null;
  dessiner();
}

VUES.fabricants = function () {
  if (PROFIL) return vueProfil(PROFIL);
  var h = "";

  if (estAdmin()) {
    h += '<div class="carte"><h3>Nouveau fabricant</h3>' +
      '<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">' +
      '<img id="apercu" class="avatar" src="' + PHOTO_VIDE + '">' +
      '<input type="file" accept="image/*" onchange="choisirPhoto(this)" style="margin:0">' +
      '</div>' +
      '<input id="f-nom" placeholder="Nom complet">' +
      '<input id="f-tel" type="tel" placeholder="Numéro de téléphone">' +
      '<input id="f-quartier" placeholder="Quartier ou adresse">' +
      '<select id="f-statut"><option>Régulier</option><option>Occasionnel</option></select>' +
      '<input id="f-date" type="date" value="' + aujourdhui() + '">' +
      '<input id="f-id" placeholder="Identifiant de connexion" autocapitalize="none">' +
      '<input id="f-mdp" placeholder="Mot de passe">' +
      '<button class="btn" onclick="ajouterFabricant()">Créer le fabricant</button></div>';
  }

  var liste = fabricants();
  h += '<div class="carte"><h3>Fabricants (' + liste.length + ')</h3>';
  if (!liste.length) {
    h += '<p class="gris">Aucun fabricant pour le moment.</p>';
  }
  liste.forEach(function (u) {
    var s = solde(u.id);
    h += '<div class="ligne" onclick="voirProfil(' + u.id + ')">' +
      '<img class="avatar" src="' + (u.photo || PHOTO_VIDE) + '">' +
      '<div style="flex:1"><b>' + echapper(u.nom) + '</b><br>' +
      '<small class="gris">' + echapper(u.tel || "Pas de numéro") + ' · ' + echapper(u.statut || "") + '</small></div>' +
      '<div class="droite"><b class="' + (s.reste > 0 ? "ko" : "ok") + '">' + argent(s.reste) + '</b><br>' +
      '<small class="gris">Voir le profil</small></div></div>';
  });
  return h + '</div>';
};

function vueProfil(id) {
  var u = D.utilisateurs.filter(function (x) { return x.id == id; })[0];
  if (!u) return '<div class="carte">Profil introuvable.</div>';
  var s = solde(id);

  var h = '<button class="btn-petit" onclick="retourListe()" style="margin-bottom:10px">← Retour à la liste</button>';

  h += '<div class="carte"><div style="display:flex;gap:12px;align-items:center">' +
    '<img class="avatar" style="width:80px;height:80px" src="' + (u.photo || PHOTO_VIDE) + '">' +
    '<div><h2 style="margin:0">' + echapper(u.nom) + '</h2>' +
    '<span class="gris">' + echapper(u.statut || "") + '</span></div></div>' +
    '<div class="ligne"><span class="gris">Téléphone</span><span>' +
    (u.tel ? '<a href="tel:' + echapper(u.tel) + '">' + echapper(u.tel) + '</a>' : "Non renseigné") + '</span></div>' +
    '<div class="ligne"><span class="gris">Quartier</span><span>' + echapper(u.quartier || "Non renseigné") + '</span></div>' +
    '<div class="ligne"><span class="gris">Arrivé le</span><span>' + echapper(u.depuis || "Non renseigné") + '</span></div></div>';

  h += '<div class="carte"><div class="grille">' +
    '<div class="case"><small class="gris">Reste à recevoir</small><b class="' + (s.reste > 0 ? "ko" : "ok") + '">' + argent(s.reste) + '</b></div>' +
    '<div class="case"><small class="gris">Déjà payé</small><b>' + argent(s.paye) + '</b></div></div></div>';

  // Production par jour, avec l'écart par rapport à l'attendu
  var prods = D.productions.filter(function (p) { return p.fabricant == id; });
  var jours = {};
  prods.forEach(function (p) {
    if (!jours[p.date]) jours[p.date] = [];
    jours[p.date].push(p);
  });
  var dates = Object.keys(jours).sort().reverse().slice(0, 30);

  h += '<div class="carte"><h3>Production par jour</h3>';
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
  return h + '</div>';
}