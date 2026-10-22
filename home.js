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
`;
  document.head.appendChild(st);

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
    actions.insertAdjacentHTML("afterbegin", "<button class='tb-ic' id='tbSearch' aria-label='Search'>🔍</button><button class='tb-ic' id='tbBell' aria-label='Notifications'>🔔</button>");
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
  sb.auth.onAuthStateChange(() => setTimeout(loadMe, 0));
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
      return '<div class="pt-card hm-post" data-id="' + p.id + '">' +
        '<div class="hm-head"><div class="hm-logo">M</div><div><strong>MuskySocials Updates</strong><div class="hm-sub">' + ago(p.created_at) + (p.pinned ? " · 📌 Pinned" : "") + " · 🌐</div></div></div>" +
        '<div class="hm-title">' + esc(p.title) + "</div>" +
        (p.body ? '<div class="hm-body">' + esc(p.body) + "</div>" : "") +
        (p.cta !== "none" ? '<div style="margin-top:10px"><button class="pt-btn" data-cta="' + p.cta + '" data-title="' + esc(p.title) + '">' + (p.cta === "buy" ? "Buy" : "Contact us") + "</button></div>" : "") +
        '<div class="hm-counts"><span>👍 ' + set.size + "</span><span>" + list.length + " comment" + (list.length === 1 ? "" : "s") + "</span></div>" +
        '<div class="hm-actions"><button data-like="' + p.id + '" class="' + (liked ? "on" : "") + '">👍 Like</button>' +
        '<button data-cm="' + p.id + '">💬 Comment</button><button data-share="' + p.id + '">↗ Share</button></div>' +
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
    if (t.closest("#hmShare")) return compose();
    if (t.closest("#hmAdmin")) return go("adminSection");
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
    ["notifSection", "🔔", "Notifications", "linear-gradient(160deg,#1877f2,#8a5cf6)"],
    ["datingSection", "❤️", "Dating Guide", "linear-gradient(160deg,#ff5f6d,#ffc371)"],
    ["jobsSection", "💼", "Job Updates", "linear-gradient(160deg,#11998e,#38ef7d)"],
    ["toolsHubSection", "✨", "AI Tools", "linear-gradient(160deg,#3a1c71,#6a82fb)"],
    ["shopSection", "🎁", "Gifts", "linear-gradient(160deg,#f7971e,#ffb347)"],
    ["librarySection", "📚", "Library", "linear-gradient(160deg,#0f9b8e,#4facfe)"],
  ];
  window.shell.homeRenderer = (el, ctx) => {
    credits = ctx && ctx.credits;
    el.innerHTML = '<div class="sh"><div class="hm-comp"><div class="hm-av" id="hmAv">?</div>' +
      '<button class="hm-pill" id="hmShare">What would you like to share?</button></div>' +
      '<div class="hm-meta"><span>🪙 ' + (credits === null || credits === undefined ? "…" : credits) + ' credits · refills to 80 daily</span>' +
      (isAdmin ? '<button id="hmAdmin">🛠️ Admin studio</button>' : "") + "</div>" +
      '<div class="hm-stories">' + STORIES.map(([id, ic, label, bg]) =>
        '<button class="hm-story" data-go="' + id + '" style="background:' + bg + '"><span class="ic">' + ic + "</span><b>" + label + "</b></button>").join("") + "</div>" +
      '<div id="hmFeed">Loading…</div></div>';
    paintAv(q("#hmAv"));
    paintFeed();
    fetchFeed(false);
  };
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

  // ---------- Explore page
  const CARDS = [
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
