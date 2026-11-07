// requetes.js : requêtes et manquements de la structure

function ajouterRequete() {
  var titre = $("q-titre").value.trim();
  if (!titre) {
    alert("Donne un titre à la requête.");
    return;
  }
  D.requetes.push({
    id: D.n++,
    date: $("q-date").value || aujourdhui(),
    type: $("q-type").value,
    titre: titre,
    details: $("q-details").value.trim(),
    statut: "ouvert"
  });
  sauver();
  dessiner();
}

function changerStatut(id) {
  var r = D.requetes.filter(function (x) { return x.id == id; })[0];
  var ordre = ["ouvert", "en cours", "résolu"];
  r.statut = ordre[(ordre.indexOf(r.statut) + 1) % 3];
  sauver();
  dessiner();
}

function supprimerRequete(id) {
  if (!confirm("Supprimer cette requête ?")) return;
  D.requetes = D.requetes.filter(function (x) { return x.id != id; });
  sauver();
  dessiner();
}

VUES.requetes = function () {
  var h = "";

  if (estAdmin()) {
    h += '<div class="carte"><h3>Nouvelle requête ou manquement</h3>' +
      '<input id="q-date" type="date" value="' + aujourdhui() + '">' +
      '<select id="q-type"><option>Requête</option><option>Manquement</option></select>' +
      '<input id="q-titre" placeholder="Titre (ex. Manque de ciment)">' +
      '<textarea id="q-details" rows="3" placeholder="Détails"></textarea>' +
      '<button class="btn" onclick="ajouterRequete()">Enregistrer</button></div>';
  }

  var ouvertes = D.requetes.filter(function (r) { return r.statut != "résolu"; }).length;
  h += '<div class="carte"><h3>Requêtes et manquements</h3>' +
    '<p class="gris" style="margin:0 0 6px">À traiter : <b class="' + (ouvertes ? "ko" : "ok") + '">' + ouvertes + '</b></p>';

  var liste = D.requetes.slice().sort(function (x, y) {
    return x.date < y.date ? 1 : x.date > y.date ? -1 : y.id - x.id;
  });

  if (!liste.length) {
    h += '<p class="gris">Rien à signaler pour le moment.</p>';
  }
  liste.forEach(function (r) {
    h += '<div class="ligne"><div><b>' + echapper(r.titre) + '</b>' +
      '<br><small class="gris">' + r.date + ' · ' + echapper(r.type || "") + '</small>' +
      (r.details ? '<br><span>' + echapper(r.details) + '</span>' : '') + '</div>' +
      '<div class="droite"><b class="' + (r.statut == "résolu" ? "ok" : "ko") + '">' + r.statut + '</b>' +
      (estAdmin() ? '<br><a onclick="changerStatut(' + r.id + ')">Changer</a> · ' +
        '<a class="ko" onclick="supprimerRequete(' + r.id + ')">Supprimer</a>' : '') +
      '</div></div>';
  });
  return h + '</div>';
};