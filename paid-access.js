// Central paid-section pricing and access rules.
// Add future paid sections to PRICES instead of scattering coin costs across feature files.
const PRICES = Object.freeze({
  jobsSection: {
    label: "Jobs",
    cost: 40,
    sessionMs: 2 * 60 * 1000,
    note: "Jobs access lasts 2 minutes. When it ends, pay 40 coins to open Jobs again.",
  },
  datingSection: {
    label: "Dating",
    cost: 33,
    note: "33 coins are charged each time you open the Dating section.",
  },
  librarySection: {
    label: "Community Library",
    cost: 20,
    note: "20 coins are charged each time you open the Community Library.",
  },
  verifiedBadge: {
    label: "Verified badge",
    cost: 7000,
    note: "A verified badge request costs 7,000 coins and waits for admin review.",
  },
});

const waitForPaidAccess = (test, ms = 25000) => new Promise((resolve) => {
  const started = Date.now();
  (function tick() {
    const value = test();
    if (value || Date.now() - started > ms) resolve(value);
    else setTimeout(tick, 150);
  })();
});

const paidAccessReady = await waitForPaidAccess(() =>
  window.portal && window.shell && window.musky &&
  document.querySelector("#jobsSection .pt") &&
  document.querySelector("#datingSection .pt") &&
  document.querySelector("#librarySection .pt")
);

if (paidAccessReady) startPaidAccess();

function startPaidAccess() {
  const originalGo = window.shell.go.bind(window.shell);
  const pending = new Set();
  let jobsExpiresAt = 0;
  try { jobsExpiresAt = Number(localStorage.getItem("mx-paid-jobs-expires") || 0); } catch {}
  let jobsTimer = null;
  let toastTimer = null;

  // Expose the one source of truth for prices so new sections can be added here.
  window.muskyPaidPricing = PRICES;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

  function toast(message, bad = false) {
    let el = document.querySelector("#mxPaidToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "mxPaidToast";
      el.setAttribute("role", "status");
      el.style.cssText = "position:fixed;left:12px;right:12px;bottom:94px;z-index:9999;padding:12px 14px;border-radius:12px;background:#12315b;color:#fff;font:600 14px/1.4 system-ui;box-shadow:0 4px 18px #0003";
      document.body.appendChild(el);
    }
    el.style.background = bad ? "#9f1d20" : "#12315b";
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 5000);
  }

  function getPane(id) {
    return document.getElementById(id);
  }

  function setNotice(id, message, bad = false) {
    const pane = getPane(id);
    const content = pane && pane.querySelector(".pt");
    if (!content) return;
    let note = content.querySelector(":scope > .mx-paid-note");
    if (!note) {
      note = document.createElement("div");
      note.className = "mx-paid-note";
      note.setAttribute("role", "status");
      note.style.cssText = "padding:10px 12px;margin:0 0 12px;border-radius:10px;border:1px solid var(--sh-line,#dadde1);font-size:13px;line-height:1.4";
      content.prepend(note);
    }
    note.style.borderColor = bad ? "#d93025" : "var(--sh-line,#dadde1)";
    note.style.color = bad ? "#b42318" : "var(--sh-text,#050505)";
    note.textContent = message;
  }

  function formatRemaining(ms) {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
  }

  function stopJobsTimer() {
    if (jobsTimer) clearInterval(jobsTimer);
    jobsTimer = null;
  }

  function startJobsTimer() {
    stopJobsTimer();
    const update = () => {
      const remaining = jobsExpiresAt - Date.now();
      if (remaining <= 0) {
        stopJobsTimer();
        jobsExpiresAt = 0;
        try { localStorage.removeItem("mx-paid-jobs-expires"); } catch {}
        const jobsPane = getPane("jobsSection");
        if (jobsPane && !jobsPane.hidden) {
          originalGo("membershipSection");
          toast("Your 2-minute Jobs access has ended. Click Jobs again to pay 40 coins and reopen it.");
        }
        return;
      }
      setNotice("jobsSection", "💼 Jobs access active — " + formatRemaining(remaining) +
        " remaining. Each new 2-minute opening costs 40 coins.");
    };
    update();
    jobsTimer = setInterval(update, 1000);
  }

  async function openPaidSection(id) {
    const rule = PRICES[id];
    if (!rule) return originalGo(id);
    if (pending.has(id)) return;
    pending.add(id);

    // A Jobs session is paid once and can be revisited while its 2-minute timer is active.
    if (id === "jobsSection" && jobsExpiresAt > Date.now()) {
      originalGo(id);
      startJobsTimer();
      setNotice(id, "💼 Jobs access active — " + formatRemaining(jobsExpiresAt - Date.now()) +
        " remaining. " + rule.note);
      pending.delete(id);
      return;
    }

    try {
      const session = await window.musky.session();
      if (!session) throw new Error("Please sign in before opening " + rule.label + ".");
      const result = await window.musky.sb.rpc("spend_credits", { amount: rule.cost });
      if (result.error) throw result.error;
      if (typeof result.data !== "number") throw new Error("The coin balance could not be confirmed. Please try again.");

      // Update the feed/dashboard balance from the server-confirmed RPC result.
      window.musky.setBadge(result.data);
      originalGo(id);

      if (id === "jobsSection") {
        jobsExpiresAt = Date.now() + rule.sessionMs;
        try { localStorage.setItem("mx-paid-jobs-expires", String(jobsExpiresAt)); } catch {}
        startJobsTimer();
        toast("40 coins deducted. Jobs is open for 2 minutes.");
      } else {
        setNotice(id, "🪙 " + rule.cost + " coins deducted for this " + rule.label + " opening. " + rule.note);
        toast(rule.cost + " coins deducted for " + rule.label + ".");
      }
    } catch (error) {
      const message = String(error && error.message || "");
      if (/not enough credits|insufficient|credit/i.test(message)) {
        originalGo("membershipSection");
        toast("You need " + rule.cost + " coins to open " + rule.label + ". Buy coins or upgrade, then try again.", true);
      } else {
        toast(message || "Could not charge coins. Nothing was deducted; please try again.", true);
      }
    } finally {
      pending.delete(id);
    }
  }

  // Catch navigation buttons before shell.js handles them.
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-go]");
    if (!trigger) return;
    const id = trigger.dataset.go;
    if (!PRICES[id]) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void openPaidSection(id);
  }, true);

  // Also guard navigation initiated by another script, not just visible buttons.
  window.shell.go = function (id) {
    if (PRICES[id]) return void openPaidSection(id);
    return originalGo(id);
  };

  // Show the price on tiles before customers tap them.
  const priceText = (id) => id === "jobsSection" ? "40 coins · 2 min" :
    id === "datingSection" ? "33 coins / open" :
    id === "librarySection" ? "20 coins / open" : "";
  function decorateTiles(root = document) {
    root.querySelectorAll(".hm-story[data-go], .ex-card[data-go], .ex-row[data-go], .sh-tile[data-go]").forEach((tile) => {
      const id = tile.dataset.go;
      if (!PRICES[id] || tile.querySelector(".mx-paid-price")) return;
      const tag = document.createElement("small");
      tag.className = "mx-paid-price";
      tag.textContent = priceText(id);
      tag.style.cssText = "display:block;font-size:12px;font-weight:700;opacity:.9;margin-top:4px";
      tile.appendChild(tag);
    });
  }
  decorateTiles();
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === 1) decorateTiles(node);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}
