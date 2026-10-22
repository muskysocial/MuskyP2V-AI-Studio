// MuskySocials Viral Boost Studio v1.
// Upload content, prepare platform-specific copy, and save private promotion drafts.
// This does not buy ads or manufacture engagement; direct publishing/promotions require platform integrations.
const waitForPortal = (ms = 15000) => new Promise(resolve => {
  const started = Date.now();
  (function tick() {
    if (window.portal && window.shell && document.querySelector("#studio")) return resolve(true);
    if (Date.now() - started > ms) return resolve(false);
    setTimeout(tick, 150);
  })();
});

if (await waitForPortal()) startViralBoost();

function startViralBoost() {
  const { sb, esc, mkPane, onShow } = window.portal;
  const BUCKET = "viral-uploads";
  const MAX_FILE = 100 * 1024 * 1024;
  const PLATFORMS = ["TikTok", "Instagram", "Facebook", "YouTube", "X", "WhatsApp"];
  const pane = mkPane("viralBoostSection", `
    <div class="vb-head">
      <p class="vb-eyebrow">MUSKYSOCIALS CREATOR TOOLS</p>
      <h2>Viral Boost Studio 🚀</h2>
      <p class="vb-muted">Prepare stronger content and organize promotion campaigns in one place.</p>
    </div>
    <div class="vb-info"><strong>What this does:</strong> create content drafts and save your campaign plan. Actual ads, direct publishing, and guaranteed views are not connected yet.</div>
    <div class="vb-card">
      <h3>1. Add your content</h3>
      <label for="vbTitle">Campaign name</label>
      <input id="vbTitle" class="vb-input" maxlength="120" placeholder="e.g. My new fashion video">
      <label for="vbFile">Upload an image or video (max 100 MB)</label>
      <input id="vbFile" class="vb-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/x-m4v">
      <div id="vbPreviewWrap" class="vb-preview-wrap" hidden></div>
      <label for="vbUrl">Or paste a post link (optional if you upload a file)</label>
      <input id="vbUrl" class="vb-input" type="url" maxlength="2000" placeholder="https://…">
      <p class="vb-small">Use content you own or have permission to promote. Uploaded files are private to your account.</p>
    </div>
    <div class="vb-card">
      <h3>2. Choose platforms</h3>
      <p class="vb-muted">Select where you plan to share or promote this content.</p>
      <div class="vb-platforms">
        ${PLATFORMS.map(p => '<label class="vb-platform"><input type="checkbox" name="vbPlatform" value="' + p + '"><span>' + p + '</span></label>').join("")}
      </div>
    </div>
    <div class="vb-card">
      <h3>3. Prepare your caption</h3>
      <label for="vbTopic">What is the content about?</label>
      <input id="vbTopic" class="vb-input" maxlength="240" placeholder="e.g. New sneaker collection, comedy skit, food recipe">
      <label for="vbCaption">Caption</label>
      <textarea id="vbCaption" class="vb-input" rows="4" maxlength="2200" placeholder="Write a caption or generate a starting idea…"></textarea>
      <label for="vbHashtags">Hashtags</label>
      <textarea id="vbHashtags" class="vb-input" rows="2" maxlength="700" placeholder="#YourTopic #Creator"></textarea>
      <div class="vb-actions">
        <button type="button" class="vb-btn secondary" id="vbIdeas">Suggest caption + hashtags</button>
        <button type="button" class="vb-btn" id="vbCopy">Copy content</button>
      </div>
      <p id="vbCopyStatus" class="vb-status" role="status"></p>
      <p class="vb-small">Suggestions are rule-based starting points, not an AI prediction of virality. Edit them to fit your audience.</p>
    </div>
    <div class="vb-actions vb-save-row">
      <button type="button" class="vb-btn" id="vbSave">Save promotion draft</button>
      <button type="button" class="vb-btn secondary" id="vbReset">Clear form</button>
    </div>
    <p id="vbStatus" class="vb-status" role="status" aria-live="polite"></p>
    <div class="vb-card vb-saved-card">
      <div class="vb-saved-head"><div><h3>Your saved drafts</h3><p class="vb-muted">Private to your account</p></div><button type="button" class="vb-btn secondary" id="vbRefresh">Refresh</button></div>
      <div id="vbDrafts"><p class="vb-muted">Sign in to view saved drafts.</p></div>
    </div>
    <div class="vb-footnote">A campaign draft does not automatically publish content or buy advertising. Platform access and campaign launch features will be connected separately.</div>
  `);
  window.shell.addItem(["viralBoostSection", "🚀", "Viral Boost", ""]);
  const $ = id => pane.querySelector("#" + id);
  let selectedFile = null;
  let previewUrl = null;
  let saving = false;

  const style = document.createElement("style");
  style.textContent = `
    #viralBoostSection .vb-head{margin-bottom:14px}
    #viralBoostSection .vb-eyebrow{font-size:10px;letter-spacing:.16em;font-weight:800;color:var(--sh-blue,#1877f2);margin:0 0 6px}
    #viralBoostSection .vb-head h2{font-size:clamp(23px,6vw,30px);margin:0 0 7px;line-height:1.15}
    #viralBoostSection .vb-muted{color:var(--sh-sub,#65676b);font-size:14px;margin:5px 0 10px}
    #viralBoostSection .vb-info{border:1px solid var(--sh-line,#dadde1);border-radius:12px;padding:12px;margin:12px 0;background:var(--sh-card,#fff);font-size:13px;line-height:1.5}
    #viralBoostSection .vb-card{border:1px solid var(--sh-line,#dadde1);border-radius:15px;padding:14px;margin:12px 0;background:var(--sh-card,#fff);min-width:0}
    #viralBoostSection .vb-card h3{font-size:17px;margin:0 0 10px}
    #viralBoostSection .vb-card label{display:block;margin:12px 0 6px;font-size:13px;font-weight:650;color:var(--sh-text,#050505)}
    #viralBoostSection .vb-input{display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box;border:1px solid var(--sh-line,#dadde1);border-radius:10px;background:var(--sh-card,#fff);color:var(--sh-text,#050505);padding:11px 12px;font:inherit;font-size:16px}
    #viralBoostSection input[type=file].vb-input{font-size:13px;padding:9px}
    #viralBoostSection .vb-preview-wrap{margin-top:10px}
    #viralBoostSection .vb-preview-wrap img,#viralBoostSection .vb-preview-wrap video{display:block;width:100%;max-height:360px;object-fit:contain;background:#080e1c;border-radius:12px}
    #viralBoostSection .vb-small{font-size:12px;line-height:1.45;color:var(--sh-sub,#65676b);margin:8px 0 0}
    #viralBoostSection .vb-platforms{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    #viralBoostSection .vb-platform{display:flex!important;align-items:center;gap:9px;border:1px solid var(--sh-line,#dadde1);border-radius:10px;padding:10px!important;margin:0!important;min-width:0}
    #viralBoostSection .vb-platform input{width:18px;height:18px;flex:none;accent-color:var(--sh-blue,#1877f2)}
    #viralBoostSection .vb-platform span{overflow-wrap:anywhere}
    #viralBoostSection .vb-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    #viralBoostSection .vb-btn{border:0;border-radius:10px;background:var(--sh-blue,#1877f2);color:#fff;padding:11px 13px;font-weight:700;font-size:14px;min-height:42px}
    #viralBoostSection .vb-btn.secondary{background:transparent;border:1px solid var(--sh-line,#dadde1);color:var(--sh-text,#050505)}
    #viralBoostSection .vb-btn:disabled{opacity:.55;cursor:wait}
    #viralBoostSection .vb-save-row .vb-btn:first-child{flex:1}
    #viralBoostSection .vb-status{font-size:13px;line-height:1.4;min-height:18px;color:var(--sh-sub,#65676b);overflow-wrap:anywhere}
    #viralBoostSection .vb-saved-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
    #viralBoostSection .vb-saved-head h3{margin:0}
    #viralBoostSection .vb-draft{border-top:1px solid var(--sh-line,#dadde1);padding:12px 0}
    #viralBoostSection .vb-draft:first-child{border-top:0}
    #viralBoostSection .vb-draft-title{font-weight:750;overflow-wrap:anywhere}
    #viralBoostSection .vb-draft-meta{font-size:12px;color:var(--sh-sub,#65676b);margin:4px 0 8px}
    #viralBoostSection .vb-draft-copy{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;margin:8px 0}
    #viralBoostSection .vb-draft-actions{display:flex;gap:8px;flex-wrap:wrap}
    #viralBoostSection .vb-footnote{font-size:12px;color:var(--sh-sub,#65676b);padding:6px 2px 20px;line-height:1.5}
    @media(min-width:560px){#viralBoostSection .vb-platforms{grid-template-columns:repeat(3,minmax(0,1fr))}}
    html.mx-light #viralBoostSection .vb-input{background:#fff!important;color:#050505!important}
    html.mx-light #viralBoostSection .vb-btn.secondary{color:#050505!important}
  `;
  document.head.appendChild(style);

  function say(message, bad = false) {
    $("vbStatus").textContent = message;
    $("vbStatus").style.color = bad ? "#c62828" : "var(--sh-sub,#65676b)";
  }
  function cleanupPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    selectedFile = null;
    $("vbPreviewWrap").replaceChildren();
    $("vbPreviewWrap").hidden = true;
  }
  $("vbFile").addEventListener("change", () => {
    cleanupPreview();
    const file = $("vbFile").files && $("vbFile").files[0];
    if (!file) return;
    const allowed = /^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime|x-m4v))$/i.test(file.type);
    if (!allowed) { $("vbFile").value = ""; say("Please choose a JPG, PNG, WebP, GIF, MP4, WebM, or MOV file.", true); return; }
    if (file.size > MAX_FILE) { $("vbFile").value = ""; say("That file is over 100 MB. Choose a smaller file.", true); return; }
    selectedFile = file;
    previewUrl = URL.createObjectURL(file);
    let media;
    if (file.type.startsWith("video/")) {
      media = document.createElement("video");
      media.controls = true; media.playsInline = true; media.src = previewUrl;
    } else {
      media = document.createElement("img");
      media.alt = "Preview of uploaded content";
      media.src = previewUrl;
    }
    $("vbPreviewWrap").appendChild(media);
    $("vbPreviewWrap").hidden = false;
    if (!$("vbTitle").value.trim()) $("vbTitle").value = file.name.replace(/\.[^.]+$/, "").slice(0, 120);
    say("Preview ready. Your file stays on this device until you save the draft.");
  });

  function selectedPlatforms() {
    return Array.from(pane.querySelectorAll('input[name="vbPlatform"]:checked')).map(el => el.value);
  }
  function makeIdeas() {
    const topic = $("vbTopic").value.trim();
    const title = $("vbTitle").value.trim();
    const base = topic || title || "my latest content";
    const lower = base.toLowerCase();
    const tags = new Set(["#MuskySocials", "#ForYou"]);
    const categories = [
      [/fashion|style|outfit|clothes|beauty|makeup/, ["#Fashion", "#StyleInspo", "#OOTD"]],
      [/food|cook|recipe|restaurant|eat|meal/, ["#Foodie", "#FoodTok", "#RecipeIdeas"]],
      [/music|song|dance|beat|sing/, ["#Music", "#Dance", "#NewMusic"]],
      [/business|brand|shop|product|sell/, ["#SmallBusiness", "#Entrepreneur", "#ShopSmall"]],
      [/comedy|funny|joke|skit|laugh/, ["#Comedy", "#FunnyVideos", "#Relatable"]],
      [/travel|trip|hotel|holiday|adventure/, ["#Travel", "#ExploreMore", "#TravelTips"]],
      [/fitness|gym|workout|health/, ["#Fitness", "#WorkoutMotivation", "#HealthyHabits"]],
      [/game|gaming|stream/, ["#Gaming", "#Gamer", "#Gameplay"]],
      [/photo|photography|picture/, ["#Photography", "#PhotoOfTheDay", "#Creative"]],
      [/education|learn|tutorial|tip|how to/, ["#LearnOnTikTok", "#HowTo", "#QuickTips"]]
    ];
    for (const [pattern, values] of categories) if (pattern.test(lower)) values.forEach(v => tags.add(v));
    const topicTag = base.split(/\s+/).filter(Boolean).slice(0, 3).map(w => "#" + w.replace(/[^a-z0-9]/gi, "")).filter(t => t.length > 1);
    topicTag.forEach(t => tags.add(t));
    if (!$("vbCaption").value.trim()) {
      $("vbCaption").value = "Here’s " + base + " ✨\n\nWhat do you think? Share your thoughts below and save this for later!";
    }
    $("vbHashtags").value = Array.from(tags).slice(0, 12).join(" ");
    $("vbCopyStatus").textContent = "Caption and hashtag ideas are ready. Adjust them for your audience.";
  }
  $("vbIdeas").addEventListener("click", makeIdeas);
  $("vbCopy").addEventListener("click", async () => {
    const content = [$("vbCaption").value.trim(), $("vbHashtags").value.trim()].filter(Boolean).join("\n\n");
    if (!content) { $("vbCopyStatus").textContent = "Add a caption or generate ideas first."; return; }
    try {
      await navigator.clipboard.writeText(content);
      $("vbCopyStatus").textContent = "Caption and hashtags copied.";
    } catch {
      const temp = document.createElement("textarea");
      temp.value = content; pane.appendChild(temp); temp.select();
      const ok = document.execCommand("copy"); temp.remove();
      $("vbCopyStatus").textContent = ok ? "Caption and hashtags copied." : "Copy was blocked by your browser. Select and copy the text manually.";
    }
  });

  $("vbReset").addEventListener("click", () => {
    cleanupPreview();
    $("vbFile").value = ""; $("vbTitle").value = ""; $("vbUrl").value = "";
    $("vbTopic").value = ""; $("vbCaption").value = ""; $("vbHashtags").value = "";
    pane.querySelectorAll('input[name="vbPlatform"]').forEach(el => el.checked = false);
    $("vbCopyStatus").textContent = "";
    say("Form cleared.");
  });

  function safeUrl(value) {
    if (!value) return "";
    try { const u = new URL(value); return ["https:", "http:"].includes(u.protocol) ? u.href : ""; } catch { return ""; }
  }
  function getUserId() {
    return sb.auth.getUser().then(({ data, error }) => {
      if (error) throw error;
      if (!data.user) throw new Error("Please sign in to save a promotion draft.");
      return data.user.id;
    });
  }
  function formatDate(value) {
    return new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
  }
  async function saveDraft() {
    if (saving) return;
    const title = $("vbTitle").value.trim();
    const postUrlRaw = $("vbUrl").value.trim();
    const postUrl = safeUrl(postUrlRaw);
    const platforms = selectedPlatforms();
    if (!title) return say("Add a campaign name first.", true);
    if (!selectedFile && !postUrl) return say("Upload an image/video or paste a valid post link.", true);
    if (postUrlRaw && !postUrl) return say("Enter a valid http:// or https:// post link.", true);
    if (!platforms.length) return say("Choose at least one social platform.", true);
    const caption = $("vbCaption").value.trim();
    const hashtags = $("vbHashtags").value.trim();
    const button = $("vbSave");
    saving = true; button.disabled = true; say("Saving your private campaign draft…");
    let path = null;
    try {
      const userId = await getUserId();
      if (selectedFile) {
        const ext = (selectedFile.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
        path = userId + "/" + new Date().toISOString().slice(0, 10) + "/" + crypto.randomUUID() + "." + ext;
        const uploaded = await sb.storage.from(BUCKET).upload(path, selectedFile, {
          contentType: selectedFile.type,
          cacheControl: "3600",
          upsert: false
        });
        if (uploaded.error) throw new Error("Upload failed: " + uploaded.error.message + ". Check that the latest database migration is applied.");
      }
      const { error } = await sb.from("viral_campaigns").insert({
        user_id: userId, title, post_url: postUrl || null, platforms, caption, hashtags,
        asset_path: path, original_file_name: selectedFile ? selectedFile.name : null,
        content_type: selectedFile ? selectedFile.type : null, file_size: selectedFile ? selectedFile.size : null
      });
      if (error) {
        if (path) await sb.storage.from(BUCKET).remove([path]);
        throw new Error("Could not save draft: " + error.message);
      }
      say("Draft saved. No coins were charged; no post was published or promoted.");
      cleanupPreview(); $("vbFile").value = "";
      await loadDrafts();
    } catch (error) {
      say(String(error && error.message || "Could not save this draft."), true);
    } finally {
      saving = false; button.disabled = false;
    }
  }
  $("vbSave").addEventListener("click", saveDraft);

  async function openAsset(path, name) {
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, 300, name ? { download: name } : undefined);
    if (error || !data || !data.signedUrl) throw error || new Error("Could not open the uploaded file.");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }
  async function deleteDraft(id, path) {
    if (!confirm("Delete this saved draft? This cannot be undone.")) return;
    const { error } = await sb.from("viral_campaigns").delete().eq("id", id);
    if (error) return say("Could not delete draft: " + error.message, true);
    if (path) {
      const removed = await sb.storage.from(BUCKET).remove([path]);
      if (removed.error) say("Draft deleted, but its private media file could not be removed: " + removed.error.message, true);
    }
    await loadDrafts();
  }
  async function loadDrafts() {
    const box = $("vbDrafts");
    box.textContent = "Loading your drafts…";
    try {
      const userId = await getUserId();
      const { data, error } = await sb.from("viral_campaigns")
        .select("id,title,post_url,platforms,caption,hashtags,asset_path,original_file_name,created_at")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      if (!data || !data.length) { box.innerHTML = "<p class='vb-muted'>No saved drafts yet. Create your first one above.</p>"; return; }
      box.innerHTML = data.map(row =>
        '<article class="vb-draft"><div class="vb-draft-title">' + esc(row.title) + '</div>' +
        '<div class="vb-draft-meta">' + esc(formatDate(row.created_at)) + ' · ' + esc((row.platforms || []).join(", ") || "No platform") + '</div>' +
        (row.post_url ? '<p><a href="' + esc(row.post_url) + '" target="_blank" rel="noopener noreferrer">Open original post ↗</a></p>' : '') +
        (row.original_file_name ? '<p class="vb-draft-meta">📎 ' + esc(row.original_file_name) + '</p>' : '') +
        (row.caption ? '<div class="vb-draft-copy">' + esc(row.caption) + '</div>' : '') +
        (row.hashtags ? '<div class="vb-draft-copy">' + esc(row.hashtags) + '</div>' : '') +
        '<div class="vb-draft-actions">' + (row.asset_path ? '<button type="button" class="vb-btn secondary" data-vb-open="' + esc(row.id) + '">Open uploaded file</button>' : '') +
        '<button type="button" class="vb-btn secondary" data-vb-copy="' + esc(row.id) + '">Copy caption</button>' +
        '<button type="button" class="vb-btn secondary" data-vb-delete="' + esc(row.id) + '">Delete draft</button></div>' +
        '<span hidden data-vb-path="' + esc(row.id) + '">' + esc(row.asset_path || "") + '</span></article>'
      ).join("");
      pane._vbRows = data;
    } catch (error) {
      box.textContent = String(error && error.message || "Please sign in to load your saved drafts.");
    }
  }
  pane.addEventListener("click", async event => {
    const open = event.target.closest("[data-vb-open]");
    const copy = event.target.closest("[data-vb-copy]");
    const del = event.target.closest("[data-vb-delete]");
    const rows = pane._vbRows || [];
    if (open) {
      const row = rows.find(r => r.id === open.dataset.vbOpen);
      if (row && row.asset_path) {
        try { await openAsset(row.asset_path, row.original_file_name); }
        catch (error) { say(String(error.message || error), true); }
      }
    }
    if (copy) {
      const row = rows.find(r => r.id === copy.dataset.vbCopy);
      if (row) {
        const text = [row.caption, row.hashtags].filter(Boolean).join("\n\n");
        try { await navigator.clipboard.writeText(text); say("Saved caption copied."); }
        catch { say("Clipboard access was blocked. Open the draft and copy its text manually.", true); }
      }
    }
    if (del) {
      const row = rows.find(r => r.id === del.dataset.vbDelete);
      if (row) await deleteDraft(row.id, row.asset_path);
    }
  });
  $("vbRefresh").addEventListener("click", loadDrafts);
  onShow(pane, loadDrafts);
  // The first visit triggers the same owner-only query as later visits.
  loadDrafts();
}
