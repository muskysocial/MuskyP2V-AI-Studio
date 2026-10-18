// MuskySocials "More" menu v1. Loaded by headswap.js (no index.html change needed).
const WA = "2349041259863";
const WA_SHOW = "+234 904 125 9863";

// ---- Edit this list to change what is for sale. status: Available | Reserved | Sold
// Only list accounts you really have, and describe them honestly.
const LISTINGS = [
  { id: "FB-01", platform: "Facebook", name: "Facebook · Starter", price: 8000, status: "Available" },
  { id: "FB-02", platform: "Facebook", name: "Facebook · Business Page", price: 15000, status: "Available" },
  { id: "WA-01", platform: "WhatsApp", name: "WhatsApp · Business Line", price: 10000, status: "Available" },
  { id: "TT-01", platform: "TikTok", name: "TikTok · Creator Start", price: 12000, status: "Available" },
  { id: "IG-01", platform: "Instagram", name: "Instagram · Fresh Profile", price: 9000, status: "Available" },
  { id: "IG-02", platform: "Instagram", name: "Instagram · Niche Page", price: 20000, status: "Reserved" },
  { id: "X-01", platform: "X", name: "X · Starter", price: 8000, status: "Available" },
  { id: "TG-01", platform: "Telegram", name: "Telegram · Channel", price: 8500, status: "Sold" },
];

const studio = document.querySelector("#studio");
const tabs = document.querySelector("nav.tabs");
if (studio && tabs) init();

