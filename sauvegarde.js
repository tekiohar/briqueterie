// sauvegarde.js : export et restauration des données (admin)

var CLE_DERNIERE = "briqueterie_derniere_sauvegarde";

ONGLETS.splice(ONGLETS.length - 1, 0, ["sauvegarde", "Sauvegarde", ["admin"]]);

function derniereSauvegarde() {
  try { return localStorage.getItem(CLE_DERNIERE) || ""; } catch (e) { return ""; }
}

function exporterDonnees() {
  var texte = JSON.stringify(D);
  var blob = new Blob([texte], { type: "application/json" });
  var lien = document.createElement("a");
  lien.href = URL.createObjectURL(blob);
  lien.download = "sauvegarde-briqueterie-" + aujourdhui() + ".json";
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  try { localStorage.setItem(CLE_DERNIERE, aujourdhui()); } catch (e) {}
  setTimeout(dessiner, 300);
}

function restaurerDonnees(input) {
  var f = input.files[0];
  if (!f) return;
  var lecteur = new FileReader();
  lecteur.onload = function () {
    var data;
    try {
      data = JSON.parse(lecteur.result);
    } catch (e) {
      alert("Ce fichier n’est pas une sauvegarde valide.");
      return;
    }
    if (!data || !Array.isArray(data.utilisateurs) || !Array.isArray(data.productions)) {
      alert("Ce fichier ne ressemble pas à une sauvegarde de la briqueterie.");
      return;
    }
    if (!confirm("Remplacer toutes les données actuelles par celles de ce fichier ?")) return;
    D = data;
    if (!D.stock) D.stock = [];
    sauver();
    alert("Sauvegarde restaurée. Reconnecte-toi.");
    MOI = null;
    dessiner();
  };
  lecteur.readAsText(f);
}

VUES.sauvegarde = function () {
  var d = derniereSauvegarde();
  return '<div class="carte"><h3>Sauvegarder les données</h3>' +
    '<p class="gris" style="margin:0 0 8px">Dernière sauvegarde : <b class="' + (d ? "" : "ko") + '">' +
    (d || "jamais") + '</b></p>' +
    '<button class="btn" onclick="exporterDonnees()">Télécharger une sauvegarde</button>' +
    '<p class="gris" style="margin:8px 0 0"><small>Le fichier contient tout : fabricants, photos, production, paie, livraisons, stock. ' +
    'Garde-le en lieu sûr (Telegram, Google Drive, e-mail à toi-même).</small></p></div>' +

    '<div class="carte"><h3>Restaurer une sauvegarde</h3>' +
    '<p class="gris" style="margin:0 0 8px"><small>Attention : cela remplace toutes les données actuelles.</small></p>' +
    '<input type="file" accept=".json,application/json" onchange="restaurerDonnees(this)"></div>' +

    '<div class="carte"><h3>Contenu actuel</h3>' +
    '<div class="ligne"><span>Fabricants</span><b>' + fabricants().length + '</b></div>' +
    '<div class="ligne"><span>Productions</span><b>' + D.productions.length + '</b></div>' +
    '<div class="ligne"><span>Paiements</span><b>' + D.paiements.length + '</b></div>' +
    '<div class="ligne"><span>Livraisons</span><b>' + D.livraisons.length + '</b></div></div>';
};