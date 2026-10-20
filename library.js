// MuskySocials Library v1: you upload any kind of file in the Admin studio;
// everyone who is signed in can read or download it from the Library on Home.
// Loaded automatically by portal.js. Needs the "library_items" table and "library" storage bucket.
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

const ready = await wait(() => window.portal && window.shell && q("#adminSection .pt #adStats"));
if (ready) start();

function start() {
  const { sb, esc, mkPane, onShow } = window.portal;
  const BUCKET = "library";
  const MAX = 50 * 1024 * 1024;

  const size = (n) => (n == null ? "" : n < 1048576 ? Math.max(1, Math.round(n / 1024)) + " KB" : (n / 1048576).toFixed(1) + " MB");
  const when = (d) => new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  const icon = (name) => {
    const e = (name.split(".").pop() || "").toLowerCase();
    if (e === "pdf") return "📕";
    if (["doc", "docx", "odt", "rtf"].includes(e)) return "📘";
    if (["xls", "xlsx", "csv", "ods"].includes(e)) return "📗";
    if (["ppt", "pptx", "odp"].includes(e)) return "📙";
    if (["jpg", "jpeg", "png", "gif", "webp", "heic", "svg"].includes(e)) return "🖼️";
    if (["zip", "rar", "7z"].includes(e)) return "🗜️";
    if (["txt", "md"].includes(e)) return "📄";
    return "📎";
  };

  async function openFile(path, downloadName) {
    const w = downloadName ? null : window.open("", "_blank"); // opened first so phone browsers do not block it
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, 3600, downloadName ? { download: downloadName } : undefined);
    if (error || !data) { if (w) w.close(); alert("Could not open this file."); return; }
    if (w) w.location = data.signedUrl;
    else location.href = data.signedUrl;
  }

  const st = document.createElement("style");
  st.textContent = `
.lb-ico{flex:none;font-size:28px;width:44px;text-align:center}
.lb-main{min-width:0;flex:1}
.lb-t{font-weight:700;overflow-wrap:anywhere}
.lb-s{font-size:12px;color:var(--sh-sub,#65676b)}
.lb-item{display:flex;gap:10px;align-items:flex-start}
.lb-acts{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
html.mx-light #studio .lb-s{color:#65676b!important}
`;
  document.head.appendChild(st);

  // ---------- Library screen (everyone signed in)
  const pane = mkPane("librarySection",
    "<h2>Library</h2><input id='lbSearch' class='pt-in' placeholder='Search the library'>" +
    "<div class='gs-chips' id='lbChips'></div><div id='lbList'>Loading…</div>");
  window.shell.addItem(["librarySection", "📚", "Library", ""]);
  const list = pane.querySelector("#lbList");
  const chips = pane.querySelector("#lbChips");
  let items = [];
  let cat = "All";

  function draw() {
    const term = pane.querySelector("#lbSearch").value.trim().toLowerCase();
    const cats = ["All", ...new Set(items.map((i) => i.category))];
    chips.innerHTML = cats.map((c) => '<button class="gs-chip' + (c === cat ? " on" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>").join("");
    const shown = items.filter((i) => (cat === "All" || i.category === cat) &&
      (!term || (i.title + " " + (i.description || "")).toLowerCase().includes(term)));
    list.innerHTML = shown.length ? shown.map((i) =>
      '<div class="pt-card"><div class="lb-item"><div class="lb-ico">' + icon(i.file_name) + '</div><div class="lb-main">' +
      '<div class="lb-t">' + esc(i.title) + "</div>" +
      (i.description ? '<div class="lb-s">' + esc(i.description) + "</div>" : "") +
      '<div class="lb-s">' + esc(i.category) + " · " + size(i.size_bytes) + " · " + when(i.created_at) + "</div>" +
      '<div class="lb-acts"><button class="pt-btn" data-open="' + esc(i.file_path) + '">Open</button>' +
      '<button class="pt-btn" data-dl="' + esc(i.file_path) + '" data-name="' + esc(i.file_name) + '">Download</button></div>' +
      "</div></div></div>").join("") : "<p>Nothing here yet.</p>";
  }
  async function loadLib() {
    const { data, error } = await sb.from("library_items").select("*").order("created_at", { ascending: false });
    if (error) { list.textContent = "Could not load the library. Sign in and try again."; return; }
    items = data;
    if (cat !== "All" && !items.some((i) => i.category === cat)) cat = "All";
    draw();
  }
  pane.addEventListener("input", (e) => { if (e.target.id === "lbSearch") draw(); });
  pane.addEventListener("click", (e) => {
    const c = e.target.closest("[data-cat]");
    if (c) { cat = c.dataset.cat; return draw(); }
    const o = e.target.closest("[data-open]");
    if (o) return openFile(o.dataset.open);
    const d = e.target.closest("[data-dl]");
    if (d) return openFile(d.dataset.dl, d.dataset.name);
  });
  onShow(pane, loadLib);

  // ---------- Admin: upload to the Library
  q("#adminSection #adStats").insertAdjacentHTML("afterend",
    "<div class='pt-card'><strong>Upload to the Library</strong>" +
    "<input id='lbTitle' class='pt-in' maxlength='120' placeholder='Title'>" +
    "<textarea id='lbDesc' class='pt-in' rows='2' maxlength='500' placeholder='Short description (optional)'></textarea>" +
    "<input id='lbCat' class='pt-in' list='lbCats' maxlength='40' placeholder='Category, e.g. Guides'>" +
    "<datalist id='lbCats'><option value='General'><option value='Guides'><option value='Forms'><option value='Templates'><option value='Contracts'><option value='Policies'><option value='Pictures'></datalist>" +
    "<input id='lbFile' class='pt-in' type='file'>" +
    "<button class='pt-btn' id='lbGo'>Upload</button><p class='pt-msg' id='lbMsg'></p>" +
    "<strong>Library files</strong><div id='lbAdminList'></div></div>");
  const admin = q("#adminSection");
  const $ = (id) => admin.querySelector("#" + id);
  const say = (t) => { $("lbMsg").textContent = t; };

  async function loadAdminList() {
    const { data, error } = await sb.from("library_items").select("id,title,file_path,file_name,size_bytes").order("created_at", { ascending: false });
    if (error) { $("lbAdminList").textContent = "Admin access needed."; return; }
    $("lbAdminList").innerHTML = data.length ? data.map((i) =>
      '<div class="pt-row"><span>' + icon(i.file_name) + " " + esc(i.title) + "<br><small>" + size(i.size_bytes) + '</small></span><span>' +
      '<button class="pt-btn" data-open="' + esc(i.file_path) + '">Open</button> ' +
      '<button class="pt-btn del" data-dellib="' + i.id + '" data-path="' + esc(i.file_path) + '">Delete</button></span></div>').join("")
      : "<p>No files yet.</p>";
  }
  onShow(admin, loadAdminList);

  $("lbGo").addEventListener("click", async () => {
    const title = $("lbTitle").value.trim();
    const file = $("lbFile").files[0];
    if (!title) return say("Type a title first.");
    if (!file) return say("Choose a file.");
    if (file.size > MAX) return say("That file is over 50 MB.");
    const btn = $("lbGo");
    btn.disabled = true;
    say("Uploading… large files can take a while.");
    const safe = file.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-80);
    const path = Date.now() + "-" + Math.random().toString(36).slice(2, 7) + "-" + safe;
    const up = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type || "application/octet-stream" });
    if (up.error) { btn.disabled = false; return say("Upload failed: " + up.error.message); }
    const ins = await sb.from("library_items").insert({
      title, description: $("lbDesc").value.trim() || null, category: $("lbCat").value.trim() || "General",
      file_path: path, file_name: file.name.slice(0, 200), mime: (file.type || "").slice(0, 100), size_bytes: file.size,
    });
    if (ins.error) {
      await sb.storage.from(BUCKET).remove([path]);
      btn.disabled = false;
      return say("Could not save: " + ins.error.message);
    }
    ["lbTitle", "lbDesc", "lbCat", "lbFile"].forEach((id) => { $(id).value = ""; });
    btn.disabled = false;
    say("Uploaded. Everyone can find it in the Library.");
    loadAdminList();
  });

  $("lbAdminList").addEventListener("click", async (e) => {
    const o = e.target.closest("[data-open]");
    if (o) return openFile(o.dataset.open);
    const d = e.target.closest("[data-dellib]");
    if (d && confirm("Delete this file from the Library?")) {
      await sb.storage.from(BUCKET).remove([d.dataset.path]);
      const { error } = await sb.from("library_items").delete().eq("id", d.dataset.dellib);
      say(error ? "Could not delete: " + error.message : "Deleted.");
      loadAdminList();
    }
  });
}
