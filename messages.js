// Private messages for MuskySocials. Uses authenticated Supabase access and participant-only RLS.
const waitForMessaging = (ms = 20000) => new Promise((resolve) => {
  const start = Date.now();
  (function tick() {
    const ready = window.musky?.sb && window.portal && window.shell &&
      document.querySelector("#publicProfileSection") && document.querySelector("#studio");
    if (ready) return resolve(true);
    if (Date.now() - start > ms) return resolve(false);
    setTimeout(tick, 100);
  })();
});

if (await waitForMessaging()) initPrivateMessaging();

function initPrivateMessaging() {
  if (window.muskyMessaging) return;
  const sb = window.musky.sb;
  const { esc, mkPane } = window.portal;
  const $ = (selector) => document.querySelector(selector);
  const pane = $("#messagesSection") || mkPane("messagesSection",
    "<div class='mxmsg'><div class='mxmsg-head'><div><p class='mxmsg-kicker'>YOUR COMMUNITY</p><h2>Messages</h2><p class='mxmsg-sub'>Private conversations between you and another member.</p></div><button type='button' class='mxmsg-refresh' data-msg-refresh>↻</button></div><div id='mxmsg-status' role='status' aria-live='polite'>Loading your inbox…</div><div id='mxmsg-content'></div></div>");
  const root = pane.querySelector(".mxmsg");
  if (!root || pane.dataset.messagingReady === "true") return;
  pane.dataset.messagingReady = "true";
  const style = document.createElement("style");
  style.textContent = `
    #messagesSection .mxmsg{max-width:760px;margin:0 auto;padding:2px 0 24px;color:var(--sh-text,#172033)}
    #messagesSection .mxmsg-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
    #messagesSection .mxmsg-kicker{margin:0 0 4px;color:#1877f2;font-size:10px;font-weight:900;letter-spacing:.16em}
    #messagesSection .mxmsg h2{margin:0;font-size:clamp(25px,7vw,32px);letter-spacing:-.04em}
    #messagesSection .mxmsg-sub{margin:5px 0 0;color:var(--sh-sub,#65676b);font-size:12px;line-height:1.5}
    #messagesSection .mxmsg-refresh,#messagesSection .mxmsg-back{border:1px solid var(--sh-line,#e4e6eb);background:var(--sh-card,#fff);color:var(--sh-text,#172033);border-radius:12px;padding:10px 12px;font-weight:750}
    #messagesSection #mxmsg-status{min-height:18px;margin:8px 1px 12px;color:var(--sh-sub,#65676b);font-size:12px}
    #messagesSection .mxmsg-list{display:grid;gap:9px}
    #messagesSection .mxmsg-row{display:flex;align-items:center;gap:12px;width:100%;padding:13px;text-align:left;border:1px solid var(--sh-line,#e4e6eb);border-radius:16px;background:var(--sh-card,#fff);color:var(--sh-text,#172033)}
    #messagesSection .mxmsg-avatar{display:grid;place-items:center;flex:0 0 46px;width:46px;height:46px;overflow:hidden;border-radius:50%;background:linear-gradient(135deg,#1877f2,#f45b9a);color:#fff;font-size:17px;font-weight:850}
    #messagesSection .mxmsg-avatar img{width:100%;height:100%;object-fit:cover}
    #messagesSection .mxmsg-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:4px}
    #messagesSection .mxmsg-copy strong{font-size:14px;overflow-wrap:anywhere}
    #messagesSection .mxmsg-copy small{font-size:12px;line-height:1.4;color:var(--sh-sub,#65676b);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #messagesSection .mxmsg-time{font-size:10px;color:var(--sh-sub,#65676b);white-space:nowrap}
    #messagesSection .mxmsg-unread{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#1877f2;color:#fff;font-size:10px;font-weight:800}
    #messagesSection .mxmsg-empty{padding:28px 17px;text-align:center;border:1px dashed var(--sh-line,#d5dbea);border-radius:17px;background:linear-gradient(130deg,rgba(24,119,242,.04),rgba(244,91,154,.04))}
    #messagesSection .mxmsg-empty b{display:block;font-size:15px;margin-bottom:6px}
    #messagesSection .mxmsg-empty p{margin:0;color:var(--sh-sub,#65676b);font-size:12px;line-height:1.6}
    #messagesSection .mxmsg-thread-head{display:flex;align-items:center;gap:10px;padding:12px;border:1px solid var(--sh-line,#e4e6eb);border-radius:15px;background:var(--sh-card,#fff);margin-bottom:10px}
    #messagesSection .mxmsg-thread-person{flex:1;min-width:0}
    #messagesSection .mxmsg-thread-person strong{display:block;font-size:14px;overflow-wrap:anywhere}
    #messagesSection .mxmsg-thread-person small{display:block;margin-top:3px;color:var(--sh-sub,#65676b);font-size:11px}
    #messagesSection .mxmsg-bubbles{display:flex;flex-direction:column;gap:9px;min-height:140px;max-height:min(56vh,540px);overflow:auto;padding:13px 8px;border:1px solid var(--sh-line,#e4e6eb);border-radius:16px;background:var(--sh-bg,#f7f8fc)}
    #messagesSection .mxmsg-bubble{max-width:86%;padding:10px 12px;border-radius:15px;background:var(--sh-card,#fff);border:1px solid var(--sh-line,#e4e6eb);font-size:13px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
    #messagesSection .mxmsg-bubble.mine{align-self:flex-end;background:linear-gradient(135deg,#1877f2,#347ff0);border-color:#1877f2;color:#fff;border-bottom-right-radius:5px}
    #messagesSection .mxmsg-bubble.theirs{align-self:flex-start;border-bottom-left-radius:5px}
    #messagesSection .mxmsg-bubble time{display:block;margin-top:5px;font-size:9px;opacity:.72;text-align:right}
    #messagesSection .mxmsg-compose{display:grid;grid-template-columns:1fr auto;align-items:end;gap:8px;margin-top:10px}
    #messagesSection .mxmsg-compose textarea{width:100%;min-height:45px;max-height:130px;resize:vertical;padding:12px;border:1px solid var(--sh-line,#d5dbea);border-radius:14px;background:var(--sh-card,#fff);color:var(--sh-text,#172033);font:inherit;font-size:14px}
    #messagesSection .mxmsg-send{min-height:44px;border:0;border-radius:13px;padding:0 16px;background:#1877f2;color:#fff;font-weight:800}
    #messagesSection .mxmsg-send:disabled{opacity:.55}
    #messagesSection .mxmsg-privacy{margin:10px 2px 0;color:var(--sh-sub,#65676b);font-size:10px;line-height:1.5}
    html.mx-light #messagesSection .mxmsg-bubble.theirs{color:#172033}
    @media(max-width:420px){#messagesSection .mxmsg-row{padding:11px;gap:9px}#messagesSection .mxmsg-avatar{flex-basis:42px;width:42px;height:42px}#messagesSection .mxmsg-compose{grid-template-columns:minmax(0,1fr) auto}#messagesSection .mxmsg-send{padding:0 12px}}
  `;
  document.head.appendChild(style);

  const status = pane.querySelector("#mxmsg-status");
  const content = pane.querySelector("#mxmsg-content");
  let userId = null;
  let currentConversationId = null;
  let currentPeer = null;
  let busy = false;

  const safeTime = (value) => {
    if (!value) return "";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };
  const avatarUrl = (path) => path ? sb.storage.from("avatars").getPublicUrl(path).data.publicUrl : "";
  const avatarHtml = (person) => {
    const url = avatarUrl(person?.avatar_path);
    return '<span class="mxmsg-avatar">' + (url ? '<img src="' + esc(url) + '" alt="">' : esc((person?.display_name || "M").trim().charAt(0).toUpperCase() || "M")) + "</span>";
  };
  const say = (message) => { status.textContent = message || ""; };
  async function getUser() {
    const session = await window.musky.session();
    userId = session?.user?.id || null;
    return userId;
  }
  async function getPerson(id) {
    const { data, error } = await sb.from("member_directory")
      .select("id,display_name,avatar_path,country,is_verified").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return data;
  }
  async function getOrCreateConversation(peerId) {
    if (!userId && !(await getUser())) throw new Error("Please sign in to send a private message.");
    if (!peerId || peerId === userId) throw new Error("You can't message your own account.");
    const [user_a, user_b] = [userId, peerId].sort();
    const lookup = () => sb.from("conversations").select("id,user_a,user_b,last_message_at")
      .eq("user_a", user_a).eq("user_b", user_b).maybeSingle();
    let result = await lookup();
    if (result.error) throw result.error;
    if (result.data) return result.data;
    result = await sb.from("conversations").insert({ user_a, user_b })
      .select("id,user_a,user_b,last_message_at").single();
    if (!result.error && result.data) return result.data;
    if (result.error?.code === "23505") {
      const retry = await lookup();
      if (!retry.error && retry.data) return retry.data;
    }
    throw result.error || new Error("Could not start this conversation.");
  }
  async function loadInbox() {
    if (busy) return;
    busy = true;
    try {
      if (!(await getUser())) {
        say("Sign in to use private messages.");
        content.innerHTML = '<div class="mxmsg-empty"><b>Sign in to message members</b><p>Your private inbox is only available when you are signed in.</p></div>';
        return;
      }
      say("Loading your inbox…");
      const { data: conversations, error } = await sb.from("conversations")
        .select("id,user_a,user_b,last_message_at").order("last_message_at", { ascending: false }).limit(100);
      if (error) throw error;
      const rows = conversations || [];
      if (!rows.length) {
        say("");
        content.innerHTML = '<div class="mxmsg-empty"><b>Your inbox is ready</b><p>You have no conversations yet. Open a member profile and tap <strong>Message</strong> to start a private conversation.</p></div>';
        return;
      }
      const ids = rows.map((row) => row.id);
      const peerIds = [...new Set(rows.map((row) => row.user_a === userId ? row.user_b : row.user_a))];
      const [peopleResult, messageResult, unreadResult] = await Promise.all([
        sb.from("member_directory").select("id,display_name,avatar_path,country,is_verified").in("id", peerIds),
        sb.from("direct_messages").select("conversation_id,body,sender_id,created_at").in("conversation_id", ids).order("created_at", { ascending: false }).limit(500),
        sb.from("direct_messages").select("id,conversation_id").in("conversation_id", ids).neq("sender_id", userId).is("read_at", null).limit(500)
      ]);
      if (peopleResult.error) throw peopleResult.error;
      if (messageResult.error) throw messageResult.error;
      if (unreadResult.error) throw unreadResult.error;
      const people = new Map((peopleResult.data || []).map((person) => [person.id, person]));
      const latest = new Map();
      for (const message of messageResult.data || []) if (!latest.has(message.conversation_id)) latest.set(message.conversation_id, message);
      const unread = new Map();
      for (const message of unreadResult.data || []) unread.set(message.conversation_id, (unread.get(message.conversation_id) || 0) + 1);
      say("");
      content.innerHTML = '<div class="mxmsg-list">' + rows.map((conversation) => {
        const peerId = conversation.user_a === userId ? conversation.user_b : conversation.user_a;
        const peer = people.get(peerId) || { id: peerId, display_name: "MuskySocials member" };
        const last = latest.get(conversation.id);
        const preview = last ? ((last.sender_id === userId ? "You: " : "") + last.body) : "Say hello to start the conversation.";
        const count = unread.get(conversation.id) || 0;
        return '<button type="button" class="mxmsg-row" data-msg-open-conversation="' + esc(conversation.id) + '">' +
          avatarHtml(peer) + '<span class="mxmsg-copy"><strong>' + esc(peer.display_name || "Member") + '</strong><small>' + esc(preview) + '</small></span>' +
          '<span class="mxmsg-time">' + esc(safeTime(last?.created_at || conversation.last_message_at)) + (count ? '<span class="mxmsg-unread">' + count + '</span>' : '') + '</span></button>';
      }).join("") + "</div>";
    } catch (error) {
      console.error("Could not load private messages:", error);
      say("Your inbox could not load. Please refresh and try again.");
      content.innerHTML = '<div class="mxmsg-empty"><b>We couldn't load your inbox</b><p>Check your connection and try again. Your messages remain protected by account-level access rules.</p></div>';
    } finally {
      busy = false;
    }
  }
  async function open(peerId) {
    try {
      if (!(await getUser())) {
        window.shell.go("messagesSection");
        say("Sign in to use private messages.");
        content.innerHTML = '<div class="mxmsg-empty"><b>Sign in first</b><p>Private messages are available to signed-in members.</p></div>';
        return;
      }
      say("Opening conversation…");
      const peer = await getPerson(peerId);
      if (!peer) throw new Error("That member profile could not be loaded.");
      const conversation = await getOrCreateConversation(peerId);
      currentPeer = peer;
      currentConversationId = conversation.id;
      window.shell.go("messagesSection");
      await renderThread();
    } catch (error) {
      console.error("Could not open private conversation:", error);
      say(error.message || "Could not open this conversation. Please try again.");
    }
  }
  async function openConversation(conversationId) {
    try {
      if (!(await getUser())) throw new Error("Please sign in to view your messages.");
      const { data: conversation, error } = await sb.from("conversations")
        .select("id,user_a,user_b,last_message_at").eq("id", conversationId).maybeSingle();
      if (error || !conversation) throw error || new Error("That conversation is unavailable.");
      const peerId = conversation.user_a === userId ? conversation.user_b : conversation.user_a;
      const peer = await getPerson(peerId);
      currentPeer = peer || { id: peerId, display_name: "MuskySocials member" };
      currentConversationId = conversation.id;
      window.shell.go("messagesSection");
      await renderThread();
    } catch (error) {
      console.error("Could not open message thread:", error);
      say(error.message || "Could not open this conversation.");
    }
  }
  async function renderThread() {
    if (!currentConversationId || !currentPeer) return loadInbox();
    say("Loading conversation…");
    const { error: markError } = await sb.from("direct_messages").update({ read_at: new Date().toISOString() })
      .eq("conversation_id", currentConversationId).neq("sender_id", userId).is("read_at", null);
    if (markError) console.warn("Could not mark received messages as read:", markError);
    const { data: messages, error } = await sb.from("direct_messages")
      .select("id,sender_id,body,created_at,read_at").eq("conversation_id", currentConversationId)
      .order("created_at", { ascending: true }).limit(300);
    if (error) {
      say("Could not load this conversation. Please try again.");
      content.innerHTML = '<button type="button" class="mxmsg-back" data-msg-back>← Inbox</button><div class="mxmsg-empty"><b>Conversation unavailable</b><p>Please refresh and try again.</p></div>';
      return;
    }
    say("");
    content.innerHTML = '<div class="mxmsg-thread-head"><button type="button" class="mxmsg-back" data-msg-back>←</button>' +
      avatarHtml(currentPeer) + '<span class="mxmsg-thread-person"><strong>' + esc(currentPeer.display_name || "Member") + '</strong><small>Private conversation</small></span></div>' +
      '<div class="mxmsg-bubbles" aria-label="Conversation messages">' +
      ((messages || []).map((message) => '<div class="mxmsg-bubble ' + (message.sender_id === userId ? "mine" : "theirs") + '">' +
        esc(message.body) + '<time>' + esc(safeTime(message.created_at)) + '</time></div>').join("") ||
        '<div class="mxmsg-empty"><b>Say hello 👋</b><p>Your conversation starts here.</p></div>') +
      '</div><form class="mxmsg-compose" data-msg-compose><textarea name="message" maxlength="4000" rows="2" required aria-label="Write a private message" placeholder="Write a message…"></textarea><button class="mxmsg-send" type="submit">Send</button></form>' +
      '<p class="mxmsg-privacy">Only the two conversation participants can read these messages. Keep personal and financial secrets out of chats.</p>';
    const bubbles = content.querySelector(".mxmsg-bubbles");
    if (bubbles) bubbles.scrollTop = bubbles.scrollHeight;
  }
  async function sendMessage(form) {
    if (!currentConversationId || !userId) return;
    const input = form.elements.message;
    const body = input.value.trim();
    if (!body) return;
    if (body.length > 4000) return say("Messages can be up to 4,000 characters.");
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    say("Sending…");
    try {
      const { error } = await sb.from("direct_messages").insert({
        conversation_id: currentConversationId, sender_id: userId, body
      });
      if (error) throw error;
      input.value = "";
      await renderThread();
    } catch (error) {
      console.error("Could not send message:", error);
      say("Message wasn't sent. Check your connection and try again.");
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  }

  pane.addEventListener("click", async (event) => {
    const back = event.target.closest("[data-msg-back]");
    if (back) { currentConversationId = null; currentPeer = null; return loadInbox(); }
    const refresh = event.target.closest("[data-msg-refresh]");
    if (refresh) return currentConversationId ? renderThread() : loadInbox();
    const openThread = event.target.closest("[data-msg-open-conversation]");
    if (openThread) return openConversation(openThread.dataset.msgOpenConversation);
  });
  pane.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-msg-compose]");
    if (!form) return;
    event.preventDefault();
    sendMessage(form);
  });
  const observer = new MutationObserver(() => {
    if (!pane.hidden && !currentConversationId) loadInbox();
  });
  observer.observe(pane, { attributes: true, attributeFilter: ["hidden"] });
  window.muskyMessaging = {
    inbox() { currentConversationId = null; currentPeer = null; window.shell.go("messagesSection"); return loadInbox(); },
    open,
    openConversation
  };
}
