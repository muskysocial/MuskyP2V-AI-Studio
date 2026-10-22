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
/* Own-profile visual refresh; preserve every existing account control and handler. */
#profileSection .pt>h2{font-size:27px;letter-spacing:-.04em;margin:4px 0 16px}
#profileSection .pf-hero{overflow:hidden;padding:0!important;border-radius:22px!important;border:1px solid rgba(24,119,242,.15)!important;box-shadow:0 12px 34px rgba(31,65,112,.08)}
#profileSection .pf-cover{height:100px;padding:17px 18px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(120deg,#1877f2 0%,#6aa8ff 50%,#f45b9a 100%);color:#fff}
#profileSection .pf-cover-mark{display:grid;place-items:center;width:42px;height:42px;border:1px solid rgba(255,255,255,.65);border-radius:14px;background:rgba(255,255,255,.18);font-weight:900;font-size:22px}
#profileSection .pf-cover-caption{max-width:160px;text-align:right;font-size:11px;font-weight:800;letter-spacing:.03em}
#profileSection .pf-hero-body{padding:0 18px 18px}
#profileSection .pf-identity{display:flex;align-items:center;gap:13px;margin-top:-30px;position:relative;text-align:left}
#profileSection .pf-av{flex:none;width:78px;height:78px;border:4px solid var(--sh-card,#fff);box-shadow:0 4px 15px rgba(15,40,80,.13);margin:0;border-radius:50%;background-color:#1877f2;background-position:center;background-size:cover;font-size:30px}
#profileSection .pf-identity-copy{min-width:0;padding-top:30px}
#profileSection #pfName{font-size:21px;letter-spacing:-.025em;overflow-wrap:anywhere}
#profileSection #pfRole{display:inline-block;margin:4px 0 0}
#profileSection .pf-profile-email{margin:12px 0 4px!important;color:var(--sh-sub,#65676b);font-size:12px;overflow-wrap:anywhere}
#profileSection .pf-profile-bio{margin:6px 0 8px!important;font-size:14px;line-height:1.5;overflow-wrap:anywhere}
#profileSection .pf-meta-pill{display:inline-flex;margin-top:5px;padding:7px 10px;border:1px solid var(--sh-line);border-radius:10px;background:rgba(24,119,242,.055);font-size:11px;font-weight:700;color:var(--sh-sub)}
#profileSection .pf-hero-actions{display:flex;gap:8px;margin-top:13px}
#profileSection .pf-hero-actions button{flex:1;min-height:40px;border-radius:12px}
#profileSection .pf-highlight-card{margin:14px 0;padding:15px;border:1px solid var(--sh-line);border-radius:18px;background:var(--sh-card)}
#profileSection .pf-highlight-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px}
#profileSection .pf-highlight-head strong{font-size:15px}
#profileSection .pf-highlight-head span{font-size:11px;color:var(--sh-sub)}
#profileSection .pf-highlight-row{display:flex;gap:16px;overflow-x:auto;padding:2px 0 5px}
#profileSection .pf-highlight{flex:none;width:66px;text-align:center;color:var(--sh-sub);font-size:11px}
#profileSection .pf-highlight-ring{width:58px;height:58px;margin:0 auto 6px;padding:3px;display:grid;place-items:center;border:2px solid #f45b9a;border-radius:50%;background:var(--sh-card)}
#profileSection .pf-highlight-ring span{width:100%;height:100%;display:grid;place-items:center;border-radius:50%;background:linear-gradient(145deg,rgba(24,119,242,.12),rgba(244,91,154,.12));font-size:21px;color:#1877f2}
#profileSection .pf-content-preview{margin:14px 0 16px;padding:15px;border:1px solid var(--sh-line);border-radius:18px;background:var(--sh-card)}
#profileSection .pf-content-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-bottom:1px solid var(--sh-line);margin:-3px 0 13px}
#profileSection .pf-content-tabs span{padding:9px 3px;text-align:center;font-size:11px;font-weight:750;color:var(--sh-sub)}
#profileSection .pf-content-tabs span:first-child{color:#1877f2;border-bottom:2px solid #1877f2}
#profileSection .pf-post-empty{min-height:88px;display:grid;place-items:center;text-align:center;color:var(--sh-sub);font-size:12px;line-height:1.5}
#profileSection .pf-post-empty strong{display:block;color:var(--sh-text);font-size:14px;margin-bottom:3px}
#profileSection .pf-group{margin-top:22px}
#profileSection .pf-d{border-radius:13px;margin:7px 0;padding:0 12px;background:var(--sh-card);border:1px solid var(--sh-line)}
#profileSection .pf-d summary{font-weight:700}
@media(max-width:420px){#profileSection .pf-cover{height:86px;padding:14px}#profileSection .pf-hero-body{padding:0 13px 14px}#profileSection .pf-av{width:68px;height:68px;font-size:26px}#profileSection #pfName{font-size:19px}#profileSection .pf-highlight-card,#profileSection .pf-content-preview{padding:12px}}
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
    "<h2>My profile</h2>" +
    "<div class='pt-card pf-hero'><div class='pf-cover'><span class='pf-cover-mark'>M</span><span class='pf-cover-caption'>YOUR SPACE · YOUR STORY</span></div>" +
    "<div class='pf-hero-body'><div class='pf-identity'><div id='pfAv' class='pf-av'>?</div><div class='pf-identity-copy'><strong id='pfName'>Your profile</strong><br><span id='pfRole' class='pf-tag'></span></div></div>" +
    "<p id='pfBio' class='pf-profile-bio'>Add a little about yourself.</p><p id='pfEmail' class='pf-profile-email'></p>" +
    "<div id='pfMeta' class='pf-meta-pill'>Loading your account…</div>" +
    "<div class='pf-hero-actions'><button class='pt-btn' id='pfPhotoBtn'>📷 Change photo</button><button class='pt-btn' type='button' id='pfEditOpen'>✏️ Edit profile</button></div>" +
    "<input id='pfPhoto' type='file' accept='image/*' hidden><p class='pt-msg' id='pfMsg'></p></div></div>" +
    "<section class='pf-highlight-card'><div class='pf-highlight-head'><strong>Highlights</strong><span>Personal moments</span></div>" +
    "<div class='pf-highlight-row'><div class='pf-highlight'><div class='pf-highlight-ring'><span>＋</span></div>Add highlight</div>" +
    "<div class='pf-highlight'><div class='pf-highlight-ring'><span>◷</span></div>Stories</div><div class='pf-highlight'><div class='pf-highlight-ring'><span>♡</span></div>Favorites</div></div>" +
    "<p style='margin:8px 0 0;color:var(--sh-sub);font-size:11px'>Highlights are a visual preview for now; story saving is not enabled yet.</p></section>" +
    "<section class='pf-content-preview'><div class='pf-content-tabs'><span>▦ Posts</span><span>▶ Reels</span><span>▣ Tagged</span></div>" +
    "<div class='pf-post-empty'><div><strong>Your posts will live here</strong>Member post publishing and personal photo grids are not connected yet.</div></div></section>" +
    "<div class='pf-group'>Account</div>" +
    "<details class='pf-d' id='pfEditDetails'><summary>✏️ Edit profile details</summary>" +
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
    "<div class='pf-group'>Account features</div>" +
    "<button class='pf-row' data-go='notifSection'><span>🔔 Notifications</span><span>›</span></button>" +
    ["🛡️ Two-factor sign-in", "📱 Devices and active sessions", "👁️ Who can see my profile", "🔖 Saved items",
     "🧾 My orders and activity", "💳 Payment methods", "🎁 Invite friends, earn credits", "✅ Verified badge", "⬇️ Download my data"]
      .map((t) => t === "🛡️ Two-factor sign-in"
        ? "<button class='pf-row' id='pfMfa'><span>" + t + "</span><span class='pf-tag'>Set up</span></button>"
        : t === "📱 Devices and active sessions"
          ? "<button class='pf-row' id='pfDevices'><span>" + t + "</span><span>›</span></button>"
          : t === "👁️ Who can see my profile"
            ? "<button class='pf-row' id='pfPrivacy'><span>" + t + "</span><span>›</span></button>"
            : t === "🔖 Saved items"
              ? "<button class='pf-row' id='pfSaved'><span>" + t + "</span><span>›</span></button>"
              : t === "🧾 My orders and activity"
                ? "<button class='pf-row' id='pfOrders'><span>" + t + "</span><span>›</span></button>"
                : t === "💳 Payment methods"
                  ? "<button class='pf-row' id='pfPayment'><span>" + t + "</span><span>›</span></button>"
                  : t === "🎁 Invite friends, earn credits"
                    ? "<button class='pf-row' id='pfInvite'><span>" + t + "</span><span>›</span></button>"
                    : t === "✅ Verified badge"
                      ? "<button class='pf-row' id='pfVerified'><span>" + t + "</span><span>›</span></button>"
                      : t === "⬇️ Download my data"
                        ? "<button class='pf-row' id='pfExport'><span>" + t + "</span><span>›</span></button>"
                        : "<div class='pf-row off'><span>" + t + "</span><span class='pf-tag'>Soon</span></div>").join("") +
    "<button class='pf-row' id='pfBadgeAdmin' hidden><span>🛡️ Review verified badge requests</span><span>›</span></button>" +
    "<button class='pf-row' id='pfHelp'><span>💬 Help and support on WhatsApp</span><span>›</span></button>" +
    "<button class='pf-row' id='pfDel'><span>🗑️ Ask to delete my account</span><span>›</span></button>" +
    "<button class='pt-btn del' id='pfOut' style='width:100%;margin-top:14px'>Sign out</button>");
  const $p = (id) => prof.querySelector("#" + id);
  $p("pfEditOpen").addEventListener("click", () => {
    const details = $p("pfEditDetails");
    details.open = !details.open;
    if (details.open) details.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
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
    $p("pfRole").textContent = (d.role === "admin" ? "Admin" : "Client") + (d.is_verified ? " · Verified ✓" : "");
    $p("pfBadgeAdmin").hidden = d.role !== "admin";
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

  // Device/session management: Supabase client APIs can revoke all sessions, but cannot
  // enumerate and revoke individual sessions without a trusted server-side admin endpoint.
  function settingsModal(id, title, body) {
    const old = document.querySelector("#" + id);
    if (old) old.remove();
    const modal = document.createElement("div");
    modal.id = id;
    modal.style.cssText = "position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px";
    modal.innerHTML = "<section role='dialog' aria-modal='true' style='box-sizing:border-box;width:min(100%,460px);max-height:90vh;overflow:auto;background:var(--sh-card,#fff);color:var(--sh-text,#111);border-radius:16px;padding:20px'>" +
      "<button type='button' data-close style='float:right;border:0;background:none;color:inherit;font-size:24px'>×</button><h2>" + title + "</h2><div data-body></div></section>";
    modal.querySelector("[data-body]").append(body);
    modal.querySelector("[data-close]").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    return modal;
  }
  $p("pfDevices").addEventListener("click", async () => {
    const body = document.createElement("div");
    body.innerHTML = "<p>Review the account session active on this device. For security, sign out all devices if you suspect someone else has access.</p><div class='pt-card'><strong>Current session</strong><p>Signed in on this browser/device</p><p id='pfDeviceEmail'></p><p id='pfDeviceTime'></p></div><p id='pfDeviceMsg' role='status'></p>";
    const all = document.createElement("button");
    all.type = "button"; all.className = "pt-btn del"; all.style.width = "100%"; all.textContent = "Sign out all devices";
    body.appendChild(all);
    const modal = settingsModal("pfDevicesModal", "Devices and active sessions", body);
    const sess = await sb.auth.getSession();
    const session = sess.data && sess.data.session;
    body.querySelector("#pfDeviceEmail").textContent = session && session.user ? session.user.email : "No active session found";
    body.querySelector("#pfDeviceTime").textContent = session && session.created_at
      ? "Session started: " + new Date(session.created_at * 1000).toLocaleString()
      : "Session details are provided by Supabase.";
    all.addEventListener("click", async () => {
      if (!confirm("Sign out this account on all devices? You will need to sign in again.")) return;
      all.disabled = true;
      body.querySelector("#pfDeviceMsg").textContent = "Signing out all devices…";
      const { error } = await sb.auth.signOut({ scope: "global" });
      if (error) {
        body.querySelector("#pfDeviceMsg").textContent = "Could not sign out all devices: " + error.message;
        all.disabled = false;
        return;
      }
      modal.remove();
      location.reload();
    });
  });

  // Profile visibility preferences are stored on the signed-in user's profile row.
  $p("pfPrivacy").addEventListener("click", async () => {
    const body = document.createElement("div");
    body.innerHTML = "<p>Choose your preferred profile visibility.</p><label for='pfVisibility'>Who can see your profile?</label><select id='pfVisibility' class='pt-in'><option value='public'>Everyone</option><option value='members'>Signed-in members</option><option value='private'>Only me</option></select><p id='pfPrivacyMsg' class='pt-msg' role='status'></p><p style='font-size:12px;opacity:.8'>This saves your preference to your account. The existing site does not yet have a complete public-profile access layer, so this setting cannot hide profile details from every existing surface until that layer is connected.</p>";
    const save = document.createElement("button");
    save.type = "button"; save.className = "pt-btn"; save.style.width = "100%"; save.textContent = "Save privacy setting";
    body.appendChild(save);
    settingsModal("pfPrivacyModal", "Who can see my profile", body);
    const sel = body.querySelector("#pfVisibility");
    const msg = body.querySelector("#pfPrivacyMsg");
    if (!uid) {
      msg.textContent = "Sign in to manage profile visibility.";
      sel.disabled = true; save.disabled = true; return;
    }
    const { data, error } = await sb.from("profiles").select("profile_visibility").eq("id", uid).maybeSingle();
    if (error) {
      msg.textContent = "Could not load your privacy setting: " + error.message;
      save.disabled = true; return;
    }
    sel.value = (data && data.profile_visibility) || "public";
    save.addEventListener("click", async () => {
      save.disabled = true; msg.textContent = "Saving…";
      const { error: saveError } = await sb.from("profiles").update({ profile_visibility: sel.value }).eq("id", uid);
      if (saveError) {
        msg.textContent = "Could not save: " + saveError.message + ". Make sure the profile privacy database migration has been applied.";
        save.disabled = false; return;
      }
      msg.textContent = "Privacy preference saved.";
      save.disabled = false;
    });
  });


  // Payment methods: connect the existing checkout and account-specific payment history.
  $p("pfPayment").addEventListener("click", async () => {
    const body = document.createElement("div");
    body.innerHTML = "<p>Payments are currently limited to Paystack test mode. Test payments do not move real money. No card details are stored by MuskySocials in this screen.</p><p id='pfPayMsg' role='status'>Loading your payment history…</p><div id='pfPayHistory'></div>";
    const manage = document.createElement("button");
    manage.type = "button"; manage.className = "pt-btn"; manage.style.width = "100%"; manage.textContent = "Open plans and payment checkout";
    body.appendChild(manage);
    settingsModal("pfPaymentModal", "Payment methods", body);
    manage.addEventListener("click", () => {
      document.querySelector("#pfPaymentModal")?.remove();
      window.shell.go("membershipSection");
    });
    if (!uid) {
      body.querySelector("#pfPayMsg").textContent = "Sign in to view your payment history.";
      manage.disabled = true; return;
    }
    try {
      const [payments, orders] = await Promise.all([
        sb.from("payment_transactions").select("reference,plan_code,amount_kobo,currency,status,created_at,paid_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(20),
        sb.from("customer_orders").select("order_ref,item_name,amount,currency,payment_method,payment_status,status,created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(20),
      ]);
      if (payments.error && orders.error) throw payments.error;
      const rows = [];
      (payments.data || []).forEach((p) => rows.push({
        when: p.created_at, title: p.plan_code || "Membership/coins",
        amount: ((Number(p.amount_kobo) || 0) / 100).toLocaleString("en-NG", { style: "currency", currency: p.currency || "NGN" }),
        status: p.status || "pending",
      }));
      (orders.data || []).forEach((p) => rows.push({
        when: p.created_at, title: p.item_name || p.order_ref || "Order",
        amount: Number(p.amount).toLocaleString("en-NG", { style: "currency", currency: p.currency || "NGN" }),
        status: p.payment_status || p.status || "pending",
      }));
      rows.sort((a,b) => new Date(b.when) - new Date(a.when));
      body.querySelector("#pfPayMsg").textContent = rows.length ? "Your recent payment records:" : "No payment records found for this account yet.";
      body.querySelector("#pfPayHistory").innerHTML = rows.slice(0,20).map((r) =>
        "<div class='pt-card'><strong>" + esc(r.title) + "</strong><p>" + esc(r.amount) + " · " + esc(r.status) + "</p><small>" + esc(r.when ? new Date(r.when).toLocaleString() : "") + "</small></div>"
      ).join("");
      if (payments.error || orders.error) body.querySelector("#pfPayMsg").textContent += " Some history could not be loaded.";
    } catch (err) {
      body.querySelector("#pfPayMsg").textContent = "Could not load payment history: " + (err.message || err);
    }
  });

  // Export only records belonging to the currently authenticated account.
  $p("pfExport").addEventListener("click", async () => {
    if (!uid) return pmsg("Sign in first to download your data.");
    const button = $p("pfExport");
    button.disabled = true;
    pmsg("Preparing your data export…");
    const exportData = {
      exported_at: new Date().toISOString(),
      account: { id: uid, email: $p("pfEmail").textContent || null },
      data: {},
      export_warnings: [],
    };
    const ownQueries = [
      ["profile", () => sb.from("profiles").select("id,display_name,email,bio,country,whatsapp,avatar_path,created_at,role,credits,daily_credits,paid_coins,referral_code,referred_by,is_verified").eq("id", uid).maybeSingle()],
      ["payment_transactions", () => sb.from("payment_transactions").select("*").eq("user_id", uid).order("created_at", { ascending: false })],
      ["subscriptions", () => sb.from("user_subscriptions").select("*").eq("user_id", uid).order("started_at", { ascending: false })],
      ["coin_ledger", () => sb.from("coin_ledger").select("*").eq("user_id", uid).order("created_at", { ascending: false })],
      ["saved_items", () => sb.from("saved_items").select("*").eq("user_id", uid).order("created_at", { ascending: false })],
      ["customer_orders", () => sb.from("customer_orders").select("*").eq("user_id", uid).order("created_at", { ascending: false })],
      ["user_activity", () => sb.from("user_activity").select("*").eq("user_id", uid).order("created_at", { ascending: false })],
      ["notifications", () => sb.from("notifications").select("*").eq("user_id", uid).order("created_at", { ascending: false })],
      ["referrals", () => sb.from("referrals").select("*").eq("referrer_id", uid).order("created_at", { ascending: false })],
      ["verified_badge_requests", () => sb.from("verified_badge_requests").select("*").eq("user_id", uid).order("created_at", { ascending: false })],
      ["comments", () => sb.from("post_comments").select("*").eq("user_id", uid).order("created_at", { ascending: false })],
      ["likes", () => sb.from("post_likes").select("*").eq("user_id", uid).order("created_at", { ascending: false })],
    ];
    try {
      for (const [name, query] of ownQueries) {
        const result = await query();
        if (result.error) {
          exportData.export_warnings.push(name + ": " + result.error.message);
          continue;
        }
        exportData.data[name] = result.data;
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "muskysocials-my-data-" + new Date().toISOString().slice(0,10) + ".json";
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      pmsg(exportData.export_warnings.length
        ? "Your export downloaded, but some tables were unavailable. See export_warnings inside the file."
        : "Your data export has downloaded.");
    } catch (err) {
      pmsg("Could not create your export: " + (err.message || err));
    } finally {
      button.disabled = false;
    }
  });

  // Verified badge: charge through a server-side RPC, then submit a review request.
  $p("pfVerified").addEventListener("click", async () => {
    const badgeCost = Number(window.muskyPaidPricing && window.muskyPaidPricing.verifiedBadge && window.muskyPaidPricing.verifiedBadge.cost) || 7000;
    const badgeCostText = badgeCost.toLocaleString("en-NG");
    const body = document.createElement("div");
    body.innerHTML = "<p>A verified badge request costs <strong>" + badgeCostText + " coins</strong>. The badge appears after an admin approves your request. If a request is rejected, the coins are refunded automatically.</p><p id='pfBadgeMsg' class='pt-msg' role='status'>Checking your badge status…</p><div id='pfBadgeHistory'></div><button id='pfBadgeRequest' type='button' class='pt-btn' style='width:100%'></button>";
    settingsModal("pfVerifiedModal", "Verified badge", body);
    const msg = body.querySelector("#pfBadgeMsg");
    const btn = body.querySelector("#pfBadgeRequest");
    btn.textContent = "Pay " + badgeCostText + " coins and submit request";
    if (!uid) { msg.textContent = "Sign in to request a verified badge."; btn.disabled = true; return; }
    btn.disabled = true;
    try {
      const [profileResult, requestResult] = await Promise.all([
        sb.from("profiles").select("is_verified").eq("id", uid).maybeSingle(),
        sb.from("verified_badge_requests").select("status,coins_paid,created_at,reviewed_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(5),
      ]);
      if (profileResult.error) throw profileResult.error;
      if (requestResult.error) throw requestResult.error;
      if (profileResult.data && profileResult.data.is_verified) {
        msg.textContent = "Your account is already verified.";
        btn.hidden = true;
      } else {
        const pending = (requestResult.data || []).some((r) => r.status === "pending");
        msg.textContent = pending ? "Your request is waiting for admin review. You have not been charged again." : "No pending request. Submit one when you're ready.";
        btn.disabled = pending;
      }
      body.querySelector("#pfBadgeHistory").innerHTML = (requestResult.data || []).map((r) =>
        "<div class='pt-card'><strong>" + esc(r.status) + "</strong><p>" + Number(r.coins_paid || 7000).toLocaleString() + " coins · " +
        esc(r.created_at ? new Date(r.created_at).toLocaleDateString() : "") + "</p></div>"
      ).join("");
    } catch (err) {
      msg.textContent = "Could not load badge status: " + (err.message || err);
      btn.disabled = true;
      return;
    }
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      msg.textContent = "Checking your balance and submitting the request…";
      try {
        const { data, error } = await sb.rpc("request_verified_badge");
        if (error) throw error;
        if (data && data.status === "approved") {
          msg.textContent = "Your account is already verified.";
          btn.hidden = true;
          return;
        }
        if (data && data.status === "pending" && data.already_pending) {
          msg.textContent = "You already have a pending request. No additional coins were charged.";
          return;
        }
        const balance = await window.musky.credits();
        if (balance !== null) window.musky.setBadge(balance);
        msg.textContent = "Request submitted. " + badgeCostText + " coins were deducted. Your request is pending admin review.";
        body.querySelector("#pfBadgeHistory").insertAdjacentHTML("afterbegin", "<div class='pt-card'><strong>pending</strong><p>7,000 coins · just now</p></div>");
      } catch (err) {
        const message = String(err && err.message || err);
        msg.textContent = /not enough credits|insufficient|credit/i.test(message)
          ? "You need at least 7,000 coins to submit this request. No coins were deducted."
          : "Could not submit the request: " + message;
        btn.disabled = false;
      }
    });
  });

  // Admin-only review queue. Database RLS remains the authorization boundary.
  $p("pfBadgeAdmin").addEventListener("click", async () => {
    const body = document.createElement("div");
    body.innerHTML = "<p>Approve a badge only after checking the member's details. Rejecting a request automatically refunds 7,000 coins.</p><p id='pfBadgeAdminMsg' class='pt-msg' role='status'>Loading requests…</p><div id='pfBadgeAdminRows'></div>";
    settingsModal("pfBadgeAdminModal", "Review verified badge requests", body);
    const msg = body.querySelector("#pfBadgeAdminMsg");
    const rowsEl = body.querySelector("#pfBadgeAdminRows");
    async function loadPending() {
      msg.textContent = "Loading pending requests…";
      rowsEl.replaceChildren();
      const { data: requests, error } = await sb.from("verified_badge_requests")
        .select("id,user_id,coins_paid,status,created_at").eq("status", "pending")
        .order("created_at", { ascending: true }).limit(100);
      if (error) { msg.textContent = "Could not load requests: " + error.message; return; }
      if (!requests || !requests.length) { msg.textContent = "There are no pending badge requests."; return; }
      const ids = [...new Set(requests.map((r) => r.user_id))];
      const { data: profiles, error: profilesError } = await sb.from("profiles")
        .select("id,display_name,email").in("id", ids);
      const profileById = new Map((profiles || []).map((p) => [p.id, p]));
      msg.textContent = requests.length + " pending request(s).";
      if (profilesError) msg.textContent += " Some member names could not be loaded.";
      requests.forEach((request) => {
        const profile = profileById.get(request.user_id) || {};
        const card = document.createElement("div");
        card.className = "pt-card";
        const title = document.createElement("strong");
        title.textContent = profile.display_name || profile.email || request.user_id;
        const detail = document.createElement("p");
        detail.textContent = "7,000 coins · " + new Date(request.created_at).toLocaleString();
        const actions = document.createElement("div");
        actions.style.cssText = "display:flex;gap:8px;margin-top:8px";
        const approve = document.createElement("button");
        approve.type = "button"; approve.className = "pt-btn"; approve.textContent = "Approve";
        const reject = document.createElement("button");
        reject.type = "button"; reject.className = "pt-btn"; reject.textContent = "Reject";
        reject.style.background = "#a61b1b";
        async function review(status, button) {
          if (!window.confirm((status === "approved" ? "Approve" : "Reject and refund") + " this verified badge request?")) return;
          approve.disabled = reject.disabled = true;
          msg.textContent = "Saving review…";
          const { error: reviewError } = await sb.from("verified_badge_requests")
            .update({ status }).eq("id", request.id).eq("status", "pending");
          if (reviewError) {
            msg.textContent = "Could not save the review: " + reviewError.message;
            approve.disabled = reject.disabled = false;
            return;
          }
          await loadPending();
        }
        approve.addEventListener("click", () => review("approved", approve));
        reject.addEventListener("click", () => review("rejected", reject));
        actions.append(approve, reject);
        card.append(title, detail, actions);
        rowsEl.appendChild(card);
      });
    }
    await loadPending();
  });

  // Referral links and reward history. Rewards are issued by database triggers only
  // after the referred account confirms its email; browser code never credits coins.
  $p("pfInvite").addEventListener("click", async () => {
    const body = document.createElement("div");
    body.innerHTML = "<p>Earn <strong>300 coins</strong> for each eligible friend who joins with your link and confirms their email. After 10 successful referrals, your reward doubles to <strong>600 coins</strong> for each additional eligible friend.</p><label for='pfInviteLink'>Your invite link</label><input id='pfInviteLink' class='pt-in' readonly><p id='pfInviteMsg' class='pt-msg' role='status'>Loading your invite link…</p><p id='pfInviteStats'></p><button id='pfInviteCopy' type='button' class='pt-btn' style='width:100%'>Copy invite link</button><button id='pfInviteShare' type='button' class='pt-btn' style='width:100%;margin-top:8px'>Share invite link</button><div id='pfInviteHistory'></div>";
    settingsModal("pfInviteModal", "Invite friends, earn credits", body);
    const msg = body.querySelector("#pfInviteMsg");
    const linkInput = body.querySelector("#pfInviteLink");
    const copy = body.querySelector("#pfInviteCopy");
    const share = body.querySelector("#pfInviteShare");
    if (!uid) { msg.textContent = "Sign in to get your invite link."; copy.disabled = true; share.disabled = true; return; }
    let inviteUrl = "";
    try {
      const { data: profile, error: profileError } = await sb.from("profiles").select("referral_code").eq("id", uid).maybeSingle();
      if (profileError) throw profileError;
      if (!profile || !profile.referral_code) throw new Error("Your invite code is not ready yet. Refresh and try again.");
      const url = new URL(window.location.href);
      url.searchParams.set("ref", profile.referral_code);
      inviteUrl = url.toString();
      linkInput.value = inviteUrl;
      const { data: refs, error: refsError } = await sb.from("referrals").select("referred_user_id,status,reward_coins,created_at,qualified_at").eq("referrer_id", uid).order("created_at", { ascending: false }).limit(100);
      if (refsError) throw refsError;
      const qualified = (refs || []).filter((r) => r.status === "qualified");
      const earned = qualified.reduce((sum, r) => sum + (Number(r.reward_coins) || 0), 0);
      body.querySelector("#pfInviteStats").textContent = "Successful referrals: " + qualified.length + " · Total earned: " + earned.toLocaleString() + " coins · Next reward rate: " + (qualified.length >= 10 ? "600" : "300") + " coins";
      body.querySelector("#pfInviteHistory").innerHTML = (refs || []).map((r) =>
        "<div class='pt-card'><strong>" + (r.status === "qualified" ? "Successful referral" : r.status === "pending" ? "Awaiting email confirmation" : "Not eligible") +
        "</strong><p>" + (r.status === "qualified" ? "+" + Number(r.reward_coins || 0).toLocaleString() + " coins" : "No reward issued yet") +
        " · " + esc(r.created_at ? new Date(r.created_at).toLocaleDateString() : "") + "</p></div>"
      ).join("");
      msg.textContent = "Share this link with friends. Rewards are credited after they confirm their email.";
    } catch (err) {
      msg.textContent = "Could not load your referral details: " + (err.message || err);
      copy.disabled = true; share.disabled = true;
      return;
    }
    async function copyInvite() {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(inviteUrl);
        else {
          linkInput.focus(); linkInput.select();
          if (!document.execCommand("copy")) throw new Error("Copy is not supported here. Select and copy the link manually.");
        }
        msg.textContent = "Invite link copied. Send it to your friends.";
      } catch (err) {
        msg.textContent = "Could not copy automatically. Tap and hold the invite link to copy it.";
        linkInput.focus(); linkInput.select();
      }
    }
    copy.addEventListener("click", copyInvite);
    share.addEventListener("click", async () => {
      if (navigator.share) {
        try { await navigator.share({ title: "Join MuskySocials", text: "Join me on MuskySocials using my invite link:", url: inviteUrl }); }
        catch (err) { if (!err || err.name !== "AbortError") await copyInvite(); }
      } else await copyInvite();
    });
  });

  $p("pfMfa").addEventListener("click", () => {
    if (typeof window.musky.manageMFA === "function") window.musky.manageMFA();
    else pmsg("Two-factor settings are still loading. Refresh and try again.");
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
    homeSection: ".hm-post", exploreSection: ".ex-card, .ex-row", toolsHubSection: ".sh-tile", jobsSection: ".jb-card", datingSection: ".dt-card", designSection: ".ds-card",
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
