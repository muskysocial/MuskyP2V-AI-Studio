// MuskySocials home.js v1 (Stage 1 of the redesign): branded top bar, post composer, story cards,
// community feed with Like / Comment / Share, Explore page, Tools page, and clearly marked
// "coming soon" pages. Loaded by portal.js (listed in modules.json).
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

const ready = await wait(() => window.shell && window.portal && q(".topbar") && q("#studio") && q("#homeSection"));
if (ready) start();

function start() {
  const { sb, esc, mkPane } = window.portal;
  const home = q("#homeSection");
  const WA = "2349041259863";
  const go = (id) => window.shell.go(id);
  let isAdmin = !!window.shell.isAdmin;
  let uid = null, myName = "Member", avatarPath = null;
  let credits = null;

  // ---------- Styles
  const st = document.createElement("style");
  st.textContent = `
.topbar .brand{display:flex;align-items:center;gap:8px;text-decoration:none}
.mk-logo{flex:none;width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#1877f2,#6aa8ff);color:#fff;font-weight:800;font-size:20px;display:flex;align-items:center;justify-content:center}
.mk-txt{display:flex;flex-direction:column;line-height:1.15}
.mk-name{font-size:18px;font-weight:800;color:var(--sh-blue,#1877f2)}
.mk-txt small{font-size:10px;color:var(--sh-sub,#65676b);white-space:nowrap}
.topbar .online-dot,#authCredits{display:none!important}
.tb-ic{width:34px;height:34px;border-radius:50%;border:0;background:var(--sh-line,#e4e6eb);font-size:16px;display:inline-flex;align-items:center;justify-content:center}
#xTools{margin-left:6px!important}
html.mx-light .topbar .mk-name{color:#1877f2!important}
html.mx-light .topbar .mk-txt small{color:#65676b!important}
html.mx-light .topbar .mk-logo{color:#fff!important}
.hm-comp{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.hm-av{flex:none;width:42px;height:42px;border-radius:50%;background:var(--sh-blue,#1877f2) center/cover;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center}
.hm-pill{flex:1;text-align:left;padding:11px 14px;border-radius:999px;border:0;background:var(--sh-line,#e4e6eb);color:var(--sh-sub,#65676b);font-size:15px}
.hm-meta{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px;color:var(--sh-sub,#65676b);margin-bottom:10px}
.hm-meta button{border:1px solid var(--sh-line,#ccd0d5);background:transparent;color:var(--sh-text,#050505);border-radius:999px;padding:4px 10px;font-size:13px}
.hm-stories{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px;scroll-snap-type:x mandatory}
.hm-story{flex:none;width:104px;height:150px;border:0;border-radius:14px;color:#fff;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;padding:10px;text-align:left;scroll-snap-align:start}
.hm-story .ic{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.28);display:flex;align-items:center;justify-content:center;font-size:20px}
.hm-story b{font-size:14px;line-height:1.15}
.hm-post{margin:10px 0!important}
.hm-head{display:flex;gap:10px;align-items:center;margin-bottom:8px}
.hm-logo{flex:none;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#1877f2,#6aa8ff);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center}
.hm-sub{font-size:12px;color:var(--sh-sub,#65676b)}
.hm-title{font-weight:700;margin-bottom:4px;overflow-wrap:anywhere}
.hm-body{white-space:pre-wrap;line-height:1.45;overflow-wrap:anywhere}
.hm-counts{display:flex;justify-content:space-between;font-size:13px;color:var(--sh-sub,#65676b);padding:8px 2px;border-bottom:1px solid var(--sh-line,#dadde1)}
.hm-actions{display:flex;justify-content:space-around;padding-top:4px}
.hm-actions button{flex:1;padding:10px 4px;border:0;background:transparent;color:var(--sh-sub,#65676b);font-size:15px;font-weight:600}
.hm-actions button.on{color:var(--sh-blue,#1877f2)}
.hm-c{padding:8px 0;border-top:1px solid var(--sh-line,#dadde1);font-size:14px;overflow-wrap:anywhere}
.hm-cbar{display:flex;gap:8px;margin-top:8px}
.hm-cbar input{margin:0!important}
.hm-badge{display:inline-block;font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;border:1px solid #e6a700;color:#9a6700;margin-bottom:8px}
.hm-ul{padding-left:20px;line-height:1.6}
.ex-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ex-card{display:flex;flex-direction:column;gap:6px;text-align:left;padding:12px;border:1px solid var(--sh-line,#dadde1);border-radius:14px;color:var(--sh-text,#050505);font-size:15px}
.ex-card .ic{font-size:26px}
.ex-card b{font-size:15px;line-height:1.2}
.ex-card span.d{font-size:12px;color:var(--sh-sub,#65676b)}
.ex-tag{align-self:flex-start;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;border:1px solid currentColor}
.ex-row{display:flex;justify-content:space-between;align-items:center;width:100%;padding:13px 4px;border:0;border-top:1px solid var(--sh-line,#dadde1);background:transparent;color:var(--sh-text,#050505);font-size:16px;text-align:left}
.hm-toast{position:fixed;left:12px;right:12px;bottom:92px;z-index:90;padding:12px 14px;border-radius:12px;background:#222;color:#fff;font-size:14px;text-align:center}
html.mx-light #studio .hm-story,html.mx-light #studio .hm-story *{color:#fff!important}
html.mx-light #studio .hm-sub,html.mx-light #studio .hm-counts,html.mx-light #studio .hm-meta,html.mx-light #studio .ex-card span.d{color:#65676b!important}
html.mx-light #studio .hm-pill{color:#65676b!important}
html.mx-light #studio .hm-actions button{color:#65676b!important}
html.mx-light #studio .hm-actions button.on{color:#1877f2!important}
html.mx-light #studio .hm-av,html.mx-light #studio .hm-logo{color:#fff!important}
html.mx-light #studio .hm-badge{color:#9a6700!important}
html.mx-light #studio .ex-tag{color:#9a6700!important}
html.mx-light #studio .ex-tag.ok{color:#0a7d33!important}
html.mx-light #studio .ex-card b{color:#050505!important}

.md-hero{padding:18px;border:1px solid var(--sh-line);border-radius:18px;background:linear-gradient(130deg,rgba(24,119,242,.12),rgba(244,91,154,.12));margin-bottom:14px}
.md-hero h2{margin:0 0 5px;font-size:24px;letter-spacing:-.03em}
.md-hero p{margin:0;color:var(--sh-sub)}
.md-search{display:flex;gap:8px;margin:14px 0}
.md-search input{flex:1;min-width:0;border:1px solid var(--sh-line);border-radius:12px;padding:13px;background:var(--sh-card);color:var(--sh-text)}
.md-people-list{display:grid;grid-template-columns:1fr;gap:12px}
.md-card{padding:14px;border:1px solid var(--sh-line);border-radius:18px;background:var(--sh-card);box-shadow:0 8px 24px rgba(25,45,85,.06);min-width:0}
.md-person{display:flex;gap:12px;align-items:flex-start;width:100%;padding:0;border:0;background:transparent;color:var(--sh-text);text-align:left;min-width:0}
.md-avatar{display:grid;place-items:center;flex:none;width:54px;height:54px;border-radius:50%;object-fit:cover;background:linear-gradient(135deg,#1877f2,#f45b9a);color:#fff;font-size:20px;font-weight:800}
.md-avatar-fallback{display:inline-flex;align-items:center;justify-content:center}
.md-person-copy{display:flex;flex:1;flex-direction:column;gap:4px;min-width:0}
.md-person-copy strong{font-size:16px;overflow-wrap:anywhere}
.md-verified{display:inline-flex;align-self:flex-start;align-items:center;gap:4px;border-radius:999px;background:#eaf3ff;color:#1456a0;padding:3px 7px;font-size:10px;font-weight:800}
.md-person-copy small{color:var(--sh-sub);font-size:12px}
.md-bio{color:var(--sh-sub);font-size:13px;line-height:1.45;overflow-wrap:anywhere}
.md-card-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--sh-line);font-size:12px;color:var(--sh-sub)}
.md-follow{flex:none;padding:9px 14px;border:1px solid var(--ms-blue,#1877f2);border-radius:999px;background:var(--ms-blue,#1877f2);color:#fff;font-weight:750;font-size:12px}
.md-follow.is-following{background:transparent;color:var(--sh-text);border-color:var(--sh-line)}
.md-profile{padding:18px;border:1px solid var(--sh-line);border-radius:20px;background:var(--sh-card)}
.md-profile-top{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.md-profile .md-avatar{width:76px;height:76px;font-size:28px}
.md-profile h2{margin:0 0 5px;font-size:24px}
.md-profile-bio{line-height:1.6;overflow-wrap:anywhere}
.md-counts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:18px 0}
.md-count{padding:12px;border:1px solid var(--sh-line);border-radius:14px;text-align:center}
.md-count strong{display:block;font-size:20px;color:var(--sh-text)}
.md-count span{font-size:12px;color:var(--sh-sub)}
.md-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}
.md-actions button{flex:1;min-width:120px}
.md-coming{display:inline-flex;align-items:center;gap:5px;margin-top:12px;padding:5px 9px;border:1px solid #ffd1e1;border-radius:999px;background:#fff0f6;color:#a92d61;font-size:11px;font-weight:800}
.hm-meet{display:flex;align-items:center;gap:11px;width:100%;margin:12px 0;padding:13px;border:1px solid color-mix(in srgb,#1877f2 20%,var(--sh-line));border-radius:16px;background:linear-gradient(110deg,rgba(24,119,242,.09),rgba(244,91,154,.09));color:var(--sh-text);text-align:left}
.hm-meet-icon{display:grid;place-items:center;flex:none;width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,#1877f2,#f45b9a);color:#fff;font-size:21px}
.hm-meet-copy{display:flex;flex:1;flex-direction:column;gap:2px}
.hm-meet-copy strong{font-size:14px}
.hm-meet-copy small{font-size:11px;color:var(--sh-sub)}
.hm-meet-arrow{font-size:19px;color:var(--ms-blue,#1877f2)}
@media(min-width:620px){.md-people-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:380px){.md-card{padding:12px}.md-avatar{width:46px;height:46px}.md-card-footer{align-items:flex-start;flex-direction:column}.md-follow{width:100%}.hm-meet-copy small{font-size:10px}}


/* Social-first mobile interface: blue + pink accents on a clean white canvas */
:root{--ms-blue:#1877f2;--ms-pink:#f45b9a;--ms-ink:#172033;--ms-paper:#fff}
html.mx-light body{background:#f7f8fc!important}
#studio #homeSection{max-width:760px;margin:0 auto;padding:8px 10px 92px!important}
.ms-top-menu{width:42px;height:42px;flex:0 0 42px;border:0;border-radius:50%;background:#eef4ff;color:#1877f2;font-size:23px;font-weight:700;display:grid;place-items:center;margin-right:8px}
.topbar{gap:8px!important}
.topbar .brand{min-width:0;flex:1}
.topbar .brand strong{font-size:17px!important;letter-spacing:-.4px}
.topbar .brand small{font-size:9px!important;letter-spacing:.5px}
.ms-top-avatar{position:relative;display:grid;place-items:center;width:42px;height:42px;flex:0 0 42px;padding:0;border:3px solid #fce3ef;border-radius:50%;background:linear-gradient(135deg,#1877f2,#f45b9a);color:#fff;font-weight:800;font-size:16px;overflow:visible}
.ms-top-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.ms-top-avatar:after{content:"";position:absolute;right:-1px;bottom:0;width:10px;height:10px;border-radius:50%;background:#22c55e;border:2px solid #fff}
#msQuickMenu{position:fixed;z-index:120;top:68px;left:12px;width:min(280px,calc(100vw - 24px));padding:10px;background:#fff;border:1px solid #e7eaf2;border-radius:18px;box-shadow:0 16px 48px #15264b30;display:none}
#msQuickMenu.open{display:grid;gap:4px}
#msQuickMenu button{display:flex;align-items:center;gap:12px;width:100%;padding:12px;border:0;border-radius:11px;background:#fff;color:#20283b;text-align:left;font-size:14px;font-weight:650}
#msQuickMenu button:active{background:#f0f5ff}
.ms-search{display:flex;align-items:center;gap:9px;margin:8px 0 14px;padding:0 12px;height:46px;background:#eef1f7;border:1px solid #e7eaf2;border-radius:15px}
.ms-search .glass{font-size:18px;color:#667085}
.ms-search input{flex:1;min-width:0;border:0!important;outline:0;background:transparent!important;color:#172033!important;padding:8px 0!important;font-size:14px}
.ms-search button{border:0;background:transparent;color:#1877f2;font-size:19px;padding:5px}
.ms-section-head{display:flex;align-items:center;justify-content:space-between;margin:15px 2px 10px}
.ms-section-head strong{font-size:17px;color:#172033}
.ms-section-head button{border:0;background:transparent;color:#1877f2;font-weight:700;font-size:12px}
.ms-story-strip{display:flex;gap:13px;overflow-x:auto;padding:2px 2px 12px;margin-bottom:10px;scrollbar-width:none}
.ms-story-strip::-webkit-scrollbar{display:none}
.ms-story{display:flex;flex-direction:column;align-items:center;gap:6px;flex:0 0 62px;width:62px;border:0;background:transparent;padding:0;color:#273149;font-size:11px;font-weight:650}
.ms-story-ring{width:58px;height:58px;display:grid;place-items:center;border-radius:50%;padding:3px;background:linear-gradient(135deg,#1877f2 10%,#f45b9a 58%,#ffb15c);position:relative}
.ms-story-ring>span,.ms-story-ring img{width:100%;height:100%;border-radius:50%;border:2px solid #fff;object-fit:cover;background:#edf3ff;display:grid;place-items:center;color:#1877f2;font-size:19px;font-weight:800}
.ms-story-add .ms-story-ring{background:#e8efff;padding:2px}
.ms-story-add .ms-story-ring>span{border:0;background:#fff;font-size:28px;color:#1877f2}
.ms-compose{display:flex;align-items:center;gap:10px;padding:12px;background:#fff;border:1px solid #e8ebf2;border-radius:18px;box-shadow:0 3px 14px #1b2b4b08}
.ms-compose .hm-av{width:42px;height:42px;border:2px solid #fce3ef}
.ms-compose .hm-pill{background:#f1f4f9;color:#657087;border:1px solid #e7eaf2;padding:13px 15px}
.ms-creditline{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 3px 12px;color:#748096;font-size:11px}
.ms-creditline strong{color:#1877f2;font-weight:750}
.ms-post{overflow:hidden;background:#fff!important;border:1px solid #e8ebf2!important;border-radius:20px!important;box-shadow:0 4px 20px #16274b0a!important;margin:12px 0!important;padding:0!important}
.ms-post .hm-head{padding:14px 14px 8px;margin:0;gap:10px}
.ms-post .hm-logo{width:42px;height:42px;border:2px solid #fce3ef;font-size:16px}
.ms-post .ms-author{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}
.ms-post .ms-author strong{font-size:13px;color:#19233a}
.ms-post .ms-handle{font-size:11px;color:#8992a5}
.ms-post .ms-more{width:34px;height:34px;border:0;border-radius:50%;background:transparent;color:#64708a;font-size:23px}
.ms-post .hm-title{padding:4px 14px 0;color:#182238;font-size:15px}
.ms-post .hm-body{padding:0 14px 10px;color:#303b51;font-size:14px;line-height:1.55;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.ms-post .hm-body.expanded{display:block;overflow:visible}
.ms-readmore{margin:0 14px 10px;padding:0;border:0;background:transparent;color:#1877f2;font-size:12px;font-weight:750}
.ms-tags{padding:0 14px 10px;color:#1877f2;font-size:12px;line-height:1.5}
.ms-post .hm-counts{margin:0 14px;padding:10px 0;border-top:1px solid #f0f2f6;border-bottom:1px solid #f0f2f6;color:#7a8498;font-size:12px}
.ms-post .hm-actions{padding:4px 8px 6px;gap:3px}
.ms-post .hm-actions button{border-radius:10px;padding:10px 2px;font-size:12px;color:#68748b}
.ms-post .hm-actions button.on{color:#1877f2;background:#edf4ff}
.ms-post .hm-c,.ms-post .hm-cbar{margin-left:14px;margin-right:14px}
.ms-empty-media{display:none}
.ms-like-dot{display:inline-grid;place-items:center;width:19px;height:19px;border-radius:50%;background:#1877f2;color:#fff;font-size:11px}
.ms-post .hm-actions button[data-bookmark].on{color:#f45b9a;background:#fff0f6}
.ms-footer-links{display:flex;justify-content:center;flex-wrap:wrap;gap:8px 14px;padding:20px 6px;color:#9aa2b2;font-size:10px}
.ms-footer-links a{color:inherit;text-decoration:none}
#mxBar{box-shadow:0 -5px 24px #17233b0d!important;border-top:1px solid #edf0f6!important}
#mxBar button{color:#8a93a6!important;font-size:10px!important;font-weight:650}
#mxBar button.on{color:#1877f2!important}
#mxBar button span{font-size:21px!important}
@media(min-width:620px){#studio #homeSection{padding:12px 18px 100px!important}.ms-post .hm-body{-webkit-line-clamp:5}}

`;
  document.head.appendChild(st);

  // Upgrade the existing header in place; keep the app shell and its auth hooks.
  const topbar=q(".topbar");
  if(topbar&&!q("#msMenuButton")){
    const menu=document.createElement("button");menu.id="msMenuButton";menu.className="ms-top-menu";menu.type="button";menu.setAttribute("aria-label","Open navigation menu");menu.textContent="☰";
    const brand=topbar.querySelector(".brand");if(brand)topbar.insertBefore(menu,brand);
    const actions=topbar.querySelector(".top-actions");
    if(actions){actions.innerHTML='<button id="msTopAvatar" class="ms-top-avatar" type="button" aria-label="Open your profile">M</button>';q("#msTopAvatar").addEventListener("click",()=>window.shell.go("profileSection"));}
    const quick=document.createElement("div");quick.id="msQuickMenu";quick.innerHTML='<button data-msgo="homeSection">🏠 Home</button><button data-msgo="peopleSection">👥 Friends & Discover</button><button data-msgo="notifSection">♡ Activity</button><button data-msgo="profileSection">👤 My profile</button><button data-msgo="shopSection">🛍 Shop</button><button data-msgo="settingsSection">⚙ Settings</button>';
    document.body.appendChild(quick);
    menu.addEventListener("click",()=>quick.classList.toggle("open"));
    quick.addEventListener("click",e=>{const b=e.target.closest("[data-msgo]");if(!b)return;quick.classList.remove("open");window.shell.go(b.dataset.msgo);});
    document.addEventListener("click",e=>{if(!quick.contains(e.target)&&e.target!==menu)quick.classList.remove("open");});
    sb.auth.onAuthStateChange(()=>{loadMe().then(()=>{const a=q("#msTopAvatar");if(a){if(avatarPath){a.innerHTML='<img src="'+esc(avUrl(avatarPath))+'" alt="">';}else a.textContent=(myName||"M").charAt(0).toUpperCase();}});});
  }

  const toast = (msg) => {
    const t = document.createElement("div");
    t.className = "hm-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  };
  const ago = (d) => {
    const s = Math.max(1, Math.floor((Date.now() - new Date(d)) / 1000));
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m";
    if (s < 86400) return Math.floor(s / 3600) + "h";
    if (s < 604800) return Math.floor(s / 86400) + "d";
    return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  };
  const wa = (t) => window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(t), "_blank", "noopener");

  // ---------- Branded top bar
  const brand = q(".topbar .brand");
  if (brand) {
    brand.innerHTML = '<span class="mk-logo">M</span><span class="mk-txt"><strong class="mk-name">MuskySocials</strong><small>Connect • Discover • Create</small></span>';
    brand.addEventListener("click", (e) => { e.preventDefault(); go("homeSection"); });
  }
  const actions = q(".topbar .top-actions");
  if (actions) {
    actions.insertAdjacentHTML("afterbegin", "<button class='tb-ic' id='tbSearch' aria-label='Search'>🔍</button><button class='tb-ic' id='tbPeople' aria-label='Meet people'>👥</button><button class='tb-ic' id='tbBell' aria-label='Notifications'>🔔</button>");
    q("#tbPeople").addEventListener("click", () => { loadPeople(true); go("peopleSection"); });
    q("#tbBell").addEventListener("click", () => go("notifSection"));
    q("#tbSearch").addEventListener("click", () => {
      go("homeSection");
      setTimeout(() => { const i = q("#homeSection .xs input"); if (i) i.focus(); }, 150);
    });
  }

  // ---------- Who am I (name and photo for the composer and comments)
  const avUrl = (p) => sb.storage.from("avatars").getPublicUrl(p).data.publicUrl;
  async function loadMe() {
    try {
      const s = await window.musky.session();
      if (!s) return;
      uid = s.user.id;
      const { data } = await sb.from("profiles").select("display_name,avatar_path").eq("id", uid).maybeSingle();
      myName = (data && data.display_name) || s.user.email.split("@")[0];
      avatarPath = data && data.avatar_path;
      const el = q("#hmAv");
      if (el) paintAv(el);
    } catch {}
  }
  function paintAv(el) {
    if (avatarPath) { el.style.backgroundImage = "url('" + avUrl(avatarPath) + "')"; el.textContent = ""; }
    else { el.style.backgroundImage = ""; el.textContent = myName.charAt(0).toUpperCase(); }
  }
  sb.auth.onAuthStateChange(() => {
    setTimeout(() => { loadMe().then(() => loadPeople(true)); }, 0);
  });
  loadMe();

  // ---------- Feed data (posts, likes, comments)
  let posts = [], likes = {}, cms = {}, social = true, lastFetch = 0;
  const openC = new Set();

  async function fetchFeed(force) {
    if (!force && Date.now() - lastFetch < 20000 && posts.length) return paintFeed();
    lastFetch = Date.now();
    const { data, error } = await sb.from("posts").select("*")
      .order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(20);
    if (error) { const f = q("#hmFeed"); if (f) f.textContent = "Could not load the feed. Sign in and try again."; return; }
    posts = data;
    likes = {};
    cms = {};
    const ids = posts.map((p) => p.id);
    if (ids.length) {
      const [l, c] = await Promise.all([
        sb.from("post_likes").select("post_id,user_id").in("post_id", ids),
        sb.from("post_comments").select("id,post_id,user_id,author_name,body,created_at").in("post_id", ids).order("created_at", { ascending: true }).limit(300),
      ]);
      social = !l.error && !c.error;
      (l.data || []).forEach((r) => { (likes[r.post_id] = likes[r.post_id] || new Set()).add(r.user_id); });
      (c.data || []).forEach((r) => { (cms[r.post_id] = cms[r.post_id] || []).push(r); });
    }
    paintFeed();
  }

  function paintFeed() {
    const box = q("#hmFeed");
    if (!box) return;
    if (!posts.length) { box.innerHTML = "<p>No posts yet. Check back soon.</p>"; return; }
    box.innerHTML = posts.map((p) => {
      const set = likes[p.id] || new Set();
      const liked = uid && set.has(uid);
      const list = cms[p.id] || [];
      const open = openC.has(p.id);
      return '<div class="pt-card hm-post ms-post" data-id="' + p.id + '">' +
        '<div class="hm-head"><div class="hm-logo">M</div><div class="ms-author"><strong>MuskySocials Updates</strong><span class="ms-handle">@muskysocials · ' + ago(p.created_at) + (p.pinned ? " · 📌 Pinned" : "") + '</span></div><button class="ms-more" type="button" data-postmenu="' + p.id + '" aria-label="Post options">⋯</button></div>' +
        '<div class="hm-title">' + esc(p.title) + "</div>" +
        (p.body ? '<div class="hm-body" data-caption="' + p.id + '">' + esc(p.body) + "</div>" + (p.body.length>150?'<button class="ms-readmore" data-read="' + p.id + '">Read more</button>':"") + '<div class="ms-tags">' + ((p.title+" "+p.body).match(/#[a-z0-9_]+/ig)||[]).map(tag=>esc(tag)).join(" ") + '</div>' : "") +
        (p.cta !== "none" ? '<div style="padding:0 14px 10px"><button class="pt-btn" data-cta="' + p.cta + '" data-title="' + esc(p.title) + '">' + (p.cta === "buy" ? "Buy" : "Contact us") + "</button></div>" : "") +
        '<div class="hm-counts"><span><span class="ms-like-dot">♥</span> ' + set.size + '</span><span>' + list.length + ' comment' + (list.length === 1 ? "" : "s") + '</span></div>' +
        '<div class="hm-actions"><button data-like="' + p.id + '" class="' + (liked ? "on" : "") + '">♥ Like</button>' +
        '<button data-cm="' + p.id + '">▢ Comment</button><button data-share="' + p.id + '">↗ Share</button><button data-bookmark="' + p.id + '" aria-label="Bookmark post">▱ Save</button></div>' +
        (open ? list.map((c) => '<div class="hm-c"><strong>' + esc(c.author_name) + "</strong> " + esc(c.body) +
          ' <span class="hm-sub">' + ago(c.created_at) + "</span>" +
          ((uid && c.user_id === uid) || isAdmin ? ' <button class="hm-meta" style="border:0;background:none;font-size:13px" data-cdel="' + c.id + '">🗑</button>' : "") + "</div>").join("") +
          '<div class="hm-cbar"><input class="pt-in" maxlength="500" data-cin="' + p.id + '" placeholder="Write a comment…"><button class="pt-btn" data-csend="' + p.id + '">Send</button></div>' : "") +
        "</div>";
    }).join("");
  }

  async function needUser() {
    if (!uid) await loadMe();
    if (!uid) { toast("Please sign in first."); return false; }
    return true;
  }
  async function toggleLike(id) {
    if (!social) return toast("Likes and comments are not switched on yet.");
    if (!(await needUser())) return;
    const set = (likes[id] = likes[id] || new Set());
    const had = set.has(uid);
    if (had) set.delete(uid); else set.add(uid);
    paintFeed();
    const res = had ? await sb.from("post_likes").delete().eq("post_id", id).eq("user_id", uid)
                    : await sb.from("post_likes").insert({ post_id: id });
    if (res.error) { if (had) set.add(uid); else set.delete(uid); paintFeed(); toast("Could not save your like."); }
  }
  async function sendComment(id) {
    if (!social) return toast("Likes and comments are not switched on yet.");
    if (!(await needUser())) return;
    const inp = home.querySelector('[data-cin="' + id + '"]');
    const body = inp ? inp.value.trim() : "";
    if (!body) return;
    const { data, error } = await sb.from("post_comments").insert({ post_id: id, body, author_name: myName.slice(0, 40) })
      .select("id,post_id,user_id,author_name,body,created_at").single();
    if (error) return toast("Could not post your comment.");
    (cms[id] = cms[id] || []).push(data);
    paintFeed();
  }
  async function share(p) {
    const url = location.origin + location.pathname;
    const text = p.title + (p.body ? " — " + p.body.slice(0, 120) : "");
    if (navigator.share) {
      try { await navigator.share({ title: "MuskySocials", text, url }); return; } catch (e) { if (e && e.name === "AbortError") return; }
    }
    window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n" + url), "_blank", "noopener");
  }
  function compose() {
    if (isAdmin) {
      go("adminSection");
      setTimeout(() => { const r = q('#ahHub [data-ah="0"]'); if (r) r.click(); }, 300);
    } else toast("Only the MuskySocials team can post for now. You can like, comment and share posts.");
  }

  home.addEventListener("click", async (e) => {
    const t = e.target;
    if (t.closest("#hmMeet")) { loadPeople(true); return go("peopleSection"); }
    if (t.closest("#hmShare")) return compose();
    if (t.closest("#hmAdmin")) return go("adminSection");
    const read=t.closest("[data-read]");
    if(read){const body=q('[data-caption="'+read.dataset.read+'"]');if(body){body.classList.toggle("expanded");read.textContent=body.classList.contains("expanded")?"Read less":"Read more";}return;}
    const save=t.closest("[data-bookmark]");
    if(save){save.classList.toggle("on");save.textContent=save.classList.contains("on")?"▰ Saved":"▱ Save";toast(save.classList.contains("on")?"Saved on this screen.":"Removed saved mark.");return;}
    const menu=t.closest("[data-postmenu]");
    if(menu){const p=posts.find(x=>x.id===menu.dataset.postmenu);if(p)share(p);return;}
    const lk = t.closest("[data-like]");
    if (lk) return toggleLike(lk.dataset.like);
    const cm = t.closest("[data-cm]");
    if (cm) { const id = cm.dataset.cm; if (openC.has(id)) openC.delete(id); else openC.add(id); return paintFeed(); }
    const sh = t.closest("[data-share]");
    if (sh) { const p = posts.find((x) => x.id === sh.dataset.share); if (p) share(p); return; }
    const cs = t.closest("[data-csend]");
    if (cs) return sendComment(cs.dataset.csend);
    const cd = t.closest("[data-cdel]");
    if (cd && confirm("Delete this comment?")) {
      const id = cd.dataset.cdel;
      const { error } = await sb.from("post_comments").delete().eq("id", id);
      if (error) return toast("Could not delete the comment.");
      Object.keys(cms).forEach((k) => { cms[k] = cms[k].filter((c) => c.id !== id); });
      return paintFeed();
    }
    const cta = t.closest("[data-cta]");
    if (cta) wa(cta.dataset.cta === "buy" ? 'Hello MuskySocials, I saw your post "' + cta.dataset.title + '" and I want to buy.' : 'Hello MuskySocials, I saw your post "' + cta.dataset.title + '" and I have a question.');
  });
  home.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.dataset && e.target.dataset.cin) { e.preventDefault(); sendComment(e.target.dataset.cin); }
  });

  // ---------- Home screen (replaces the old tile grid)
  const STORIES = [
    ["profileSection", "🙂", "You", "linear-gradient(160deg,#1877f2,#6aa8ff)"],
    ["peopleSection", "👥", "Meet people", "linear-gradient(160deg,#1877f2,#f45b9a)"],
    ["notifSection", "🔔", "Notifications", "linear-gradient(160deg,#1877f2,#8a5cf6)"],
    ["datingSection", "❤️", "Dating Guide", "linear-gradient(160deg,#ff5f6d,#ffc371)"],
    ["jobsSection", "💼", "Job Updates", "linear-gradient(160deg,#11998e,#38ef7d)"],
    ["toolsHubSection", "✨", "AI Tools", "linear-gradient(160deg,#3a1c71,#6a82fb)"],
    ["shopSection", "🎁", "Gifts", "linear-gradient(160deg,#f7971e,#ffb347)"],
    ["librarySection", "📚", "Library", "linear-gradient(160deg,#0f9b8e,#4facfe)"],
  ];
  window.shell.homeRenderer = (el, ctx) => {
    credits = ctx && ctx.credits;
    el.innerHTML = '<div class="sh ms-home">' +
      '<div class="ms-search"><span class="glass">⌕</span><input id="msSearchInput" type="search" placeholder="Search people, posts and more" aria-label="Search MuskySocials"><button id="msVoiceSearch" type="button" aria-label="Voice search">🎙</button></div>' +
      '<div class="ms-section-head"><strong>Stories</strong><button id="msWatchStories" type="button">Watch all →</button></div>' +
      '<div class="ms-story-strip"><button class="ms-story ms-story-add" data-go="profileSection"><span class="ms-story-ring"><span>＋</span></span><span>Add story</span></button>' +
      STORIES.slice(1).map(([id, ic, label, bg]) => '<button class="ms-story" data-go="' + id + '"><span class="ms-story-ring"><span style="background:' + bg + ';color:#fff">' + ic + '</span></span><span>' + label + '</span></button>').join("") + '</div>' +
      '<div class="ms-compose"><div class="hm-av" id="hmAv">?</div><button class="hm-pill" id="hmShare">What would you like to share?</button></div>' +
      '<div class="ms-creditline"><span><strong>MuskySocials</strong> · Connect, discover, create</span><span>🪙 ' + (credits === null || credits === undefined ? "…" : credits) + '</span></div>' +
      '<button class="hm-meet" id="hmMeet" type="button"><span class="hm-meet-icon">👥</span><span class="hm-meet-copy"><strong>Discover friends</strong><small>Find people, follow members and grow your circle</small></span><span class="hm-meet-arrow">›</span></button>' +
      '<div id="hmFeed">Loading feed…</div>' +
      '<div class="ms-footer-links"><a href="#" data-go="aboutSection">About</a><a href="#" data-go="aboutSection">Accessibility</a><a href="#" data-go="contactSection">Help Center</a><a href="#" data-go="privacySection">Privacy</a><a href="#" data-go="privacySection">Terms</a><a href="#" data-go="shopSection">Advertising</a></div></div>';
    paintAv(q("#hmAv"));
    paintFeed();
    fetchFeed(false);
    const search=q("#msSearchInput");
    if(search) search.addEventListener("keydown",e=>{if(e.key==="Enter"&&search.value.trim()){window.shell.go("peopleSection");setTimeout(()=>{const target=q("#mdSearch")||q("#mdSearchInput")||q("#peopleSearch");if(target){target.value=search.value.trim();target.dispatchEvent(new Event("input",{bubbles:true}));}},150);}});
    const voice=q("#msVoiceSearch");
    if(voice) voice.addEventListener("click",()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){toast("Voice search isn't supported in this browser. You can type in search.");return;}const rec=new SR();rec.lang=navigator.language||"en-US";rec.onresult=e=>{if(search)search.value=e.results[0][0].transcript;};rec.onerror=()=>toast("Couldn't hear that. Please try again.");rec.start();});
    const watch=q("#msWatchStories");if(watch)watch.addEventListener("click",()=>go("peopleSection"));
  };
  // Fix the startup race: shell.js can render its legacy tile grid before this
  // module finishes loading. Re-render immediately so the new social home is
  // visible on the first visit, without requiring users to leave and return.
  if (typeof window.shell.renderHome === "function") window.shell.renderHome();
  window.addEventListener("musky-admin", (e) => {
    isAdmin = !!e.detail;
    if (!home.hidden) window.shell.renderHome();
    const pr = q("#profileSection .pt");
    if (pr && isAdmin && !q("#pfAdmin")) {
      const g = pr.querySelector(".pf-group");
      if (g) g.insertAdjacentHTML("beforebegin", "<button class='pf-row' id='pfAdmin' data-go='adminSection'><span>🛠️ Admin studio</span><span>›</span></button>");
    }
    if (pr && !isAdmin) { const a = q("#pfAdmin"); if (a) a.remove(); }
  });
  if (isAdmin) window.dispatchEvent(new CustomEvent("musky-admin", { detail: true }));


  // ---------- Meet people: public member directory, follow/unfollow, public profile
  const PEOPLE_FIELDS = "id,display_name,bio,country,avatar_path,is_verified,created_at,follower_count,following_count";
  let people = [];
  let followedIds = new Set();
  let selectedPerson = null;
  let peopleLoadToken = 0;

  const publicAvatarUrl = (person) => {
    if (!person || !person.avatar_path) return "";
    try { return sb.storage.from("avatars").getPublicUrl(person.avatar_path).data.publicUrl || ""; }
    catch { return ""; }
  };
  const personAvatar = (person) => {
    const url = publicAvatarUrl(person);
    if (url) return '<img class="md-avatar" src="' + esc(url) + '" alt="" loading="lazy">';
    return '<span class="md-avatar md-avatar-fallback">' + esc(((person && person.display_name) || "M").charAt(0).toUpperCase()) + "</span>";
  };
  const verifiedMark = (person) => person && person.is_verified
    ? '<span class="md-verified" aria-label="Verified member">✓ Verified</span>' : "";

  function paintPeople() {
    const box = q("#mdPeopleList");
    if (!box) return;
    const search = (q("#mdSearch") && q("#mdSearch").value || "").trim().toLowerCase();
    const visible = people.filter((p) => p.id !== uid && (
      (p.display_name || "").toLowerCase().includes(search) ||
      (p.country || "").toLowerCase().includes(search) ||
      (p.bio || "").toLowerCase().includes(search)
    ));
    if (!visible.length) {
      box.innerHTML = '<div class="pt-card"><strong>' + (search ? "No members match that search." : "No other members yet.") +
        '</strong><p class="muted">New people will appear here as they join MuskySocials.</p></div>';
      return;
    }
    box.innerHTML = visible.map((p) => {
      const following = followedIds.has(p.id);
      const country = p.country ? "📍 " + esc(p.country) : "MuskySocials member";
      const bio = p.bio ? esc(p.bio) : "No bio added yet.";
      return '<article class="md-card">' +
        '<button type="button" class="md-person" data-person="' + p.id + '" aria-label="View ' + esc(p.display_name) + ' profile">' +
        personAvatar(p) + '<span class="md-person-copy"><strong>' + esc(p.display_name) + '</strong>' + verifiedMark(p) +
        '<small>' + country + '</small><span class="md-bio">' + bio + '</span></span></button>' +
        '<div class="md-card-footer"><span>👥 ' + Number(p.follower_count || 0) + ' followers</span>' +
        '<button type="button" class="md-follow' + (following ? " is-following" : "") + '" data-follow="' + p.id + '">' +
        (following ? "Following" : "Follow") + "</button></div></article>";
    }).join("");
  }

  async function loadPeople(force) {
    const token = ++peopleLoadToken;
    const box = q("#mdPeopleList");
    if (!uid) await loadMe();
    if (!uid) {
      if (box) box.innerHTML = '<div class="pt-card"><strong>Sign in to meet people</strong><p class="muted">Create or sign in to your account to discover community members and follow profiles.</p></div>';
      return;
    }
    if (!force && people.length) { paintPeople(); return; }
    if (box) box.innerHTML = '<div class="pt-card">Finding community members…</div>';
    const results = await Promise.all([
      sb.from("member_directory").select(PEOPLE_FIELDS).order("created_at", { ascending: false }).limit(100),
      sb.from("member_follows").select("followed_id").eq("follower_id", uid)
    ]);
    if (token !== peopleLoadToken) return;
    const directory = results[0], followRows = results[1];
    if (directory.error) {
      if (box) box.innerHTML = '<div class="pt-card"><strong>People could not load right now.</strong><p class="muted">Please refresh and try again.</p></div>';
      return;
    }
    people = directory.data || [];
    followedIds = new Set((followRows.data || []).map((row) => row.followed_id));
    paintPeople();
    if (followRows.error) toast("People loaded, but your following list could not be refreshed.");
  }

  async function openPerson(id) {
    let person = people.find((p) => p.id === id);
    if (!person) {
      const result = await sb.from("member_directory").select(PEOPLE_FIELDS).eq("id", id).maybeSingle();
      if (result.error || !result.data) return toast("That profile could not be opened.");
      person = result.data;
    }
    selectedPerson = person;
    paintPublicProfile();
    go("publicProfileSection");
  }

  function paintPublicProfile() {
    const pane = q("#publicProfileSection .pt") || q("#publicProfileSection");
    if (!pane || !selectedPerson) return;
    const p = selectedPerson;
    const following = followedIds.has(p.id);
    const bio = p.bio ? esc(p.bio) : "This member hasn't added a bio yet.";
    const country = p.country ? '<p class="muted">📍 ' + esc(p.country) + '</p>' : "";
    pane.innerHTML = '<div class="md-hero"><button type="button" class="pt-btn" data-go="peopleSection">‹ Back to people</button><h2 style="margin-top:14px">Member profile</h2><p>Get to know the people in your community.</p></div>' +
      '<div class="md-profile"><div class="md-profile-top">' + personAvatar(p) + '<div><h2>' + esc(p.display_name) + '</h2>' +
      verifiedMark(p) + country + '</div></div><p class="md-profile-bio">' + bio + '</p>' +
      '<div class="md-counts"><div class="md-count"><strong>' + Number(p.follower_count || 0) + '</strong><span>Followers</span></div>' +
      '<div class="md-count"><strong>' + Number(p.following_count || 0) + '</strong><span>Following</span></div></div>' +
      '<div class="md-actions"><button type="button" class="pt-btn md-follow' + (following ? " is-following" : "") + '" data-profile-follow="' + p.id + '">' +
      (following ? "Following · Unfollow" : "Follow") + '</button><button type="button" class="pt-btn" data-message-soon="' + p.id + '">Message</button></div>' +
      '<span class="md-coming">Private messaging · Coming soon</span></div>';
  }

  async function toggleFollow(id) {
    if (!(await needUser())) return;
    if (!id || id === uid) return toast("You can't follow your own profile.");
    const wasFollowing = followedIds.has(id);
    const result = wasFollowing
      ? await sb.from("member_follows").delete().eq("follower_id", uid).eq("followed_id", id)
      : await sb.from("member_follows").insert({ follower_id: uid, followed_id: id });
    if (result.error) {
      toast(result.error.code === "23505" ? "You're already following this member." : "Could not update your follow. Please try again.");
      return;
    }
    if (wasFollowing) followedIds.delete(id); else followedIds.add(id);
    toast(wasFollowing ? "You unfollowed this member." : "You're now following this member.");
    await loadPeople(true);
    if (selectedPerson && selectedPerson.id === id) {
      selectedPerson = people.find((p) => p.id === id) || selectedPerson;
      paintPublicProfile();
    }
  }

  mkPane("peopleSection",
    '<div class="md-hero"><h2>Meet people 👋</h2><p>Discover members, find people with shared interests, and grow your circle.</p>' +
    '<div class="md-search"><input id="mdSearch" type="search" maxlength="80" placeholder="Search by name, country or bio…" aria-label="Search members"></div>' +
    '<p class="muted" style="font-size:12px">Only public profile details are shown. Email, phone numbers and account credits stay private.</p></div>' +
    '<div id="mdPeopleList" class="md-people-list"><div class="pt-card">Loading members…</div></div>'
  );
  mkPane("publicProfileSection",
    '<div class="md-profile" id="mdPublicProfile"><p class="muted">Choose a member to view their profile.</p></div>'
  );

  const peopleSection = q("#peopleSection");
  if (peopleSection) {
    peopleSection.addEventListener("click", (e) => {
      const t = e.target;
      const follow = t.closest("[data-follow]");
      if (follow) { e.preventDefault(); e.stopPropagation(); return toggleFollow(follow.dataset.follow); }
      const person = t.closest("[data-person]");
      if (person) return openPerson(person.dataset.person);
    });
    peopleSection.addEventListener("input", (e) => {
      if (e.target && e.target.id === "mdSearch") paintPeople();
    });
  }
  const publicProfilePane = q("#publicProfileSection");
  if (publicProfilePane) {
    publicProfilePane.addEventListener("click", (e) => {
      const t = e.target;
      const follow = t.closest("[data-profile-follow]");
      if (follow) return toggleFollow(follow.dataset.profileFollow);
      const message = t.closest("[data-message-soon]");
      if (message) toast("Private messaging is coming soon. You can follow this member for now.");
    });
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest && e.target.closest('[data-go="peopleSection"]')) loadPeople(true);
  });
  // ---------- Explore page
  const CARDS = [
    ["peopleSection", "👥", "Meet people", "Discover community members, follow profiles and grow your circle.", "Open", "24,119,242"],
    ["datingSection", "❤️", "Dating Site First With Love Log", "Directory of dating websites, with safety tips.", "Open", "255,95,109"],
    ["jobsSection", "💼", "Apply for Jobs", "Admin-posted job openings.", "Open", "17,153,142"],
    ["designSection", "🎓", "Educational Design Studio", "Practice templates for design learning.", "Open", "106,90,205"],
    ["aitoolsSection", "✨", "AI Tools Library", "Image, video and voice tools for creators.", "Coming soon", "24,119,242"],
    ["librarySection", "📚", "Community Library", "Guides, tutorials and downloads.", "Open", "15,155,142"],
  ];
  const MORE = [["shopSection", "🎁", "Gift shop"], ["socialsSection", "🛍️", "MuskySocials accounts"], ["askazaSection", "💱", "Ask 4 Aza"],
    ["docsSection", "📄", "My documents"], ["viralBoostSection", "🚀", "Viral Boost Studio"], ["aboutSection", "ℹ️", "About us"], ["contactSection", "📞", "Contact us"], ["privacySection", "🔒", "Privacy"]];
  mkPane("exploreSection",
    "<h2>🧭 Explore</h2><p>Find what you need, all in one place.</p><div class='ex-grid'>" +
    CARDS.map(([id, ic, t, d, tag, rgb]) =>
      "<button class='ex-card' data-go='" + id + "' style='background:rgba(" + rgb + ",.12)'><span class='ic'>" + ic + "</span><b>" + t + "</b><span class='d'>" + d + "</span>" +
      "<span class='ex-tag" + (tag === "Open" ? " ok" : "") + "' style='color:" + (tag === "Open" ? "#0a7d33" : "#9a6700") + "'>" + tag + "</span></button>").join("") +
    "</div><div class='pf-group' style='margin:16px 0 4px;font-weight:700;font-size:13px'>MORE</div>" +
    MORE.map(([id, ic, t]) => "<button class='ex-row' data-go='" + id + "'><span>" + ic + " " + t + "</span><span>›</span></button>").join(""));

  // ---------- Tools page (your existing AI Studio, unchanged)
  const TOOLS = [["videoSection", "🎬", "Photo to video", ""], ["headswapSection", "🪄", "HeadSwap", ""], ["chatSection", "💬", "AI chat", ""],
    ["voiceSection", "🎙️", "Voice studio", ""], ["cameraSection", "📷", "Camera studio", ""], ["viralBoostSection", "🚀", "Viral Boost Studio", "Prepare captions and campaign drafts"], ["voiceCloneSection", "🗣️", "Voice clone", "soon"],
    ["creditSection", "🪙", "Buy credit", "soon"], ["aitoolsSection", "✨", "AI Tools Library", "soon"]];
  mkPane("toolsHubSection",
    "<h2>✨ Tools</h2><p>Your AI Studio. Everything here works as before.</p><div class='sh-grid'>" +
    TOOLS.map(([id, ic, t, n]) => "<button class='sh-tile' data-go='" + id + "'><span class='ico'>" + ic + "</span>" + t + (n ? "<small>" + n + "</small>" : "") + "</button>").join("") + "</div>");

  
  // ---------- Notifications page
  mkPane(
    "notifSection",
    "<div id='notificationsLoading'>Loading notifications...</div>"
  );
  const soon = (id, ic, title, intro, bullets, back) =>
    mkPane(id, "<h2>" + ic + " " + title + "</h2><div class='hm-badge'>Coming soon</div><p>" + intro + "</p>" +
      (bullets.length ? "<ul class='hm-ul'>" + bullets.map((b) => "<li>" + b + "</li>").join("") + "</ul>" : "") +
      "<button class='pt-btn' data-go='" + back + "'>‹ Back</button>");
  soon("datingSection", "❤️", "Dating Site First With Love Log", "A directory of dating websites with descriptions and links. Nothing is listed yet.",
    ["Relationship categories and country filters", "Age rule: adults 18+ only", "A review status and last-checked date on every listing", "A site is only called verified after checks are recorded",
     "A Report button on every listing", "We cannot guarantee that people or relationships on any site are genuine"], "exploreSection");
  // Create the Jobs pane before jobs.js starts; do not replace it with a Coming Soon screen.
  mkPane("jobsSection", "<p>Loading job listings...</p>");
  soon("designSection", "🎓", "Educational Design Studio", "Practice templates for learning graphic design, such as CVs, business cards, flyers, invitations and social posts.",
    ["Every template is marked as a sample for learning", "Invented names and details only", "No ID cards, tickets, boarding passes or official documents"], "exploreSection");
  soon("aitoolsSection", "✨", "AI Tools Library", "A guide to AI tools for images, photo editing, video, voice, hairstyles and clothing, backgrounds and enhancement.",
    ["Official links only", "Free tier or paid, and limits, shown only when confirmed", "Meanwhile, try the tools on the Tools tab"], "toolsHubSection");
  if (!home.hidden) window.shell.renderHome(); // the old tile Home may already be showing
}
