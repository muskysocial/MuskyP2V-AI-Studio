// MuskySocials app shell v1: light Facebook-style look, bigger text,
// bottom bar, Menu grid, Settings. Loaded from index.html after auth.js.
const KEY = "musky-settings";
const DEFAULTS = { theme: "light", size: 1.25 };
const S = (() => {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return { ...DEFAULTS }; }
})();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
function apply() {
  document.documentElement.classList.toggle("mx-light", S.theme === "light");
  document.body.style.zoom = S.size; // scales all text and layout, including older parts of the site
}

const CSS = `
:root{--sh-card:#0b1530;--sh-text:#e6ecff;--sh-sub:#9fb4f0;--sh-line:#1b2a52;--sh-blue:#6ea0ff}
html.mx-light{--sh-card:#fff;--sh-text:#050505;--sh-sub:#65676b;--sh-line:#dadde1;--sh-blue:#1877f2}
body{padding-bottom:84px}
#studio nav.tabs,#studio .notice,#studio .hello-row,#studio .chat-prompt,#authOut{display:none!important}
#mxBar{position:fixed;left:0;right:0;bottom:0;z-index:70;display:none;background:var(--sh-card);border-top:1px solid var(--sh-line);padding-bottom:env(safe-area-inset-bottom,0px)}
#mxBar button{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 0 6px;border:0;background:none;color:var(--sh-sub);font-size:12px}
#mxBar button span{font-size:22px;line-height:1.1}
#mxBar button.on{color:var(--sh-blue);font-weight:700}
.sh{color:var(--sh-text);font-size:16px}
.sh h2{margin:0 0 10px;font-size:22px}
.sh p,.sh small{color:var(--sh-sub)}
.sh-bal{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px;border:1px solid var(--sh-line);border-radius:14px;background:var(--sh-card);margin-bottom:14px}
.sh-bal strong{display:block;font-size:26px;color:var(--sh-text)}
.sh-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sh-tile{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:14px;border:1px solid var(--sh-line);border-radius:14px;background:var(--sh-card);color:var(--sh-text);font-size:16px;font-weight:600;text-align:left}
.sh-tile .ico{font-size:26px}
.sh-tile small{font-weight:400;font-size:12px}
.sh-row{display:flex;gap:8px;margin:8px 0 16px}
.sh-row button,.sh-out{flex:1;padding:12px 6px;border-radius:10px;border:1px solid var(--sh-line);background:var(--sh-card);color:var(--sh-text);font-size:15px}
.sh-row button.on{background:var(--sh-blue);border-color:var(--sh-blue);color:#fff;font-weight:700}
.sh-out{width:100%;margin-top:6px;color:#d93025;font-weight:600}
.sh h3{margin:14px 0 4px;font-size:16px}
/* Light, Facebook-like look for the older parts of the site */
html.mx-light body{background:#f0f2f5!important;color:#050505!important;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif!important}
html.mx-light .topbar{background:#fff!important;border-bottom:1px solid #dadde1!important}
html.mx-light .topbar *{color:#050505!important}
html.mx-light .topbar .brand-mark{color:#fff!important}
html.mx-light #authCredits{color:#1877f2!important;border-color:#1877f2!important;background:#e7f3ff!important}
html.mx-light .orb{display:none!important}
html.mx-light .welcome-screen{background:#f0f2f5!important}
html.mx-light #loginPanel,html.mx-light #loginPanel *:not(button):not(input){color:#050505}
html.mx-light #loginPanel h1 span{color:#1877f2!important}
html.mx-light #loginPanel .intro,html.mx-light #loginPanel .fineprint{color:#65676b!important}
html.mx-light .entry-form{background:#fff!important;border:1px solid #dadde1!important}
html.mx-light #authSwap{color:#1877f2!important}
html.mx-light #authMsg{color:#65676b!important}
html.mx-light #authMsg[style*="154"]{color:#d93025!important}
html.mx-light input,html.mx-light textarea,html.mx-light select{background:#f0f2f5!important;color:#050505!important;border:1px solid #ccd0d5!important;border-radius:10px!important}
html.mx-light .primary{background:#1877f2!important;color:#fff!important}
html.mx-light .primary *{color:#fff!important}
html.mx-light #studio{color:#050505}
html.mx-light #studio .pane{background:#fff!important;border:1px solid #dadde1!important;box-shadow:0 1px 2px rgba(0,0,0,.1)!important}
html.mx-light #studio .pane *{color:#050505}
html.mx-light #studio .ai-generator{background:#fff!important;border-color:#dadde1!important}
html.mx-light #studio :is(.muted,.status,.ai-smallprint,.bottom-note,small){color:#65676b!important}
html.mx-light #studio .eyebrow{color:#1877f2!important}
html.mx-light #studio .primary,html.mx-light #studio .primary *{color:#fff!important}
html.mx-light #studio footer,html.mx-light #studio footer *{color:#65676b!important}
html.mx-light #hs{background:#fff!important;border-color:#dadde1!important}
html.mx-light #hs :is(.note,label.box,.consent,.status){color:#65676b!important}
html.mx-light #hs .status.err{color:#d93025!important}
html.mx-light #hs .pick{background:#f0f2f5!important;border-color:#bcc0c4!important}
html.mx-light #hs .pick span{color:#65676b!important}
html.mx-light #hs button{background:#1877f2!important;color:#fff!important}
html.mx-light #hs button:disabled{background:#e4e6eb!important;color:#8a8d91!important}
html.mx-light #hs .out button{background:#e4e6eb!important;color:#050505!important;border:0!important}
html.mx-light .mx,html.mx-light .mx h2,html.mx-light .mx strong,html.mx-light .mx-name,html.mx-light .mx-price{color:#050505!important}
html.mx-light .mx p,html.mx-light .mx .soft{color:#4b4c4f!important}
html.mx-light .mx-card{background:#fff!important;border-color:#dadde1!important}
html.mx-light .mx-badge{color:#65676b!important;border-color:#ccd0d5!important}
html.mx-light .mx-badge.ok{color:#0a7d33!important;border-color:#9bd7b2!important}
html.mx-light .mx-badge.hold{color:#9a6700!important;border-color:#e6c77a!important}
html.mx-light .mx-badge.no{color:#d93025!important;border-color:#f0a5a0!important}
html.mx-light .mx-btn{background:#1877f2!important;color:#fff!important}
html.mx-light .mx-btn:disabled{background:#e4e6eb!important;color:#8a8d91!important}
`;

