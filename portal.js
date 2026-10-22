// MuskySocials client portal v1: client folders + documents (PDF), and the Admin screen.
// Needs auth.js and shell.js. Later pieces (photos.js, feed.js, shop.js) load themselves from here.
const wait = (test, ms = 15000) =>
  new Promise((res) => {
    const t0 = Date.now();
    (function tick() {
      const v = test();
      if (v || Date.now() - t0 > ms) res(v);
      else setTimeout(tick, 150);
    })();
  });

const ready = await wait(() => window.musky && window.musky.sb && window.shell);
const studio = document.querySelector("#studio");
if (ready && studio) start();

function start() {
  const sb = window.musky.sb;
  const BUCKET = "client-files";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const css = document.createElement("style");
  css.textContent = `
.pt{color:var(--sh-text,#050505);font-size:16px}
.pt h2{margin:0 0 10px;font-size:22px}
.pt p{color:var(--sh-sub,#65676b)}
.pt-card{border:1px solid var(--sh-line,#dadde1);border-radius:14px;background:var(--sh-card,#fff);padding:12px;margin:10px 0}
.pt-row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 0;border-top:1px solid var(--sh-line,#dadde1)}
.pt-row span{min-width:0;overflow-wrap:anywhere}
.pt-btn{padding:10px 14px;border:0;border-radius:10px;background:var(--sh-blue,#1877f2);color:#fff;font-size:15px;font-weight:600;white-space:nowrap}
.pt-btn:disabled{opacity:.5}
.pt-btn.del{background:transparent;border:1px solid #d93025;color:#d93025}
.pt-in{width:100%;padding:10px;margin:6px 0;border-radius:10px;border:1px solid var(--sh-line,#ccd0d5);background:var(--sh-card,#fff);color:var(--sh-text,#050505);font-size:16px}
.pt-msg{min-height:20px;font-size:14px}
html.mx-light #studio .pt-btn{color:#fff!important}
html.mx-light #studio .pt-btn.del{color:#d93025!important;background:transparent!important}
html.mx-light #studio .pt p,html.mx-light #studio .pt .pt-msg{color:#65676b!important}
`;
  document.head.appendChild(css);

  const footer = studio.querySelector(":scope > footer");
  const mkPane = (id, inner) => {
    const s = document.createElement("section");
    s.id = id;
    s.className = "pane";
    s.hidden = true;
    s.innerHTML = '<div class="pt">' + inner + "</div>";
    studio.insertBefore(s, footer);
    return s;
  };
  const addTile = (id, ico, label) => window.shell.addItem([id, ico, label, ""]);
  const onShow = (pane, fn) =>
    new MutationObserver(() => { if (!pane.hidden) fn(); }).observe(pane, { attributes: true, attributeFilter: ["hidden"] });

  async function openFile(path) {
    const w = window.open("", "_blank"); // opened first so phone browsers do not block it
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (error || !data) { if (w) w.close(); alert("Could not open this file."); return; }
    if (w) w.location = data.signedUrl;
    else location.href = data.signedUrl;
  }

  // ---------- Client view: My documents
  const docs = mkPane("docsSection", "<h2>My documents</h2><div id='ptDocs'>Loading…</div>");
  addTile("docsSection", "📄", "My documents");
  async function loadDocs() {
    const box = docs.querySelector("#ptDocs");
    const { data: projects, error } = await sb.from("projects").select("id,name").order("created_at", { ascending: false });
    if (error) { box.textContent = "Could not load your folders. Sign in and try again."; return; }
    if (!projects.length) { box.innerHTML = "<p>No folders yet. Files for your project will appear here.</p>"; return; }
    const { data: files } = await sb.from("documents").select("id,project_id,title,file_path")
      .in("project_id", projects.map((p) => p.id)).order("created_at", { ascending: false });
    box.innerHTML = projects.map((p) => {
      const list = (files || []).filter((f) => f.project_id === p.id);
      return '<div class="pt-card"><strong>' + esc(p.name) + "</strong>" +
        (list.length ? list.map((f) => '<div class="pt-row"><span>' + esc(f.title) +
          '</span><button class="pt-btn" data-open="' + esc(f.file_path) + '">Open</button></div>').join("")
          : "<p>No documents yet.</p>") + "</div>";
    }).join("");
  }
  docs.addEventListener("click", (e) => {
    const b = e.target.closest("[data-open]");
    if (b) openFile(b.dataset.open);
  });
  onShow(docs, loadDocs);

  // ---------- Admin view
  const admin = mkPane("adminSection",
    "<h2>Admin studio</h2><p class='pt-msg' id='adStats'></p>" +
    "<div class='pt-card'><strong>New client folder</strong><select id='adClient' class='pt-in'></select>" +
    "<input id='adProjName' class='pt-in' maxlength='80' placeholder='Folder name, e.g. Logo project'>" +
    "<button class='pt-btn' id='adMake'>Create folder</button></div>" +
    "<div class='pt-card'><strong>Upload a PDF</strong><select id='adProj' class='pt-in'></select>" +
    "<input id='adTitle' class='pt-in' maxlength='120' placeholder='Document title'>" +
    "<input id='adFile' class='pt-in' type='file' accept='application/pdf'>" +
    "<button class='pt-btn' id='adUp'>Upload</button></div>" +
    "<p class='pt-msg' id='adMsg'></p><div id='adList'></div>");
  // The Admin button appears on the bottom bar for admins only.
  const $a = (id) => admin.querySelector("#" + id);
  const say = (t) => { $a("adMsg").textContent = t; };
  let projects = [];

  async function loadAdmin() {
    const [pc, pj, dc] = await Promise.all([
      sb.from("profiles").select("id,display_name,email").order("created_at"),
      sb.from("projects").select("id,name,client_id").order("created_at", { ascending: false }),
      sb.from("documents").select("id,project_id,title,file_path").order("created_at", { ascending: false }),
    ]);
    if (pc.error || pj.error) { say("Admin access needed. Check your role in Supabase."); return; }
    const names = Object.fromEntries(pc.data.map((c) => [c.id, (c.display_name || "Client") + " · " + (c.email || "")]));
    projects = pj.data;
    $a("adStats").textContent = "Clients: " + pc.data.length + " · Folders: " + pj.data.length + " · Documents: " + (dc.data || []).length;
    $a("adClient").innerHTML = pc.data.map((c) => '<option value="' + c.id + '">' + esc(names[c.id]) + "</option>").join("");
    $a("adProj").innerHTML = projects.map((p) => '<option value="' + p.id + '">' + esc(names[p.client_id]) + " — " + esc(p.name) + "</option>").join("");
    $a("adList").innerHTML = projects.map((p) => {
      const list = (dc.data || []).filter((f) => f.project_id === p.id);
      return '<div class="pt-card"><strong>' + esc(p.name) + "</strong><p>" + esc(names[p.client_id]) + "</p>" +
        list.map((f) => '<div class="pt-row"><span>' + esc(f.title) + '</span><span><button class="pt-btn" data-open="' + esc(f.file_path) +
          '">Open</button> <button class="pt-btn del" data-deldoc="' + f.id + '" data-path="' + esc(f.file_path) + '">Delete</button></span></div>').join("") +
        '<div class="pt-row"><span></span><button class="pt-btn del" data-delproj="' + p.id + '">Delete folder</button></div></div>';
    }).join("") || "<p>No folders yet.</p>";
  }
  onShow(admin, loadAdmin);

  $a("adMake").addEventListener("click", async () => {
    const name = $a("adProjName").value.trim();
    const client_id = $a("adClient").value;
    if (!name || !client_id) return say("Pick a client and type a folder name.");
    const { error } = await sb.from("projects").insert({ client_id, name });
    if (error) return say("Could not create the folder: " + error.message);
    $a("adProjName").value = "";
    say("Folder created.");
    loadAdmin();
  });

  $a("adUp").addEventListener("click", async () => {
    const btn = $a("adUp");
    const file = $a("adFile").files[0];
    const title = $a("adTitle").value.trim();
    const p = projects.find((x) => x.id === $a("adProj").value);
    if (!p) return say("Create a folder first.");
    if (!file || !title) return say("Choose a PDF and type a title.");
    if (file.type !== "application/pdf") return say("Only PDF files for now.");
    if (file.size > 20 * 1024 * 1024) return say("The file is over 20 MB.");
    btn.disabled = true;
    say("Uploading…");
    const safe = file.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-80);
    const path = p.client_id + "/" + p.id + "/" + Date.now() + "-" + safe;
    const up = await sb.storage.from(BUCKET).upload(path, file, { contentType: "application/pdf" });
    if (up.error) { btn.disabled = false; return say("Upload failed: " + up.error.message); }
    const ins = await sb.from("documents").insert({ project_id: p.id, title, file_path: path });
    if (ins.error) {
      await sb.storage.from(BUCKET).remove([path]);
      btn.disabled = false;
      return say("Could not save: " + ins.error.message);
    }
    $a("adTitle").value = "";
    $a("adFile").value = "";
    btn.disabled = false;
    say("Uploaded. The client can open it now.");
    loadAdmin();
  });

  admin.addEventListener("click", async (e) => {
    const o = e.target.closest("[data-open]");
    if (o) return openFile(o.dataset.open);
    const d = e.target.closest("[data-deldoc]");
    if (d && confirm("Delete this document?")) {
      await sb.storage.from(BUCKET).remove([d.dataset.path]);
      const { error } = await sb.from("documents").delete().eq("id", d.dataset.deldoc);
      say(error ? "Could not delete: " + error.message : "Document deleted.");
      loadAdmin();
    }
    const f = e.target.closest("[data-delproj]");
    if (f && confirm("Delete this folder and everything inside it?")) {
      const { data: files } = await sb.from("documents").select("file_path").eq("project_id", f.dataset.delproj);
      if (files && files.length) await sb.storage.from(BUCKET).remove(files.map((x) => x.file_path));
      const { error } = await sb.from("projects").delete().eq("id", f.dataset.delproj);
      say(error ? "Could not delete: " + error.message : "Folder deleted.");
      loadAdmin();
    }
  });

  // Show the Admin tile only to admins (the database enforces this too).
  async function checkAdmin() {
    try {
      const s = await window.musky.session();
      if (!s) return;
      const { data } = await sb.from("profiles").select("role").eq("id", s.user.id).maybeSingle();
      if (data && data.role === "admin") window.shell.addBar("adminSection", "🛠️", "Admin");
      else window.shell.removeBar("adminSection");
    } catch {}
  }
  sb.auth.onAuthStateChange(() => setTimeout(checkAdmin, 0));
  checkAdmin();

  // Shared helpers for the next pieces (photos, feed, shop).
  window.portal = { sb, esc, mkPane, addTile, onShow, openFile };
  // Which extra pieces to load is listed in modules.json (a missing file is skipped quietly).
  const DEFAULTS = ["./feed.js", "./shop.js", "./library.js", "./bubbles.js", "./listings.js", "./extras.js", "./askaza.js", "./adminhub.js"];
  fetch("modules.json", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : DEFAULTS))
    .catch(() => DEFAULTS)
    .then((list) => (Array.isArray(list) ? list : DEFAULTS)
      .filter((m) => typeof m === "string" && /^\.\/[A-Za-z0-9_-]+\.js$/.test(m))
      .forEach((m) => import(m).catch((error) => {
        console.error("MuskySocials module failed to load:", m, error);
      })));
}
