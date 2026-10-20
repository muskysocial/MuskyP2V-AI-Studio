// MuskySocials Jobs board v1: you publish, edit and remove jobs in Admin; everyone browses and applies.
// Verified means YOU checked the employer. Loaded by portal.js (listed in modules.json).
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

const ready = await wait(() => window.portal && q("#jobsSection .pt") && q("#adminSection .pt #adStats"));
if (ready) start();

function start() {
  const { sb, esc, onShow } = window.portal;
  const pane = q("#jobsSection");
  const admin = q("#adminSection");
  const today = () => new Date().toLocaleDateString("en-CA");
  const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  const safeHref = (u) => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ""; } catch { return ""; } };

  const st = document.createElement("style");
  st.textContent = `
.jb-note{font-size:13px;padding:10px;border-radius:10px;border:1px solid var(--sh-line,#dadde1);margin-bottom:10px}
.jb-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.jb-sub{font-size:13px;color:var(--sh-sub,#65676b);margin-top:2px}
.jb-badge{flex:none;font-size:12px;font-weight:700;padding:3px 8px;border-radius:999px;border:1px solid currentColor}
.jb-body{white-space:pre-wrap;line-height:1.45;font-size:14px;margin:6px 0;overflow-wrap:anywhere}
.jb-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center}
.jb-acts a.pt-btn{text-decoration:none;display:inline-block}
.jb-link{background:transparent!important;border:1px solid var(--sh-line,#ccd0d5)!important;color:var(--sh-text,#050505)!important}
html.mx-light #studio .jb-sub{color:#65676b!important}
html.mx-light #studio .jb-badge.ok{color:#0a7d33!important}
html.mx-light #studio .jb-badge.warn{color:#9a6700!important}
`;
  document.head.appendChild(st);

  // ---------- Jobs screen
  pane.querySelector(".pt").innerHTML =
    "<h2>💼 Jobs</h2><div class='jb-note'><b>Stay safe:</b> never pay money to get a job, and check an employer before you share personal details or documents. " +
    "<b>Verified</b> means the MuskySocials team checked the employer. <b>Unverified</b> means we have not checked it.</div>" +
    "<div class='gs-chips' id='jbChips'></div><div id='jbList'>Loading…</div>";
  const list = pane.querySelector("#jbList");
  const chips = pane.querySelector("#jbChips");
  let jobs = [];
  let filter = "All";

  function applyBlock(m) {
    const t = (m || "").trim();
    const href = safeHref(t);
    if (href) return '<a class="pt-btn" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">Apply</a>';
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return '<a class="pt-btn" href="mailto:' + esc(t) + '">Apply by email</a>';
    return '<div class="jb-body"><b>How to apply:</b> ' + esc(t) + "</div>";
  }
  function draw() {
    chips.innerHTML = ["All", "Verified", "Unverified"].map((c) => '<button class="gs-chip' + (c === filter ? " on" : "") + '" data-f="' + c + '">' + c + "</button>").join("");
    const shown = jobs.filter((j) => (!j.deadline || j.deadline >= today()) &&
      (filter === "All" || (filter === "Verified") === j.verified));
    list.innerHTML = shown.length ? shown.map((j) =>
      '<div class="pt-card jb-card"><div class="jb-top"><strong>' + esc(j.title) + '</strong><span class="jb-badge ' + (j.verified ? "ok" : "warn") +
      '" style="color:' + (j.verified ? "#0a7d33" : "#9a6700") + '">' + (j.verified ? "✅ Verified" : "⚠️ Unverified") + "</span></div>" +
      '<div class="jb-sub">' + esc(j.employer) + (j.location ? " · " + esc(j.location) : "") + "</div>" +
      '<div class="jb-sub">' + (j.deadline ? "Apply by " + fmt(j.deadline) : "No deadline given") + "</div>" +
      "<details><summary>Details and requirements</summary><div class='jb-body'>" + esc(j.description) + "</div>" +
      (j.requirements ? "<div class='jb-body'><b>Requirements</b>\n" + esc(j.requirements) + "</div>" : "") + "</details>" +
      '<div class="jb-acts">' + applyBlock(j.apply_method) + '<button class="pt-btn jb-link" data-rep="' + j.id + '">Report</button></div></div>').join("")
      : "<p>No open jobs right now. Check back soon.</p>";
  }
  async function load() {
    const { data, error } = await sb.from("jobs").select("*").eq("active", true).order("created_at", { ascending: false });
    if (error) { list.textContent = "Could not load the jobs. Sign in and try again."; return; }
    jobs = data;
    draw();
  }
  pane.addEventListener("click", (e) => {
    const f = e.target.closest("[data-f]");
    if (f) { filter = f.dataset.f; return draw(); }
    const r = e.target.closest("[data-rep]");
    if (r && window.portal.report) {
      const j = jobs.find((x) => x.id === r.dataset.rep);
      window.portal.report("job", r.dataset.rep, j ? j.title : "");
    }
  });
  onShow(pane, load);

  // ---------- Admin: publish, edit, remove
  q("#adminSection #adStats").insertAdjacentHTML("afterend",
    "<div class='pt-card'><strong id='jbFormTitle'>Post a job</strong>" +
    "<input id='jbTitle' class='pt-in' maxlength='120' placeholder='Job title'>" +
    "<input id='jbEmp' class='pt-in' maxlength='120' placeholder='Employer'>" +
    "<input id='jbLoc' class='pt-in' maxlength='120' placeholder='Location (or Remote)'>" +
    "<label class='pt-msg'>Application deadline (optional)</label><input id='jbDead' class='pt-in' type='date'>" +
    "<textarea id='jbDesc' class='pt-in' rows='4' maxlength='4000' placeholder='Job description'></textarea>" +
    "<textarea id='jbReq' class='pt-in' rows='3' maxlength='2000' placeholder='Requirements (optional)'></textarea>" +
    "<input id='jbApply' class='pt-in' maxlength='400' placeholder='How to apply: a link, an email, or short instructions'>" +
    "<label style='display:flex;gap:8px;align-items:center;margin:6px 0'><input id='jbVer' type='checkbox'> Verified: I have checked this employer</label>" +
    "<button class='pt-btn' id='jbGo'>Post job</button> <button class='pt-btn del' id='jbCancel' style='display:none'>Cancel edit</button><p class='pt-msg' id='jbMsg'></p>" +
    "<strong>Your jobs</strong><div id='jbAdminList'></div></div>");
  const $ = (id) => admin.querySelector("#" + id);
  const say = (t) => { $("jbMsg").textContent = t; };
  let rows = [];
  let editId = null;

  function resetForm() {
    editId = null;
    ["jbTitle", "jbEmp", "jbLoc", "jbDead", "jbDesc", "jbReq", "jbApply"].forEach((id) => { $(id).value = ""; });
    $("jbVer").checked = false;
    $("jbGo").textContent = "Post job";
    $("jbCancel").style.display = "none";
    $("jbFormTitle").textContent = "Post a job";
  }
  async function loadAdmin() {
    const { data, error } = await sb.from("jobs").select("*").order("created_at", { ascending: false });
    if (error) { $("jbAdminList").textContent = "Run the jobs database step first, or admin access is needed."; return; }
    rows = data;
    $("jbAdminList").innerHTML = rows.length ? rows.map((j) =>
      '<div class="pt-row"><span>' + (j.active ? "" : "🚫 ") + esc(j.title) + "<br><small>" + esc(j.employer) + " · " + (j.verified ? "Verified" : "Unverified") +
      (j.deadline ? " · " + j.deadline : "") + (j.deadline && j.deadline < today() ? " (closed)" : "") + '</small></span><span>' +
      '<button class="pt-btn" data-edit="' + j.id + '">Edit</button> ' +
      '<button class="pt-btn" data-ver="' + j.id + '">' + (j.verified ? "Unverify" : "Verify") + "</button> " +
      '<button class="pt-btn" data-vis="' + j.id + '">' + (j.active ? "Hide" : "Show") + "</button> " +
      '<button class="pt-btn del" data-del="' + j.id + '">Delete</button></span></div>').join("") : "<p>No jobs yet.</p>";
  }
  onShow(admin, loadAdmin);

  $("jbGo").addEventListener("click", async () => {
    const title = $("jbTitle").value.trim(), employer = $("jbEmp").value.trim();
    const description = $("jbDesc").value.trim(), apply_method = $("jbApply").value.trim();
    if (!title || !employer || !description || !apply_method) return say("Fill in the title, employer, description and how to apply.");
    const row = {
      title, employer, description, apply_method, location: $("jbLoc").value.trim() || null,
      requirements: $("jbReq").value.trim() || null, deadline: $("jbDead").value || null, verified: $("jbVer").checked,
    };
    const res = editId ? await sb.from("jobs").update(row).eq("id", editId) : await sb.from("jobs").insert(row);
    if (res.error) return say("Could not save: " + res.error.message);
    say(editId ? "Changes saved." : "Job posted. It is on the Jobs page now.");
    resetForm();
    loadAdmin();
  });
  $("jbCancel").addEventListener("click", () => { resetForm(); say(""); });

  $("jbAdminList").addEventListener("click", async (e) => {
    const ed = e.target.closest("[data-edit]");
    if (ed) {
      const j = rows.find((x) => x.id === ed.dataset.edit);
      if (!j) return;
      editId = j.id;
      $("jbTitle").value = j.title; $("jbEmp").value = j.employer; $("jbLoc").value = j.location || "";
      $("jbDead").value = j.deadline || ""; $("jbDesc").value = j.description; $("jbReq").value = j.requirements || "";
      $("jbApply").value = j.apply_method; $("jbVer").checked = j.verified;
      $("jbGo").textContent = "Save changes";
      $("jbCancel").style.display = "";
      $("jbFormTitle").textContent = "Edit job";
      $("jbTitle").scrollIntoView({ block: "center" });
      return;
    }
    const vr = e.target.closest("[data-ver]");
    if (vr) {
      const j = rows.find((x) => x.id === vr.dataset.ver);
      const { error } = await sb.from("jobs").update({ verified: !j.verified }).eq("id", j.id);
      say(error ? "Could not change: " + error.message : j.verified ? "Now unverified." : "Marked verified.");
      return loadAdmin();
    }
    const vs = e.target.closest("[data-vis]");
    if (vs) {
      const j = rows.find((x) => x.id === vs.dataset.vis);
      const { error } = await sb.from("jobs").update({ active: !j.active }).eq("id", j.id);
      say(error ? "Could not change: " + error.message : j.active ? "Hidden from everyone." : "Visible again.");
      return loadAdmin();
    }
    const d = e.target.closest("[data-del]");
    if (d && confirm("Delete this job?")) {
      const { error } = await sb.from("jobs").delete().eq("id", d.dataset.del);
      say(error ? "Could not delete: " + error.message : "Job deleted.");
      loadAdmin();
    }
  });
}
