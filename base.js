// base.js : relie le site à Supabase (à charger en dernier)

var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_CLE);
var ROLES_BASE = { admin: "admin", owner: "proprietaire", maker: "fabricant" };
var COLLECTIONS = ["utilisateurs", "articles", "productions", "paiements",
  "ajustements", "livraisons", "requetes", "stock"];
var instantane = {};
var fileSync = Promise.resolve();

function message(t) {
  var e = $("erreur");
  if (e) e.textContent = t; else alert(t);
}

function propre(o) {
  var c = JSON.parse(JSON.stringify(o));
  delete c.mdp;
  return c;
}

function donneesVides() {
  var v = { n: 100 };
  COLLECTIONS.forEach(function (c) { v[c] = []; });
  return v;
}

async function chargerDepuisBase() {
  var lignes = [], de = 0, pas = 1000;
  while (true) {
    var r = await sb.from("donnees").select("collection,id,data")
      .order("collection").order("id").range(de, de + pas - 1);
    if (r.error) throw r.error;
    lignes = lignes.concat(r.data);
    if (r.data.length < pas) break;
    de += pas;
  }
  var nouveau = donneesVides();
  instantane = {};
  COLLECTIONS.forEach(function (c) { instantane[c] = {}; });
  lignes.forEach(function (l) {
    if (!nouveau[l.collection]) return;
    var o = l.data;
    o.id = l.id;
    nouveau[l.collection].push(o);
    instantane[l.collection][l.id] = JSON.stringify(propre(o));
    if (l.id >= nouveau.n) nouveau.n = l.id + 1;
  });
  D = nouveau;
}

async function synchroniser(admin) {
  if (!admin) return;
  var aEnvoyer = [], aSupprimer = {};
  COLLECTIONS.forEach(function (c) {
    if (!instantane[c]) instantane[c] = {};
    var vus = {};
    (D[c] || []).forEach(function (o) {
      var copie = propre(o);
      var txt = JSON.stringify(copie);
      vus[o.id] = true;
      if (instantane[c][o.id] !== txt) {
        aEnvoyer.push({ c: c, id: o.id, copie: copie, txt: txt });
      }
    });
    Object.keys(instantane[c]).forEach(function (id) {
      if (!vus[id]) {
        if (!aSupprimer[c]) aSupprimer[c] = [];
        aSupprimer[c].push(+id);
      }
    });
  });

  for (var i = 0; i < aEnvoyer.length; i += 200) {
    var lot = aEnvoyer.slice(i, i + 200);
    var r = await sb.from("donnees").upsert(lot.map(function (x) {
      return { collection: x.c, id: x.id, data: x.copie };
    }));
    if (r.error) throw r.error;
    lot.forEach(function (x) { instantane[x.c][x.id] = x.txt; });
  }

  var cols = Object.keys(aSupprimer);
  for (var k = 0; k < cols.length; k++) {
    var c = cols[k], ids = aSupprimer[c];
    for (var j = 0; j < ids.length; j += 100) {
      var morceau = ids.slice(j, j + 100);
      var d = await sb.from("donnees").delete().eq("collection", c).in("id", morceau);
      if (d.error) throw d.error;
      morceau.forEach(function (id) { delete instantane[c][id]; });
    }
  }
}

// Chaque enregistrement du site part maintenant vers la base
sauver = function () {
  var admin = !!MOI && MOI.role == "admin";
  fileSync = fileSync.then(function () {
    return synchroniser(admin);
  }).catch(function (e) {
    alert("Les données n’ont pas pu être enregistrées (" + (e.message || e) +
      "). Vérifie ta connexion puis recharge la page.");
  });
};

function amorcerBase() {
  D.articles = donneesInitiales().articles;
  D.utilisateurs = [
    { id: 1, identifiant: "admin", nom: "Administrateur", role: "admin" },
    { id: 2, identifiant: "papa", nom: "Papa Moyo", role: "proprietaire" }
  ];
  D.n = Math.max(D.n, 100);
}

async function ouvrirSession(uid) {
  var p = await sb.from("profiles").select("*").eq("id", uid).single();
  if (p.error || !p.data) {
    await sb.auth.signOut();
    MOI = null;
    dessiner();
    message("Ce compte n’est pas configuré. Contacte l’administrateur.");
    return;
  }
  var role = ROLES_BASE[p.data.role];
  MOI = { id: p.data.local_id, role: role, nom: p.data.full_name };
  try {
    await chargerDepuisBase();
  } catch (e) {
    await sb.auth.signOut();
    MOI = null;
    dessiner();
    message("Impossible de charger les données : " + (e.message || e));
    return;
  }
  if (role == "admin" && D.articles.length == 0) {
    amorcerBase();
    sauver();
  }
  var fiche = D.utilisateurs.filter(function (u) { return u.id == p.data.local_id; })[0];
  if (fiche) {
    MOI = fiche.role == role ? fiche : Object.assign({}, fiche, { role: role });
  }
  ONGLET = onglets()[0][0];
  dessiner();
}

seConnecter = async function () {
  var id = $("champ-id").value.trim().toLowerCase();
  var mdp = $("champ-mdp").value;
  if (!id || !mdp) {
    message("Entre ton identifiant et ton mot de passe.");
    return;
  }
  message("Connexion…");
  var r = await sb.auth.signInWithPassword({ email: id + "@briqueterie.app", password: mdp });
  if (r.error) {
        message(r.error.message == "Invalid login credentials" ? "Identifiant ou mot de passe incorrect." : "Erreur : " + r.error.message);
    return;
  }
  await ouvrirSession(r.data.user.id);
};

seDeconnecter = async function () {
  await fileSync;
  await sb.auth.signOut();
  MOI = null;
  D = donneesVides();
  instantane = {};
  dessiner();
};

var dessinerAvantBase = dessiner;
dessiner = function () {
  dessinerAvantBase();
  var t = document.querySelector(".connexion small");
  if (t) t.textContent = "Connecte-toi avec l’identifiant et le mot de passe donnés par l’administrateur.";
};

window.addEventListener("load", async function () {
  var s = await sb.auth.getSession();
  if (s.data && s.data.session) {
    await ouvrirSession(s.data.session.user.id);
  } else {
    dessiner();
  }
});