// MuskySocials HeadSwap v1 — photo head swap via the public BFS Space.
// Space: hugging-apps/bfs-best-face-swap  |  endpoint: /face_swap
// No tokens or secrets here. Photos are sent to a third-party AI service.
import { Client, handle_file } from "https://cdn.jsdelivr.net/npm/@gradio/client/dist/index.min.js";

const SPACE = "hugging-apps/bfs-best-face-swap";

// ---- Simple event log (Supabase). The publishable key is public by design:
// the table only allows adding rows, never reading or deleting them.
const SB_URL = "https://jnsbttwyiwcqhuhveikq.supabase.co";
const SB_KEY = "sb_publishable_LB_HC5TVIdKf7FX3c0q8Hg__81wa5F2";
function log(event, item_id = null, order_ref = null, detail = null) {
  try {
    fetch(SB_URL + "/rest/v1/site_events", {
      method: "POST",
      headers: { apikey: SB_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        event: String(event).slice(0, 40),
        item_id: item_id && String(item_id).slice(0, 40),
        order_ref: order_ref && String(order_ref).slice(0, 40),
        detail: detail && String(detail).slice(0, 200),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

const MAX_SIDE = 1536; // shrink big phone photos before upload (faster, fewer errors)

const css = `
#hs{box-sizing:border-box;max-width:560px;margin:16px auto;padding:14px;border-radius:14px;
background:#070b16;border:1px solid #1b2a52;color:#e6ecff;font:15px/1.4 system-ui,sans-serif}
#hs *{box-sizing:border-box}
#hs h2{margin:0 0 4px;font-size:18px}
#hs p.note{margin:0 0 12px;color:#8fa3d6;font-size:13px}
#hs .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
#hs label.box{display:flex;flex-direction:column;gap:6px;font-size:13px;color:#b8c6ee}
#hs .pick{position:relative;aspect-ratio:3/4;border:1px dashed #2c427f;border-radius:10px;background:#0b1530;
display:flex;align-items:center;justify-content:center;overflow:hidden;color:#6f86c4;text-align:center;padding:6px}
#hs .pick img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
#hs input[type=file]{display:none}
#hs .consent{display:flex;gap:8px;align-items:flex-start;margin:12px 0;font-size:13px;color:#b8c6ee}
#hs .consent input{margin-top:3px}
#hs button{width:100%;padding:12px;border:0;border-radius:10px;background:#1d4ed8;color:#fff;font-size:16px;font-weight:600}
#hs button:disabled{background:#1b2a52;color:#6f86c4}
#hs .status{margin-top:10px;font-size:14px;color:#9fb4f0;min-height:20px}
#hs .status.err{color:#ff9a9a}
#hs .out{margin-top:10px;display:none}
#hs .out img{width:100%;border-radius:10px;display:block}
#hs .out button{margin-top:8px;background:#0f1d42;border:1px solid #2c427f}
`;

const html = `
<h2>HeadSwap</h2>
<p class="note">Photos are sent to a third-party AI service (Hugging Face Space). Use only photos of people who gave permission.</p>
<div class="row">
  <label class="box">Face to use (reference)
    <span class="pick" id="hsPickRef"><span>Tap to upload</span></span>
    <input type="file" accept="image/*" id="hsRef"></label>
  <label class="box">Body / scene (target)
    <span class="pick" id="hsPickTgt"><span>Tap to upload</span></span>
    <input type="file" accept="image/*" id="hsTgt"></label>
</div>
<label class="consent"><input type="checkbox" id="hsOk"><span>I have permission to use these photos.</span></label>
<button id="hsGo" disabled>Generate HeadSwap</button>
<div class="status" id="hsStatus"></div>
<div class="out" id="hsOut"><img id="hsImg" alt="HeadSwap result"><button id="hsDl">Download result</button></div>
`;

const style = document.createElement("style");
style.textContent = css;
document.head.appendChild(style);
const pane = document.createElement("section");
pane.id = "headswapSection";
pane.className = "pane";
pane.hidden = true;
const root = document.createElement("div");
root.id = "hs";
root.innerHTML = html;
pane.appendChild(root);

// Put the panel inside the studio, before the footer, and add a tab for it.
const host = document.querySelector("#studio") || document.body;
host.insertBefore(pane, host.querySelector(":scope > footer"));

const $ = (id) => root.querySelector("#" + id);
const files = { ref: null, tgt: null };
let resultUrl = null;

function setStatus(msg, isErr = false) {
  const s = $("hsStatus");
  s.textContent = msg;
  s.className = "status" + (isErr ? " err" : "");
}

function refresh() {
  $("hsGo").disabled = !(files.ref && files.tgt && $("hsOk").checked);
}

async function shrink(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.92));
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

function wirePick(inputId, pickId, key) {
  $(inputId).addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith("image/") || f.size > 25 * 1024 * 1024) {
      setStatus("Use an image file under 25 MB.", true);
      return;
    }
    try {
      files[key] = await shrink(f);
      const pick = $(pickId);
      pick.innerHTML = "";
      const img = document.createElement("img");
      img.src = URL.createObjectURL(files[key]);
      pick.appendChild(img);
      setStatus("");
    } catch {
      files[key] = null;
      setStatus("Could not read that image. Try a JPG or PNG.", true);
    }
    refresh();
  });
}

wirePick("hsRef", "hsPickRef", "ref");
wirePick("hsTgt", "hsPickTgt", "tgt");
$("hsOk").addEventListener("change", refresh);

function friendlyError(err) {
  const m = String((err && (err.message || err.detail)) || err || "");
  if (/quota|GPU|zero/i.test(m))
    return "The free GPU quota is used up for now. Try again later.";
  if (/queue|busy|full/i.test(m)) return "The AI Space is busy. Try again in a minute.";
  return "HeadSwap failed: " + (m.slice(0, 220) || "unknown error") +
    " (copy this message and send it to Claude)";
}

$("hsGo").addEventListener("click", async () => {
  const btn = $("hsGo");
  btn.disabled = true;
  $("hsOut").style.display = "none";
  try {
    log("headswap_start");
    setStatus("Connecting to the AI Space…");
    const app = await Client.connect(SPACE);
    setStatus("Generating… this can take 30–90 seconds.");
    // Only the two images are sent; the Space uses its own defaults
    // (Turbo mode, 1536 px, random seed, standard head-swap prompt).
    const res = await app.predict("/face_swap", {
      reference_face: handle_file(files.ref),
      target_image: handle_file(files.tgt),
    });
    const slider = res.data[0]; // [target, result] before/after pair
    const item = Array.isArray(slider) ? slider[1] : slider;
    resultUrl = item && (item.url || item.path);
    if (!resultUrl) throw new Error("The Space returned no image.");
    $("hsImg").src = resultUrl;
    $("hsOut").style.display = "block";
    log("headswap_done");
    setStatus("Done. Check the result, then download it.");
  } catch (err) {
    console.error(err);
    log("headswap_fail", null, null, (err && (err.message || err.detail)) || err);
    setStatus(friendlyError(err), true);
  } finally {
    refresh();
  }
});

$("hsDl").addEventListener("click", async () => {
  try {
    const blob = await (await fetch(resultUrl)).blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "headswap.png";
    a.click();
  } catch {
    window.open(resultUrl, "_blank"); // fallback: long-press to save
  }
});

// Load the "More" menu after this panel exists.
import("./more.js").catch((e) => console.error("more.js failed", e));
