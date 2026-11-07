// dialogues.js : boîtes de dialogue intégrées au site (à charger en dernier)

(function () {
  var s = document.createElement("style");
  s.textContent =
    ".dlg-fond{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px}" +
    ".dlg{background:var(--carte);color:var(--texte);border-radius:10px;padding:16px;width:100%;max-width:380px;box-shadow:0 8px 30px rgba(0,0,0,.35)}" +
    ".dlg p{margin:0 0 12px;white-space:pre-line}" +
    ".dlg .acts{display:flex;gap:8px;justify-content:flex-end;margin-top:4px}" +
    ".dlg .btn,.dlg .btn-petit{margin:0;padding:11px 18px;font-size:15px}";
  document.head.appendChild(s);
})();

function boite(texte, champs, ok, annulable) {
  return new Promise(function (resolve) {
    var fond = document.createElement("div");
    fond.className = "dlg-fond";
    var h = '<div class="dlg"><p>' + echapper(texte) + '</p>';
    champs.forEach(function (c, i) {
      h += (c.label ? '<small class="gris">' + echapper(c.label) + '</small>' : '') +
        '<input id="dlg-c' + i + '" type="text" inputmode="' + (c.mode || "text") +
        '" value="' + echapper(c.valeur == null ? "" : c.valeur) +
        '" placeholder="' + echapper(c.placeholder || "") + '">';
    });
    h += '<div class="acts">' +
      (annulable ? '<button class="btn-petit" id="dlg-non">Annuler</button>' : '') +
      '<button class="btn" id="dlg-ok">' + echapper(ok || "OK") + '</button></div></div>';
    fond.innerHTML = h;
    document.body.appendChild(fond);

    var premier = fond.querySelector("input");
    if (premier) premier.focus();

    function fermer(valeur) {
      document.body.removeChild(fond);
      resolve(valeur);
    }
    fond.querySelector("#dlg-ok").onclick = function () {
      fermer(champs.map(function (c, i) {
        return fond.querySelector("#dlg-c" + i).value;
      }));
    };
    var non = fond.querySelector("#dlg-non");
    if (non) non.onclick = function () { fermer(null); };
  });
}

function demander(texte, valeur, mode) {
  return boite(texte, [{ valeur: valeur, mode: mode || "text" }], "Valider", true)
    .then(function (r) { return r ? r[0] : null; });
}

function confirmer(texte) {
  return boite(texte, [], "Oui", true).then(function (r) { return r !== null; });
}

function nombre(t) {
  return +String(t).replace(/\s/g, "").replace("−", "-").replace(",", ".");
}

function nomBrut(id) {
  var u = D.utilisateurs.filter(function (x) { return x.id == id; })[0];
  return u ? u.nom : "";
}

// Les messages d'alerte deviennent des fenêtres du site
window.alert = function (texte) {
  boite(String(texte), [], "OK", false);
};

// Les confirmations passent maintenant par confirmer()
window.confirm = function () { return true; };

function avecConfirmation(nom, texte) {
  var origine = window[nom];
  window[nom] = function () {
    var args = arguments;
    confirmer(texte).then(function (ok) {
      if (ok) origine.apply(null, args);
    });
  };
}

avecConfirmation("supprimerProduction", "Supprimer cette production ?");
avecConfirmation("supprimerMouvement", "Annuler cette ligne ?");
avecConfirmation("supprimerLivraison", "Supprimer cette livraison ?");
avecConfirmation("supprimerRequete", "Supprimer cette requête ?");
avecConfirmation("supprimerMouvementStock", "Supprimer ce mouvement ?");
avecConfirmation("restaurerDonnees", "Remplacer toutes les données actuelles par celles du fichier choisi ?");

// Paiement
payer = async function (id) {
  var s = solde(id);
  var v = await demander("Paiement de " + nomBrut(id) + " : montant payé (F)",
    s.reste > 0 ? s.reste : "", "numeric");
  if (v === null) return;
  v = Math.round(nombre(v));
  if (!(v > 0)) {
    alert("Montant invalide.");
    return;
  }
  D.paiements.push({ id: D.n++, date: aujourdhui(), fabricant: id, montant: v });
  sauver();
  dessiner();
};

// Prime ou retenue
ajuster = async function (id) {
  var r = await boite("Ajustement pour " + nomBrut(id), [
    { label: "Montant (positif = prime, négatif = retenue)", placeholder: "ex. 500 ou -500" },
    { label: "Motif", placeholder: "ex. prime d’assiduité" }
  ], "Enregistrer", true);
  if (!r) return;
  var v = Math.round(nombre(r[0]));
  if (!v) {
    alert("Montant invalide.");
    return;
  }
  D.ajustements.push({
    id: D.n++,
    date: aujourdhui(),
    fabricant: id,
    montant: v,
    motif: r[1].trim() || "Sans motif"
  });
  sauver();
  dessiner();
};