// id, icon, label, note
const ITEMS = [
  ["videoSection", "🎬", "Photo to video", ""],
  ["headswapSection", "🪄", "HeadSwap", ""],
  ["chatSection", "💬", "AI chat", "soon"],
  ["voiceCloneSection", "🗣️", "Voice clone", "soon"],
  ["voiceSection", "🎙️", "Voice studio", ""],
  ["cameraSection", "📷", "Camera studio", ""],
  ["creditSection", "🪙", "Buy credit", "soon"],
  ["socialsSection", "🛍️", "MuskySocials", "for sale"],
  ["aboutSection", "ℹ️", "About us", ""],
  ["contactSection", "📞", "Contact us", ""],
  ["privacySection", "🔒", "Privacy", ""],
  ["settingsSection", "⚙️", "Settings", ""],
];
const FAVS = ["videoSection", "headswapSection", "chatSection", "socialsSection"];

const studio = document.querySelector("#studio");
if (studio) init();

function init() {
  const st = document.createElement("style");
  st.textContent = CSS;
  document.head.appendChild(st);
  apply();

  let credits = null;
  const footer = studio.querySelector(":scope > footer");
  const mk = (id, html) => {
    const s = document.createElement("section");
    s.id = id;
    s.className = "pane";
    s.hidden = true;
    s.innerHTML = '<div class="sh">' + html + "</div>";
    studio.insertBefore(s, footer);
    return s;
  };
  const tile = ([id, ico, label, note]) =>
    '<button class="sh-tile" data-go="' + id + '"><span class="ico">' + ico + "</span>" + label +
    (note ? "<small>" + note + "</small>" : "") + "</button>";

  const home = mk("homeSection", "");
  const menu = mk("menuSection", "<h2>Menu</h2>" + '<div class="sh-grid">' + ITEMS.map(tile).join("") + "</div>");
  mk("chatSection", "<h2>AI chat</h2><p>Coming soon. You will be able to chat with an AI helper right here in the app.</p>");
  const settings = mk("settingsSection",
    "<h2>Settings</h2><h3>Account</h3><p id='shEmail'>Signed in</p><p id='shCred'></p>" +
    "<h3>Appearance</h3><div class='sh-row' id='shTheme'><button data-theme='light'>Light</button><button data-theme='dark'>Dark</button></div>" +
    "<h3>Text size</h3><div class='sh-row' id='shSize'><button data-size='1.1'>Normal</button><button data-size='1.25'>Large</button><button data-size='1.4'>Extra large</button></div>" +
    "<button class='sh-out' id='shOut'>Sign out</button>");

  const name = () => (document.querySelector("#welcomeName") || {}).textContent || "creator";
  function renderHome() {
    home.innerHTML = '<div class="sh"><h2>Hello, ' + name().replace(/</g, "&lt;") + " 👋</h2>" +
      '<div class="sh-bal"><div><small>Your credits</small><strong>' + (credits === null ? "…" : credits) +
      "</strong></div><small>Refills to 80 every day</small></div>" +
      '<div class="sh-grid">' + ITEMS.filter((i) => FAVS.includes(i[0])).map(tile).join("") + "</div></div>";
  }
  function renderSettings() {
    settings.querySelector("#shCred").textContent = "Credits: " + (credits === null ? "…" : credits);
    settings.querySelectorAll("#shTheme button").forEach((b) => b.classList.toggle("on", b.dataset.theme === S.theme));
    settings.querySelectorAll("#shSize button").forEach((b) => b.classList.toggle("on", +b.dataset.size === S.size));
  }

  // Bottom bar
  const bar = document.createElement("nav");
  bar.id = "mxBar";
  bar.innerHTML = [["homeSection", "🏠", "Home"], ["socialsSection", "🛍️", "Shop"], ["creditSection", "🪙", "Credits"], ["menuSection", "☰", "Menu"]]
    .map(([id, i, l]) => '<button data-go="' + id + '"><span>' + i + "</span>" + l + "</button>").join("");
  document.body.appendChild(bar);

  function go(id) {
    if (!document.getElementById(id)) return;
    if (id === "homeSection") renderHome();
    if (id === "settingsSection") renderSettings();
    studio.querySelectorAll(".pane").forEach((p) => {
      const hide = p.id !== id;
      if (p.hidden !== hide) p.hidden = hide;
    });
    const tabs = ["homeSection", "socialsSection", "creditSection"];
    bar.querySelectorAll("button").forEach((b) =>
      b.classList.toggle("on", b.dataset.go === (tabs.includes(id) ? id : "menuSection")));
    window.scrollTo({ top: 0 });
  }

  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-go]");
    if (g) go(g.dataset.go);
  });
  settings.addEventListener("click", (e) => {
    const t = e.target.closest("[data-theme]");
    const z = e.target.closest("[data-size]");
    if (t) S.theme = t.dataset.theme;
    if (z) S.size = +z.dataset.size;
    if (t || z) { save(); apply(); renderSettings(); }
  });
  settings.querySelector("#shOut").addEventListener("click", async () => {
    try { await window.musky.sb.auth.signOut(); } catch {}
    location.reload();
  });
  window.addEventListener("musky-credits", (e) => {
    credits = e.detail;
    renderSettings();
    if (!home.hidden) renderHome();
  });
  Promise.resolve(window.musky && window.musky.session()).then((s) => {
    if (s) settings.querySelector("#shEmail").textContent = s.user.email;
  }).catch(() => {});

  // Show the bar and Home once the studio is visible; keep the old home pane hidden.
  const old = document.querySelector("#toolsSection");
  let started = false;
  function sync() {
    const open = !studio.hidden;
    bar.style.display = open ? "flex" : "none";
    if (open && !started) { started = true; go("homeSection"); }
    if (open && old && !old.hidden) {
      old.hidden = true;
      if (![...studio.querySelectorAll(".pane")].some((p) => !p.hidden)) go("homeSection");
    }
  }
  new MutationObserver(sync).observe(studio, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
  sync();
}
