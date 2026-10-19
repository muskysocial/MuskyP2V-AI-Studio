// MuskySocials Gift shop v1. You add gifts in the Admin studio; everyone browses them in the Gifts tab.
// Loaded automatically by portal.js. Needs the "products" table and "shop" storage bucket from the Supabase setup.
const WA = "2349041259863";
const SB_URL = "https://jnsbttwyiwcqhuhveikq.supabase.co";
const SB_KEY = "sb_publishable_LB_HC5TVIdKf7FX3c0q8Hg__81wa5F2";
const BUCKET = "shop";

const wait = (test, ms = 15000) =>
  new Promise((res) => {
    const t0 = Date.now();
    (function tick() {
      const v = test();
      if (v || Date.now() - t0 > ms) res(v);
      else setTimeout(tick, 150);
    })();
  });

const ready = await wait(() => window.portal && document.querySelector("#shopSection .sh") && document.querySelector("#adminSection .pt #adStats"));
if (ready) start();

async function start() {
  const { sb, esc, onShow } = window.portal;
  const shop = document.querySelector("#shopSection");
  const admin = document.querySelector("#adminSection");
  const naira = (n) => "₦" + Number(n).toLocaleString("en-NG");
  const img = (path) => sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
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

  const st = document.createElement("style");
  st.textContent = `
.gs-chips{display:flex;gap:8px;overflow-x:auto;padding:2px 0 10px}
.gs-chip{flex:none;padding:8px 14px;border-radius:999px;border:1px solid var(--sh-line,#ccd0d5);background:var(--sh-card,#fff);color:var(--sh-text,#050505);font-size:14px}
.gs-chip.on{background:var(--sh-blue,#1877f2);border-color:var(--sh-blue,#1877f2);color:#fff}
.gs-card{margin:0!important;padding:8px!important}
.gs-card img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:10px;display:block;background:#e4e6eb}
.gs-name{font-weight:700;margin-top:6px}
.gs-sub{font-size:12px;color:var(--sh-sub,#65676b)}
.gs-price{font-weight:700;margin:2px 0 6px}
html.mx-light #studio .gs-chip{color:#050505!important}
html.mx-light #studio .gs-chip.on{color:#fff!important;background:#1877f2!important}
html.mx-light #studio .gs-sub{color:#65676b!important}
`;
  document.head.appendChild(st);

  // ---------- Gifts screen (everyone)
  shop.querySelector(".sh").innerHTML = "<h2>Gift shop</h2><div class='gs-chips' id='gsChips'></div><div class='sh-grid' id='gsGrid'>Loading…</div>";
  const chips = shop.querySelector("#gsChips");
  const gridEl = shop.querySelector("#gsGrid");
  let items = [];
  let cat = "All";

  function draw() {
    const cats = ["All", ...new Set(items.map((i) => i.category))];
    chips.innerHTML = cats.map((c) => '<button class="gs-chip' + (c === cat ? " on" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>").join("");
    const shown = items.filter((i) => cat === "All" || i.category === cat);
    gridEl.innerHTML = shown.length ? shown.map((i) =>
      '<div class="pt-card gs-card">' +
      (i.image_path ? '<img loading="lazy" alt="" src="' + esc(img(i.image_path)) + '">' : "") +
      '<div class="gs-name">' + esc(i.name) + "</div>" +
      '<div class="gs-sub">' + esc(i.category) + "</div>" +
      (i.description ? '<div class="gs-sub">' + esc(i.description) + "</div>" : "") +
      '<div class="gs-price">' + naira(i.price) + "</div>" +
      '<button class="pt-btn" style="width:100%" data-buy="' + i.id + '"' + (i.in_stock ? "" : " disabled") + ">" +
      (i.in_stock ? "Buy on WhatsApp" : "Sold out") + "</button></div>").join("")
      : "<p>No gifts here yet. Check back soon.</p>";
  }
  async function loadShop() {
    const { data, error } = await sb.from("products").select("*").order("created_at", { ascending: false });
    if (error) { gridEl.textContent = "Could not load the gifts. Sign in and try again."; return; }
    items = data;
    if (cat !== "All" && !items.some((i) => i.category === cat)) cat = "All";
    draw();
  }
  shop.addEventListener("click", (e) => {
    const c = e.target.closest("[data-cat]");
    if (c) { cat = c.dataset.cat; return draw(); }
    const b = e.target.closest("[data-buy]");
    if (!b) return;
    const it = items.find((x) => x.id === b.dataset.buy);
    if (!it) return;
    const r = ref();
    log("gift_buy", it.id, r, it.name + " " + naira(it.price));
    const msg = "Hello MuskySocials 👋\nI want to buy this gift:\n• Item: " + it.name + "\n• Price: " + naira(it.price) +
      "\n• Order ref: " + r + "\nPlease confirm it is available and tell me how delivery works.";
    window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
  });
  onShow(shop, loadShop);

  // ---------- Admin: add and manage gifts
  const card =
    "<div class='pt-card'><strong>Add a gift</strong>" +
    "<input id='gaName' class='pt-in' maxlength='100' placeholder='Gift name'>" +
    "<textarea id='gaDesc' class='pt-in' rows='2' maxlength='1000' placeholder='Short description (optional)'></textarea>" +
    "<input id='gaPrice' class='pt-in' type='number' min='0' inputmode='numeric' placeholder='Price in naira'>" +
    "<input id='gaCat' class='pt-in' list='gaCats' maxlength='40' placeholder='Category, e.g. Anniversary'>" +
    "<datalist id='gaCats'><option value='Anniversary'><option value='Tech'><option value='Just because'><option value='Birthday'><option value='Jewelry'><option value='Flowers'><option value='Plushies'></datalist>" +
    "<input id='gaFile' class='pt-in' type='file' accept='image/*'>" +
    "<label style='display:flex;gap:8px;align-items:center;margin:6px 0'><input id='gaStock' type='checkbox' checked> In stock</label>" +
    "<button class='pt-btn' id='gaGo'>Add gift</button><p class='pt-msg' id='gaMsg'></p>" +
    "<strong>Your gifts</strong><div id='gaList'></div></div>";
  const feedCard = (await wait(() => admin.querySelector("#fpGo"), 4000)) || null;
  if (feedCard) feedCard.closest(".pt-card").insertAdjacentHTML("afterend", card);
  else admin.querySelector("#adStats").insertAdjacentHTML("afterend", card);

  const $ = (id) => admin.querySelector("#" + id);
  const say = (t) => { $("gaMsg").textContent = t; };

  async function shrink(file) {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const k = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
  }

  async function loadGifts() {
    const { data, error } = await sb.from("products").select("id,name,price,in_stock,image_path").order("created_at", { ascending: false });
    if (error) { $("gaList").textContent = "Admin access needed."; return; }
    $("gaList").innerHTML = data.length ? data.map((p) =>
      '<div class="pt-row"><span>' + esc(p.name) + "<br><small>" + naira(p.price) + (p.in_stock ? "" : " · sold out") + '</small></span><span>' +
      '<button class="pt-btn" data-stock="' + p.id + '" data-on="' + (p.in_stock ? "1" : "0") + '">' + (p.in_stock ? "Sold out" : "In stock") + "</button> " +
      '<button class="pt-btn" data-price="' + p.id + '">Price</button> ' +
      '<button class="pt-btn del" data-delgift="' + p.id + '" data-img="' + esc(p.image_path || "") + '">Delete</button></span></div>').join("")
      : "<p>No gifts yet.</p>";
  }
  onShow(admin, loadGifts);

  $("gaGo").addEventListener("click", async () => {
    const name = $("gaName").value.trim();
    const price = parseInt($("gaPrice").value, 10);
    const file = $("gaFile").files[0];
    if (!name) return say("Type the gift name.");
    if (!Number.isInteger(price) || price < 0) return say("Type the price as a number.");
    if (!file) return say("Choose a photo of the gift.");
    const btn = $("gaGo");
    btn.disabled = true;
    say("Uploading…");
    let path = "";
    try {
      const blob = await shrink(file);
      path = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
      const up = await sb.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) throw up.error;
      const ins = await sb.from("products").insert({
        name, description: $("gaDesc").value.trim() || null, price,
        category: $("gaCat").value.trim() || "Just because", image_path: path, in_stock: $("gaStock").checked,
      });
      if (ins.error) { await sb.storage.from(BUCKET).remove([path]); throw ins.error; }
      ["gaName", "gaDesc", "gaPrice", "gaCat", "gaFile"].forEach((id) => { $(id).value = ""; });
      say("Gift added. It is now in the Gifts tab.");
      loadGifts();
    } catch (err) {
      say("Could not add the gift: " + (err.message || err));
    }
    btn.disabled = false;
  });

  $("gaList").addEventListener("click", async (e) => {
    const s = e.target.closest("[data-stock]");
    if (s) {
      const { error } = await sb.from("products").update({ in_stock: s.dataset.on !== "1" }).eq("id", s.dataset.stock);
      if (error) say("Could not change stock: " + error.message);
      return loadGifts();
    }
    const pr = e.target.closest("[data-price]");
    if (pr) {
      const v = parseInt(prompt("New price in naira:"), 10);
      if (!Number.isInteger(v) || v < 0) return;
      const { error } = await sb.from("products").update({ price: v }).eq("id", pr.dataset.price);
      if (error) say("Could not change the price: " + error.message);
      return loadGifts();
    }
    const d = e.target.closest("[data-delgift]");
    if (d && confirm("Delete this gift?")) {
      if (d.dataset.img) await sb.storage.from(BUCKET).remove([d.dataset.img]);
      const { error } = await sb.from("products").delete().eq("id", d.dataset.delgift);
      say(error ? "Could not delete: " + error.message : "Gift deleted.");
      loadGifts();
    }
  });
}
