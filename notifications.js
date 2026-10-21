// MuskySocials notifications inbox. Uses the signed-in user's Supabase session and RLS.
const waitForMusky = () => new Promise((resolve) => {
  const started = Date.now();
  const tick = () => {
    if (window.musky?.sb && window.shell) return resolve(true);
    if (Date.now() - started > 15000) return resolve(false);
    setTimeout(tick, 100);
  };
  tick();
});

if (await waitForMusky()) initNotifications();

function initNotifications() {
  const sb = window.musky.sb;
  const studio = document.querySelector("#studio");
  if (!studio || document.querySelector("#notificationsSection")) return;
  const footer = studio.querySelector(":scope > footer");
  const pane = document.createElement("section");
  pane.id = "notificationsSection";
  pane.className = "pane";
  pane.hidden = true;
  pane.innerHTML = `
    <div class="mx-notifications">
      <div class="mx-notifications-head"><div><h2>Notifications</h2><p id="mxNotifSummary">Your account updates, all in one place.</p></div><button type="button" id="mxNotifRefresh" class="mx-notif-btn">Refresh</button></div>
      <div id="mxNotifStatus" role="status" class="mx-notif-status">Loading notifications…</div>
      <div id="mxNotifList" class="mx-notif-list"></div>
    </div>`;
  studio.insertBefore(pane, footer);

  const style = document.createElement("style");
  style.textContent = `
    .mx-notifications{color:var(--sh-text,#050505);font-size:16px}
    .mx-notifications-head{display:flex;justify-content:space-between;align-items:center;gap:12px}
    .mx-notifications h2{font-size:23px;margin:0}
    .mx-notifications p,.mx-notif-status{font-size:13px;color:var(--sh-sub,#65676b)}
    .mx-notif-btn,.mx-notif-read{border:1px solid var(--sh-line,#dadde1);background:var(--sh-card,#fff);color:var(--sh-text,#050505);border-radius:9px;padding:8px 11px;font-size:13px}
    .mx-notif-list{display:grid;gap:10px;margin-top:14px}
    .mx-notif-item{border:1px solid var(--sh-line,#dadde1);border-radius:13px;padding:13px;background:var(--sh-card,#fff)}
    .mx-notif-item.unread{border-left:4px solid var(--sh-blue,#1877f2)}
    .mx-notif-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
    .mx-notif-title{font-weight:750;overflow-wrap:anywhere}
    .mx-notif-date{font-size:11px;color:var(--sh-sub,#65676b);white-space:nowrap}
    .mx-notif-message{margin:7px 0 10px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;color:var(--sh-text,#050505)}
    .mx-notif-actions{display:flex;gap:8px;flex-wrap:wrap}
    .mx-notif-actions a{font-size:13px;color:var(--sh-blue,#1877f2)}
    html.mx-light .mx-notifications,html.mx-light .mx-notifications h2,html.mx-light .mx-notif-title,html.mx-light .mx-notif-message{color:#050505!important}
    html.mx-light .mx-notif-date,html.mx-light .mx-notifications p,html.mx-light .mx-notif-status{color:#65676b!important}
  `;
  document.head.appendChild(style);

  const list = pane.querySelector("#mxNotifList");
  const status = pane.querySelector("#mxNotifStatus");
  const summary = pane.querySelector("#mxNotifSummary");
  const refreshButton = pane.querySelector("#mxNotifRefresh");
  let loading = false;
  let unreadCount = 0;

  window.shell.addItem(["notificationsSection", "🔔", "Notifications", "Inbox and account updates"]);
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
      if (!sessionData?.session) {
        status.textContent = "Sign in to view your notifications.";
        list.replaceChildren();
        return;
      }
      const { data, error } = await sb.from("notifications")
        .select("id,title,message,type,link,read_at,created_at")
        .order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      const rows = data || [];
      unreadCount = rows.filter((row) => !row.read_at).length;
      summary.textContent = unreadCount ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "You're all caught up.";
      status.textContent = rows.length ? "" : "No notifications yet. Account and credit updates will appear here.";
      list.replaceChildren();
      for (const row of rows) {
        const item = document.createElement("article");
        item.className = "mx-notif-item" + (row.read_at ? "" : " unread");
        const top = document.createElement("div"); top.className = "mx-notif-top";
        const title = document.createElement("div"); title.className = "mx-notif-title"; title.textContent = row.title;
        const date = document.createElement("time"); date.className = "mx-notif-date"; date.dateTime = row.created_at || ""; date.textContent = dateLabel(row.created_at);
        top.append(title, date);
        const message = document.createElement("p"); message.className = "mx-notif-message"; message.textContent = row.message;
        item.append(top, message);
        const actions = document.createElement("div"); actions.className = "mx-notif-actions";
        if (row.link && row.link.startsWith("/") && !row.link.startsWith("//")) {
          const link = document.createElement("a"); link.href = row.link; link.textContent = "Open"; actions.append(link);
        }
        if (!row.read_at) {
          const button = document.createElement("button"); button.type = "button"; button.className = "mx-notif-read"; button.textContent = "Mark as read";
          button.addEventListener("click", () => markRead(row.id, button)); actions.append(button);
        } else {
          const read = document.createElement("span"); read.className = "mx-notif-date"; read.textContent = "Read"; actions.append(read);
        }
        item.append(actions); list.append(item);
      }
      updateHomeTile();
    } catch (error) {
      console.error("Could not load notifications:", error);
      status.textContent = "Could not load notifications. Check your connection and try again.";
    } finally { loading = false; refreshButton.disabled = false; }
  }

  async function markRead(id, button) {
    button.disabled = true;
    try {
      const { data: sessionData, error: sessionError } = await sb.auth.getSession();
      if (sessionError || !sessionData?.session) throw sessionError || new Error("Please sign in again.");
      const { error } = await sb.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null);
      if (error) throw error;
      await loadNotifications();
    } catch (error) {
      console.error("Could not mark notification as read:", error);
      status.textContent = "Could not mark this notification as read. Please try again.";
      button.disabled = false;
    }
  }

  function updateHomeTile() {
    const tile = document.querySelector('#studio [data-go="notificationsSection"]');
    if (!tile) return;
    const small = tile.querySelector("small");
    if (small) small.textContent = unreadCount ? `${unreadCount} unread` : "You're all caught up";
    const icon = tile.querySelector(".ico");
    if (icon) icon.textContent = unreadCount ? "🔔 " + unreadCount : "🔔";
  }
  refreshButton.addEventListener("click", loadNotifications);
  new MutationObserver(() => { if (!pane.hidden) loadNotifications(); })
    .observe(pane, { attributes: true, attributeFilter: ["hidden"] });
  loadNotifications();
  setInterval(() => { if (!studio.hidden) loadNotifications(); }, 60000);
}
