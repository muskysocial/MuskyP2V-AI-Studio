// MuskySocials account listings v1: you add, price and mark accounts in the Admin studio;
// the MuskySocials page on Home shows them. Loaded automatically by portal.js.
// Needs the "account_listings" table. If the table is missing, the built-in list stays.
const WA = "2349041259863";
const SB_URL = "https://jnsbttwyiwcqhuhveikq.supabase.co";
const SB_KEY = "sb_publishable_LB_HC5TVIdKf7FX3c0q8Hg__81wa5F2";
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

const ready = await wait(() => window.portal && q("#socialsSection #mxGrid") && q("#adminSection .pt #adStats"));
if (ready) start();

function start() {
  const { sb, esc, onShow } = window.portal;
  const pane = q("#socialsSection");
  const grid = q("#mxGrid");
  const admin = q("#adminSection");
  const naira = (n) => "₦" + Number(n).toLocaleString("en-NG");
  const BADGE = { Available: ["ok", "● Available"], Reserved: ["hold", "● Reserved"], Sold: ["no", "● Sold"] };
  const RANK = { Available: 0, Reserved: 1, Sold: 2 };
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

  // ---------- The MuskySocials page (everyone)
  let items = [];
  async function load() {
    const { data, error } = await sb.from("account_listings").select("*").order("created_at", { ascending: false });
    if (error) return; // table not set up yet: keep the built-in list
    items = data.slice().sort((a, b) => RANK[a.status] - RANK[b.status]);
    grid.innerHTML = items.length ? items.map((i) => {
      const [cls, label] = BADGE[i.status] || BADGE.Sold;
      return '<div class="mx-card"><div class="mx-top"><strong>' + esc(i.platform) + '</strong><span class="mx-badge ' + cls + '">' + label + "</span></div>" +
        '<div class="mx-name">' + esc(i.name) + "</div>" +
        (i.details ? '<div class="soft" style="font-size:13px;margin-bottom:6px">' + esc(i.details) + "</div>" : "") +
        '<div class="mx-price">' + naira(i.price) + "</div>" +
        '<button class="mx-btn" data-buy="' + i.id + '"' + (i.status === "Available" ? "" : " disabled") + ">" +
        (i.status === "Available" ? "Buy on WhatsApp" : i.status) + "</button></div>";
    }).join("") : "<p>No accounts are listed right now. Check back soon.</p>";
  }
  grid.addEventListener("click", (e) => {
    const b = e.target.closest("[data-buy]");
    if (!b) return;
    const it = items.find((x) => x.id === b.dataset.buy);
    if (!it) return;
    const r = ref();
    log("buy_click", it.code, r, it.platform + " " + naira(it.price));
    const msg = "Hello MuskySocials 👋\nI want to buy this account:\n• Item: " + it.platform + " — " + it.name +
      "\n• Listing ID: " + it.code + "\n• Price: " + naira(it.price) + "\n• Order ref: " + r +
      "\nPlease confirm it is still available.";
    window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
  });
  onShow(pane, load);
  load();

  // ---------- Admin: manage listings
  q("#adminSection #adStats").insertAdjacentHTML("afterend",
    "<div class='pt-card'><strong>Add an account listing</strong>" +
    "<input id='alPlat' class='pt-in' list='alPlats' maxlength='40' placeholder='Platform, e.g. Instagram'>" +
    "<datalist id='alPlats'><option value='Facebook'><option value='WhatsApp'><option value='TikTok'><option value='Instagram'><option value='X'><option value='Telegram'><option value='YouTube'><option value='Snapchat'></datalist>" +
    "<input id='alName' class='pt-in' maxlength='100' placeholder='Name, e.g. Instagram · Niche Page'>" +
    "<textarea id='alDet' class='pt-in' rows='2' maxlength='300' placeholder='Honest details (age, niche, what is included). Optional.'></textarea>" +
    "<input id='alPrice' class='pt-in' type='number' min='0' inputmode='numeric' placeholder='Price in naira'>" +
    "<select id='alStat' class='pt-in'><option>Available</option><option>Reserved</option><option>Sold</option></select>" +
    "<button class='pt-btn' id='alGo'>Add listing</button><p class='pt-msg' id='alMsg'></p>" +
    "<strong>Your listings</strong><div id='alList'></div></div>");
  const $ = (id) => admin.querySelector("#" + id);
  const say = (t) => { $("alMsg").textContent = t; };

  async function loadAdmin() {
    const { data, error } = await sb.from("account_listings").select("id,code,platform,name,price,status").order("created_at", { ascending: false });
    if (error) { $("alList").textContent = "Run the listings database step first, or admin access is needed."; return; }
    $("alList").innerHTML = data.length ? data.map((i) =>
      '<div class="pt-row"><span>' + esc(i.platform) + " · " + esc(i.name) + "<br><small>" + naira(i.price) + " · " + esc(i.code) + '</small></span><span>' +
      '<select class="pt-in" style="width:auto;margin:0 6px 0 0" data-st="' + i.id + '">' +
      ["Available", "Reserved", "Sold"].map((s) => "<option" + (s === i.status ? " selected" : "") + ">" + s + "</option>").join("") + "</select>" +
      '<button class="pt-btn" data-pr="' + i.id + '">Price</button> ' +
      '<button class="pt-btn del" data-del="' + i.id + '">Delete</button></span></div>').join("")
      : "<p>No listings yet.</p>";
  }
  onShow(admin, loadAdmin);

  $("alGo").addEventListener("click", async () => {
    const platform = $("alPlat").value.trim();
    const name = $("alName").value.trim();
    const price = parseInt($("alPrice").value, 10);
    if (!platform || !name) return say("Type the platform and the name.");
    if (!Number.isInteger(price) || price < 0) return say("Type the price as a number.");
    const btn = $("alGo");
    btn.disabled = true;
    const code = platform.slice(0, 2).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    const { error } = await sb.from("account_listings").insert({
      code, platform, name, details: $("alDet").value.trim() || null, price, status: $("alStat").value,
    });
    btn.disabled = false;
    if (error) return say("Could not add: " + error.message);
    ["alPlat", "alName", "alDet", "alPrice"].forEach((id) => { $(id).value = ""; });
    $("alStat").value = "Available";
    say("Added. It is on the MuskySocials page now.");
    loadAdmin();
    load();
  });

  $("alList").addEventListener("change", async (e) => {
    const s = e.target.closest("[data-st]");
    if (!s) return;
    const { error } = await sb.from("account_listings").update({ status: s.value }).eq("id", s.dataset.st);
    say(error ? "Could not change the status: " + error.message : "Status updated.");
    load();
  });
  $("alList").addEventListener("click", async (e) => {
    const p = e.target.closest("[data-pr]");
    if (p) {
      const v = parseInt(prompt("New price in naira:"), 10);
      if (!Number.isInteger(v) || v < 0) return;
      const { error } = await sb.from("account_listings").update({ price: v }).eq("id", p.dataset.pr);
      say(error ? "Could not change the price: " + error.message : "Price updated.");
      loadAdmin();
      return load();
    }
    const d = e.target.closest("[data-del]");
    if (d && confirm("Delete this listing?")) {
      const { error } = await sb.from("account_listings").delete().eq("id", d.dataset.del);
      say(error ? "Could not delete: " + error.message : "Listing deleted.");
      loadAdmin();
      load();
    }
  });
}
