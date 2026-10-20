// MuskySocials extras v1: search bars, language switch, profile view (top right).
// Loaded automatically by portal.js.
const q = (s) => document.querySelector(s);
const wait = (test, ms = 15000) =>
  new Promise((res) => {
    const t0 = Date.now();
    (function tick() {
      const v = test();
      if (v || Date.now() - t0 > ms) res(v);
      else setTimeout(tick, 150);
    })();
  });

const ready = await wait(() => window.shell && window.portal && q(".top-actions") && q("#studio"));
if (ready) start();

function start() {
  const { sb, esc, mkPane, onShow } = window.portal;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  // ---------------- Language (own dictionary: Google's free translate widget was retired on Oct 1, 2026)
  const D = {
    "Home": { pid: "Home", fr: "Accueil", es: "Inicio" },
    "Feed": { pid: "News", fr: "Actualités", es: "Novedades" },
    "Explore": { pid: "Explore", fr: "Explorer", es: "Explorar" },
    "Jobs": { pid: "Jobs", fr: "Emplois", es: "Empleos" },
    "Tools": { pid: "Tools", fr: "Outils", es: "Herramientas" },
    "Like": { pid: "Like", fr: "J'aime", es: "Me gusta" },
    "Comment": { pid: "Comment", fr: "Commenter", es: "Comentar" },
    "Share": { pid: "Share", fr: "Partager", es: "Compartir" },
    "What would you like to share?": { pid: "Wetin you wan share?", fr: "Que souhaitez-vous partager ?", es: "¿Qué quieres compartir?" },
    "Gifts": { pid: "Gifts", fr: "Cadeaux", es: "Regalos" },
    "Settings": { pid: "Settings", fr: "Paramètres", es: "Ajustes" },
    "Photo to video": { pid: "Photo to video", fr: "Photo en vidéo", es: "Foto a vídeo" },
    "AI chat": { pid: "AI chat", fr: "Chat IA", es: "Chat con IA" },
    "Voice clone": { pid: "Voice clone", fr: "Clonage de voix", es: "Clonación de voz" },
    "Voice studio": { pid: "Voice studio", fr: "Studio vocal", es: "Estudio de voz" },
    "Camera studio": { pid: "Camera studio", fr: "Studio caméra", es: "Estudio de cámara" },
    "Buy credit": { pid: "Buy credit", fr: "Acheter des crédits", es: "Comprar créditos" },
    "About us": { pid: "About us", fr: "À propos", es: "Quiénes somos" },
    "Contact us": { pid: "Talk to us", fr: "Nous contacter", es: "Contáctanos" },
    "Privacy": { pid: "Privacy", fr: "Confidentialité", es: "Privacidad" },
    "My documents": { pid: "My documents", fr: "Mes documents", es: "Mis documentos" },
    "Library": { pid: "Library", fr: "Bibliothèque", es: "Biblioteca" },
    "soon": { pid: "soon", fr: "bientôt", es: "pronto" },
    "for sale": { pid: "for sale", fr: "à vendre", es: "en venta" },
    "Gift shop": { pid: "Gift shop", fr: "Boutique cadeaux", es: "Tienda de regalos" },
    "Appearance": { pid: "Appearance", fr: "Apparence", es: "Apariencia" },
    "Text size": { pid: "Text size", fr: "Taille du texte", es: "Tamaño del texto" },
    "Light": { pid: "Light", fr: "Clair", es: "Claro" },
    "Dark": { pid: "Dark", fr: "Sombre", es: "Oscuro" },
    "Normal": { pid: "Normal", fr: "Normal", es: "Normal" },
    "Large": { pid: "Large", fr: "Grand", es: "Grande" },
    "Extra large": { pid: "Extra large", fr: "Très grand", es: "Muy grande" },
    "Sign out": { pid: "Comot", fr: "Se déconnecter", es: "Cerrar sesión" },
    "Floating bubbles": { pid: "Floating bubbles", fr: "Bulles flottantes", es: "Burbujas flotantes" },
    "On": { pid: "On", fr: "Activé", es: "Activado" },
    "Off": { pid: "Off", fr: "Désactivé", es: "Desactivado" },
    "Your credits": { pid: "Your credits", fr: "Vos crédits", es: "Tus créditos" },
    "Refills to 80 every day": { pid: "E go refill reach 80 every day", fr: "Rechargé à 80 chaque jour", es: "Se recarga a 80 cada día" },
    "Search": { pid: "Search am", fr: "Rechercher", es: "Buscar" },
    "Profile": { pid: "Your profile", fr: "Profil", es: "Perfil" },
    "Display name": { pid: "Display name", fr: "Nom affiché", es: "Nombre visible" },
    "Ask 4 Aza": { pid: "Ask 4 Aza", fr: "Ask 4 Aza", es: "Ask 4 Aza" },
    "Account": { pid: "Account", fr: "Compte", es: "Cuenta" },
    "Coming soon": { pid: "Coming soon", fr: "Bientôt disponible", es: "Próximamente" },
    "Support": { pid: "Support", fr: "Assistance", es: "Soporte" },
    "Soon": { pid: "Soon", fr: "Bientôt", es: "Pronto" },
    "Change photo": { pid: "Change photo", fr: "Changer la photo", es: "Cambiar foto" },
    "Ask for account on WhatsApp": { pid: "Ask for account for WhatsApp", fr: "Demander un compte sur WhatsApp", es: "Pedir cuenta por WhatsApp" },
    "Save name": { pid: "Save name", fr: "Enregistrer le nom", es: "Guardar nombre" },
    "Admin studio": { pid: "Admin studio", fr: "Studio admin", es: "Panel de administración" },
    "Posting": { pid: "Posting", fr: "Publications", es: "Publicaciones" },
    "Account listings": { pid: "Account listings", fr: "Annonces de comptes", es: "Anuncios de cuentas" },
    "Clients & files": { pid: "Clients & files", fr: "Clients et fichiers", es: "Clientes y archivos" },
    "Working photos": { pid: "Working photos", fr: "Photos de travail", es: "Fotos de trabajo" },
    "Open": { pid: "Open", fr: "Ouvrir", es: "Abrir" },
    "Download": { pid: "Download", fr: "Télécharger", es: "Descargar" },
    "Buy on WhatsApp": { pid: "Buy for WhatsApp", fr: "Acheter sur WhatsApp", es: "Comprar por WhatsApp" },
    "Sold out": { pid: "Sold out", fr: "Épuisé", es: "Agotado" },
    "Send": { pid: "Send", fr: "Envoyer", es: "Enviar" },
    "Chat on WhatsApp": { pid: "Chat for WhatsApp", fr: "Discuter sur WhatsApp", es: "Chatear por WhatsApp" },
  };
  const RULES = [
    [/^Hello, (.+) 👋$/, { pid: (m) => "How far, " + m[1] + " 👋", fr: (m) => "Bonjour, " + m[1] + " 👋", es: (m) => "Hola, " + m[1] + " 👋" }],
    [/^Credits: (.+)$/, { pid: (m) => "Credits: " + m[1], fr: (m) => "Crédits : " + m[1], es: (m) => "Créditos: " + m[1] }],
  ];
  let lang = store.get("musky-lang") || "en";
  const rec = new WeakMap();

  function tNode(node) {
    let r = rec.get(node);
    if (r && node.nodeValue !== r.out) r = null; // the app changed this text itself
    const en = r ? r.en : node.nodeValue;
    const key = en.trim();
    let out = en;
    if (lang !== "en" && key) {
      const t = D[key] && D[key][lang];
      if (t) out = en.replace(key, t);
      else for (const [re, f] of RULES) {
        const m = key.match(re);
        if (m) { if (f[lang]) out = en.replace(key, f[lang](m)); break; }
      }
    }
    if (out !== node.nodeValue) node.nodeValue = out;
    if (out !== en) rec.set(node, { en, out }); else if (r) rec.delete(node);
  }
  function tAll(root) {
    if (!root) return;
    if (root.nodeType === 3) return tNode(root);
    if (root.nodeType !== 1) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(tNode);
    root.querySelectorAll("[placeholder]").forEach((el) => {
      if (!el.dataset.enPh) el.dataset.enPh = el.getAttribute("placeholder");
      const en = el.dataset.enPh;
      const t = lang !== "en" && D[en] && D[en][lang];
      el.setAttribute("placeholder", t || en);
    });
  }
  let pending = false;
  new MutationObserver((muts) => {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      for (const m of muts) m.addedNodes.forEach((n) => tAll(n));
    }, 40);
  }).observe(document.body, { childList: true, subtree: true });
  function setLang(l) {
    lang = l;
    store.set("musky-lang", l);
    document.documentElement.lang = l === "pid" ? "en" : l;
    tAll(document.body);
  }

  // ---------------- Top bar: language + profile button
  const css = document.createElement("style");
  css.textContent = `
.top-actions > span:not(.online-dot):not(#authCredits):not(#xTools){display:none}
#xTools{display:flex;align-items:center;gap:8px;margin-left:8px}
#xLang{padding:5px 6px;border-radius:8px;border:1px solid var(--sh-line,#ccd0d5);background:var(--sh-card,#fff);color:var(--sh-text,#050505);font-size:13px}
#xAv{width:34px;height:34px;border-radius:50%;border:0;background:var(--sh-blue,#1877f2);color:#fff;font-weight:700;font-size:15px}
.xs{padding-bottom:10px}
.pf-av{width:96px;height:96px;border-radius:50%;margin:0 auto 10px;background:var(--sh-blue,#1877f2) center/cover;color:#fff;font-size:40px;font-weight:700;display:flex;align-items:center;justify-content:center}
.pf-tag{font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid var(--sh-line,#dadde1);color:var(--sh-sub,#65676b)}
.pf-group{margin:16px 0 4px;font-size:13px;font-weight:700;color:var(--sh-sub,#65676b);text-transform:uppercase;letter-spacing:.04em}
.pf-row{display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;padding:14px 4px;border:0;border-top:1px solid var(--sh-line,#dadde1);background:transparent;color:var(--sh-text,#050505);font-size:16px;text-align:left}
.pf-row.off{opacity:.55}
.pf-d{border-top:1px solid var(--sh-line,#dadde1);padding:4px}
.pf-d summary{padding:12px 0;font-size:16px;cursor:pointer}
#xAv{background-position:center;background-size:cover}
html.mx-light #studio .pf-av,html.mx-light .topbar #xAv{color:#fff!important}
html.mx-light #studio .pf-tag,html.mx-light #studio .pf-group{color:#65676b!important}
html.mx-light .topbar #xAv{color:#fff!important}
`;
  document.head.appendChild(css);
  q(".top-actions").insertAdjacentHTML("beforeend",
    "<span id='xTools'><select id='xLang' aria-label='Language'><option value='en'>EN</option><option value='pid'>PID</option>" +
    "<option value='fr'>FR</option><option value='es'>ES</option></select><button id='xAv' aria-label='Profile'>?</button></span>");
  const sel = q("#xLang");
  sel.value = lang;
  sel.addEventListener("change", () => setLang(sel.value));
  q("#xAv").addEventListener("click", () => window.shell.go("profileSection"));

  // ---------------- Profile screen (Facebook-style settings list)
  const prof = mkPane("profileSection",
    "<h2>Profile</h2>" +
    "<div class='pt-card' style='text-align:center'><div id='pfAv' class='pf-av'>?</div>" +
    "<button class='pt-btn' id='pfPhotoBtn'>Change photo</button><input id='pfPhoto' type='file' accept='image/*' hidden>" +
    "<div style='margin-top:10px'><strong id='pfName'></strong> <span id='pfRole' class='pf-tag'></span></div>" +
    "<p id='pfEmail' style='margin:2px 0'></p><p id='pfBio' style='margin:2px 0'></p><p id='pfMeta' style='margin:2px 0'></p>" +
    "<p class='pt-msg' id='pfMsg'></p></div>" +
    "<div class='pf-group'>Account</div>" +
    "<details class='pf-d'><summary>✏️ Edit profile</summary>" +
    "<input id='pfIn' class='pt-in' maxlength='40' placeholder='Display name'>" +
    "<textarea id='pfBioIn' class='pt-in' rows='2' maxlength='160' placeholder='About you (optional)'></textarea>" +
    "<input id='pfCountry' class='pt-in' maxlength='60' placeholder='Country (optional)'>" +
    "<input id='pfWa' class='pt-in' maxlength='20' inputmode='tel' placeholder='WhatsApp number, e.g. +234... (optional)'>" +
    "<button class='pt-btn' id='pfSave'>Save</button></details>" +
    "<details class='pf-d'><summary>🔒 Change password</summary>" +
    "<input id='pfP1' class='pt-in' type='password' autocomplete='new-password' placeholder='New password (8+ characters)'>" +
    "<input id='pfP2' class='pt-in' type='password' autocomplete='new-password' placeholder='Type it again'>" +
    "<button class='pt-btn' id='pfPass'>Change password</button></details>" +
    "<button class='pf-row' data-go='settingsSection'><span>🎨 Appearance and text size</span><span>›</span></button>" +
    "<div class='pf-group'>Coming soon</div>" +
    ["🔔 Notifications", "🛡️ Two-factor sign-in", "📱 Devices and active sessions", "👁️ Who can see my profile", "🔖 Saved items",
     "🧾 My orders and activity", "💳 Payment methods", "🎁 Invite friends, earn credits", "✅ Verified badge", "⬇️ Download my data"]
      .map((t) => "<div class='pf-row off'><span>" + t + "</span><span class='pf-tag'>Soon</span></div>").join("") +
    "<div class='pf-group'>Support</div>" +
    "<button class='pf-row' id='pfHelp'><span>💬 Help and support on WhatsApp</span><span>›</span></button>" +
    "<button class='pf-row' id='pfDel'><span>🗑️ Ask to delete my account</span><span>›</span></button>" +
    "<button class='pt-btn del' id='pfOut' style='width:100%;margin-top:14px'>Sign out</button>");
  const $p = (id) => prof.querySelector("#" + id);
  const WA = "2349041259863";
  let uid = null;
  let stamp = Date.now();
  const avUrl = (path) => sb.storage.from("avatars").getPublicUrl(path).data.publicUrl + "?t=" + stamp;
  function paintAv(el, name, path) {
    if (path) { el.style.backgroundImage = "url('" + avUrl(path) + "')"; el.textContent = ""; }
    else { el.style.backgroundImage = ""; el.textContent = (name || "?").charAt(0).toUpperCase(); }
  }
  const pmsg = (t) => { $p("pfMsg").textContent = t; };

  async function loadProfile() {
    const s = await window.musky.session();
    if (!s) { $p("pfName").textContent = "Not signed in"; return; }
    uid = s.user.id;
    const { data } = await sb.from("profiles").select("*").eq("id", uid).maybeSingle();
    const d = data || {};
    const name = d.display_name || s.user.email.split("@")[0];
    const credits = await window.musky.credits();
    $p("pfName").textContent = name;
    $p("pfRole").textContent = d.role === "admin" ? "Admin" : "Client";
    $p("pfEmail").textContent = s.user.email;
    $p("pfBio").textContent = d.bio || "";
    $p("pfMeta").textContent = "Credits: " + (credits === null ? "…" : credits) +
      (d.created_at ? " · Member since " + new Date(d.created_at).toLocaleDateString("en-NG", { month: "short", year: "numeric" }) : "");
    $p("pfIn").value = name;
    $p("pfBioIn").value = d.bio || "";
    $p("pfCountry").value = d.country || "";
    $p("pfWa").value = d.whatsapp || "";
    paintAv($p("pfAv"), name, d.avatar_path);
    paintAv(q("#xAv"), name, d.avatar_path);
    tAll(prof);
  }
  onShow(prof, loadProfile);

  async function squarePhoto(file) {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const side = Math.min(bmp.width, bmp.height);
    const c = document.createElement("canvas");
    c.width = c.height = 400;
    c.getContext("2d").drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, 400, 400);
    return new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
  }
  $p("pfPhotoBtn").addEventListener("click", () => $p("pfPhoto").click());
  $p("pfPhoto").addEventListener("change", async () => {
    const f = $p("pfPhoto").files[0];
    $p("pfPhoto").value = "";
    if (!f || !uid) return;
    pmsg("Uploading photo…");
    try {
      const blob = await squarePhoto(f);
      const path = uid + "/avatar.jpg";
      const up = await sb.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (up.error) throw up.error;
      const { error } = await sb.from("profiles").update({ avatar_path: path }).eq("id", uid);
      if (error) throw error;
      stamp = Date.now();
      pmsg("Photo updated.");
      loadProfile();
    } catch (err) {
      pmsg("Could not save the photo: " + (err.message || err) + " (run the Ask 4 Aza and Profile database step first)");
    }
  });
  $p("pfSave").addEventListener("click", async () => {
    const name = $p("pfIn").value.trim().slice(0, 40);
    if (!name || !uid) return pmsg("Type a display name.");
    const wa = $p("pfWa").value.trim().replace(/[^0-9+]/g, "").slice(0, 20);
    const { error } = await sb.from("profiles").update({
      display_name: name, bio: $p("pfBioIn").value.trim() || null,
      country: $p("pfCountry").value.trim() || null, whatsapp: wa || null,
    }).eq("id", uid);
    if (error) return pmsg("Could not save: " + error.message + " (run the Ask 4 Aza and Profile database step first)");
    try { await sb.auth.updateUser({ data: { display_name: name } }); } catch {}
    const w = q("#welcomeName");
    if (w) w.textContent = name;
    pmsg("Saved.");
    loadProfile();
  });
  $p("pfPass").addEventListener("click", async () => {
    const a = $p("pfP1").value, b = $p("pfP2").value;
    if (a.length < 8) return pmsg("Use at least 8 characters.");
    if (a !== b) return pmsg("The two passwords do not match.");
    const { error } = await sb.auth.updateUser({ password: a });
    if (error) return pmsg("Could not change it: " + error.message);
    $p("pfP1").value = $p("pfP2").value = "";
    pmsg("Password changed.");
  });
  const wa = (t) => window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(t), "_blank", "noopener");
  $p("pfHelp").addEventListener("click", () => wa("Hello MuskySocials, I need help with my account."));
  $p("pfDel").addEventListener("click", () => wa("Hello MuskySocials, please delete my account. My email: " + ($p("pfEmail").textContent || "")));
  $p("pfOut").addEventListener("click", async () => {
    try { await sb.auth.signOut(); } catch {}
    location.reload();
  });
  // Fill the top-right avatar as soon as someone is signed in.
  const initAv = async () => {
    try {
      const s = await window.musky.session();
      if (!s) return;
      const { data } = await sb.from("profiles").select("display_name,avatar_path").eq("id", s.user.id).maybeSingle();
      const n = (data && data.display_name) || s.user.email.split("@")[0];
      paintAv(q("#xAv"), n, data && data.avatar_path);
    } catch {}
  };
  sb.auth.onAuthStateChange(() => setTimeout(initAv, 0));
  initAv();

  // ---------------- Search bars
  const MAP = {
    homeSection: ".hm-post", exploreSection: ".ex-card, .ex-row", toolsHubSection: ".sh-tile",
    feedSection: ".pt-card", shopSection: ".gs-card", docsSection: ".pt-card",
    socialsSection: ".mx-card", adminSection: ".ah-row", askazaSection: ".az-card",
  };
  const terms = {};
  const attached = new Set();
  function filter(id) {
    const pane = q("#" + id);
    if (!pane) return;
    const t = (terms[id] || "").trim().toLowerCase();
    pane.querySelectorAll(MAP[id]).forEach((el) => {
      const d = !t || el.textContent.toLowerCase().includes(t) ? "" : "none";
      if (el.style.display !== d) el.style.display = d;
    });
  }
  function ensure(id) {
    const pane = q("#" + id);
    if (!pane) return;
    if (!pane.querySelector(":scope > .xs")) {
      const d = document.createElement("div");
      d.className = "xs";
      d.innerHTML = "<input class='pt-in' type='search' placeholder='Search' aria-label='Search'>";
      const inp = d.firstChild;
      inp.value = terms[id] || "";
      inp.addEventListener("input", () => { terms[id] = inp.value; filter(id); });
      pane.insertBefore(d, pane.firstChild);
    }
    filter(id);
  }
  function attach() {
    Object.keys(MAP).forEach((id) => {
      const pane = q("#" + id);
      if (!pane || attached.has(id)) return;
      attached.add(id);
      let t = 0;
      new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => ensure(id), 60); }).observe(pane, { childList: true, subtree: true });
      ensure(id);
    });
  }
  attach();
  let tries = 0;
  const iv = setInterval(() => { attach(); if (++tries > 60) clearInterval(iv); }, 1000);

  setLang(lang);
}
