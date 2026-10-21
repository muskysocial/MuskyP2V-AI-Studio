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
      <div id="mxNotifStatus" role="status" aria-live="polite" class="mx-notif-status">Loading notifications…</div>
      <div id="mxNotifList" class="mx-notif-list"></div>
    </div>`;

  const style = document.createElement("style");
  style.textContent = `
    #notifSection .mx-notifications{color:var(--sh-text,#050505);font-size:16px}
    #notifSection .mx-notifications-head{display:flex;justify-content:space-between;align-items:center;gap:12px}
    #notifSection .mx-notifications h2{font-size:23px;margin:0}
    #notifSection .mx-notifications p,#notifSection .mx-notif-status{font-size:13px;color:var(--sh-sub,#65676b)}
    #notifSection .mx-notif-btn,#notifSection .mx-notif-read{border:1px solid var(--sh-line,#dadde1);background:var(--sh-card,#fff);color:var(--sh-text,#050505);border-radius:9px;padding:8px 11px;font-size:13px}
    #notifSection .mx-notif-list{display:grid;gap:10px;margin-top:14px}
    #notifSection .mx-notif-item{border:1px solid var(--sh-line,#dadde1);border-radius:13px;padding:13px;background:var(--sh-card,#fff)}
    #notifSection .mx-notif-item.unread{border-left:4px solid var(--sh-blue,#1877f2)}
    #notifSection .mx-notif-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    #notifSection .mx-notif-title{font-weight:750;overflow-wrap:anywhere}
    #notifSection .mx-notif-date{font-size:11px;color:var(--sh-sub,#65676b);white-space:nowrap}
    #notifSection .mx-notif-message{margin:7px 0 10px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;color:var(--sh-text,#050505)}
    #notifSection .mx-notif-actions{display:flex;gap:8px;flex-wrap:wrap}
    #notifSection .mx-notif-actions a{font-size:13px;color:var(--sh-blue,#1877f2)}
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
      list.replaceChildren();
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
      updateNotificationBadges();
    } catch (error) {
      console.error("Could not load notifications:", error);
      status.textContent = "Could not load notifications. Check your connection and try again.";
    } finally {
      loading = false;
      refreshButton.disabled = false;
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

  refreshButton.addEventListener("click", loadNotifications);
  new MutationObserver(() => { if (!pane.hidden) loadNotifications(); })
    .observe(pane, { attributes: true, attributeFilter: ["hidden"] });
  sb.auth.onAuthStateChange(() => setTimeout(loadNotifications, 0));
  loadNotifications();
  setInterval(() => { if (!document.hidden) loadNotifications(); }, 60000);
}
