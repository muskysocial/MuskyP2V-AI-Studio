// Notifications center for the existing MuskySocials shell.
// Loaded by portal.js through modules.json so it can reuse the pane created by home.js.
const waitForNotificationPane = (ms = 20000) => new Promise((resolve) => {
  const started = Date.now();
  (function tick() {
    const pane = document.querySelector("#notifSection");
    if (window.musky?.sb && window.shell && window.portal && pane) return resolve(pane);
    if (Date.now() - started > ms) return resolve(null);
    setTimeout(tick, 100);
  })();
});

const notificationPane = await waitForNotificationPane();
if (notificationPane) initNotifications(notificationPane);

function initNotifications(pane) {
  if (pane.dataset.notificationsReady === "true") return;
  pane.dataset.notificationsReady = "true";
  const sb = window.musky.sb;
  pane.innerHTML = `
    <div class="mx-notifications">
      <div class="mx-notifications-head">
        <div><h2>🔔 Notifications</h2><p id="mxNotifSummary">Your account updates, all in one place.</p></div>
        <button type="button" id="mxNotifRefresh" class="mx-notif-btn">Refresh</button>
      </div>
      <div class="mx-notif-welcome"><span class="mx-notif-bell">♧</span><div><strong>Your activity</strong><small>Stay in the loop with your MuskySocials account.</small></div></div>
      <div class="mx-notif-filters" role="group" aria-label="Filter notifications">
        <button type="button" class="mx-notif-filter active" data-filter="all" aria-pressed="true">All</button>
        <button type="button" class="mx-notif-filter" data-filter="unread" aria-pressed="false">Unread</button>
        <button type="button" class="mx-notif-filter" data-filter="followers" aria-pressed="false">Followers</button>
        <button type="button" class="mx-notif-filter" data-filter="account" aria-pressed="false">Account</button>
      </div>
      <div id="mxNotifStatus" role="status" aria-live="polite" class="mx-notif-status">Loading notifications…</div>
      <div id="mxNotifList" class="mx-notif-list"></div>
    </div>`;

  const style = document.createElement("style");
  style.textContent = `
    #notifSection .mx-notifications{color:var(--sh-text,#050505);font-size:15px;max-width:760px;margin:0 auto;padding-bottom:18px}
    #notifSection .mx-notifications-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px}
    #notifSection .mx-notifications h2{font-size:27px;letter-spacing:-.04em;margin:0}
    #notifSection .mx-notifications p,#notifSection .mx-notif-status{font-size:13px;color:var(--sh-sub,#65676b)}
    #notifSection .mx-notif-btn,#notifSection .mx-notif-read{border:1px solid var(--sh-line,#dadde1);background:var(--sh-card,#fff);color:var(--sh-text,#050505);border-radius:11px;padding:9px 12px;font-size:13px;font-weight:700}
    #notifSection .mx-notif-btn{background:var(--sh-blue,#1877f2);color:#fff;border-color:transparent}
    #notifSection .mx-notif-welcome{display:flex;align-items:center;gap:12px;padding:16px;border-radius:18px;background:linear-gradient(115deg,rgba(24,119,242,.12),rgba(244,91,154,.12));border:1px solid rgba(24,119,242,.12);margin:8px 0 14px}
    #notifSection .mx-notif-bell{display:grid;place-items:center;flex:none;width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#1877f2,#f45b9a);color:white;font-size:23px}
    #notifSection .mx-notif-welcome strong,#notifSection .mx-notif-welcome small{display:block}
    #notifSection .mx-notif-welcome strong{font-size:15px}
    #notifSection .mx-notif-welcome small{font-size:12px;color:var(--sh-sub,#65676b);margin-top:3px}
    #notifSection .mx-notif-filters{display:flex;gap:8px;overflow-x:auto;padding:3px 0 10px;margin-bottom:5px}
    #notifSection .mx-notif-filter{flex:none;border:1px solid var(--sh-line,#dadde1);border-radius:999px;padding:9px 14px;background:var(--sh-card,#fff);color:var(--sh-sub,#65676b);font-size:13px;font-weight:700}
    #notifSection .mx-notif-filter.active{background:var(--sh-blue,#1877f2);border-color:var(--sh-blue,#1877f2);color:#fff}
    #notifSection .mx-notif-list{display:grid;gap:10px;margin-top:12px}
    #notifSection .mx-notif-item{position:relative;border:1px solid var(--sh-line,#dadde1);border-radius:16px;padding:14px;background:var(--sh-card,#fff);box-shadow:0 3px 12px rgba(20,45,90,.035)}
    #notifSection .mx-notif-item.unread{border-color:rgba(24,119,242,.38);background:linear-gradient(110deg,rgba(24,119,242,.055),var(--sh-card,#fff) 65%)}
    #notifSection .mx-notif-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    #notifSection .mx-notif-title{font-weight:800;overflow-wrap:anywhere;font-size:14px}
    #notifSection .mx-notif-date{font-size:11px;color:var(--sh-sub,#65676b);white-space:nowrap}
    #notifSection .mx-notif-message{margin:7px 0 12px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.5;color:var(--sh-text,#050505)}
    #notifSection .mx-notif-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    #notifSection .mx-notif-actions a{font-size:13px;color:var(--sh-blue,#1877f2);font-weight:750}
    #notifSection .mx-notif-empty{padding:28px 16px;text-align:center;border:1px dashed var(--sh-line,#dadde1);border-radius:16px;color:var(--sh-sub,#65676b);font-size:13px;line-height:1.5}
    @media(max-width:420px){#notifSection .mx-notifications h2{font-size:24px}#notifSection .mx-notif-item{padding:12px}#notifSection .mx-notifications-head{align-items:flex-start}}
    html.mx-light #notifSection .mx-notifications,html.mx-light #notifSection .mx-notifications h2,html.mx-light #notifSection .mx-notif-title,html.mx-light #notifSection .mx-notif-message{color:#050505!important}
    html.mx-light #notifSection .mx-notif-date,html.mx-light #notifSection .mx-notifications p,html.mx-light #notifSection .mx-notif-status{color:#65676b!important}
  `;
  document.head.appendChild(style);

  const list = pane.querySelector("#mxNotifList");
  const status = pane.querySelector("#mxNotifStatus");
  const summary = pane.querySelector("#mxNotifSummary");
  const refreshButton = pane.querySelector("#mxNotifRefresh");
  let loading = false;
  let unreadCount = 0;
  let lastSessionUserId = null;
  let cachedRows = [];
  let activeFilter = "all";

  const dateLabel = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
  };

  async function loadNotifications() {
    if (loading) return;
    loading = true;
    refreshButton.disabled = true;
    status.textContent = "Loading notifications…";
    try {
      const { data: sessionData, error: sessionError } = await sb.auth.getSession();
      if (sessionError) throw sessionError;
      const session = sessionData?.session;
      if (!session) {
        lastSessionUserId = null;
        unreadCount = 0;
        summary.textContent = "Sign in to view your notifications.";
        status.textContent = "No signed-in session found.";
        list.replaceChildren();
        updateNotificationBadges();
        return;
      }
      if (lastSessionUserId && lastSessionUserId !== session.user.id) list.replaceChildren();
      lastSessionUserId = session.user.id;

      // RLS scopes this query to the authenticated user.
      const { data, error } = await sb.from("notifications")
        .select("id,title,message,type,link,read_at,created_at")
        .order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      const rows = data || [];
      unreadCount = rows.filter((row) => !row.read_at).length;
      summary.textContent = unreadCount
        ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
        : "You're all caught up.";
      status.textContent = rows.length ? "" : "No notifications yet. Account and credit updates will appear here.";
      cachedRows = rows;
      renderRows();
      updateNotificationBadges();
    } catch (error) {
      console.error("Could not load notifications:", error);
      status.textContent = "Could not load notifications. Check your connection and try again.";
    } finally {
      loading = false;
      refreshButton.disabled = false;
    }
  }

  function renderRows() {
      const rows = cachedRows.filter((row) => {
        if (activeFilter === "unread") return !row.read_at;
        const kind = (String(row.type || "") + " " + String(row.title || "") + " " + String(row.message || "")).toLowerCase();
        if (activeFilter === "followers") return /follow|follower/.test(kind);
        if (activeFilter === "account") return /account|credit|password|security|payment|billing|profile/.test(kind);
        return true;
      });
      list.replaceChildren();
      if (!rows.length) {
        const empty = document.createElement("div");
        empty.className = "mx-notif-empty";
        empty.textContent = activeFilter === "all" ? "No notifications yet. Account and credit updates will appear here." : "Nothing in this filter right now.";
        list.append(empty);
        return;
      }
      for (const row of rows) {
        const item = document.createElement("article");
        item.className = "mx-notif-item" + (row.read_at ? "" : " unread");
        const top = document.createElement("div"); top.className = "mx-notif-top";
        const title = document.createElement("div"); title.className = "mx-notif-title"; title.textContent = row.title;
        const date = document.createElement("time"); date.className = "mx-notif-date";
        date.dateTime = row.created_at || ""; date.textContent = dateLabel(row.created_at);
        top.append(title, date);
        const message = document.createElement("p"); message.className = "mx-notif-message"; message.textContent = row.message;
        item.append(top, message);
        const actions = document.createElement("div"); actions.className = "mx-notif-actions";
        if (row.link && row.link.startsWith("/") && !row.link.startsWith("//")) {
          const link = document.createElement("a"); link.href = row.link; link.textContent = "Open"; actions.append(link);
        }
        if (!row.read_at) {
          const button = document.createElement("button"); button.type = "button";
          button.className = "mx-notif-read"; button.textContent = "Mark as read";
          button.addEventListener("click", () => markRead(row.id, button)); actions.append(button);
        } else {
          const read = document.createElement("span"); read.className = "mx-notif-date"; read.textContent = "Read"; actions.append(read);
        }
        item.append(actions); list.append(item);
      }
  }

  async function markRead(id, button) {
    button.disabled = true;
    try {
      const { data: sessionData, error: sessionError } = await sb.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData?.session || sessionData.session.user.id !== lastSessionUserId) throw new Error("Please sign in again.");
      const { error } = await sb.from("notifications").update({ read_at: new Date().toISOString() })
        .eq("id", id).is("read_at", null);
      if (error) throw error;
      await loadNotifications();
    } catch (error) {
      console.error("Could not mark notification as read:", error);
      status.textContent = "Could not mark this notification as read. Please try again.";
      button.disabled = false;
    }
  }

  function updateNotificationBadges() {
    const bell = document.querySelector("#tbBell");
    if (bell) {
      bell.textContent = unreadCount ? "🔔 " + unreadCount : "🔔";
      bell.setAttribute("aria-label", unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications");
      bell.title = unreadCount ? `${unreadCount} unread notifications` : "Notifications";
    }
    const story = document.querySelector('#homeSection [data-go="notifSection"] b');
    if (story) story.textContent = unreadCount ? `Notifications · ${unreadCount} unread` : "Notifications";
  }

  pane.querySelectorAll(".mx-notif-filter").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";
      pane.querySelectorAll(".mx-notif-filter").forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      renderRows();
    });
  });
  refreshButton.addEventListener("click", loadNotifications);
  new MutationObserver(() => { if (!pane.hidden) loadNotifications(); })
    .observe(pane, { attributes: true, attributeFilter: ["hidden"] });
  sb.auth.onAuthStateChange(() => setTimeout(loadNotifications, 0));
  loadNotifications();
  setInterval(() => { if (!document.hidden) loadNotifications(); }, 60000);
}
