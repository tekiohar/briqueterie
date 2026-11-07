// prix.js : prix par sac et quotas, modifiables par l'administrateur

function modifierPrix(id, valeur) {
  var a = trouverArticle(id);
  a.prix = Math.max(Math.round(+valeur) || 0, 0);
  sauver();
}

function modifierParSac(id, valeur) {
  var a = trouverArticle(id);
  a.parSac = Math.max(Math.round(+valeur) || 0, 0);
  sauver();
}

function ajouterArticle() {
  var nom = $("a-nom").value.trim();
  if (!nom) {
    alert("Donne un nom à l’article.");
    return;
  }
  var existe = D.articles.some(function (a) {
    return a.nom.toLowerCase() == nom.toLowerCase();
  });
  if (existe) {
    alert("Cet article existe déjà.");
    return;
  }
  D.articles.push({
    id: D.n++,
    nom: nom,
    prix: Math.round(+$("a-prix").value) || 0,
    sacsMin: Math.round(+$("a-min").value) || 1,
    parSac: Math.round(+$("a-parsac").value) || 0
  });
  sauver();
  dessiner();
}

VUES.prix = function () {
  var h = '<div class="carte"><h3>Prix par sac de ciment</h3>' +
    '<p class="gris" style="margin:0 0 6px"><small>Changer un prix ne modifie pas les productions déjà enregistrées.</small></p>';

  D.articles.forEach(function (a) {
    h += '<div class="ligne" style="display:block"><div style="display:flex;justify-content:space-between">' +
      '<b>' + echapper(a.nom) + '</b>' +
      (estAdmin() ? '' : '<b>' + argent(a.prix) + '</b>') + '</div>';
    if (estAdmin()) {
      h += '<div class="grille" style="margin-top:6px">' +
        '<div><small class="gris">Prix par sac (F)</small>' +
        '<input type="number" value="' + a.prix + '" onchange="modifierPrix(' + a.id + ',this.value)" style="margin:0"></div>' +
        '<div><small class="gris">Pièces attendues par sac</small>' +
        '<input type="number" value="' + a.parSac + '" onchange="modifierParSac(' + a.id + ',this.value)" style="margin:0"></div></div>' +
        '<small class="gris">Minimum ' + a.sacsMin + ' sac(s)</small>';
    } else {
      h += '<small class="gris">' + (a.parSac ? a.parSac + ' pièces attendues par sac · ' : '') +
        'minimum ' + a.sacsMin + ' sac(s)</small>';
    }
    h += '</div>';
  });
  h += '</div>';

  if (estAdmin()) {
    h += '<div class="carte"><h3>Nouvel article</h3>' +
      '<input id="a-nom" placeholder="Nom de l’article">' +
      '<input id="a-prix" type="number" placeholder="Prix par sac (F)">' +
      '<input id="a-min" type="number" placeholder="Minimum de sacs" value="1">' +
      '<input id="a-parsac" type="number" placeholder="Pièces attendues par sac (0 si variable)">' +
      '<button class="btn" onclick="ajouterArticle()">Ajouter l’article</button></div>';
  }
  return h;
};