function init() {
  const css = `
.mx{padding:2px 0 8px;color:#e6ecff}
.mx h2{margin:0 0 6px;font-size:20px}
.mx p{margin:0 0 10px;color:#b8c6ee;font-size:14px;line-height:1.5}
.mx .soft{color:#8fa3d6;font-size:13px}
.mx-btn{display:block;width:100%;padding:12px;border:0;border-radius:10px;background:#1d4ed8;color:#fff;font-size:15px;font-weight:600}
.mx-btn:disabled{background:#1b2a52;color:#6f86c4}
.mx-btn.alt{background:#0f1d42;border:1px solid #2c427f}
.mx-grid{display:grid;grid-template-columns:1fr;gap:10px;margin-top:12px}
.mx-card{padding:12px;border:1px solid #1b2a52;border-radius:12px;background:#0a1226}
.mx-top{display:flex;justify-content:space-between;align-items:center;gap:8px}
.mx-name{margin:6px 0 2px;font-size:15px}
.mx-price{margin:0 0 10px;font-size:18px;font-weight:700;color:#cfe0ff}
.mx-badge{font-size:12px;padding:3px 8px;border-radius:999px;border:1px solid #2c427f;color:#b8c6ee}
.mx-badge.ok{color:#7dffb0;border-color:#1f6b45}
.mx-badge.hold{color:#ffd27d;border-color:#7a5a1f}
.mx-badge.no{color:#ff9a9a;border-color:#7a2f2f}
.mx-menu{position:fixed;z-index:60;min-width:230px;padding:6px;border-radius:12px;background:#0b1530;
border:1px solid #2c427f;box-shadow:0 10px 30px rgba(0,0,0,.5);display:none}
.mx-menu.open{display:block}
.mx-menu button{display:flex;justify-content:space-between;width:100%;padding:11px 10px;border:0;border-radius:8px;
background:transparent;color:#e6ecff;font-size:15px;text-align:left}
.mx-menu button:active{background:#142654}
.mx-menu small{color:#8fa3d6}
`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const footer = studio.querySelector(":scope > footer");
  const wa = (text) => "https://wa.me/" + WA + "?text=" + encodeURIComponent(text);
  const openWa = (text) => window.open(wa(text), "_blank", "noopener");
  const naira = (n) => "₦" + n.toLocaleString("en-NG");
  const ref = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return "MS-" + p(d.getMonth() + 1) + p(d.getDate()) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  };

  function pane(id, inner) {
    const s = document.createElement("section");
    s.id = id;
    s.className = "pane";
    s.hidden = true;
    s.innerHTML = '<div class="mx">' + inner + "</div>";
    studio.insertBefore(s, footer);
    return s;
  }

  // Photo to video: move the existing generator here (its script.js hooks keep working).
  const videoPane = pane("videoSection", "<h2>Photo to video</h2>");
  const gen = document.querySelector(".ai-generator");
  if (gen) videoPane.querySelector(".mx").appendChild(gen);
  else videoPane.querySelector(".mx").insertAdjacentHTML("beforeend", "<p>The video tool could not be found.</p>");

  pane("voiceCloneSection",
    "<h2>Voice clone</h2><p>Coming soon. We are connecting this next.</p>" +
    '<button class="mx-btn" disabled>Coming soon</button>');

  const creditPane = pane("creditSection",
    "<h2>Buy credit</h2><p>Credits are not open yet. Message us and we will tell you the moment they are.</p>" +
    '<button class="mx-btn" id="mxCredit">Ask about credit on WhatsApp</button>');
  creditPane.querySelector("#mxCredit").addEventListener("click", () =>
    openWa("Hello MuskySocials, I want to know when credit is available."));

  pane("aboutSection",
    "<h2>About us</h2>" +
    "<p>MuskySocials is a small creator project. We build simple AI tools you can use from your phone, " +
    "like turning a photo into a short video and swapping a head between two photos. We also list social media " +
    "accounts for people who want a head start online.</p>" +
    "<p>We are building step by step, and some tools are still experimental. When a tool depends on a free public " +
    "AI service, we say so on the screen, because those services can be slow or busy.</p>" +
    "<p>What we hold to:</p>" +
    "<p>• Use only photos and videos you own or have permission to use.<br>" +
    "• Listings are described honestly, and we confirm every detail with you on WhatsApp before any payment.<br>" +
    "• You talk to a real person when you need help.</p>");

  const socials = pane("socialsSection",
    "<h2>MuskySocials</h2><p>Accounts for sale. Tap Buy and we continue on WhatsApp, where we confirm details before any payment.</p>" +
    '<div class="mx-grid" id="mxGrid"></div>');
  const grid = socials.querySelector("#mxGrid");
  const badge = { Available: ["ok", "● Available"], Reserved: ["hold", "● Reserved"], Sold: ["no", "● Sold"] };
  LISTINGS.forEach((it) => {
    const [cls, label] = badge[it.status] || badge.Sold;
    const card = document.createElement("div");
    card.className = "mx-card";
    card.innerHTML =
      '<div class="mx-top"><strong>' + it.platform + '</strong><span class="mx-badge ' + cls + '">' + label + "</span></div>" +
      '<div class="mx-name">' + it.name + "</div>" +
      '<div class="mx-price">' + naira(it.price) + "</div>";
    const b = document.createElement("button");
    b.className = "mx-btn";
    b.textContent = it.status === "Available" ? "Buy on WhatsApp" : it.status;
    b.disabled = it.status !== "Available";
    b.addEventListener("click", () =>
      openWa(
        "Hello MuskySocials 👋\nI want to buy this account:\n• Item: " + it.platform + " — " + it.name +
        "\n• Listing ID: " + it.id + "\n• Price: " + naira(it.price) + "\n• Order ref: " + ref() +
        "\nPlease confirm it is still available."
      ));
    card.appendChild(b);
    grid.appendChild(card);
  });

  const contact = pane("contactSection",
    "<h2>Contact us</h2><p>We answer on WhatsApp.</p><p><strong>" + WA_SHOW + "</strong></p>" +
    '<button class="mx-btn" id="mxChat">Chat on WhatsApp</button>');
  contact.querySelector("#mxChat").addEventListener("click", () =>
    openWa("Hello MuskySocials, I need help."));

  // ---- Tab + dropdown menu
  const mine = ["videoSection", "headswapSection", "voiceCloneSection", "creditSection",
    "aboutSection", "socialsSection", "contactSection"];
  const items = [
    ["videoSection", "Photo to video", ""],
    ["headswapSection", "HeadSwap", ""],
    ["voiceCloneSection", "Voice clone", "soon"],
    ["creditSection", "Buy credit", "soon"],
    ["aboutSection", "About us", ""],
    ["socialsSection", "MuskySocials", "for sale"],
    ["contactSection", "Contact us", ""],
  ];

  const moreTab = document.createElement("button");
  moreTab.type = "button";
  moreTab.className = "tab";
  moreTab.textContent = "More ▾";
  tabs.appendChild(moreTab);

  const menu = document.createElement("div");
  menu.className = "mx-menu";
  items.forEach(([id, label, note]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = "<span>" + label + "</span><small>" + note + "</small>";
    b.addEventListener("click", () => show(id));
    menu.appendChild(b);
  });
  document.body.appendChild(menu);

  const closeMenu = () => menu.classList.remove("open");
  moreTab.addEventListener("click", (e) => {
    e.stopPropagation();
    const r = moreTab.getBoundingClientRect();
    menu.style.top = r.bottom + 6 + "px";
    menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 240)) + "px";
    menu.classList.toggle("open");
  });
  document.addEventListener("click", closeMenu);

  function show(id) {
    document.querySelectorAll("#studio .pane").forEach((p) => {
      const hide = p.id !== id;
      if (p.hidden !== hide) p.hidden = hide;
    });
    tabs.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === moreTab));
    closeMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // When the site's own tabs/cards show one of its panes, hide ours.
  const others = [...studio.querySelectorAll(".pane")].filter((p) => !mine.includes(p.id));
  new MutationObserver(() => {
    if (others.some((p) => !p.hidden)) {
      mine.forEach((id) => {
        const p = document.getElementById(id);
        if (p && !p.hidden) p.hidden = true;
      });
      moreTab.classList.remove("active");
    }
  }).observe(studio, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
}
