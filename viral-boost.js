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
    <div class="vb-info"><strong>How Viral Boost works:</strong> create content for free, then publish to supported connected social accounts. External publishing does not cost MuskySocials coins. Posts appear in the MuskySocials feed only after the user purchases a paid feed-placement service. Paid feed placement remains disabled until it is ready.</div>
    <div class="vb-card">
      <h3>1. Add your content</h3>
      <label for="vbTitle">Campaign name</label>
      <input id="vbTitle" class="vb-input" maxlength="120" placeholder="e.g. My new fashion video">
      <label for="vbFile">Upload an image or video (max 100 MB)</label>
      <input id="vbFile" class="vb-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/x-m4v">
      <div id="vbPreviewWrap" class="vb-preview-wrap" hidden></div>
      <label for="vbUrl">Or paste a post link (optional if you upload a file)</label>
      <input id="vbUrl" class="vb-input" type="url" maxlength="2000" placeholder="https://…">
      <label for="vbMediaType">Promotion type</label>
      <select id="vbMediaType" class="vb-input"><option value="picture">MuskySocials feed placement — picture (planned 950 coins)</option><option value="video">MuskySocials feed placement — video (planned 1,020 coins)</option></select>
      <p class="vb-small">These are planned prices for featuring a post in the MuskySocials feed, not for external ads. Saving a draft and publishing to a connected social account are separate from paid feed placement. No coins are charged now.</p>
      <p class="vb-small">Use content you own or have permission to promote. Uploaded files are private to your account.</p>
    </div>
    <div class="vb-card">
      <h3>2. Choose platforms</h3>
      <p class="vb-muted">Select where you plan to share or promote this content.</p>
      <div class="vb-platforms">
        ${PLATFORMS.map(p => '<label class="vb-platform"><input type="checkbox" name="vbPlatform" value="' + p + '"><span>' + p + '</span></label>').join("")}
      </div>
    </div>
    <div class="vb-card vb-connect-card">
      <h3>3. Connect your social accounts</h3>
      <p class="vb-muted">Connect accounts securely so supported platforms can receive posts directly after publishing is enabled.</p>
      <div id="vbConnectedAccounts" class="vb-connections"><p class="vb-small">Checking connected accounts…</p></div>
      <input id="vbPublishFile" type="file" accept="video/mp4,video/webm,video/quicktime" hidden>
      <label for="vbTikTokPrivacy">TikTok audience privacy (loaded from your connected account)</label>
      <select id="vbTikTokPrivacy" class="vb-input" disabled><option value="">Connect TikTok to load options</option></select>
      <div class="vb-tiktok-options">
        <label><input id="vbTikTokComments" type="checkbox" checked disabled> Allow comments</label>
        <label><input id="vbTikTokDuet" type="checkbox" checked disabled> Allow Duet</label>
        <label><input id="vbTikTokStitch" type="checkbox" checked disabled> Allow Stitch</label>
      </div>
      <div class="vb-actions">
        <button type="button" class="vb-btn" id="vbConnectTikTok">Connect TikTok</button>
        <button type="button" class="vb-btn secondary" id="vbRefreshConnections">Refresh connections</button>
      </div>
      <p id="vbConnectionStatus" class="vb-status" role="status" aria-live="polite"></p>
      <p class="vb-small">Instagram, Facebook, YouTube and other connections will appear when their official publishing integrations are configured. Connecting an account does not post anything by itself. You will review and confirm every post.</p>
    </div>
    <div class="vb-card">
      <h3>4. Prepare your caption</h3>
      <label for="vbCategory">Content category</label>
      <select id="vbCategory" class="vb-input">
        <option value="">Choose a category</option>
        <option value="fashion">Fashion & beauty</option><option value="business">Business & products</option>
        <option value="entertainment">Entertainment & comedy</option><option value="education">Education & tutorials</option>
        <option value="food">Food & cooking</option><option value="travel">Travel & lifestyle</option>
        <option value="fitness">Fitness & wellness</option><option value="gaming">Gaming</option>
        <option value="technology">Technology</option><option value="music">Music & dance</option>
        <option value="other">Other</option>
      </select>
      <label for="vbTopic">What is the content about?</label>
      <input id="vbTopic" class="vb-input" maxlength="240" placeholder="e.g. New sneaker collection, comedy skit, food recipe">
      <label for="vbCaption">Caption</label>
      <textarea id="vbCaption" class="vb-input" rows="4" maxlength="2200" placeholder="Write a caption or generate a starting idea…"></textarea>
      <label for="vbHashtags">Hashtags</label>
      <textarea id="vbHashtags" class="vb-input" rows="2" maxlength="700" placeholder="#YourTopic #Creator"></textarea>
      <div class="vb-actions">
        <button type="button" class="vb-btn" id="vbAiIdeas">✨ Generate AI caption + hashtags</button>
        <button type="button" class="vb-btn secondary" id="vbIdeas">Quick ideas</button>
        <button type="button" class="vb-btn secondary" id="vbCopy">Copy content</button>
      </div>
      <p id="vbCopyStatus" class="vb-status" role="status"></p>
      <p class="vb-small">AI suggestions use Musky Assistant. They can help with wording but cannot guarantee reach or virality. Quick ideas work as a simple fallback.</p>
    </div>
    <div class="vb-actions vb-save-row">
      <button type="button" class="vb-btn" id="vbSave">Save promotion draft</button>
      <button type="button" class="vb-btn secondary" id="vbCancelEdit" hidden>Cancel edit</button>
      <button type="button" class="vb-btn secondary" id="vbReset">Clear form</button>
    </div>
    <p id="vbStatus" class="vb-status" role="status" aria-live="polite"></p>
    <div class="vb-card vb-saved-card">
      <div class="vb-saved-head"><div><h3>Your saved drafts</h3><p class="vb-muted">Private to your account</p></div><button type="button" class="vb-btn secondary" id="vbRefresh">Refresh</button></div>
      <div id="vbDrafts"><p class="vb-muted">Sign in to view saved drafts.</p></div>
    </div>
    <div class="vb-footnote">Publishing to an external account and paid placement in the MuskySocials feed are separate services. External publishing is available only for platforms whose official integrations and permissions are configured. A draft never appears in the public MuskySocials feed automatically.</div>
  `);
  window.shell.addItem(["viralBoostSection", "🚀", "Viral Boost", ""]);
  const $ = id => pane.querySelector("#" + id);
  let selectedFile = null;
  let previewUrl = null;
  let saving = false;
  let editingDraftId = null;
  let connectedAccounts = [];
  let tikTokCreatorInfo = null;

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
    #viralBoostSection select.vb-input{min-height:44px}
    #viralBoostSection input[type=file].vb-input{font-size:13px;padding:9px}
    #viralBoostSection .vb-preview-wrap{margin-top:10px}
    #viralBoostSection .vb-preview-wrap img,#viralBoostSection .vb-preview-wrap video{display:block;width:100%;max-height:360px;object-fit:contain;background:#080e1c;border-radius:12px}
    #viralBoostSection .vb-small{font-size:12px;line-height:1.45;color:var(--sh-sub,#65676b);margin:8px 0 0}
    #viralBoostSection .vb-platforms{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    #viralBoostSection .vb-card .vb-platform{display:flex!important;align-items:center;gap:9px;border:1px solid var(--sh-line,#dadde1);border-radius:10px;padding:10px!important;margin:0!important;min-width:0}
    #viralBoostSection .vb-platform input{width:18px;height:18px;flex:none;accent-color:var(--sh-blue,#1877f2)}
    #viralBoostSection .vb-platform span{overflow-wrap:anywhere}
    #viralBoostSection .vb-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    #viralBoostSection .vb-btn{border:0;border-radius:10px;background:var(--sh-blue,#1877f2);color:#fff;padding:11px 13px;font-weight:700;font-size:14px;min-height:42px}
    #viralBoostSection .vb-btn.secondary{background:transparent;border:1px solid var(--sh-line,#dadde1);color:var(--sh-text,#050505)}
    #viralBoostSection .vb-btn:disabled{opacity:.55;cursor:wait}
    #viralBoostSection .vb-btn[hidden]{display:none!important}
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
    #viralBoostSection .vb-connection{display:flex;align-items:center;gap:10px;border:1px solid var(--sh-line,#dadde1);border-radius:10px;padding:10px;margin:8px 0;min-width:0}
    #viralBoostSection .vb-connection-avatar{width:38px;height:38px;border-radius:50%;object-fit:cover;background:var(--sh-line,#dadde1);flex:none}
    #viralBoostSection .vb-connection-copy{min-width:0;flex:1;overflow-wrap:anywhere}
    #viralBoostSection .vb-connection-copy strong{display:block;font-size:13px}
    #viralBoostSection .vb-connection-copy small{display:block;color:var(--sh-sub,#65676b);font-size:12px;margin-top:3px}
    #viralBoostSection .vb-tiktok-options{display:grid;grid-template-columns:1fr;gap:8px;margin:10px 0}
    #viralBoostSection .vb-tiktok-options label{display:flex;align-items:center;gap:9px;font-size:14px}
    #viralBoostSection .vb-tiktok-options input{width:18px;height:18px;flex:none}
    #viralBoostSection .vb-connection .vb-btn{padding:8px 10px;min-height:36px;font-size:12px;flex:none}
    #viralBoostSection .vb-connection{display:flex;align-items:center;gap:10px;border:1px solid var(--sh-line,#dadde1);border-radius:10px;padding:10px;margin:8px 0;min-width:0}
    #viralBoostSection .vb-connection-avatar{width:38px;height:38px;border-radius:50%;object-fit:cover;background:var(--sh-line,#dadde1);flex:none}
    #viralBoostSection .vb-connection-copy{min-width:0;flex:1;overflow-wrap:anywhere}
    #viralBoostSection .vb-connection-copy strong{display:block;font-size:13px}
    #viralBoostSection .vb-connection-copy small{display:block;color:var(--sh-sub,#65676b);font-size:12px;margin-top:3px}
    #viralBoostSection .vb-connection .vb-btn{padding:8px 10px;min-height:36px;font-size:12px;flex:none}
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
    $("vbMediaType").disabled = false;
    const file = $("vbFile").files && $("vbFile").files[0];
    if (!file) return;
    const allowed = /^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime|x-m4v))$/i.test(file.type);
    if (!allowed) { $("vbFile").value = ""; say("Please choose a JPG, PNG, WebP, GIF, MP4, WebM, or MOV file.", true); return; }
    if (file.size > MAX_FILE) { $("vbFile").value = ""; say("That file is over 100 MB. Choose a smaller file.", true); return; }
    $("vbMediaType").value = file.type.startsWith("video/") ? "video" : "picture";
    $("vbMediaType").disabled = true;
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

  async function invokeSocial(action, extra = {}) {
    const { data, error } = await sb.functions.invoke("social-connections", { body: { action, ...extra } });
    if (error) {
      let message = error.message || "Social account service is not available yet.";
      try { const body = await error.context.json(); if (body.error) message = body.error; } catch {}
      throw new Error(message);
    }
    if (data && data.error) throw new Error(data.error);
    return data || {};
  }
  function connectionMessage(message, bad = false) {
    const el = $("vbConnectionStatus");
    el.textContent = message;
    el.style.color = bad ? "#c62828" : "var(--sh-sub,#65676b)";
  }
  async function loadConnections() {
    const box = $("vbConnectedAccounts");
    box.textContent = "Checking connected accounts…";
    try {
      const result = await invokeSocial("list");
      const connections = Array.isArray(result.connections) ? result.connections : [];
      connectedAccounts = connections;
      if (!connections.length) {
        tikTokCreatorInfo = null;
        $("vbTikTokPrivacy").disabled = true;
        $("vbTikTokPrivacy").innerHTML = "<option value=''>Connect TikTok to load options</option>";
        ["Comments","Duet","Stitch"].forEach(name => { $("vbTikTok" + name).checked = false; $("vbTikTok" + name).disabled = true; });
        box.innerHTML = "<p class='vb-small'>No social accounts connected yet.</p>";
        $("vbConnectTikTok").textContent = "Connect TikTok";
        await loadDrafts();
        return;
      }
      box.innerHTML = connections.map(account => {
        const name = esc(account.display_name || account.provider);
        const provider = esc(account.provider || "");
        const avatar = safeUrl(account.avatar_url || "");
        const image = avatar ? "<img class='vb-connection-avatar' src='" + esc(avatar) + "' alt=''>" : "<span class='vb-connection-avatar' aria-hidden='true'></span>";
        return "<div class='vb-connection'>" + image + "<div class='vb-connection-copy'><strong>" + name + "</strong><small>" + provider + " · connected</small></div><button type='button' class='vb-btn secondary' data-vb-disconnect='" + provider + "'>Disconnect</button></div>";
      }).join("");
      const hasTikTok = connections.some(a => a.provider === "tiktok");
      $("vbConnectTikTok").textContent = hasTikTok ? "Reconnect TikTok" : "Connect TikTok";
      if (hasTikTok) {
        try {
          tikTokCreatorInfo = await invokeSocial("creator-info");
          const privacy = Array.isArray(tikTokCreatorInfo.privacy_level_options) ? tikTokCreatorInfo.privacy_level_options : [];
          const labels = { PUBLIC_TO_EVERYONE: "Everyone (public)", MUTUAL_FOLLOW_FRIENDS: "Friends / mutual followers", FOLLOWER_OF_CREATOR: "Followers", SELF_ONLY: "Only me" };
          $("vbTikTokPrivacy").innerHTML = privacy.length
            ? privacy.map(value => "<option value='" + esc(value) + "'>" + esc(labels[value] || value) + "</option>").join("")
            : "<option value=''>No posting privacy options available</option>";
          $("vbTikTokPrivacy").disabled = !privacy.length;
          if (privacy.length) $("vbTikTokPrivacy").value = privacy[0];
          [["Comments","comment_disabled"],["Duet","duet_disabled"],["Stitch","stitch_disabled"]].forEach(([label, key]) => {
            const control = $("vbTikTok" + label);
            control.checked = tikTokCreatorInfo[key] !== true;
            control.disabled = tikTokCreatorInfo[key] === true;
          });
          connectionMessage("TikTok connected as " + (tikTokCreatorInfo.creator_nickname || "your account") + ". Review audience and interaction settings before posting.");
        } catch (error) {
          tikTokCreatorInfo = null;
          $("vbTikTokPrivacy").disabled = true;
          $("vbTikTokPrivacy").innerHTML = "<option value=''>TikTok posting permissions need attention</option>";
          ["Comments","Duet","Stitch"].forEach(name => { $("vbTikTok" + name).checked = false; $("vbTikTok" + name).disabled = true; });
          connectionMessage(String(error && error.message || "Could not load TikTok posting settings."), true);
        }
      } else {
        tikTokCreatorInfo = null;
        $("vbTikTokPrivacy").disabled = true;
        $("vbTikTokPrivacy").innerHTML = "<option value=''>Connect TikTok to load options</option>";
        connectionMessage("Connected accounts loaded. Nothing has been published.");
      }
      await loadDrafts();
    } catch (error) {
      connectedAccounts = [];
      tikTokCreatorInfo = null;
      $("vbTikTokPrivacy").disabled = true;
      box.innerHTML = "<p class='vb-small'>Account connection will be available after the secure service is deployed and configured.</p>";
      connectionMessage(String(error && error.message || "Could not load connected accounts."), true);
      await loadDrafts();
    }
  }
  $("vbConnectTikTok").addEventListener("click", async () => {
    const button = $("vbConnectTikTok");
    button.disabled = true;
    connectionMessage("Preparing secure TikTok authorization…");
    try {
      const result = await invokeSocial("start", { provider: "tiktok" });
      if (!result.authorize_url || !/^https:\/\/www\.tiktok\.com\//i.test(result.authorize_url)) throw new Error("TikTok returned an invalid authorization link.");
      window.location.assign(result.authorize_url);
    } catch (error) {
      connectionMessage(String(error && error.message || "Could not connect TikTok."), true);
      button.disabled = false;
    }
  });
  $("vbRefreshConnections").addEventListener("click", loadConnections);
  $("vbPublishFile").addEventListener("change", async () => {
    const fileInput = $("vbPublishFile");
    const campaignId = fileInput.dataset.campaignId;
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = "";
    if (!campaignId || !file) return;
    const button = pane.querySelector('[data-vb-publish-tiktok="' + CSS.escape(campaignId) + '"]');
    if (!button) return;
    if (!/^video\/(mp4|webm|quicktime)$/i.test(file.type)) return say("Choose an MP4, WebM, or MOV video.", true);
    if (file.size < 1 || file.size > 40 * 1024 * 1024) return say("Choose a video under 40 MB for direct TikTok publishing.", true);
    try {
      const videoUrl = URL.createObjectURL(file);
      const duration = await new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => { const value = video.duration; URL.revokeObjectURL(videoUrl); resolve(value); };
        video.onerror = () => { URL.revokeObjectURL(videoUrl); reject(new Error("Could not read this video's duration. Try another video file.")); };
        video.src = videoUrl;
      });
      const maxDuration = Number(tikTokCreatorInfo?.max_video_post_duration_sec || 0);
      if (maxDuration && duration > maxDuration) return say("This TikTok account allows videos up to " + maxDuration + " seconds. Choose a shorter video.", true);
    } catch (error) {
      return say(String(error && error.message || "Could not check video duration."), true);
    }
    if (!confirm("Post the selected video to " + (tikTokCreatorInfo?.creator_nickname || "your connected TikTok account") + "? Audience: " + $("vbTikTokPrivacy").selectedOptions[0].textContent + ". Choose the original video used in this draft. Continue?")) return;
    button.disabled = true;
    const oldLabel = button.textContent;
    button.textContent = "Preparing TikTok post…";
    try {
      const result = await invokeSocial("publish-video", {
        campaign_id: campaignId, privacy_level: $("vbTikTokPrivacy").value,
        allow_comments: $("vbTikTokComments").checked,
        allow_duet: $("vbTikTokDuet").checked,
        allow_stitch: $("vbTikTokStitch").checked,
        consent: true, video_size: file.size, video_type: file.type
      });
      if (result.publish_id) button.dataset.publishId = result.publish_id;
      if (result.status !== "upload_ready" || !result.upload_url || !result.publish_id) {
        button.textContent = result.status === "processing" ? "Check TikTok status" : oldLabel;
        say(result.message || "TikTok did not prepare the upload.", result.status === "failed");
        return;
      }
      const chunkSize = Number(result.chunk_size) || (10 * 1024 * 1024);
      const chunkCount = Math.max(1, Math.floor(file.size / chunkSize));
      for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const endExclusive = chunkIndex === chunkCount - 1 ? file.size : start + chunkSize;
        const part = file.slice(start, endExclusive);
        const end = start + part.size - 1;
        const upload = await fetch(result.upload_url, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
            "Content-Range": "bytes " + start + "-" + end + "/" + file.size
          },
          body: part
        });
        if (!upload.ok) throw new Error("TikTok upload failed at video bytes " + start + "–" + end + ". Use Check TikTok status before trying again.");
      }
      button.textContent = "Checking TikTok…";
      const status = await invokeSocial("publish-status", { publish_id: result.publish_id });
      if (status.status === "published") {
        button.textContent = "Published on TikTok";
        say(status.message || "TikTok confirms the post was published.");
      } else if (status.status === "failed") {
        button.textContent = "TikTok post failed";
        say(status.message || "TikTok reported a publishing failure.", true);
      } else {
        button.textContent = "Check TikTok status";
        say("Video uploaded. TikTok is processing it; check again in a moment.");
      }
    } catch (error) {
      button.textContent = button.dataset.publishId ? "Check TikTok status" : oldLabel;
      say(String(error && error.message || "Could not upload the video to TikTok."), true);
    } finally {
      button.disabled = button.textContent === "Published on TikTok";
    }
  });

  $("vbConnectedAccounts").addEventListener("click", async event => {
    const button = event.target.closest("[data-vb-disconnect]");
    if (!button) return;
    const provider = button.dataset.vbDisconnect;
    if (!confirm("Disconnect " + provider + " from MuskySocials?")) return;
    button.disabled = true;
    try {
      await invokeSocial("disconnect", { provider });
      connectionMessage("Account disconnected.");
      await loadConnections();
    } catch (error) {
      connectionMessage(String(error && error.message || "Could not disconnect account."), true);
      button.disabled = false;
    }
  });
  const query = new URLSearchParams(window.location.search);
  if (query.get("social_connect") === "tiktok_success") {
    connectionMessage("TikTok connected successfully. Publishing will be enabled after the platform posting workflow is completed.");
    query.delete("social_connect");
    const cleanUrl = window.location.pathname + (query.toString() ? "?" + query.toString() : "") + window.location.hash;
    history.replaceState({}, "", cleanUrl);
  }

  function selectedPlatforms() {
    return Array.from(pane.querySelectorAll('input[name="vbPlatform"]:checked')).map(el => el.value);
  }
  function makeIdeas() {
    const topic = $("vbTopic").value.trim();
    const title = $("vbTitle").value.trim();
    const categoryLabel = $("vbCategory").selectedOptions[0]?.textContent;
    const base = topic || title || ($("vbCategory").value ? categoryLabel : "my latest content");
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
  async function generateAiIdeas() {
    const topic = $("vbTopic").value.trim();
    const title = $("vbTitle").value.trim();
    const category = $("vbCategory").value;
    const base = topic || title || category;
    if (!base) {
      $("vbCopyStatus").textContent = "Enter a campaign name or describe your content first.";
      $("vbTopic").focus();
      return;
    }
    const platforms = selectedPlatforms();
    const existingCaption = $("vbCaption").value.trim();
    const prompt = [
      "You are the social media copywriter for MuskySocials.",
      "Create one natural, engaging caption and 5-10 relevant hashtags for a creator's post.",
      "Do not promise viral reach, fake results, or use misleading claims. Avoid generic engagement bait.",
      "Keep the caption concise and adapt it for the selected platforms.",
      "Return exactly this format, without markdown fences:",
      "CAPTION:",
      "(caption text)",
      "",
      "HASHTAGS:",
      "(space-separated hashtags)",
      "",
      "Campaign/content topic: " + base,
      "Category: " + (category || "not selected"),
      "Platforms: " + (platforms.length ? platforms.join(", ") : "General social media"),
      existingCaption ? "Existing caption to improve: " + existingCaption : "No existing caption; write a fresh one."
    ].join("\n");
    const button = $("vbAiIdeas");
    button.disabled = true;
    const oldLabel = button.textContent;
    button.textContent = "Generating…";
    $("vbCopyStatus").textContent = "Asking Musky Assistant for caption ideas…";
    try {
      const { data, error } = await sb.functions.invoke("rapid-function", {
        body: { messages: [{ role: "user", content: prompt }] }
      });
      if (error) throw error;
      const reply = String(data && data.reply || "").trim();
      if (!reply) throw new Error("The AI returned an empty reply.");
      const captionMatch = reply.match(/CAPTION\s*:\s*([\s\S]*?)(?=\n\s*HASHTAGS\s*:|$)/i);
      const hashtagsMatch = reply.match(/HASHTAGS\s*:\s*([\s\S]*)$/i);
      if (captionMatch && captionMatch[1].trim()) {
        $("vbCaption").value = captionMatch[1].trim();
        $("vbHashtags").value = hashtagsMatch ? hashtagsMatch[1].trim() : "";
      } else {
        const lines = reply.split("\n");
        const tagLines = lines.filter(line => /(^|\s)#[\p{L}\p{N}_]+/u.test(line));
        $("vbCaption").value = lines.filter(line => !tagLines.includes(line)).join("\n").trim() || reply;
        $("vbHashtags").value = tagLines.join(" ").trim();
      }
      $("vbCopyStatus").textContent = "AI caption ready. Review it and edit anything that doesn't fit your post.";
    } catch (error) {
      $("vbCopyStatus").textContent = "AI caption unavailable: " + String(error && error.message || "please try again") + " Quick ideas are available as a fallback.";
    } finally {
      button.disabled = false;
      button.textContent = oldLabel;
    }
  }
  $("vbAiIdeas").addEventListener("click", generateAiIdeas);
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

  function resetEditor() {
    cleanupPreview();
    $("vbFile").value = ""; $("vbFile").disabled = false;
    $("vbMediaType").disabled = false;
    $("vbTitle").value = ""; $("vbUrl").value = "";
    $("vbCategory").value = ""; $("vbTopic").value = ""; $("vbCaption").value = ""; $("vbHashtags").value = "";
    pane.querySelectorAll('input[name="vbPlatform"]').forEach(el => el.checked = false);
    $("vbCopyStatus").textContent = "";
    editingDraftId = null;
    $("vbSave").textContent = "Save promotion draft";
    $("vbCancelEdit").hidden = true;
    say("Form cleared.");
  }
  $("vbReset").addEventListener("click", resetEditor);
  $("vbCancelEdit").addEventListener("click", resetEditor);

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
    const editingRow = editingDraftId && (pane._vbRows || []).find(row => row.id === editingDraftId);
    if (!selectedFile && !postUrl && !(editingRow && editingRow.asset_path)) return say("Upload an image/video or paste a valid post link.", true);
    if (postUrlRaw && !postUrl) return say("Enter a valid http:// or https:// post link.", true);
    if (!platforms.length) return say("Choose at least one social platform.", true);
    const category = $("vbCategory").value || "other";
    const caption = $("vbCaption").value.trim();
    const hashtags = $("vbHashtags").value.trim();
    const button = $("vbSave");
    saving = true; button.disabled = true; say("Saving your private campaign draft…");
    let path = null;
    const saveId = editingDraftId;
    try {
      const userId = await getUserId();
      if (selectedFile) {
        const ext = (selectedFile.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
        const unique = window.crypto && typeof window.crypto.randomUUID === "function" ? window.crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2));
        path = userId + "/" + new Date().toISOString().slice(0, 10) + "/" + unique + "." + ext;
        const uploaded = await sb.storage.from(BUCKET).upload(path, selectedFile, {
          contentType: selectedFile.type,
          cacheControl: "3600",
          upsert: false
        });
        if (uploaded.error) throw new Error("Upload failed: " + uploaded.error.message + ". Check that the latest database migration is applied.");
      }
      if (saveId) {
        const { data: updated, error } = await sb.from("viral_campaigns")
          .update({ title, post_url: postUrl || null, platforms, caption, hashtags, media_type: $("vbMediaType").value, content_category: category })
          .eq("id", saveId).eq("user_id", userId).select("id").maybeSingle();
        if (error || !updated) throw new Error("Could not update draft: " + (error && error.message || "draft not found or permission denied"));
        editingDraftId = null;
        $("vbSave").textContent = "Save promotion draft";
        $("vbCancelEdit").hidden = true;
        $("vbFile").disabled = false;
        say("Draft changes saved. No coins were charged; nothing was published or promoted.");
      } else {
        const { error } = await sb.from("viral_campaigns").insert({
          user_id: userId, title, post_url: postUrl || null, platforms, caption, hashtags,
          media_type: $("vbMediaType").value, content_category: category,
          asset_path: path, original_file_name: selectedFile ? selectedFile.name : null,
          content_type: selectedFile ? selectedFile.type : null, file_size: selectedFile ? selectedFile.size : null
        });
        if (error) {
          if (path) await sb.storage.from(BUCKET).remove([path]);
          throw new Error("Could not save draft: " + error.message);
        }
        say("Draft saved. No coins were charged; no post was published or promoted.");
      }
      cleanupPreview(); $("vbFile").value = ""; $("vbFile").disabled = false;
      $("vbMediaType").disabled = false;
      $("vbTopic").value = "";
      await loadDrafts();
    } catch (error) {
      say(String(error && error.message || "Could not save this draft."), true);
    } finally {
      saving = false; button.disabled = false;
    }
  }
  $("vbSave").addEventListener("click", saveDraft);

  async function requestPromotion() {
    // Safety gate: real advertising fulfillment is not connected, so never charge coins.
    say("Paid promotion is coming soon. Your coins have NOT been deducted. You can keep creating and editing drafts for free.");
  }

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
        .select("id,title,post_url,platforms,caption,hashtags,content_category,asset_path,original_file_name,content_type,media_type,promotion_status,promotion_cost,created_at")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      if (!data || !data.length) { box.innerHTML = "<p class='vb-muted'>No saved drafts yet. Create your first one above.</p>"; return; }
      box.innerHTML = data.map(row =>
        '<article class="vb-draft"><div class="vb-draft-title">' + esc(row.title) + '</div>' +
        '<div class="vb-draft-meta">' + esc(formatDate(row.created_at)) + ' · ' + esc((row.platforms || []).join(", ") || "No platform") + ' · ' + esc(row.content_category || "other") + '</div>' +
        (row.post_url ? '<p><a href="' + esc(row.post_url) + '" target="_blank" rel="noopener noreferrer">Open original post ↗</a></p>' : '') +
        (row.original_file_name ? '<p class="vb-draft-meta">📎 ' + esc(row.original_file_name) + '</p>' : '') +
        (row.caption ? '<div class="vb-draft-copy">' + esc(row.caption) + '</div>' : '') +
        (row.hashtags ? '<div class="vb-draft-copy">' + esc(row.hashtags) + '</div>' : '') +
        '<p class="vb-draft-meta">Type: ' + esc(row.media_type || ((row.content_type || "").startsWith("video/") ? "video" : "picture")) + (row.promotion_status && row.promotion_status !== "draft" ? " · Promotion: " + esc(row.promotion_status) + (row.promotion_cost ? " (" + esc(String(row.promotion_cost)) + " coins)" : "") : "") + '</p>' +
        (row.promotion_status && row.promotion_status !== "draft" ? '<p class="vb-small">Feed placement requested. This post is not visible in the public MuskySocials feed until the paid placement service is enabled and fulfilled.</p>' : '') +
        '<div class="vb-draft-actions">' + (connectedAccounts.some(a => a.provider === "tiktok") && String(row.content_type || "").startsWith("video/") && row.asset_path ? '<button type="button" class="vb-btn" data-vb-publish-tiktok="' + esc(row.id) + '">Post video to TikTok</button>' : '') + (row.promotion_status && row.promotion_status !== "draft" ? "" : '<button type="button" class="vb-btn secondary" data-vb-edit="' + esc(row.id) + '">Edit draft</button>') + (row.promotion_status && row.promotion_status !== "draft" ? "" : '<button type="button" class="vb-btn" data-vb-promote="' + esc(row.id) + '" disabled aria-disabled="true" title="Paid promotion will be enabled when advertising delivery is connected">Paid promotion · Coming soon</button>') + (row.asset_path ? '<button type="button" class="vb-btn secondary" data-vb-open="' + esc(row.id) + '">Open uploaded file</button>' : '') +
        '<button type="button" class="vb-btn secondary" data-vb-copy="' + esc(row.id) + '">Copy caption</button>' +
        (row.promotion_status && row.promotion_status !== "draft" ? "" : '<button type="button" class="vb-btn secondary" data-vb-delete="' + esc(row.id) + '">Delete draft</button>') + '</div>' +
        '<span hidden data-vb-path="' + esc(row.id) + '">' + esc(row.asset_path || "") + '</span></article>'
      ).join("");
      pane._vbRows = data;
    } catch (error) {
      box.textContent = String(error && error.message || "Please sign in to load your saved drafts.");
    }
  }
  function editDraft(row) {
    if (!row) return;
    cleanupPreview();
    $("vbFile").value = "";
    $("vbFile").disabled = true;
    $("vbMediaType").disabled = !!row.asset_path;
    $("vbTitle").value = row.title || "";
    $("vbUrl").value = row.post_url || "";
    $("vbMediaType").value = row.media_type || ((row.content_type || "").startsWith("video/") ? "video" : "picture");
    $("vbCategory").value = row.content_category || "other";
    $("vbTopic").value = "";
    $("vbCaption").value = row.caption || "";
    $("vbHashtags").value = row.hashtags || "";
    pane.querySelectorAll('input[name="vbPlatform"]').forEach(el => {
      el.checked = (row.platforms || []).includes(el.value);
    });
    editingDraftId = row.id;
    $("vbSave").textContent = "Save changes";
    $("vbCancelEdit").hidden = false;
    $("vbCopyStatus").textContent = "Editing a saved draft. Its uploaded media will remain unchanged.";
    say("Editing “" + row.title + "”. Update the details above, then save changes.");
    $("vbTitle").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  pane.addEventListener("click", async event => {
    const edit = event.target.closest("[data-vb-edit]");
    const promote = event.target.closest("[data-vb-promote]");
    const open = event.target.closest("[data-vb-open]");
    const copy = event.target.closest("[data-vb-copy]");
    const del = event.target.closest("[data-vb-delete]");
    const publishTikTok = event.target.closest("[data-vb-publish-tiktok]");
    const rows = pane._vbRows || [];
    if (publishTikTok) {
      const row = rows.find(r => r.id === publishTikTok.dataset.vbPublishTiktok);
      if (row) {
        if (!connectedAccounts.some(a => a.provider === "tiktok")) return say("Connect TikTok first.", true);
        if (!tikTokCreatorInfo || !$("vbTikTokPrivacy").value) return say("Refresh TikTok account settings before posting.", true);
        const checking = !!publishTikTok.dataset.publishId;
        if (!checking) {
          $("vbPublishFile").dataset.campaignId = row.id;
          $("vbPublishFile").click();
          return;
        }
        publishTikTok.disabled = true;
        const oldLabel = publishTikTok.textContent;
        publishTikTok.textContent = checking ? "Checking status…" : "Sending to TikTok…";
        try {
          const result = checking
            ? await invokeSocial("publish-status", { publish_id: publishTikTok.dataset.publishId })
            : await invokeSocial("publish-video", { campaign_id: row.id, privacy_level: $("vbTikTokPrivacy").value, consent: true });
          if (result.publish_id) publishTikTok.dataset.publishId = result.publish_id;
          if (result.status === "processing" && result.publish_id) {
            publishTikTok.textContent = "Check TikTok status";
            say(result.message || "TikTok is processing the video. Check again in a moment.");
          } else if (result.status === "published") {
            publishTikTok.textContent = "Published on TikTok";
            publishTikTok.disabled = true;
            say(result.message || "TikTok confirms the post was published.");
          } else if (result.status === "failed") {
            publishTikTok.textContent = "TikTok post failed";
            say(result.message || "TikTok reported a publishing failure. Review the draft before trying again.", true);
          } else {
            publishTikTok.textContent = oldLabel;
            say(result.message || "TikTok returned a response.", result.status === "failed");
          }
        } catch (error) {
          publishTikTok.textContent = oldLabel;
          say(String(error && error.message || "Could not publish to TikTok."), true);
        } finally {
          if (publishTikTok.textContent !== "Published on TikTok") publishTikTok.disabled = false;
        }
      }
    }
    if (edit) {
      const row = rows.find(r => r.id === edit.dataset.vbEdit);
      editDraft(row);
    }
    if (promote) {
      const row = rows.find(r => r.id === promote.dataset.vbPromote);
      if (row) await requestPromotion(row, promote);
    }
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
  loadConnections();
}
