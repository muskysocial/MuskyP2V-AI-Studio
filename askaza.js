// MuskySocials "Ask 4 Aza" v1: a searchable list of banks and payment apps with how long money
// usually takes to land. People tap "Ask for account" and continue on WhatsApp.
// You manage the list (add, change timing, upload logos, hide, delete) in Admin. Loaded by portal.js.
const WA = "2349041259863";
const SB_URL = "https://jnsbttwyiwcqhuhveikq.supabase.co";
const SB_KEY = "sb_publishable_LB_HC5TVIdKf7FX3c0q8Hg__81wa5F2";
const BUCKET = "logos";
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
  const REGIONS = ["USA", "Europe", "UK", "Nigeria", "Global"];
  const logoUrl = (p) => sb.storage.from(BUCKET).getPublicUrl(p).data.publicUrl;
  const ref = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return "MS-" + p(d.getMonth() + 1) + p(d.getDate()) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  };
  const log = (event, item_id, order_ref, detail) => {
    try {
      fetch(SB_URL + "/rest/v1/site_events", {
        method: "POST",
        headers: { apikey: SB_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ event, item_id: String(item_id).slice(0, 40), order_ref, detail: String(detail).slice(0, 200) }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  };
  const hue = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const avatar = (m) => m.logo_path
    ? '<img class="az-logo" alt="" loading="lazy" src="' + esc(logoUrl(m.logo_path)) + '">'
    : '<div class="az-logo az-letter" style="background:hsl(' + hue(m.name) + ',55%,45%)">' + esc(m.name.charAt(0).toUpperCase()) + "</div>";

  const st = document.createElement("style");
  st.textContent = `
.az-card{display:flex;gap:12px;align-items:flex-start}
.az-logo{flex:none;width:52px;height:52px;border-radius:12px;object-fit:contain;background:#fff;border:1px solid var(--sh-line,#dadde1)}
.az-letter{display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:22px;border:0}
.az-main{min-width:0;flex:1}
.az-t{font-weight:700}
.az-s{font-size:13px;color:var(--sh-sub,#65676b);margin-top:2px}
.az-time{margin:8px 0;font-size:14px}
.az-note{font-size:13px;padding:10px;border-radius:10px;border:1px solid var(--sh-line,#dadde1);margin-bottom:10px}
html.mx-light #studio .az-s{color:#65676b!important}
html.mx-light #studio .az-letter{color:#fff!important}
`;
  document.head.appendChild(st);

  // ---------- Ask 4 Aza screen (everyone signed in)
  const pane = mkPane("askazaSection",
    "<h2>Ask 4 Aza</h2><div class='az-note'>Times shown are typical, not promises. They change with the sending bank, cut-off times, weekends and holidays. " +
    "Always confirm account details with us on WhatsApp before you pay.</div>" +
    "<div class='gs-chips' id='azChips'></div><div id='azList'>Loading…</div>");
  window.shell.addItem(["askazaSection", "💱", "Ask 4 Aza", ""]);
  const list = pane.querySelector("#azList");
  const chips = pane.querySelector("#azChips");
  let items = [];
  let region = "All";

  function draw() {
    chips.innerHTML = ["All", ...REGIONS].map((r) => '<button class="gs-chip' + (r === region ? " on" : "") + '" data-reg="' + r + '">' + r + "</button>").join("");
    const shown = items.filter((m) => region === "All" || m.region === region);
    list.innerHTML = shown.length ? shown.map((m) =>
      '<div class="pt-card az-card">' + avatar(m) + '<div class="az-main"><div class="az-t">' + esc(m.name) + "</div>" +
      '<div class="az-s">' + esc(m.region) + (m.country ? " · " + esc(m.country) : "") + " · " + esc(m.kind) + "</div>" +
      '<div class="az-time">⏱ ' + esc(m.lands_in) + "</div>" +
      (m.description ? '<div class="az-s">' + esc(m.description) + "</div>" : "") +
      '<button class="pt-btn" style="margin-top:8px" data-ask="' + m.id + '">Ask for account on WhatsApp</button></div></div>').join("")
      : "<p>Nothing here yet.</p>";
  }
  async function load() {
    const { data, error } = await sb.from("pay_methods").select("*").eq("active", true).order("region").order("country").order("name");
    if (error) { list.textContent = "Could not load the list. Sign in and try again."; return; }
    items = data;
    draw();
  }
  pane.addEventListener("click", (e) => {
    const c = e.target.closest("[data-reg]");
    if (c) { region = c.dataset.reg; return draw(); }
    const a = e.target.closest("[data-ask]");
    if (!a) return;
    const m = items.find((x) => x.id === a.dataset.ask);
    if (!m) return;
    const r = ref();
    log("aza_ask", m.name, r, m.region + " " + m.country);
    const msg = "Hello MuskySocials 👋\nI need an account for an international payment:\n• Method: " + m.name +
      (m.country ? "\n• Country: " + m.country : "") + "\n• Order ref: " + r +
      "\nPlease send the account details and tell me the fees and how long it will take.";
    window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
  });
  onShow(pane, load);

  // ---------- Admin: manage the list
  q("#adminSection #adStats").insertAdjacentHTML("afterend",
    "<div class='pt-card'><strong>Add a payment method</strong>" +
    "<input id='azName' class='pt-in' maxlength='80' placeholder='Name, e.g. Revolut'>" +
    "<select id='azReg' class='pt-in'>" + REGIONS.map((r) => "<option>" + r + "</option>").join("") + "</select>" +
    "<input id='azCountry' class='pt-in' maxlength='60' placeholder='Country, e.g. Germany'>" +
    "<select id='azKind' class='pt-in'><option>Bank</option><option>Wallet</option><option>Transfer</option></select>" +
    "<textarea id='azTime' class='pt-in' rows='2' maxlength='300' placeholder='How long money usually takes to land'></textarea>" +
    "<input id='azDesc' class='pt-in' maxlength='400' placeholder='Short note (optional)'>" +
    "<button class='pt-btn' id='azGo'>Add</button><p class='pt-msg' id='azMsg'></p>" +
    "<strong>Your payment methods</strong><input id='azFilter' class='pt-in' placeholder='Search this list'>" +
    "<input id='azLogoIn' type='file' accept='image/*' hidden><div id='azAdminList'></div></div>");
  const admin = q("#adminSection");
  const $ = (id) => admin.querySelector("#" + id);
  const say = (t) => { $("azMsg").textContent = t; };
  let rows = [];
  let logoFor = null;

  function drawAdmin() {
    const t = $("azFilter").value.trim().toLowerCase();
    const shown = rows.filter((m) => !t || (m.name + " " + m.country + " " + m.region).toLowerCase().includes(t)).slice(0, 80);
    $("azAdminList").innerHTML = shown.length ? shown.map((m) =>
      '<div class="pt-row"><span>' + (m.active ? "" : "🚫 ") + esc(m.name) + "<br><small>" + esc(m.region) + (m.country ? " · " + esc(m.country) : "") +
      '</small></span><span><button class="pt-btn" data-logo="' + m.id + '">Logo</button> <button class="pt-btn" data-time="' + m.id + '">Time</button> ' +
      '<button class="pt-btn" data-vis="' + m.id + '">' + (m.active ? "Hide" : "Show") + '</button> <button class="pt-btn del" data-del="' + m.id + '">Delete</button></span></div>').join("")
      : "<p>Nothing found.</p>";
  }
  async function loadAdmin() {
    const { data, error } = await sb.from("pay_methods").select("*").order("region").order("country").order("name");
    if (error) { $("azAdminList").textContent = "Run the Ask 4 Aza database step first, or admin access is needed."; return; }
    rows = data;
    drawAdmin();
  }
  onShow(admin, loadAdmin);
  $("azFilter").addEventListener("input", drawAdmin);

  async function squareLogo(file) {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const k = Math.min(1, 256 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise((r) => c.toBlob(r, "image/png"));
  }

  $("azGo").addEventListener("click", async () => {
    const name = $("azName").value.trim();
    const lands_in = $("azTime").value.trim();
    if (!name || !lands_in) return say("Type the name and how long it takes.");
    const { error } = await sb.from("pay_methods").insert({
      name, region: $("azReg").value, country: $("azCountry").value.trim(), kind: $("azKind").value,
      lands_in, description: $("azDesc").value.trim() || null,
    });
    if (error) return say("Could not add: " + error.message);
    ["azName", "azCountry", "azTime", "azDesc"].forEach((id) => { $(id).value = ""; });
    say("Added.");
    loadAdmin();
  });

  $("azLogoIn").addEventListener("change", async () => {
    const file = $("azLogoIn").files[0];
    $("azLogoIn").value = "";
    const m = rows.find((x) => x.id === logoFor);
    if (!file || !m) return;
    say("Uploading logo…");
    try {
      const blob = await squareLogo(file);
      const path = Date.now() + "-" + Math.random().toString(36).slice(2, 7) + ".png";
      const up = await sb.storage.from(BUCKET).upload(path, blob, { contentType: "image/png" });
      if (up.error) throw up.error;
      const { error } = await sb.from("pay_methods").update({ logo_path: path }).eq("id", m.id);
      if (error) { await sb.storage.from(BUCKET).remove([path]); throw error; }
      if (m.logo_path) await sb.storage.from(BUCKET).remove([m.logo_path]);
      say("Logo saved for " + m.name + ".");
      loadAdmin();
    } catch (err) {
      say("Could not save the logo: " + (err.message || err));
    }
  });

  $("azAdminList").addEventListener("click", async (e) => {
    const lg = e.target.closest("[data-logo]");
    if (lg) { logoFor = lg.dataset.logo; return $("azLogoIn").click(); }
    const tm = e.target.closest("[data-time]");
    if (tm) {
      const m = rows.find((x) => x.id === tm.dataset.time);
      const v = prompt("How long does money usually take to land?", m ? m.lands_in : "");
      if (v === null || !v.trim()) return;
      const { error } = await sb.from("pay_methods").update({ lands_in: v.trim().slice(0, 300) }).eq("id", tm.dataset.time);
      say(error ? "Could not save: " + error.message : "Updated.");
      return loadAdmin();
    }
    const vs = e.target.closest("[data-vis]");
    if (vs) {
      const m = rows.find((x) => x.id === vs.dataset.vis);
      const { error } = await sb.from("pay_methods").update({ active: !m.active }).eq("id", vs.dataset.vis);
      say(error ? "Could not change: " + error.message : m.active ? "Hidden from everyone." : "Visible again.");
      return loadAdmin();
    }
    const d = e.target.closest("[data-del]");
    if (d && confirm("Delete this payment method?")) {
      const m = rows.find((x) => x.id === d.dataset.del);
      if (m && m.logo_path) await sb.storage.from(BUCKET).remove([m.logo_path]);
      const { error } = await sb.from("pay_methods").delete().eq("id", d.dataset.del);
      say(error ? "Could not delete: " + error.message : "Deleted.");
      loadAdmin();
    }
  });
}
