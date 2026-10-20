// MuskySocials Admin hub v1: turns the Admin studio into a Facebook-style list of folders.
// Loaded automatically by portal.js after the other admin pieces have added their boxes.
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

const ok = await wait(() => window.portal && q("#adminSection .pt #adStats") && q("#adMake"));
if (ok) {
  await new Promise((r) => setTimeout(r, 2500)); // give feed.js, shop.js and photos.js time to add their boxes
  start();
}

function start() {
  const admin = q("#adminSection");
  const card = (sel) => { const e = q(sel); return e ? e.closest(".pt-card") : null; };
  const defs = [
    { ico: "📝", title: "Posting", sub: "Post to the feed, pin or delete posts", els: [card("#fpGo")] },
    { ico: "💱", title: "Ask 4 Aza", sub: "Payment methods, timings and logos", els: [card("#azGo")] },
    { ico: "📚", title: "Library", sub: "Upload documents anyone can read", els: [card("#lbGo")] },
    { ico: "💼", title: "Jobs", sub: "Post, edit and verify job listings", els: [card("#jbGo")] },
    { ico: "❤️", title: "Dating directory", sub: "Add sites, review status, links", els: [card("#dtGo")] },
    { ico: "🚩", title: "Reports", sub: "Review reports and remove content", els: [card("#rpRefresh")] },
    { ico: "🛍️", title: "Account listings", sub: "Add accounts, prices and status", els: [card("#alGo")] },
    { ico: "🎁", title: "Gifts", sub: "Add gifts, prices and stock", els: [card("#gaGo")] },
    { ico: "🖼️", title: "Working photos", sub: "Photos for clients to approve", els: [card("#phGo")] },
    { ico: "📁", title: "Clients & files", sub: "Client folders and PDF documents", els: [card("#adMake"), card("#adUp"), q("#adMsg"), q("#adList")] },
  ].map((d) => ({ ...d, els: d.els.filter(Boolean) })).filter((d) => d.els.length);
  const all = defs.flatMap((d) => d.els);

  const st = document.createElement("style");
  st.textContent = `
.ah-row{display:flex;align-items:center;gap:12px;width:100%;padding:14px 4px;border:0;border-top:1px solid var(--sh-line,#dadde1);background:transparent;color:var(--sh-text,#050505);text-align:left;font-size:16px}
.ah-ico{flex:none;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;background:var(--sh-line,#e4e6eb)}
.ah-t{font-weight:700}
.ah-s{font-size:13px;color:var(--sh-sub,#65676b)}
.ah-chev{margin-left:auto;font-size:24px;color:var(--sh-sub,#65676b)}
.ah-bar{display:flex;align-items:center;gap:10px;margin:8px 0}
.ah-back{padding:8px 14px;border-radius:10px;border:1px solid var(--sh-line,#ccd0d5);background:transparent;color:var(--sh-text,#050505);font-size:15px}
html.mx-light #studio .ah-s,html.mx-light #studio .ah-chev{color:#65676b!important}
html.mx-light #studio .ah-back{color:#050505!important}
`;
  document.head.appendChild(st);

  admin.querySelector("#adStats").insertAdjacentHTML("afterend",
    "<div id='ahHub'>" + defs.map((d, i) =>
      "<button class='ah-row' data-ah='" + i + "'><span class='ah-ico'>" + d.ico + "</span><span><div class='ah-t'>" + d.title +
      "</div><div class='ah-s'>" + d.sub + "</div></span><span class='ah-chev'>›</span></button>").join("") + "</div>" +
    "<div id='ahBar' class='ah-bar' style='display:none'><button class='ah-back' id='ahBack'>‹ Back</button><strong id='ahTitle'></strong></div>");
  const hub = q("#ahHub");
  const bar = q("#ahBar");

  function showHub() {
    all.forEach((e) => { e.style.display = "none"; });
    hub.style.display = "";
    bar.style.display = "none";
  }
  function open(i) {
    all.forEach((e) => { e.style.display = "none"; });
    defs[i].els.forEach((e) => { e.style.display = ""; });
    hub.style.display = "none";
    bar.style.display = "flex";
    q("#ahTitle").textContent = defs[i].title;
    window.scrollTo({ top: 0 });
  }
  hub.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ah]");
    if (b) open(+b.dataset.ah);
  });
  q("#ahBack").addEventListener("click", showHub);
  // Coming back to Admin from another tab always starts at the list.
  window.portal.onShow(admin, showHub);
  showHub();
}
