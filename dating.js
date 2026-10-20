// MuskySocials Dating directory v1: a directory of dating sites with links, categories, country filter,
// 18+ notice, review status, last-checked date and a Report button. You manage it in Admin.
// A site is only marked "Reviewed" when YOU do it. Loaded by portal.js (listed in modules.json).
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

const ready = await wait(() => window.portal && q("#datingSection .pt") && q("#adminSection .pt #adStats"));
if (ready) start();

function start() {
  const { sb, esc, onShow } = window.portal;
  const pane = q("#datingSection");
  const admin = q("#adminSection");
  const safeHref = (u) => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch { return ""; } };
  const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

  const st = document.createElement("style");
  st.textContent = `
.dt-note{font-size:13px;padding:10px;border-radius:10px;border:1px solid var(--sh-line,#dadde1);margin-bottom:10px}
.dt-name{font-weight:800;font-size:17px;color:var(--sh-blue,#1877f2);text-decoration:none;overflow-wrap:anywhere}
.dt-sub{font-size:13px;color:var(--sh-sub,#65676b);margin-top:2px}
.dt-desc{font-size:14px;margin:6px 0;line-height:1.4}
.dt-pill{display:inline-block;font-size:12px;font-weight:700;padding:3px 9px;border-radius:999px;border:1px solid currentColor}
.dt-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.dt-acts a.pt-btn{text-decoration:none;display:inline-block}
.dt-rep{background:transparent!important;border:1px solid var(--sh-line,#ccd0d5)!important;color:var(--sh-text,#050505)!important}
html.mx-light #studio .dt-name{color:#1877f2!important}
html.mx-light #studio .dt-sub{color:#65676b!important}
html.mx-light #studio .dt-pill.ok{color:#0a7d33!important}
html.mx-light #studio .dt-pill.warn{color:#9a6700!important}
html.mx-light #studio .dt-pill.bad{color:#d93025!important}
html.mx-light #studio a.pt-btn{color:#fff!important}
`;
  document.head.appendChild(st);

  // ---------- Directory screen
  pane.querySelector(".pt").innerHTML =
    "<h2>❤️ Dating Site First With Love Log</h2>" +
    "<div class='dt-note'><b>18+ only.</b> Links go to other companies' websites. <b>Reviewed</b> means we checked that the site exists and read its rules. " +
    "It does <b>not</b> mean the people or relationships on it are genuine. We cannot guarantee that.</div>" +
    "<details class='pf-d'><summary>🛡️ Stay safe (read this)</summary><ul class='hm-ul'>" +
    "<li>Never send money, gift cards or crypto to someone you have not met in person.</li>" +
    "<li>Never share one-time codes, passwords, ID photos or bank details.</li>" +
    "<li>Do a video call early. Be careful if they always refuse.</li>" +
    "<li>Search their photos online to see if they belong to someone else.</li>" +
    "<li>Meet in a public place and tell a friend where you are going.</li>" +
    "<li>Report anything suspicious to the site, and to us with the Report button.</li></ul></details>" +
    "<div class='gs-chips' id='dtChips'></div>" +
    "<select id='dtCountry' class='pt-in' aria-label='Country'></select><div id='dtList'>Loading…</div>";
  const list = pane.querySelector("#dtList");
  const chips = pane.querySelector("#dtChips");
  const csel = pane.querySelector("#dtCountry");
  let sites = [];
  let cat = "All";
  let country = "All countries";

  function draw() {
    const cats = ["All", ...new Set(sites.map((s) => s.category))];
    chips.innerHTML = cats.map((c) => '<button class="gs-chip' + (c === cat ? " on" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>").join("");
    const countries = ["All countries", ...new Set(sites.map((s) => s.country))];
    csel.innerHTML = countries.map((c) => "<option" + (c === country ? " selected" : "") + ">" + esc(c) + "</option>").join("");
    const shown = sites.filter((s) => (cat === "All" || s.category === cat) && (country === "All countries" || s.country === country));
    list.innerHTML = shown.length ? shown.map((s) => {
      const href = safeHref(s.url);
      const status = s.review_status === "Reviewed" ? ["ok", "✅ Reviewed"] : s.review_status === "Flagged" ? ["bad", "⚠️ Flagged: take extra care"] : ["warn", "Not yet reviewed"];
      return '<div class="pt-card dt-card"><a class="dt-name" href="' + esc(href || "#") + '" target="_blank" rel="noopener noreferrer">' + esc(s.name) + " ↗</a>" +
        '<div class="dt-sub">' + esc(s.category) + " · " + esc(s.country) + "</div>" +
        (s.description ? '<div class="dt-desc">' + esc(s.description) + "</div>" : "") +
        '<div class="dt-sub">' + esc(s.age_note) + "</div>" +
        '<div style="margin-top:6px"><span class="dt-pill ' + status[0] + '" style="color:' + (status[0] === "ok" ? "#0a7d33" : status[0] === "bad" ? "#d93025" : "#9a6700") + '">' + status[1] + "</span> " +
        '<span class="dt-sub">' + (s.last_checked ? "Last checked: " + fmt(s.last_checked) : "Last checked: not yet") + "</span></div>" +
        '<div class="dt-acts"><a class="pt-btn" href="' + esc(href || "#") + '" target="_blank" rel="noopener noreferrer">Visit link</a>' +
        '<button class="pt-btn dt-rep" data-rep="' + s.id + '">Report</button></div></div>';
    }).join("") : "<p>No sites found.</p>";
  }
  async function load() {
    const { data, error } = await sb.from("dating_sites").select("*").eq("active", true).order("name");
    if (error) { list.textContent = "Could not load the directory. Sign in and try again."; return; }
    sites = data;
    draw();
  }
  csel.addEventListener("change", () => { country = csel.value; draw(); });
  pane.addEventListener("click", (e) => {
    const c = e.target.closest("[data-cat]");
    if (c) { cat = c.dataset.cat; return draw(); }
    const r = e.target.closest("[data-rep]");
    if (r && window.portal.report) {
      const s = sites.find((x) => x.id === r.dataset.rep);
      window.portal.report("dating", r.dataset.rep, s ? s.name : "");
    }
  });
  onShow(pane, load);

  // ---------- Admin: add, edit, review, hide, delete
  q("#adminSection #adStats").insertAdjacentHTML("afterend",
    "<div class='pt-card'><strong id='dtFormTitle'>Add a dating site</strong>" +
    "<input id='dtName' class='pt-in' maxlength='80' placeholder='Site name'>" +
    "<input id='dtUrl' class='pt-in' type='url' maxlength='300' placeholder='Link, e.g. https://example.com'>" +
    "<input id='dtCat' class='pt-in' list='dtCats' maxlength='40' placeholder='Category, e.g. Serious relationships'>" +
    "<datalist id='dtCats'><option value='Mainstream'><option value='Serious relationships'><option value='Over 50'><option value='Faith-based'><option value='LGBTQ+'><option value='Africa and Black singles'><option value='Europe'><option value='Asia'><option value='Casual'></datalist>" +
    "<input id='dtCtry' class='pt-in' maxlength='60' placeholder='Country (or Global)'>" +
    "<textarea id='dtDesc' class='pt-in' rows='2' maxlength='500' placeholder='Short, honest description'></textarea>" +
    "<input id='dtAge' class='pt-in' maxlength='200' placeholder=\"Age note (default: 18+ only. Check the site's own rules.)\">" +
    "<select id='dtStat' class='pt-in'><option>Not reviewed</option><option>Reviewed</option><option>Flagged</option></select>" +
    "<label class='pt-msg'>Last checked (set it only when you really checked)</label><input id='dtDate' class='pt-in' type='date'>" +
    "<button class='pt-btn' id='dtGo'>Add site</button> <button class='pt-btn del' id='dtCancel' style='display:none'>Cancel edit</button> " +
    "<button class='pt-btn' id='dtSeed'>Add the starter list</button><p class='pt-msg' id='dtMsg'></p>" +
    "<strong>Your sites</strong><input id='dtFilter' class='pt-in' placeholder='Search this list'><div id='dtAdminList'></div></div>");
  const $ = (id) => admin.querySelector("#" + id);
  const say = (t) => { $("dtMsg").textContent = t; };
  let rows = [];
  let editId = null;

  function resetForm() {
    editId = null;
    ["dtName", "dtUrl", "dtCat", "dtCtry", "dtDesc", "dtAge", "dtDate"].forEach((id) => { $(id).value = ""; });
    $("dtStat").value = "Not reviewed";
    $("dtGo").textContent = "Add site";
    $("dtCancel").style.display = "none";
    $("dtFormTitle").textContent = "Add a dating site";
  }
  function drawAdmin() {
    const t = $("dtFilter").value.trim().toLowerCase();
    const shown = rows.filter((s) => !t || (s.name + " " + s.category + " " + s.country).toLowerCase().includes(t)).slice(0, 80);
    $("dtAdminList").innerHTML = shown.length ? shown.map((s) =>
      '<div class="pt-row"><span>' + (s.active ? "" : "🚫 ") + esc(s.name) + "<br><small>" + esc(s.category) + " · " + esc(s.country) + " · " + esc(s.review_status) +
      (s.last_checked ? " · " + s.last_checked : "") + '</small></span><span>' +
      '<button class="pt-btn" data-edit="' + s.id + '">Edit</button> ' +
      '<button class="pt-btn" data-rev="' + s.id + '">Reviewed today</button> ' +
      '<button class="pt-btn" data-vis="' + s.id + '">' + (s.active ? "Hide" : "Show") + "</button> " +
      '<button class="pt-btn del" data-del="' + s.id + '">Delete</button></span></div>').join("") : "<p>Nothing found.</p>";
  }
  async function loadAdmin() {
    const { data, error } = await sb.from("dating_sites").select("*").order("name");
    if (error) { $("dtAdminList").textContent = "Run the dating database step first, or admin access is needed."; return; }
    rows = data;
    drawAdmin();
  }
  onShow(admin, loadAdmin);
  $("dtFilter").addEventListener("input", drawAdmin);

  $("dtGo").addEventListener("click", async () => {
    const name = $("dtName").value.trim();
    const url = safeHref($("dtUrl").value.trim());
    const category = $("dtCat").value.trim();
    if (!name || !url || !category) return say("Type the name, a full link starting with https://, and the category.");
    const row = {
      name, url, category, country: $("dtCtry").value.trim() || "Global", description: $("dtDesc").value.trim() || null,
      age_note: $("dtAge").value.trim() || "18+ only. Check the site's own rules.", review_status: $("dtStat").value, last_checked: $("dtDate").value || null,
    };
    const res = editId ? await sb.from("dating_sites").update(row).eq("id", editId) : await sb.from("dating_sites").insert(row);
    if (res.error) return say("Could not save: " + res.error.message);
    say(editId ? "Changes saved." : "Added to the directory.");
    resetForm();
    loadAdmin();
  });
  $("dtCancel").addEventListener("click", () => { resetForm(); say(""); });

  $("dtSeed").addEventListener("click", async () => {
    const b = $("dtSeed");
    b.disabled = true;
    say("Adding the starter list…");
    try {
      const r = await fetch("dating-list.json", { cache: "no-store" });
      if (!r.ok) throw new Error("dating-list.json was not found in your site files");
      const all = await r.json();
      const { error } = await sb.from("dating_sites").upsert(all, { onConflict: "name", ignoreDuplicates: true });
      if (error) throw error;
      say("Done. " + all.length + " sites are in the directory (all marked Not reviewed).");
      loadAdmin();
    } catch (err) {
      say("Could not add the list: " + (err.message || err));
    }
    b.disabled = false;
  });

  $("dtAdminList").addEventListener("click", async (e) => {
    const ed = e.target.closest("[data-edit]");
    if (ed) {
      const s = rows.find((x) => x.id === ed.dataset.edit);
      if (!s) return;
      editId = s.id;
      $("dtName").value = s.name; $("dtUrl").value = s.url; $("dtCat").value = s.category; $("dtCtry").value = s.country;
      $("dtDesc").value = s.description || ""; $("dtAge").value = s.age_note || ""; $("dtStat").value = s.review_status; $("dtDate").value = s.last_checked || "";
      $("dtGo").textContent = "Save changes";
      $("dtCancel").style.display = "";
      $("dtFormTitle").textContent = "Edit dating site";
      $("dtName").scrollIntoView({ block: "center" });
      return;
    }
    const rv = e.target.closest("[data-rev]");
    if (rv) {
      if (!confirm("Mark this site as Reviewed today? Only do this after you really checked it.")) return;
      const { error } = await sb.from("dating_sites").update({ review_status: "Reviewed", last_checked: new Date().toLocaleDateString("en-CA") }).eq("id", rv.dataset.rev);
      say(error ? "Could not update: " + error.message : "Marked as reviewed today.");
      return loadAdmin();
    }
    const vs = e.target.closest("[data-vis]");
    if (vs) {
      const s = rows.find((x) => x.id === vs.dataset.vis);
      const { error } = await sb.from("dating_sites").update({ active: !s.active }).eq("id", s.id);
      say(error ? "Could not change: " + error.message : s.active ? "Hidden from everyone." : "Visible again.");
      return loadAdmin();
    }
    const d = e.target.closest("[data-del]");
    if (d && confirm("Delete this site from the directory?")) {
      const { error } = await sb.from("dating_sites").delete().eq("id", d.dataset.del);
      say(error ? "Could not delete: " + error.message : "Deleted.");
      loadAdmin();
    }
  });
}
