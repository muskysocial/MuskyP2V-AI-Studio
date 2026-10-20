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
    "Account": { pid: "Account", fr: "Compte", es: "Cuenta" },
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
.top-actions > span:not(.online-dot):not(#authCredits){display:none}
#xTools{display:flex;align-items:center;gap:8px;margin-left:8px}
#xLang{padding:5px 6px;border-radius:8px;border:1px solid var(--sh-line,#ccd0d5);background:var(--sh-card,#fff);color:var(--sh-text,#050505);font-size:13px}
#xAv{width:34px;height:34px;border-radius:50%;border:0;background:var(--sh-blue,#1877f2);color:#fff;font-weight:700;font-size:15px}
.xs{padding-bottom:10px}
html.mx-light .topbar #xAv{color:#fff!important}
html.mx-light #studio #xpAv{color:#fff!important}
`;
  document.head.appendChild(css);
  q(".top-actions").insertAdjacentHTML("beforeend",
    "<span id='xTools'><select id='xLang' aria-label='Language'><option value='en'>English</option><option value='pid'>Pidgin</option>" +
    "<option value='fr'>Français</option><option value='es'>Español</option></select><button id='xAv' aria-label='Profile'>?</button></span>");
  const sel = q("#xLang");
  sel.value = lang;
  sel.addEventListener("change", () => setLang(sel.value));
  q("#xAv").addEventListener("click", () => window.shell.go("profileSection"));

  // ---------------- Profile screen
  const prof = mkPane("profileSection",
    "<h2>Profile</h2>" +
    "<div class='pt-card' style='text-align:center'><div id='xpAv' style='width:72px;height:72px;border-radius:50%;margin:0 auto 8px;background:var(--sh-blue,#1877f2);color:#fff;font-size:30px;font-weight:700;display:flex;align-items:center;justify-content:center'>?</div>" +
    "<strong id='xpName'></strong><p id='xpEmail'></p><p id='xpMeta'></p></div>" +
    "<div class='pt-card'><strong>Display name</strong><input id='xpIn' class='pt-in' maxlength='40'>" +
    "<button class='pt-btn' id='xpSave'>Save name</button><p class='pt-msg' id='xpMsg'></p></div>" +
    "<button class='pt-btn del' id='xpOut' style='width:100%'>Sign out</button>");
  const $p = (id) => prof.querySelector("#" + id);
  let uid = null;

  async function loadProfile() {
    const s = await window.musky.session();
    if (!s) { $p("xpName").textContent = "Not signed in"; return; }
    uid = s.user.id;
    const { data } = await sb.from("profiles").select("display_name,role").eq("id", uid).maybeSingle();
    const name = (data && data.display_name) || s.user.email.split("@")[0];
    const credits = await window.musky.credits();
    $p("xpName").textContent = name;
    $p("xpEmail").textContent = s.user.email;
    $p("xpMeta").textContent = (data && data.role === "admin" ? "Admin" : "Client") + " · Credits: " + (credits === null ? "…" : credits);
    $p("xpIn").value = name;
    $p("xpAv").textContent = name.charAt(0).toUpperCase();
    q("#xAv").textContent = name.charAt(0).toUpperCase();
    tAll(prof);
  }
  onShow(prof, loadProfile);
  $p("xpSave").addEventListener("click", async () => {
    const name = $p("xpIn").value.trim().slice(0, 40);
    if (!name || !uid) return;
    const { error } = await sb.from("profiles").update({ display_name: name }).eq("id", uid);
    if (error) { $p("xpMsg").textContent = "Could not save: " + error.message; return; }
    try { await sb.auth.updateUser({ data: { display_name: name } }); } catch {}
    const w = q("#welcomeName");
    if (w) w.textContent = name;
    $p("xpMsg").textContent = "Saved.";
    loadProfile();
  });
  $p("xpOut").addEventListener("click", async () => {
    try { await sb.auth.signOut(); } catch {}
    location.reload();
  });
  // Fill the avatar letter as soon as someone is signed in.
  const initAv = async () => {
    try {
      const s = await window.musky.session();
      if (!s) return;
      const { data } = await sb.from("profiles").select("display_name").eq("id", s.user.id).maybeSingle();
      const n = (data && data.display_name) || s.user.email.split("@")[0];
      q("#xAv").textContent = n.charAt(0).toUpperCase();
    } catch {}
  };
  sb.auth.onAuthStateChange(() => setTimeout(initAv, 0));
  initAv();

  // ---------------- Search bars
  const MAP = {
    homeSection: ".sh-tile", feedSection: ".pt-card", shopSection: ".gs-card", docsSection: ".pt-card",
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
