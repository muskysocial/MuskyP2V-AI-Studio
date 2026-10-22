// MuskySocials Educational Design Studio v1.
// Visitors: browse templates, Use Template, add a photo and text, preview, download PNG/JPG.
// Admin: upload original template images, place the photo box and text fields visually, publish.
// Originals are stored in Supabase Storage and never changed by visitors. Settings are stored separately.
// Every export carries a fixed SAMPLE / EDUCATIONAL band that visitors and admins cannot remove.
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

const ready = await wait(() => window.portal && q("#designSection .pt") && q("#adminSection .pt #adStats"));
if (ready) start();

function start() {
  const { sb, esc, onShow } = window.portal;
  const BUCKET = "design-templates";
  const CATS = ["CV / Resume", "Business card", "Flyer", "Poster", "Invitation", "Social media post", "Brochure", "Other design"];
  // Not allowed here: identity, travel, government, licence, certificate or ticket designs.
  const BLOCK = /\b(id[\s-]?card|identity|passport|visa|boarding|ticket|licen[sc]e|diploma|certificate|national id|student id|permit|badge|driver)\b/i;
  const FONTS = [["Sans", "Arial, Helvetica, sans-serif"], ["Serif", "Georgia, 'Times New Roman', serif"], ["Mono", "'Courier New', monospace"],
    ["Bold display", "Impact, 'Arial Black', sans-serif"], ["Handwriting", "'Brush Script MT', cursive"]];
  const MAXW = 2400;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pub = (p) => sb.storage.from(BUCKET).getPublicUrl(p).data.publicUrl;
  const uid = () => "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  // ================= Shared renderer (browser canvas) =================
  const dims = (t) => { const k = Math.min(1, MAXW / Math.max(t.width, t.height)); return [Math.round(t.width * k), Math.round(t.height * k)]; };
  const loadImg = (url) => new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("The template picture could not be loaded."));
    i.src = url;
  });
  function rrect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function wrap(ctx, text, maxW) {
    const out = [];
    text.split("\n").forEach((par) => {
      let line = "";
      par.split(/\s+/).forEach((word) => {
        const t = line ? line + " " + word : word;
        if (ctx.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t;
      });
      out.push(line);
    });
    return out;
  }
  function drawText(ctx, f, value, W, H) {
    const px = Math.max(6, f.size * H), x = f.x * W, y = f.y * H, w = f.w * W;
    let text = String(value || "");
    if (f.upper) text = text.toUpperCase();
    const weight = f.bold ? "bold " : "";
    ctx.fillStyle = f.color || "#111111";
    ctx.textBaseline = "top";
    ctx.textAlign = f.align || "left";
    const ax = f.align === "center" ? x + w / 2 : f.align === "right" ? x + w : x;
    if (f.type !== "multiline") {
      let s = px;
      ctx.font = weight + s + "px " + f.font;
      while (ctx.measureText(text).width > w && s > px * 0.5) { s -= 1; ctx.font = weight + s + "px " + f.font; }
      ctx.fillText(text, ax, y);
      return;
    }
    ctx.font = weight + px + "px " + f.font;
    wrap(ctx, text, w).slice(0, 40).forEach((ln, i) => ctx.fillText(ln, ax, y + i * px * 1.25));
  }
  function drawPhoto(ctx, p, photo, adj, W, H) {
    const x = p.x * W, y = p.y * H, w = p.w * W, h = p.h * H;
    ctx.save();
    ctx.beginPath();
    if (p.shape === "circle") ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    else if (p.shape === "rounded") rrect(ctx, x, y, w, h, Math.min(w, h) * 0.12);
    else ctx.rect(x, y, w, h);
    ctx.clip();
    if (photo) {
      const s = Math.max(w / photo.width, h / photo.height) * (adj.zoom || 1);
      const dw = photo.width * s, dh = photo.height * s;
      ctx.drawImage(photo, x + (w - dw) / 2 + (adj.ox || 0) * w * 0.5, y + (h - dh) / 2 + (adj.oy || 0) * h * 0.5, dw, dh);
    } else {
      ctx.fillStyle = "#d0d5dd";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#667085";
      ctx.font = Math.round(h * 0.12) + "px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.label || "Photo", x + w / 2, y + h / 2);
    }
    ctx.restore();
  }
  function watermark(ctx, W, H) {
    const bh = Math.max(24, H * 0.035);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, H - bh, W, bh);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const msg = "SAMPLE · EDUCATIONAL PRACTICE · NOT A REAL DOCUMENT";
    let s = Math.round(bh * 0.5);
    ctx.font = "bold " + s + "px Arial";
    while (ctx.measureText(msg).width > W * 0.96 && s > 6) { s -= 1; ctx.font = "bold " + s + "px Arial"; }
    ctx.fillText(msg, W / 2, H - bh / 2);
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.globalAlpha = 0.13;
    ctx.fillStyle = "#000000";
    ctx.font = "bold " + Math.round(Math.min(W, H) * 0.16) + "px Arial";
    ctx.fillText("SAMPLE", 0, 0);
    ctx.restore();
  }
  function render(canvas, tpl, img, cfg, values, photo, adj, sample) {
    const [W, H] = dims(tpl);
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, W, H);
    if (cfg.photo) drawPhoto(ctx, cfg.photo, photo, adj || {}, W, H);
    (cfg.fields || []).forEach((f) => {
      const v = values[f.id];
      const shown = v !== undefined && v !== "" ? v : sample ? f.placeholder || f.label : "";
      if (shown) drawText(ctx, f, shown, W, H);
    });
    watermark(ctx, W, H);
  }
  const cfgOf = (t) => {
    const c = t && t.config && typeof t.config === "object" ? t.config : {};
    return { photo: c.photo || null, fields: Array.isArray(c.fields) ? c.fields : [] };
  };

  // ================= Styles =================
  const st = document.createElement("style");
  st.textContent = `
.ds-note{font-size:13px;padding:10px;border-radius:10px;border:1px solid var(--sh-line,#dadde1);margin:8px 0}
.ds-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ds-grid>*{min-width:0}.ds-card .pt-btn{white-space:normal;overflow-wrap:anywhere;min-height:42px}.ds-download-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.ds-download-row .pt-btn{flex:1;min-width:min(100%,145px)}.ds-note{font-size:clamp(12px,1.5vw,14px);line-height:1.45}.ds-t{font-size:clamp(13px,1.8vw,16px)}@media(max-width:360px){.ds-grid{grid-template-columns:minmax(0,1fr);gap:8px}.ds-card{min-width:0}.ds-download-row{flex-direction:column}.ds-download-row .pt-btn{width:100%}}@media(min-width:760px){.ds-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(min-width:1100px){.ds-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
.ds-card{margin:0!important;padding:8px!important}
.ds-card img{width:100%;display:block;border-radius:8px;background:#e4e6eb}
.ds-t{font-weight:700;margin-top:6px;overflow-wrap:anywhere}
.ds-s{font-size:12px;color:var(--sh-sub,#65676b)}
.ds-canvas{width:100%;height:auto;display:block;border-radius:8px;border:1px solid var(--sh-line,#dadde1);background:#fff}
.ds-lbl{display:block;font-size:13px;margin:8px 0 2px}
.ds-stage{position:relative;width:100%;line-height:0;touch-action:none;user-select:none;-webkit-user-select:none}
.ds-stage img{width:100%;height:auto;display:block;border-radius:6px;pointer-events:none}
.ds-box{position:absolute;box-sizing:border-box;border:2px dashed #1877f2;background:rgba(24,119,242,.18);touch-action:none;cursor:move;overflow:visible}
.ds-box.sel{border:2px solid #e8590c;background:rgba(232,89,12,.2)}
.ds-bl{position:absolute;left:2px;top:1px;font-size:10px;line-height:1.1;color:#0b3d91;background:rgba(255,255,255,.85);padding:1px 3px;border-radius:3px;pointer-events:none;max-width:95%;overflow:hidden;white-space:nowrap}
.ds-h{position:absolute;right:-9px;bottom:-9px;width:22px;height:22px;border-radius:50%;background:#1877f2;border:2px solid #fff;touch-action:none;cursor:nwse-resize}
.ds-req{color:#d93025}
.ds-thumb{width:48px;height:48px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:8px;background:#e4e6eb}
html.mx-light #studio .ds-s{color:#65676b!important}
html.mx-light #studio .ds-bl{color:#0b3d91!important}
html.mx-light #studio .ds-req{color:#d93025!important}
`;
  document.head.appendChild(st);

  // ================= Visitor screen =================
  const pane = q("#designSection");
  pane.querySelector(".pt").innerHTML =
    "<div id='dsGallery'><h2>🎓 Educational Design Studio</h2>" +
    "<div class='ds-note'><b>Educational purpose only.</b> These are sample designs for learning graphic design, with invented details. " +
    "Every picture you download carries a fixed SAMPLE band. Do not use them as real documents.</div>" +
    "<div class='gs-chips' id='dsChips'></div><div id='dsList'>Loading…</div></div>" +
    "<div id='dsEdit' style='display:none'></div>";
  const gallery = pane.querySelector("#dsGallery");
  const editBox = pane.querySelector("#dsEdit");
  const chips = pane.querySelector("#dsChips");
  const list = pane.querySelector("#dsList");
  let tpls = [];
  let cat = "All";

  function draw() {
    chips.innerHTML = ["All", ...new Set(tpls.map((t) => t.category))].map((c) => '<button class="gs-chip' + (c === cat ? " on" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>").join("");
    const shown = tpls.filter((t) => cat === "All" || t.category === cat);
    list.innerHTML = shown.length ? '<div class="ds-grid">' + shown.map((t) =>
      '<div class="pt-card ds-card"><img loading="lazy" alt="" style="aspect-ratio:' + t.width + "/" + t.height + '" src="' + esc(pub(t.image_path)) + '">' +
      '<div class="ds-t">' + esc(t.name) + '</div><div class="ds-s">' + esc(t.category) + "</div>" +
      '<button class="pt-btn" style="width:100%;margin-top:8px" data-use="' + t.id + '">Use Template</button></div>').join("") + "</div>"
      : "<p>No templates are published yet. Check back soon.</p>";
  }
  async function load() {
    const { data, error } = await sb.from("design_templates").select("*").eq("published", true).order("created_at", { ascending: false });
    if (error) { list.textContent = "Could not load the templates. Sign in and try again."; return; }
    tpls = data;
    draw();
  }
  onShow(pane, () => { if (editBox.style.display === "none") load(); });

  // ----- Editing a template as a visitor
  let cur = null, curImg = null, curCfg = null, values = {}, photo = null, adj = { zoom: 1, ox: 0, oy: 0 }, timer = 0;

  async function openTemplate(t) {
    cur = t;
    curCfg = cfgOf(t);
    values = {};
    photo = null;
    adj = { zoom: 1, ox: 0, oy: 0 };
    gallery.style.display = "none";
    editBox.style.display = "";
    editBox.innerHTML = "<p>Loading the template…</p>";
    try { curImg = await loadImg(pub(t.image_path)); }
    catch (err) { editBox.innerHTML = "<p>" + esc(err.message) + "</p><button class='pt-btn' id='dsBack'>‹ Back</button>"; return; }
    const hasFields = curCfg.fields.length > 0 || curCfg.photo;
    editBox.innerHTML =
      "<button class='pt-btn' id='dsBack'>‹ Back</button><h2>" + esc(t.name) + "</h2>" +
      "<canvas class='ds-canvas' id='dsCanvas'></canvas>" +
      "<div class='ds-note'><b>Educational purpose.</b> Sample design with invented details only. The SAMPLE band cannot be removed.</div>" +
      (hasFields ? "" : "<p>This template has no editable fields yet.</p>") +
      (curCfg.photo ? "<label class='ds-lbl'>" + esc(curCfg.photo.label || "Photo") + (curCfg.photo.required ? " <span class='ds-req'>*</span>" : "") + "</label>" +
        "<input id='dsPhoto' class='pt-in' type='file' accept='image/*'>" +
        "<label class='ds-lbl'>Zoom</label><input id='dsZoom' type='range' min='1' max='3' step='0.05' value='1' style='width:100%'>" +
        "<label class='ds-lbl'>Move left / right</label><input id='dsOx' type='range' min='-1' max='1' step='0.02' value='0' style='width:100%'>" +
        "<label class='ds-lbl'>Move up / down</label><input id='dsOy' type='range' min='-1' max='1' step='0.02' value='0' style='width:100%'>" : "") +
      curCfg.fields.map((f) => "<label class='ds-lbl'>" + esc(f.label) + (f.required ? " <span class='ds-req'>*</span>" : " (optional)") + "</label>" +
        (f.type === "multiline" ? "<textarea class='pt-in' rows='3' maxlength='600' data-fid='" + f.id + "' placeholder='" + esc(f.placeholder || "") + "'></textarea>"
          : "<input class='pt-in' maxlength='120' data-fid='" + f.id + "' placeholder='" + esc(f.placeholder || "") + "'>")).join("") +
      "<p class='ds-s'>Viewing and editing are free. Each successful download costs 100 coins.</p>" +
      "<div class='ds-download-row'><button class='pt-btn' id='dsPng' style='flex:1'>Download PNG · 100 coins</button>" +
      "<button class='pt-btn' id='dsJpg' style='flex:1'>Download JPG · 100 coins</button></div><p class='pt-msg' id='dsEMsg'></p>";
    redraw();
  }
  function redraw() {
    const c = editBox.querySelector("#dsCanvas");
    if (!c || !cur) return false;
    try {
      render(c, cur, curImg, curCfg, values, photo, adj, false);
      return true;
    } catch (e) {
      const m = editBox.querySelector("#dsEMsg");
      if (m) m.textContent = "Could not draw the preview.";
      return false;
    }
  }
  const later = () => { clearTimeout(timer); timer = setTimeout(redraw, 100); };

  editBox.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.fid) { values[t.dataset.fid] = t.value; return later(); }
    if (t.id === "dsZoom") { adj.zoom = +t.value; later(); }
    if (t.id === "dsOx") { adj.ox = +t.value; later(); }
    if (t.id === "dsOy") { adj.oy = +t.value; later(); }
  });
  editBox.addEventListener("change", async (e) => {
    if (e.target.id !== "dsPhoto") return;
    const f = e.target.files[0];
    const msg = editBox.querySelector("#dsEMsg");
    if (!f) return;
    if (!/^image\//.test(f.type) || f.size > 15 * 1024 * 1024) { msg.textContent = "Choose a picture (JPG, PNG or WebP) under 15 MB."; e.target.value = ""; return; }
    try {
      const bmp = await createImageBitmap(f, { imageOrientation: "from-image" });
      const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * k);
      c.height = Math.round(bmp.height * k);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      photo = c;
      msg.textContent = "";
      redraw();
    } catch { msg.textContent = "That picture could not be read. Try a JPG or PNG."; }
  });
  let downloadPending = false;
  async function download(type) {
    const msg = editBox.querySelector("#dsEMsg");
    const c = editBox.querySelector("#dsCanvas");
    const buttons = [editBox.querySelector("#dsPng"), editBox.querySelector("#dsJpg")].filter(Boolean);
    if (downloadPending) return;
    for (const f of curCfg.fields) {
      if (f.required && !String(values[f.id] || "").trim()) {
        msg.textContent = "Please fill in: " + f.label;
        return;
      }
    }
    if (curCfg.photo && curCfg.photo.required && !photo) {
      msg.textContent = "Please add a photo.";
      return;
    }
    if (!window.musky || typeof window.musky.spend !== "function" || typeof window.musky.session !== "function") {
      msg.textContent = "Your account is not ready. Please refresh and sign in again.";
      return;
    }

    downloadPending = true;
    buttons.forEach((button) => { button.disabled = true; });
    let objectUrl = "";
    let charged = false;
    try {
      const session = await window.musky.session();
      if (!session) throw new Error("Sign in required. Please sign in before downloading.");
      if (!redraw()) throw new Error("Could not render the design. No coins were deducted.");
      msg.textContent = "Preparing your file…";
      const blob = await new Promise((resolve, reject) => {
        try {
          c.toBlob((value) => value && value.size > 0 ? resolve(value) : reject(new Error("Could not create the file. Try again.")), type, 0.92);
        } catch (error) { reject(error); }
      });
      objectUrl = URL.createObjectURL(blob);
      msg.textContent = "Checking your balance…";
      await window.musky.spend(100);
      charged = true;

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = (cur.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "design") + (type === "image/png" ? ".png" : ".jpg");
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      msg.textContent = "Download started. 100 coins deducted. Remember: sample for learning only.";
      setTimeout(() => { try { URL.revokeObjectURL(objectUrl); } catch {} }, 5000);
      objectUrl = "";
    } catch (error) {
      if (objectUrl) { try { URL.revokeObjectURL(objectUrl); } catch {} }
      const message = String(error && error.message || "");
      if (charged) {
        msg.textContent = "100 coins were deducted, but the browser could not start the download. Please try again and contact support if this repeats.";
      } else if (/not enough credits|insufficient|credit/i.test(message)) {
        msg.textContent = "You need 100 coins to download this design. No coins were deducted; add coins and try again.";
      } else if (/sign in required|session/i.test(message)) {
        msg.textContent = "Please sign in again before downloading. No coins were deducted.";
      } else {
        msg.textContent = "Could not download this design. No coins were deducted. " + (message || "Please try again.");
      }
    } finally {
      downloadPending = false;
      buttons.forEach((button) => { button.disabled = false; });
    }
  }
  pane.addEventListener("click", (e) => {
    const c = e.target.closest("[data-cat]");
    if (c) { cat = c.dataset.cat; return draw(); }
    const u = e.target.closest("[data-use]");
    if (u) { const t = tpls.find((x) => x.id === u.dataset.use); if (t) openTemplate(t); return; }
    if (e.target.closest("#dsBack")) { editBox.style.display = "none"; gallery.style.display = ""; cur = null; return; }
    if (e.target.closest("#dsPng")) return download("image/png");
    if (e.target.closest("#dsJpg")) return download("image/jpeg");
  });

  // ================= Admin =================
  q("#adminSection #adStats").insertAdjacentHTML("afterend",
    "<div class='pt-card' id='dsAdmin'><strong>🎓 Educational Design Studio</strong>" +
    "<p class='pt-msg'>Only educational sample designs with invented details: CVs, business cards, flyers, posters, invitations, social posts and brochures. " +
    "No ID cards, passports, visas, tickets, licences, diplomas or certificates.</p>" +
    "<div id='dsHome'><strong>New template</strong>" +
    "<input id='dsName' class='pt-in' maxlength='80' placeholder='Template name'>" +
    "<select id='dsCat' class='pt-in'>" + CATS.map((c) => "<option>" + c + "</option>").join("") + "</select>" +
    "<input id='dsFile' class='pt-in' type='file' accept='image/png,image/jpeg,image/webp'>" +
    "<button class='pt-btn' id='dsUp'>Upload template</button><p class='pt-msg' id='dsMsg'></p>" +
    "<strong>Your templates</strong><div id='dsAdminList'></div></div>" +
    "<div id='dsCfg' style='display:none'></div></div>");
  const admin = q("#adminSection");
  const $ = (id) => admin.querySelector("#" + id);
  const say = (t) => { const m = $("dsMsg"); if (m) m.textContent = t; };
  let rows = [];

  async function loadAdmin() {
    const { data, error } = await sb.from("design_templates").select("*").order("created_at", { ascending: false });
    if (error) { $("dsAdminList").textContent = "Run the Design Studio database step first, or admin access is needed."; return; }
    rows = data;
    $("dsAdminList").innerHTML = rows.length ? rows.map((t) => {
      const c = cfgOf(t);
      return '<div class="pt-row"><span><img class="ds-thumb" alt="" src="' + esc(pub(t.image_path)) + '">' + esc(t.name) + "<br><small>" + esc(t.category) + " · " +
        (t.published ? "Published" : "Draft") + (c.fields.length || c.photo ? "" : " · ⚠️ not set up yet") + '</small></span><span>' +
        '<button class="pt-btn" data-conf="' + t.id + '">Set up</button> ' +
        '<button class="pt-btn" data-pub="' + t.id + '">' + (t.published ? "Unpublish" : "Publish") + "</button> " +
        '<button class="pt-btn del" data-del="' + t.id + '">Delete</button></span></div>';
    }).join("") : "<p>No templates yet.</p>";
  }
  onShow(admin, () => { if ($("dsCfg").style.display === "none") loadAdmin(); });

  $("dsUp").addEventListener("click", async () => {
    const name = $("dsName").value.trim();
    const category = $("dsCat").value;
    const file = $("dsFile").files[0];
    if (!name) return say("Type a template name.");
    if (BLOCK.test(name + " " + category)) return say("This type of design is not allowed here (identity, travel, licence, certificate or ticket designs).");
    if (!file) return say("Choose the template picture.");
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return say("Use a PNG, JPG or WebP picture.");
    if (file.size > 5 * 1024 * 1024) return say("The picture is over 5 MB. Make it smaller and try again.");
    const btn = $("dsUp");
    btn.disabled = true;
    say("Uploading…");
    let path = "";
    try {
      const bmp = await createImageBitmap(file);
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      path = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2)) + "." + ext;
      const up = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const ins = await sb.from("design_templates").insert({ name, category, image_path: path, width: bmp.width, height: bmp.height }).select().single();
      if (ins.error) { await sb.storage.from(BUCKET).remove([path]); throw ins.error; }
      $("dsName").value = "";
      $("dsFile").value = "";
      say("Saved. Now set up the photo box and text fields.");
      await loadAdmin();
      openConfig(ins.data.id);
    } catch (err) { say("Could not save the template: " + (err.message || err)); }
    btn.disabled = false;
  });

  $("dsAdminList").addEventListener("click", async (e) => {
    const cf = e.target.closest("[data-conf]");
    if (cf) return openConfig(cf.dataset.conf);
    const pb = e.target.closest("[data-pub]");
    if (pb) {
      const t = rows.find((x) => x.id === pb.dataset.pub);
      const c = cfgOf(t);
      if (!t.published && !c.fields.length && !c.photo && !confirm("This template has no photo box or fields yet. Publish anyway?")) return;
      const { error } = await sb.from("design_templates").update({ published: !t.published, updated_at: new Date().toISOString() }).eq("id", t.id);
      say(error ? "Could not change: " + error.message : t.published ? "Unpublished. Visitors no longer see it." : "Published. Visitors can use it now.");
      return loadAdmin();
    }
    const d = e.target.closest("[data-del]");
    if (d && confirm("Delete this template and its picture? This cannot be undone.")) {
      const t = rows.find((x) => x.id === d.dataset.del);
      const { error } = await sb.from("design_templates").delete().eq("id", t.id);
      if (error) { say("Could not delete: " + error.message); return; }
      await sb.storage.from(BUCKET).remove([t.image_path]);
      say("Template deleted.");
      loadAdmin();
    }
  });

  // ----- Visual configuration editor
  let tpl = null, cfg = null, sel = null, drag = null;
  const ofKey = (k) => (k === "photo" ? cfg.photo : cfg.fields.find((f) => f.id === k));
  const boxH = (o, photoBox) => (photoBox ? o.h : Math.min(0.5, o.size * 1.35 * (o.type === "multiline" ? 3 : 1)));
  const place = (o, photoBox) => "left:" + o.x * 100 + "%;top:" + o.y * 100 + "%;width:" + o.w * 100 + "%;height:" + boxH(o, photoBox) * 100 + "%";

  function openConfig(id) {
    tpl = rows.find((x) => x.id === id);
    if (!tpl) return;
    const c = cfgOf(tpl);
    cfg = JSON.parse(JSON.stringify(c));
    sel = null;
    $("dsHome").style.display = "none";
    const box = $("dsCfg");
    box.style.display = "";
    box.innerHTML =
      "<button class='pt-btn' id='cfBack'>‹ Back to templates</button>" +
      "<input id='cfName' class='pt-in' maxlength='80' value='" + esc(tpl.name) + "'>" +
      "<select id='cfCat' class='pt-in'>" + CATS.map((x) => "<option" + (x === tpl.category ? " selected" : "") + ">" + x + "</option>").join("") + "</select>" +
      "<p class='pt-msg'>Drag a box to move it. Drag the round corner to resize it (text boxes: sideways changes the width, up or down changes the text size). Tap a box to edit it below.</p>" +
      "<div class='ds-stage' id='cfStage'><img crossorigin='anonymous' alt='' src='" + esc(pub(tpl.image_path)) + "'></div>" +
      "<div style='display:flex;gap:8px;flex-wrap:wrap;margin:10px 0'><button class='pt-btn' id='cfAddPhoto'>＋ Photo box</button><button class='pt-btn' id='cfAddText'>＋ Text field</button>" +
      "<button class='pt-btn' id='cfPrev'>Preview</button><button class='pt-btn' id='cfSave'>Save setup</button></div>" +
      "<p class='pt-msg' id='cfMsg'></p><div id='cfPanel'></div><canvas id='cfCanvas' class='ds-canvas' style='display:none'></canvas>";
    renderStage();
    renderPanel();
  }
  function renderStage() {
    const stage = $("cfStage");
    stage.querySelectorAll(".ds-box").forEach((b) => b.remove());
    const add = (key, o, isPhoto) => {
      const b = document.createElement("div");
      b.className = "ds-box" + (sel === key ? " sel" : "");
      b.dataset.key = key;
      b.style.cssText = place(o, isPhoto);
      b.innerHTML = "<span class='ds-bl'>" + esc(isPhoto ? o.label || "Photo" : o.label) + "</span><i class='ds-h'></i>";
      stage.appendChild(b);
    };
    if (cfg.photo) add("photo", cfg.photo, true);
    cfg.fields.forEach((f) => add(f.id, f, false));
  }
  function renderPanel() {
    const p = $("cfPanel");
    const o = sel && ofKey(sel);
    if (!o) { p.innerHTML = "<p class='pt-msg'>Tap a box to edit it, or add a photo box or a text field.</p>"; return; }
    if (sel === "photo") {
      p.innerHTML = "<strong>Photo box</strong><label class='ds-lbl'>Label shown to visitors</label><input class='pt-in' maxlength='40' data-p='label' value='" + esc(o.label || "Photo") + "'>" +
        "<label class='ds-lbl'>Shape</label><select class='pt-in' data-p='shape'>" + [["rect", "Rectangle"], ["rounded", "Rounded"], ["circle", "Circle"]].map(([v, l]) => "<option value='" + v + "'" + (o.shape === v ? " selected" : "") + ">" + l + "</option>").join("") + "</select>" +
        "<label class='ds-lbl'><input type='checkbox' data-p='required'" + (o.required ? " checked" : "") + "> Required (visitors must add a photo)</label>" +
        "<button class='pt-btn del' data-delsel='1'>Delete photo box</button>";
      return;
    }
    p.innerHTML = "<strong>Text field</strong><label class='ds-lbl'>Label shown to visitors</label><input class='pt-in' maxlength='40' data-p='label' value='" + esc(o.label) + "'>" +
      "<label class='ds-lbl'>Type</label><select class='pt-in' data-p='type'><option value='text'" + (o.type === "text" ? " selected" : "") + ">One line</option><option value='multiline'" + (o.type === "multiline" ? " selected" : "") + ">Several lines</option></select>" +
      "<label class='ds-lbl'>Example text (shown in preview and as a hint)</label><input class='pt-in' maxlength='120' data-p='placeholder' value='" + esc(o.placeholder || "") + "'>" +
      "<label class='ds-lbl'>Font</label><select class='pt-in' data-p='font'>" + FONTS.map(([l, v]) => "<option value=\"" + esc(v) + "\"" + (o.font === v ? " selected" : "") + ">" + l + "</option>").join("") + "</select>" +
      "<label class='ds-lbl'>Text size: <b id='cfSz'>" + (o.size * 100).toFixed(1) + "</b>% of the picture height</label><input type='range' min='1' max='15' step='0.1' style='width:100%' data-p='size' value='" + (o.size * 100) + "'>" +
      "<label class='ds-lbl'>Colour</label><input type='color' data-p='color' value='" + esc(o.color || "#111111") + "' style='width:100%;height:40px'>" +
      "<label class='ds-lbl'>Alignment</label><div class='sh-row'>" + ["left", "center", "right"].map((a) => "<button class='" + (o.align === a ? "on" : "") + "' data-align='" + a + "'>" + a + "</button>").join("") + "</div>" +
      "<label class='ds-lbl'><input type='checkbox' data-p='bold'" + (o.bold ? " checked" : "") + "> Bold</label>" +
      "<label class='ds-lbl'><input type='checkbox' data-p='upper'" + (o.upper ? " checked" : "") + "> UPPERCASE</label>" +
      "<label class='ds-lbl'><input type='checkbox' data-p='required'" + (o.required ? " checked" : "") + "> Required (otherwise optional)</label>" +
      "<button class='pt-btn del' data-delsel='1'>Delete this field</button>";
  }
  const cmsg = (t) => { const m = $("cfMsg"); if (m) m.textContent = t; };

  admin.addEventListener("input", (e) => {
    const t = e.target;
    if (!t.dataset || !t.dataset.p || !sel) return;
    const o = ofKey(sel);
    if (!o) return;
    let v = t.type === "checkbox" ? t.checked : t.value;
    if (t.dataset.p === "size") { v = clamp(+v / 100, 0.01, 0.2); const s = $("cfSz"); if (s) s.textContent = (v * 100).toFixed(1); }
    o[t.dataset.p] = v;
    renderStage();
  });
  admin.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.p && sel && (t.tagName === "SELECT" || t.type === "checkbox")) { renderStage(); }
  });

  admin.addEventListener("pointerdown", (e) => {
    const stage = $("cfStage");
    if (!stage || !stage.contains(e.target)) return;
    const box = e.target.closest(".ds-box");
    if (!box) return;
    const key = box.dataset.key;
    const o = ofKey(key);
    if (!o) return;
    sel = key;
    const r = stage.getBoundingClientRect();
    drag = { key, o, photoBox: key === "photo", mode: e.target.classList.contains("ds-h") ? "resize" : "move", sx: e.clientX, sy: e.clientY,
      ox: o.x, oy: o.y, ow: o.w, oh: o.h, osz: o.size, rw: r.width, rh: r.height, pid: e.pointerId };
    try { box.setPointerCapture(e.pointerId); } catch {}
    stage.querySelectorAll(".ds-box").forEach((b) => b.classList.toggle("sel", b === box));
    renderPanel();
    e.preventDefault();
  });
  admin.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    const dx = (e.clientX - drag.sx) / drag.rw, dy = (e.clientY - drag.sy) / drag.rh, o = drag.o;
    if (drag.mode === "move") {
      o.x = clamp(drag.ox + dx, 0, 1 - o.w);
      o.y = clamp(drag.oy + dy, 0, 1 - boxH(o, drag.photoBox));
    } else {
      o.w = clamp(drag.ow + dx, 0.05, 1 - o.x);
      if (drag.photoBox) o.h = clamp(drag.oh + dy, 0.05, 1 - o.y);
      else { o.size = clamp(drag.osz + dy / 1.35, 0.01, 0.2); const s = $("cfSz"); if (s) s.textContent = (o.size * 100).toFixed(1); }
    }
    const b = $("cfStage").querySelector('[data-key="' + drag.key + '"]');
    if (b) b.style.cssText = place(o, drag.photoBox);
    e.preventDefault();
  });
  const endDrag = (e) => { if (drag && e.pointerId === drag.pid) { drag = null; renderPanel(); } };
  admin.addEventListener("pointerup", endDrag);
  admin.addEventListener("pointercancel", endDrag);

  admin.addEventListener("click", async (e) => {
    if (!tpl || $("dsCfg").style.display === "none") return;
    if (e.target.closest("#cfBack")) { $("dsCfg").style.display = "none"; $("dsHome").style.display = ""; tpl = null; return loadAdmin(); }
    if (e.target.closest("#cfAddPhoto")) {
      if (cfg.photo) return cmsg("There is already a photo box.");
      cfg.photo = { x: 0.08, y: 0.15, w: 0.28, h: 0.35, shape: "rect", required: false, label: "Photo" };
      sel = "photo"; renderStage(); renderPanel(); return;
    }
    if (e.target.closest("#cfAddText")) {
      if (cfg.fields.length >= 30) return cmsg("You can have up to 30 text fields.");
      const f = { id: uid(), label: "Field " + (cfg.fields.length + 1), type: "text", placeholder: "Example text", x: 0.1, y: 0.1 + (cfg.fields.length % 10) * 0.06, w: 0.5,
        size: 0.04, font: FONTS[0][1], color: "#111111", align: "left", bold: false, upper: false, required: false };
      cfg.fields.push(f);
      sel = f.id; renderStage(); renderPanel(); return;
    }
    const al = e.target.closest("[data-align]");
    if (al && sel) { const o = ofKey(sel); if (o) { o.align = al.dataset.align; renderPanel(); } return; }
    if (e.target.closest("[data-delsel]") && sel) {
      if (sel === "photo") cfg.photo = null; else cfg.fields = cfg.fields.filter((f) => f.id !== sel);
      sel = null; renderStage(); renderPanel(); return;
    }
    if (e.target.closest("#cfPrev")) {
      const c = $("cfCanvas");
      try {
        const img = await loadImg(pub(tpl.image_path));
        c.style.display = "";
        render(c, tpl, img, cfg, {}, null, {}, true);
        cmsg("This is how visitors will see it, with example text.");
        c.scrollIntoView({ block: "center" });
      } catch (err) { cmsg("Could not draw the preview: " + (err.message || err)); }
      return;
    }
    if (e.target.closest("#cfSave")) {
      if (cfg.fields.some((f) => !String(f.label || "").trim())) return cmsg("Every text field needs a label.");
      const name = $("cfName").value.trim();
      const category = $("cfCat").value;
      if (!name) return cmsg("Type a template name.");
      if (BLOCK.test(name + " " + category)) return cmsg("This type of design is not allowed here.");
      const btn = $("cfSave");
      btn.disabled = true;
      const { error } = await sb.from("design_templates").update({ name, category, config: cfg, updated_at: new Date().toISOString() }).eq("id", tpl.id);
      btn.disabled = false;
      if (error) return cmsg("Could not save the setup: " + error.message);
      tpl.name = name; tpl.category = category; tpl.config = JSON.parse(JSON.stringify(cfg));
      cmsg("Saved to the database. Publish the template from the list when you are ready.");
    }
  });
}
