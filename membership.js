// MuskySocials membership and secure test checkout UI.
const waitFor = (test, ms = 20000) => new Promise((resolve) => {
  const started = Date.now();
  (function tick() {
    const value = test();
    if (value || Date.now() - started > ms) resolve(value);
    else setTimeout(tick, 150);
  })();
});
const ready = await waitFor(() => window.portal && window.shell && window.musky && document.querySelector("#profileSection"));
if (ready) startMembership();

function startMembership() {
  const { sb, esc, mkPane, onShow } = window.portal;
  const css = document.createElement("style");
  css.textContent = [
    ".mem{color:var(--sh-text,#050505);font-size:15px}",
    ".mem h2{font-size:24px;margin:0 0 6px}",
    ".mem .mem-sub{color:var(--sh-sub,#65676b);margin:0 0 16px}",
    ".mem-grid{display:grid;grid-template-columns:1fr;gap:12px}",
    "@media(min-width:560px){.mem-grid{grid-template-columns:1fr 1fr}}",
    ".mem-card{position:relative;border:1px solid var(--sh-line,#dadde1);border-radius:16px;padding:15px;background:var(--sh-card,#fff)}",
    ".mem-card h3{font-size:20px;margin:0 0 3px}.mem-price{font-size:25px;font-weight:800;margin:8px 0}.mem-card ul{padding-left:20px;line-height:1.55}",
    ".mem-tag{display:inline-block;font-size:11px;border:1px solid var(--sh-line,#dadde1);border-radius:999px;padding:3px 8px;color:var(--sh-sub,#65676b)}",
    ".mem-card button{width:100%;padding:12px;border:0;border-radius:10px;background:var(--sh-blue,#1877f2);color:#fff;font-weight:750}",
    ".mem-card button:disabled{opacity:.5;cursor:not-allowed}.mem-card.current{border:2px solid var(--sh-blue,#1877f2)}",
    ".mem-status{padding:11px 12px;border-radius:10px;background:var(--sh-line,#f0f2f5);margin:10px 0;overflow-wrap:anywhere}",
    ".mem-history{padding:10px 0;border-top:1px solid var(--sh-line,#dadde1);display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}",
    ".mem-history small{color:var(--sh-sub,#65676b)}"
  ].join("");
  document.head.appendChild(css);

  const pane = mkPane("membershipSection",
    "<div class='mem'>" +
    "<h2>👑 Upgrade to Pro</h2>" +
    "<p class='mem-sub'>Choose a membership or purchase daily coins. Payments are currently restricted to Paystack test mode.</p>" +
    "<div id='memCurrent' class='pt-card'>Checking your membership…</div>" +
    "<p id='memMessage' class='mem-status' role='status'>Test checkout only. No live payments are enabled.</p>" +
    "<div id='memPlans' class='mem-grid'></div>" +
    "<div class='pt-card'><strong>Free membership stays free</strong><p>AI Chat, gifts, your profile, saved items, order history, two-factor sign-in, notifications, Ask 4 Aza and MuskySocials account access remain available. Free HeadSwap is limited to one generation per day.</p></div>" +
    "<div class='pt-card'><strong>Coin rules</strong><p>Coins are separate from membership fees. Chargeable actions keep deducting coins. Platinum includes access to its included tools, but does not make chargeable actions free.</p></div>" +
    "<div class='pt-card'><strong>Recent payment history</strong><div id='memHistory'>Sign in to view your purchases.</div></div>" +
    "</div>");
  window.shell.addItem(["membershipSection", "👑", "Upgrade to Pro", ""]);
  const profile = document.querySelector("#profileSection");
  if (profile && !profile.querySelector("#pfUpgrade")) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pf-row";
    b.id = "pfUpgrade";
    b.innerHTML = "<span>👑 Upgrade to Pro</span><span>›</span>";
    const saved = profile.querySelector("#pfSaved");
    if (saved) saved.parentElement.insertBefore(b, saved);
    else profile.appendChild(b);
    b.addEventListener("click", () => window.shell.go("membershipSection"));
  }

  const plans = [
    { code: "silver_daily", name: "Silver", price: "₦400", period: "per day", coins: "500 coins", tag: "Daily coin package", bullets: ["Free membership remains available", "Promotion offer: 500 coins", "Coin purchase does not itself unlock paid tools"] },
    { code: "gold_weekly", name: "Gold", price: "₦2,300", period: "per week", coins: "3,000 coins", tag: "Paid tier 1", bullets: ["7-day membership period", "3,000 coins credited after verified payment", "Manual renewal during the test rollout"] },
    { code: "diamond_monthly", name: "Diamond", price: "₦7,000", period: "per month", coins: "7,500 coins", tag: "Paid tier 3", bullets: ["30-day membership period", "7,500 coins credited after verified payment", "Manual renewal during the test rollout"] },
    { code: "platinum_yearly", name: "Platinum", price: "₦18,000", period: "per year", coins: "Included-tool access", tag: "Paid tier 4 · Maximum", bullets: ["365-day membership period", "Unlimited access to included tools", "Chargeable actions still deduct coins"] }
  ];
  const $ = (id) => pane.querySelector("#" + id);
  const say = (message, bad) => {
    const el = $("memMessage");
    el.textContent = message;
    el.style.color = bad ? "#b42318" : "";
  };
  const lagosDate = () => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const obj = {};
    parts.forEach((p) => obj[p.type] = p.value);
    return obj.year + "-" + obj.month + "-" + obj.day;
  };
  const promoActive = () => lagosDate() < "2027-01-01";
  const renderPlans = (currentCode) => {
    const promo = promoActive();
    $("memPlans").innerHTML = plans.map((p) => {
      const expiredOffer = !promo && p.code !== "platinum_yearly";
      const current = currentCode === p.code;
      const price = expiredOffer ? "Price pending approval" : p.price;
      const period = expiredOffer ? "standard price not set" : p.period;
      const button = expiredOffer ? "Unavailable until price is approved" : current ? "Current membership" : p.code === "silver_daily" ? "Buy coins (test mode)" : "Choose " + p.name + " (test mode)";
      return "<article class='mem-card" + (current ? " current" : "") + "'>" +
        "<span class='mem-tag'>" + esc(p.tag) + "</span><h3>" + esc(p.name) + "</h3>" +
        "<div class='mem-price'>" + esc(price) + "</div><div>" + esc(period) + "</div>" +
        "<p><strong>" + esc(p.coins) + "</strong></p><ul>" + p.bullets.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>" +
        "<button type='button' data-plan='" + esc(p.code) + "'" + (expiredOffer || current ? " disabled" : "") + ">" + esc(button) + "</button></article>";
    }).join("");
    $("memPlans").querySelectorAll("[data-plan]").forEach((button) => {
      button.addEventListener("click", () => checkout(button.dataset.plan, button));
    });
  };

  async function load() {
    const session = await window.musky.session();
    if (!session) {
      $("memCurrent").textContent = "Please sign in to view your membership and purchase coins.";
      $("memHistory").textContent = "Sign in to view payment history.";
      renderPlans("");
      return;
    }
    const uid = session.user.id;
    const [creditResult, subResult, historyResult] = await Promise.all([
      window.musky.credits(),
      sb.from("user_subscriptions").select("plan_code,status,expires_at").eq("user_id", uid).eq("status", "active").gt("expires_at", new Date().toISOString()).order("expires_at", { ascending: false }).limit(1),
      sb.from("payment_transactions").select("reference,plan_code,amount_kobo,status,created_at,paid_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(8)
    ]);
    const active = !subResult.error && subResult.data && subResult.data[0] ? subResult.data[0] : null;
    const names = { gold_weekly: "Gold", diamond_monthly: "Diamond", platinum_yearly: "Platinum" };
    const activeName = active ? names[active.plan_code] || "Paid membership" : "Silver · Free membership";
    $("memCurrent").innerHTML = "<strong>Current plan: " + esc(activeName) + "</strong><p>Coin balance: <strong>" + (typeof creditResult === "number" ? creditResult.toLocaleString("en-NG") : "Unavailable") + "</strong></p>" +
      (active ? "<p>Membership expires: " + esc(new Date(active.expires_at).toLocaleString()) + "</p>" : "<p>Free membership is active. Choose a paid option below if you want more access.</p>");
    renderPlans(active ? active.plan_code : "");
    if (historyResult.error) {
      $("memHistory").textContent = "Payment history is temporarily unavailable.";
    } else if (!historyResult.data.length) {
      $("memHistory").textContent = "No payment attempts yet.";
    } else {
      const labels = { silver_daily: "Silver coin package", gold_weekly: "Gold weekly", diamond_monthly: "Diamond monthly", platinum_yearly: "Platinum yearly" };
      $("memHistory").innerHTML = historyResult.data.map((row) =>
        "<div class='mem-history'><span><strong>" + esc(labels[row.plan_code] || row.plan_code) + "</strong><br><small>" + esc(new Date(row.created_at).toLocaleString()) + "</small></span>" +
        "<span><strong>₦" + (Number(row.amount_kobo) / 100).toLocaleString("en-NG") + "</strong><br><small>" + esc(row.status) + "</small></span></div>"
      ).join("");
    }
  }

  async function checkout(planCode, button) {
    const session = await window.musky.session();
    if (!session) { say("Please sign in before starting checkout.", true); return; }
    button.disabled = true;
    say("Preparing secure Paystack test checkout…");
    try {
      const { data, error } = await sb.functions.invoke("payment-checkout", { body: { plan_code: planCode } });
      if (error) {
        let message = "Secure checkout is not configured yet. No payment was started.";
        try {
          const response = error.context;
          if (response && typeof response.json === "function") {
            const payload = await response.json();
            if (payload && payload.error) message = payload.error;
          }
        } catch {}
        throw new Error(message);
      }
      if (!data || !data.authorization_url || data.mode !== "test") {
        throw new Error("Checkout did not return a verified test-mode destination. No payment was started.");
      }
      say("Opening Paystack test checkout…");
      window.location.assign(data.authorization_url);
    } catch (error) {
      say(String(error && error.message ? error.message : "Checkout failed. No payment was started."), true);
      button.disabled = false;
    }
  }

  // Gate paid tool panes in the app shell. AI Chat and HeadSwap remain free-access routes.
  const paidTargets = new Set(["videoSection", "voiceSection", "cameraSection", "voiceCloneSection", "aitoolsSection"]);
  const originalGo = window.shell.go.bind(window.shell);
  async function routePaidTool(id) {
    const session = await window.musky.session();
    if (!session) {
      say("Sign in, then choose Gold, Diamond, or Platinum to unlock this tool.", true);
      originalGo("membershipSection");
      return;
    }
    const { data, error } = await sb.from("user_subscriptions")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .limit(1);
    if (error || !data || !data.length) {
      say("This tool requires an active Gold, Diamond, or Platinum membership. AI Chat and your daily free HeadSwap remain available.", true);
      originalGo("membershipSection");
      return;
    }
    originalGo(id);
  }
  window.shell.go = function(id) {
    if (paidTargets.has(id)) { void routePaidTool(id); return; }
    return originalGo(id);
  };
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-go]");
    if (!trigger || !paidTargets.has(trigger.dataset.go)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void routePaidTool(trigger.dataset.go);
  }, true);

  pane.addEventListener("click", (event) => {
    const retry = event.target.closest("[data-mem-refresh]");
    if (retry) load();
  });
  onShow(pane, load);
  load();
  if (new URLSearchParams(window.location.search).get("payment") === "return") {
    say("Returned from checkout. Your account changes only after Paystack's signed webhook verifies payment. Refresh this page in a moment to check the result.");
  }
}