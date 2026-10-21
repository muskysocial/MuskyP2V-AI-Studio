// MuskySocials customer account features: saved items, order requests and activity history.
// Uses the signed-in Supabase user and RLS; no order is marked paid by this browser code.
const wait = (test, ms = 20000) => new Promise((resolve) => {
  const started = Date.now();
  (function tick() {
    const value = test();
    if (value || Date.now() - started > ms) resolve(value);
    else setTimeout(tick, 150);
  })();
});
const ready = await wait(() => window.portal && window.shell &&
  document.querySelector("#profileSection") && document.querySelector("#jobsSection") &&
  document.querySelector("#socialsSection") && document.querySelector("#shopSection"));
if (ready) start();

function start() {
  const { sb, esc, mkPane, onShow } = window.portal;
  const profile = document.querySelector("#profileSection");
  const savedPane = mkPane("savedSection",
    "<h2>🔖 Saved items</h2><p class='pt-msg' id='csSavedMsg' role='status'></p><div id='csSavedList'>Loading saved items…</div>");
  const ordersPane = mkPane("ordersSection",
    "<h2>🧾 My orders and activity</h2>" +
    "<div class='pt-card'><strong>Order requests</strong><p class='pt-msg'>WhatsApp requests appear here as awaiting confirmation. Payment is never assumed.</p><div id='csOrdersList'>Loading orders…</div></div>" +
    "<div class='pt-card'><strong>Recent activity</strong><div id='csActivityList'>Loading activity…</div></div>");
  // Support both $(element, "childId") and $("elementId") lookups.
  const $ = (root, id) => {
    if (id === undefined) { id = root; root = document; }
    else if (typeof root === "string") root = document.getElementById(root);
    return root ? root.querySelector("#" + id) : null;
  };
  const saySaved = (text) => { $("csSavedMsg").textContent = text; };
  let savedKeys = new Set();
  let currentUserId = null;
  let busyKeys = new Set();

  // Turn the two profile features into real account navigation buttons.
  const savedButton = $("profileSection", "pfSaved");
  const ordersButton = $("profileSection", "pfOrders");
  if (savedButton) savedButton.addEventListener("click", () => window.shell.go("savedSection"));
  if (ordersButton) ordersButton.addEventListener("click", () => window.shell.go("ordersSection"));

  function key(type, id) { return type + ":" + String(id); }
  function syncSaveButtons() {
    document.querySelectorAll("[data-cs-save-type][data-cs-save-id]").forEach((button) => {
      const k = key(button.dataset.csSaveType, button.dataset.csSaveId);
      button.textContent = savedKeys.has(k) ? "♥ Saved · Remove" : "♡ Save";
      button.setAttribute("aria-pressed", savedKeys.has(k) ? "true" : "false");
    });
  }

  function attachSaveButtons(root) {
    const scopes = [];
    if (root.matches && root.matches("#jobsSection,#socialsSection,#shopSection")) scopes.push(root);
    if (root.querySelectorAll) scopes.push(...root.querySelectorAll("#jobsSection,#socialsSection,#shopSection"));
    scopes.forEach((pane) => {
      const type = pane.id === "jobsSection" ? "job" : pane.id === "socialsSection" ? "account" : "gift";
      const target = pane.id;
      const cards = pane.querySelectorAll(type === "job" ? ".jb-card" : type === "account" ? ".mx-card" : ".gs-card");
      cards.forEach((card) => {
        if (card.querySelector("[data-cs-save-type]")) return;
        const source = card.querySelector(type === "job" ? "[data-rep]" : "[data-buy]");
        if (!source) return;
        const id = source.dataset[type === "job" ? "rep" : "buy"];
        if (!id) return;
        let title = "", subtitle = "";
        if (type === "job") {
          title = (card.querySelector("strong") || {}).textContent || "Job";
          subtitle = (card.querySelector(".jb-sub") || {}).textContent || "";
        } else if (type === "account") {
          title = (card.querySelector(".mx-name") || {}).textContent || "Account listing";
          subtitle = (card.querySelector(".mx-top strong") || {}).textContent || "";
        } else {
          title = (card.querySelector(".gs-name") || {}).textContent || "Gift";
          subtitle = (card.querySelector(".gs-sub") || {}).textContent || "";
        }
        const button = document.createElement("button");
        button.type = "button";
        button.className = "pt-btn";
        button.style.marginTop = "8px";
        button.dataset.csSaveType = type;
        button.dataset.csSaveId = String(id);
        button.dataset.csSaveTitle = title.trim().slice(0, 200);
        button.dataset.csSaveSubtitle = subtitle.trim().slice(0, 200);
        button.dataset.csSaveTarget = target;
        button.textContent = "♡ Save";
        const actions = card.querySelector(".jb-acts");
        if (actions) actions.appendChild(button);
        else card.appendChild(button);
      });
    });
    syncSaveButtons();
  }

  async function getUser() {
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    const user = data && data.session && data.session.user;
    currentUserId = user ? user.id : null;
    return user || null;
  }

  async function recordActivity(activityType, itemType, itemId, title, details) {
    const user = await getUser();
    if (!user) return { skipped: true };
    const { error } = await sb.from("user_activity").insert({
      user_id: user.id, activity_type: activityType, item_type: itemType || null,
      item_id: itemId == null ? null : String(itemId).slice(0, 120),
      title: String(title || activityType).slice(0, 200), details: details || {}
    });
    return { error: error || null };
  }

  async function refreshSaved() {
    const user = await getUser();
    if (!user) {
      savedKeys = new Set();
      $("csSavedList").textContent = "Sign in to save items to your account.";
      syncSaveButtons();
      return;
    }
    const { data, error } = await sb.from("saved_items").select("*").order("created_at", { ascending: false });
    if (error) {
      $("csSavedList").textContent = "Could not load saved items: " + error.message;
      return;
    }
    savedKeys = new Set(data.map((row) => key(row.item_type, row.item_id)));
    $("csSavedList").innerHTML = data.length ? data.map((row) =>
      "<div class='pt-card'><strong>" + esc(row.title) + "</strong>" +
      (row.subtitle ? "<p class='pt-msg'>" + esc(row.subtitle) + "</p>" : "") +
      "<p class='pt-msg'>Saved " + esc(new Date(row.created_at).toLocaleString()) + "</p>" +
      "<button class='pt-btn' data-cs-open='" + esc(row.target_section) + "'>Open section</button> " +
      "<button class='pt-btn del' data-cs-remove='" + esc(row.id) + "' data-cs-remove-type='" + esc(row.item_type) +
      "' data-cs-remove-id='" + esc(row.item_id) + "' data-cs-remove-title='" + esc(row.title) + "'>Remove</button></div>"
    ).join("") : "<p>You have not saved anything yet. Tap ♡ Save on a job, account listing or gift.</p>";
    syncSaveButtons();
  }

  async function refreshOrdersAndActivity() {
    const user = await getUser();
    if (!user) {
      $("csOrdersList").textContent = "Sign in to view your order requests.";
      $("csActivityList").textContent = "Sign in to view your activity.";
      return;
    }
    const [orders, activity] = await Promise.all([
      sb.from("customer_orders").select("id,order_ref,item_type,item_name,amount,currency,status,payment_status,created_at").order("created_at", { ascending: false }).limit(50),
      sb.from("user_activity").select("activity_type,item_type,item_id,title,details,created_at").order("created_at", { ascending: false }).limit(100)
    ]);
    if (orders.error) $("csOrdersList").textContent = "Could not load orders: " + orders.error.message;
    else $("csOrdersList").innerHTML = orders.data.length ? orders.data.map((row) =>
      "<div class='pt-row'><span><strong>" + esc(row.item_name) + "</strong><br><small>" + esc(row.order_ref) +
      " · " + esc(row.status.replaceAll("_", " ")) + " · Payment: " + esc(row.payment_status) +
      "<br>" + esc(row.currency) + " " + Number(row.amount).toLocaleString("en-NG") +
      "<br>" + esc(new Date(row.created_at).toLocaleString()) + "</small></span></div>"
    ).join("") : "<p>No order requests yet. Use Buy on WhatsApp on an account listing or gift.</p>";
    if (activity.error) $("csActivityList").textContent = "Could not load activity: " + activity.error.message;
    else $("csActivityList").innerHTML = activity.data.length ? activity.data.map((row) =>
      "<div class='pt-row'><span><strong>" + esc(row.title) + "</strong><br><small>" +
      esc(row.activity_type.replaceAll("_", " ")) + (row.item_type ? " · " + esc(row.item_type) : "") +
      " · " + esc(new Date(row.created_at).toLocaleString()) + "</small></span></div>"
    ).join("") : "<p>Your activity will appear here as you use saved items and place order requests.</p>";
  }

  async function toggleSaved(button) {
    const type = button.dataset.csSaveType;
    const id = button.dataset.csSaveId;
    const k = key(type, id);
    if (busyKeys.has(k)) return;
    busyKeys.add(k);
    button.disabled = true;
    try {
      const user = await getUser();
      if (!user) {
        saySaved("Please sign in first. Your saved items are kept with your account.");
        window.shell.go("profileSection");
        return;
      }
      if (savedKeys.has(k)) {
        const { error } = await sb.from("saved_items").delete().eq("item_type", type).eq("item_id", id).eq("user_id", user.id);
        if (error) throw error;
        savedKeys.delete(k);
        await recordActivity("unsaved", type, id, button.dataset.csSaveTitle || "Saved item removed", {});
        saySaved("Removed from Saved items.");
      } else {
        const row = {
          user_id: user.id, item_type: type, item_id: id,
          title: (button.dataset.csSaveTitle || "Saved item").slice(0, 200),
          subtitle: (button.dataset.csSaveSubtitle || "").slice(0, 200) || null,
          target_section: button.dataset.csSaveTarget,
          metadata: {}
        };
        const { error } = await sb.from("saved_items").upsert(row, { onConflict: "user_id,item_type,item_id", ignoreDuplicates: true });
        if (error) throw error;
        savedKeys.add(k);
        await recordActivity("saved", type, id, row.title, {});
        saySaved("Saved to your account.");
      }
      syncSaveButtons();
      await refreshSaved();
    } catch (error) {
      saySaved("Could not update Saved items: " + (error.message || error));
    } finally {
      busyKeys.delete(k);
      button.disabled = false;
    }
  }

  async function recordOrderIntent(order) {
    try {
      const user = await getUser();
      if (!user) return { skipped: true, reason: "sign_in_required" };
      const payload = {
        user_id: user.id,
        order_ref: String(order.order_ref).slice(0, 50),
        item_type: order.item_type,
        item_id: String(order.item_id).slice(0, 120),
        item_name: String(order.item_name).slice(0, 200),
        amount: Number(order.amount),
        currency: "NGN",
        payment_method: "whatsapp",
        status: "contact_pending",
        payment_status: "unpaid",
        details: order.details || {}
      };
      const { error } = await sb.from("customer_orders").insert(payload);
      if (error) return { error };
      await recordActivity("order_requested", order.item_type, order.item_id, order.item_name, {
        order_ref: payload.order_ref, amount: payload.amount, currency: payload.currency
      });
      return { ok: true };
    } catch (error) { return { error }; }
  }
  window.muskyCustomer = { recordOrderIntent, recordActivity };

  document.addEventListener("click", (event) => {
    const save = event.target.closest("[data-cs-save-type]");
    if (save) { event.preventDefault(); void toggleSaved(save); return; }
    const open = event.target.closest("[data-cs-open]");
    if (open) { window.shell.go(open.dataset.csOpen); return; }
    const remove = event.target.closest("[data-cs-remove]");
    if (remove) {
      const type = remove.dataset.csRemoveType, id = remove.dataset.csRemoveId;
      const userId = currentUserId;
      if (!userId) { saySaved("Sign in to manage saved items."); return; }
      void (async () => {
        remove.disabled = true;
        const { error } = await sb.from("saved_items").delete().eq("id", remove.dataset.csRemove).eq("user_id", userId);
        if (error) { saySaved("Could not remove item: " + error.message); remove.disabled = false; return; }
        savedKeys.delete(key(type, id));
        await recordActivity("unsaved", type, id, remove.dataset.csRemoveTitle || "Saved item removed", {});
        await refreshSaved();
      })();
    }
  });

  // The panes are created lazily by other modules, so watch their contents for cards.
  attachSaveButtons(document);
  ["#jobsSection", "#socialsSection", "#shopSection"].forEach((selector) => {
    const pane = document.querySelector(selector);
    if (!pane) return;
    new MutationObserver(() => attachSaveButtons(pane)).observe(pane, { childList: true, subtree: true });
  });

  onShow(savedPane, refreshSaved);
  onShow(ordersPane, refreshOrdersAndActivity);
  // Record section visits without collecting private form data or account credentials.
  ["#jobsSection", "#socialsSection", "#shopSection"].forEach((selector) => {
    const pane = document.querySelector(selector);
    if (!pane) return;
    let wasVisible = !pane.hidden;
    new MutationObserver(() => {
      const visible = !pane.hidden;
      if (visible && !wasVisible) {
        const label = pane.id === "jobsSection" ? "Jobs" : pane.id === "socialsSection" ? "Account listings" : "Gift shop";
        void recordActivity("view", pane.id === "jobsSection" ? "job" : pane.id === "socialsSection" ? "account" : "gift", null, label, {});
      }
      wasVisible = visible;
    }).observe(pane, { attributes: true, attributeFilter: ["hidden"] });
  });
}