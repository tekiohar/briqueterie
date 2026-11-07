// comptes.js : création des comptes fabricants dans Supabase (à charger après base.js)

var sbCreation = window.supabase.createClient(SUPABASE_URL, SUPABASE_CLE, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: "creation-compte"
  }
});

ajouterFabricant = async function () {
  var nom = $("f-nom").value.trim();
  var ident = $("f-id").value.trim().toLowerCase();
  var mdp = $("f-mdp").value;
  var tel = $("f-tel").value.trim();
  var quartier = $("f-quartier").value.trim();
  var statut = $("f-statut").value;
  var depuis = $("f-date").value;
  var photo = PHOTO_TEMP;

  if (!nom || !ident || !mdp) {
    alert("Remplis au moins le nom, l’identifiant et le mot de passe.");
    return;
  }
  if (!/^[a-z0-9._-]+$/.test(ident)) {
    alert("L’identifiant doit contenir seulement des lettres minuscules sans accent, des chiffres, un point ou un tiret (pas d’espace).");
    return;
  }
  if (mdp.length < 6) {
    alert("Le mot de passe doit avoir au moins 6 caractères.");
    return;
  }
  if (D.utilisateurs.some(function (u) { return u.identifiant == ident; })) {
    alert("Cet identifiant existe déjà.");
    return;
  }

  var r = await sbCreation.auth.signUp({ email: ident + "@briqueterie.app", password: mdp });
  if (r.error) {
    alert("Création impossible : " + r.error.message);
    return;
  }
  var user = r.data.user;
  if (!user || (user.identities && user.identities.length == 0)) {
    alert("Cet identifiant existe déjà dans la base.");
    return;
  }
  await sbCreation.auth.signOut();

  var idLocal = D.n++;
  var p = await sb.from("profiles").insert({
    id: user.id,
    username: ident,
    full_name: nom,
    role: "maker",
    local_id: idLocal
  });
  if (p.error) {
    alert("Le compte est créé mais le profil n’a pas pu être enregistré : " + p.error.message);
    return;
  }

  D.utilisateurs.push({
    id: idLocal,
    identifiant: ident,
    uid: user.id,
    nom: nom,
    role: "fabricant",
    tel: tel,
    quartier: quartier,
    statut: statut,
    depuis: depuis,
    photo: photo
  });
  PHOTO_TEMP = "";
  sauver();
  dessiner();
};

// Changement de mot de passe d'un fabricant (admin)
var enregistrerEditionOrigine = enregistrerEdition;
enregistrerEdition = async function (id) {
  var u = D.utilisateurs.filter(function (x) { return x.id == id; })[0];
  var mdp = $("e-mdp").value;
  if (mdp) {
    if (mdp.length < 6) {
      alert("Le mot de passe doit avoir au moins 6 caractères.");
      return;
    }
    if (!u || !u.uid) {
      alert("Ce fabricant n’a pas de compte de connexion, son mot de passe ne peut pas être changé.");
      return;
    }
    var r = await sb.rpc("changer_mdp", { cible: u.uid, nouveau: mdp });
    if (r.error) {
      alert("Mot de passe non changé : " + r.error.message);
      return;
    }
    $("e-mdp").value = "";
  }
  enregistrerEditionOrigine(id);
};