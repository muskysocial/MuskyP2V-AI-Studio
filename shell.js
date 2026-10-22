// MuskySocials app shell v1: light Facebook-style look, bigger text,
// bottom bar, Menu grid, Settings. Loaded from index.html after auth.js.
const KEY = "musky-settings";
const DEFAULTS = { theme: "light", size: 1 };
const S = (() => {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return { ...DEFAULTS }; }
})();
if (![1, 1.1, 1.2].includes(Number(S.size))) S.size = 1;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
function apply() {
  document.documentElement.classList.toggle("mx-light", S.theme === "light");
  document.documentElement.style.setProperty("--mx-font-scale", String(S.size));
}

const CSS = `
:root{--sh-card:#0b1530;--sh-text:#e6ecff;--sh-sub:#9fb4f0;--sh-line:#1b2a52;--sh-blue:#6ea0ff}
html.mx-light{--sh-card:#fff;--sh-text:#050505;--sh-sub:#65676b;--sh-line:#dadde1;--sh-blue:#1877f2}
body{padding-bottom:0}
#studio nav.tabs,#studio .notice,#studio .hello-row,#studio .chat-prompt,#authOut{display:none!important}
#mxBar{position:fixed;left:0;right:0;bottom:0;z-index:70;display:none;background:var(--sh-card);border-top:1px solid var(--sh-line);padding-bottom:env(safe-area-inset-bottom,0px)}
#mxBackNav{display:none;align-items:center;padding:10px 12px 4px;max-width:1000px;margin:0 auto;width:100%;box-sizing:border-box}
#mxBackButton{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px 16px;border:1px solid var(--sh-line);border-radius:999px;background:var(--sh-card);color:var(--sh-text);font:inherit;font-size:16px;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.08);cursor:pointer;touch-action:manipulation}
#mxBackButton:focus-visible{outline:3px solid var(--sh-blue);outline-offset:2px}
#mxBackButton .mx-back-arrow{font-size:22px;line-height:1}
#mxBar button{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 2px 6px;border:0;background:none;color:var(--sh-sub);font-size:calc(12px * var(--mx-font-scale,1));overflow-wrap:anywhere}
#mxBar button span{font-size:22px;line-height:1.1}
#mxBar button.on{color:var(--sh-blue);font-weight:700}
.sh{color:var(--sh-text);font-size:calc(clamp(14px,3.9vw,16px) * var(--mx-font-scale,1));min-width:0;overflow-wrap:anywhere}
.sh h2{margin:0 0 10px;font-size:calc(clamp(20px,5.5vw,24px) * var(--mx-font-scale,1))}
.sh p,.sh small{color:var(--sh-sub)}
.sh-bal{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px;border:1px solid var(--sh-line);border-radius:14px;background:var(--sh-card);margin-bottom:14px}
.sh-bal strong{display:block;font-size:calc(clamp(22px,6vw,26px) * var(--mx-font-scale,1));color:var(--sh-text)}
.sh-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sh-tile{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:14px;border:1px solid var(--sh-line);border-radius:14px;background:var(--sh-card);color:var(--sh-text);font-size:calc(clamp(14px,4vw,16px) * var(--mx-font-scale,1));font-weight:600;text-align:left;min-width:0;overflow-wrap:anywhere}
.sh-tile .ico{font-size:26px}
.sh-tile small{font-weight:400;font-size:calc(12px * var(--mx-font-scale,1))}
.sh-row{display:flex;gap:8px;margin:8px 0 16px}
.sh-row button,.sh-out{flex:1;min-width:0;padding:12px 6px;border-radius:10px;border:1px solid var(--sh-line);background:var(--sh-card);color:var(--sh-text);font-size:calc(15px * var(--mx-font-scale,1))}
.sh-row button.on{background:var(--sh-blue);border-color:var(--sh-blue);color:#fff;font-weight:700}
.sh-out{width:100%;margin-top:6px;color:#d93025;font-weight:600}
.sh h3{margin:14px 0 4px;font-size:calc(16px * var(--mx-font-scale,1))}
.ch-log{display:flex;flex-direction:column;gap:8px;min-height:40vh;margin-bottom:10px}
.ch-b{max-width:88%;padding:10px 12px;border-radius:16px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.4;font-size:calc(16px * var(--mx-font-scale,1))}
.ch-me{align-self:flex-end;background:var(--sh-blue);color:#fff}
.ch-ai{align-self:flex-start;background:var(--sh-line);color:var(--sh-text)}
.ch-bar{display:flex;gap:8px;align-items:flex-end}
.ch-bar textarea{flex:1;min-width:0;padding:10px;border-radius:12px;border:1px solid var(--sh-line);background:var(--sh-card);color:var(--sh-text);font-size:calc(16px * var(--mx-font-scale,1));resize:vertical}
.ch-go{padding:12px 16px;border:0;border-radius:12px;background:var(--sh-blue);color:#fff;font-weight:700;font-size:calc(16px * var(--mx-font-scale,1))}
.ch-go:disabled{opacity:.5}
/* Light, Facebook-like look for the older parts of the site */
html.mx-light body{background:#f0f2f5!important;color:#050505!important;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif!important}
html.mx-light .topbar{background:#fff!important;border-bottom:1px solid #dadde1!important}
html.mx-light .topbar *{color:#050505!important}
html.mx-light .topbar .brand-mark{color:#fff!important}
html.mx-light #authCredits{color:#1877f2!important;border-color:#1877f2!important;background:#e7f3ff!important}
html.mx-light .orb{display:none!important}
html.mx-light .welcome-screen{background:#f0f2f5!important}
html.mx-light #loginPanel,html.mx-light #loginPanel *:not(button):not(input){color:#050505}
html.mx-light #loginPanel h1 span{color:#1877f2!important}
html.mx-light #loginPanel .intro,html.mx-light #loginPanel .fineprint{color:#65676b!important}
html.mx-light .entry-form{background:#fff!important;border:1px solid #dadde1!important}
html.mx-light #authSwap{color:#1877f2!important}
html.mx-light #authMsg{color:#65676b!important}
html.mx-light #authMsg[style*="154"]{color:#d93025!important}
html.mx-light input,html.mx-light textarea,html.mx-light select{background:#f0f2f5!important;color:#050505!important;border:1px solid #ccd0d5!important;border-radius:10px!important}
html.mx-light .primary{background:#1877f2!important;color:#fff!important}
html.mx-light .primary *{color:#fff!important}
html.mx-light #studio{color:#050505}
html.mx-light #studio .pane{background:#fff!important;border:1px solid #dadde1!important;box-shadow:0 1px 2px rgba(0,0,0,.1)!important}
html.mx-light #studio .pane *{color:#050505}
html.mx-light #studio .ai-generator{background:#fff!important;border-color:#dadde1!important}
html.mx-light #studio :is(.muted,.status,.ai-smallprint,.bottom-note,small){color:#65676b!important}
html.mx-light #studio .eyebrow{color:#1877f2!important}
html.mx-light #studio .primary,html.mx-light #studio .primary *{color:#fff!important}
html.mx-light #studio footer,html.mx-light #studio footer *{color:#65676b!important}
html.mx-light #hs{background:#fff!important;border-color:#dadde1!important}
html.mx-light #hs :is(.note,label.box,.consent,.status){color:#65676b!important}
html.mx-light #hs .status.err{color:#d93025!important}
html.mx-light #hs .pick{background:#f0f2f5!important;border-color:#bcc0c4!important}
html.mx-light #hs .pick span{color:#65676b!important}
html.mx-light #hs button{background:#1877f2!important;color:#fff!important}
html.mx-light #hs button:disabled{background:#e4e6eb!important;color:#8a8d91!important}
html.mx-light #hs .out button{background:#e4e6eb!important;color:#050505!important;border:0!important}
html.mx-light .mx,html.mx-light .mx h2,html.mx-light .mx strong,html.mx-light .mx-name,html.mx-light .mx-price{color:#050505!important}
html.mx-light .mx p,html.mx-light .mx .soft{color:#4b4c4f!important}
html.mx-light .mx-card{background:#fff!important;border-color:#dadde1!important}
html.mx-light .mx-badge{color:#65676b!important;border-color:#ccd0d5!important}
html.mx-light .mx-badge.ok{color:#0a7d33!important;border-color:#9bd7b2!important}
html.mx-light .mx-badge.hold{color:#9a6700!important;border-color:#e6c77a!important}
html.mx-light .mx-badge.no{color:#d93025!important;border-color:#f0a5a0!important}
html.mx-light #studio .ch-me,html.mx-light #studio .ch-me *{color:#fff!important}
html.mx-light #studio .ch-ai{background:#e4e6eb!important}
html.mx-light #studio .ch-go{background:#1877f2!important;color:#fff!important}
html.mx-light .mx-btn{background:#1877f2!important;color:#fff!important}
html.mx-light .mx-btn:disabled{background:#e4e6eb!important;color:#8a8d91!important}
#studio .sh-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
#studio .sh-tile{min-width:0;overflow-wrap:anywhere}
#studio .sh-row{min-width:0;flex-wrap:wrap}
#studio .sh-row button{min-width:0}
#studio .ch-log{min-height:0}
#studio .ch-bar{align-items:stretch}
#studio .ch-bar textarea{min-width:0}
/* Full-screen chat is moved to body so no studio/main transform can trap its scroll. */
#chatSection.mx-chat-fullscreen{
  position:fixed!important;inset:0!important;z-index:999!important;
  display:flex!important;flex-direction:column!important;
  width:100%!important;max-width:none!important;height:100vh!important;height:100dvh!important;
  min-height:0!important;margin:0!important;
  padding:calc(env(safe-area-inset-top,0px) + 10px) 14px calc(env(safe-area-inset-bottom,0px) + 10px)!important;
  border:0!important;border-radius:0!important;box-shadow:none!important;overflow:hidden!important;
  background:var(--sh-card,#fff)!important;color:var(--sh-text,#111)!important;
}
#chatSection.mx-chat-fullscreen>.sh{display:flex!important;flex:1 1 auto;flex-direction:column;min-width:0;min-height:0;height:100%;overflow:hidden}
#chatSection.mx-chat-fullscreen .mx-chat-head{display:flex;align-items:center;gap:10px;flex:0 0 auto;padding:4px 0 12px;border-bottom:1px solid var(--sh-line);margin-bottom:12px}
#chatSection.mx-chat-fullscreen .mx-chat-back{width:40px;height:40px;flex:0 0 40px;border:1px solid var(--sh-line);border-radius:50%;background:var(--sh-card);color:var(--sh-text);font-size:22px}
#chatSection.mx-chat-fullscreen .mx-chat-brand{min-width:0;flex:1}
#chatSection.mx-chat-fullscreen .mx-chat-brand strong{display:block;font-size:16px;color:var(--sh-text)}
#chatSection.mx-chat-fullscreen .mx-chat-brand small{display:block;font-size:11px;color:var(--sh-sub)}
#chatSection.mx-chat-fullscreen .mx-chat-log{display:flex!important;flex-direction:column!important;align-items:stretch!important;flex:1 1 0%;min-height:0!important;height:0;overflow-y:scroll!important;overflow-x:hidden!important;touch-action:pan-y;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:thin;margin:0;padding:4px 2px 16px;gap:10px}
#chatSection.mx-chat-fullscreen .ch-b{display:block;flex:0 0 auto;width:fit-content;max-width:min(88%,680px);white-space:pre-wrap;overflow-wrap:anywhere;box-sizing:border-box}
#chatSection.mx-chat-fullscreen .ch-me{align-self:flex-end!important;margin-left:auto!important;border-bottom-right-radius:5px}
#chatSection.mx-chat-fullscreen .ch-ai{align-self:flex-start!important;margin-right:auto!important;border-bottom-left-radius:5px}
#chatSection.mx-chat-fullscreen .ch-attachment{display:block;max-width:100%;margin-top:8px;border-radius:12px}
#chatSection.mx-chat-fullscreen .ch-attachment img{display:block;max-width:min(100%,320px);max-height:280px;object-fit:contain;border-radius:10px}
#chatSection.mx-chat-fullscreen .ch-attachment a{color:var(--sh-blue);overflow-wrap:anywhere}
#chatSection.mx-chat-fullscreen .ch-tools{display:flex;gap:4px;align-items:center}
#chatSection.mx-chat-fullscreen .ch-tool{width:44px;min-width:44px;height:48px;border:1px solid var(--sh-line);border-radius:50%;background:var(--sh-card);color:var(--sh-text);font-size:20px}
#chatSection.mx-chat-fullscreen .ch-pending{display:flex;align-items:center;gap:8px;flex:0 0 auto;padding:6px 10px;margin:4px 0;border:1px solid var(--sh-line);border-radius:12px;font-size:12px;color:var(--sh-sub)}
#chatSection.mx-chat-fullscreen .ch-pending button{border:0;background:none;color:var(--sh-blue);font-size:18px}
#chatSection.mx-chat-fullscreen .ch-bar{flex:0 0 auto;align-items:flex-end;padding:10px 0 2px;gap:8px;border-top:1px solid var(--sh-line);background:var(--sh-card)}
#chatSection.mx-chat-fullscreen .ch-bar textarea{resize:none;max-height:25dvh;min-height:48px;border-radius:24px;padding:13px 16px}
#chatSection.mx-chat-fullscreen .ch-go{min-height:48px;min-width:54px;border-radius:24px;padding:10px 14px}
#chatSection.mx-chat-fullscreen .mx-chat-note{flex:0 0 auto;margin:7px 0 0;text-align:center;font-size:10px;line-height:1.35}
#chatSection.mx-chat-fullscreen .mx-chat-welcome{flex:1 0 auto;min-height:min-content;display:flex;flex-direction:column;justify-content:center;gap:14px;padding:8px 0 18px}
#chatSection.mx-chat-fullscreen .mx-chat-welcome[hidden],#chatSection.mx-chat-fullscreen .mx-chat-log[hidden]{display:none!important}
#chatSection.mx-chat-fullscreen .mx-chat-welcome h2{font-size:clamp(25px,6vw,34px);line-height:1.12;letter-spacing:-.04em;margin:0;color:var(--sh-text);border:0;padding:0}
#chatSection.mx-chat-fullscreen .mx-chat-welcome p{font-size:13px;line-height:1.5;margin:0;color:var(--sh-sub)}
#chatSection.mx-chat-fullscreen .mx-chat-prompts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:4px}
#chatSection.mx-chat-fullscreen .mx-chat-prompt{min-width:0;min-height:124px;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:10px;text-align:left;padding:12px;border:1px solid var(--sh-line);border-radius:17px;background:var(--sh-card);color:var(--sh-text);overflow:hidden}
#chatSection.mx-chat-fullscreen .mx-chat-art{width:100%;height:62px;display:flex;align-items:center;justify-content:center;border-radius:12px;font-size:34px;line-height:1}
#chatSection.mx-chat-fullscreen .mx-chat-art.video{background:linear-gradient(135deg,#d9e7ff,#9dbbff)}
#chatSection.mx-chat-fullscreen .mx-chat-art.gift{background:linear-gradient(135deg,#ffe1ee,#ffb5d0)}
#chatSection.mx-chat-fullscreen .mx-chat-art.pay{background:linear-gradient(135deg,#d7f8e8,#8eddbc)}
#chatSection.mx-chat-fullscreen .mx-chat-art.tools{background:linear-gradient(135deg,#e8e0ff,#bdb0ff)}
#chatSection.mx-chat-fullscreen .mx-chat-prompt strong{font-size:12px;line-height:1.3}
#chatSection.mx-chat-fullscreen .mx-chat-prompt small{font-size:10px;color:var(--sh-sub);line-height:1.35}
body.mx-chat-open{overflow:hidden!important;overscroll-behavior:none}
body.mx-chat-open #mxBar,body.mx-chat-open>.topbar{display:none!important}
@media(min-width:700px){
 #chatSection.mx-chat-fullscreen{padding:16px max(20px,calc((100vw - 820px)/2)) 14px!important}
 #chatSection.mx-chat-fullscreen .mx-chat-prompts{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(min-width:700px){#studio #chatSection.mx-chat-fullscreen{padding:20px max(20px,calc((100vw - 900px)/2)) 18px!important}}
#mxBar{padding-bottom:env(safe-area-inset-bottom,0px)}
@media(min-width:700px){#studio .sh-grid{grid-template-columns:repeat(3,minmax(0,1fr))}#mxBar{left:50%;right:auto;bottom:14px;transform:translateX(-50%);width:min(720px,calc(100% - 48px));border:1px solid var(--sh-line);border-radius:18px;box-shadow:0 8px 32px #0002;overflow:hidden}}
@media(min-width:1100px){#studio .sh-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:360px){#studio .sh-grid{grid-template-columns:minmax(0,1fr);gap:8px}#studio .sh-tile{padding:12px;font-size:calc(15px * var(--mx-font-scale,1))}}@media(min-width:361px) and (max-width:420px){#studio .sh-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}#studio .sh-tile{padding:11px;font-size:calc(14px * var(--mx-font-scale,1))}}@media(max-width:420px){#mxBar button{font-size:calc(11px * var(--mx-font-scale,1));padding:7px 1px 6px}#mxBar button span{font-size:20px}}
`;

// id, icon, label, note
const ITEMS = [
  ["videoSection", "🎬", "Photo to video", ""],
  ["headswapSection", "🪄", "HeadSwap", ""],
  ["chatSection", "💬", "AI chat", ""],
  ["voiceCloneSection", "🗣️", "Voice clone", "soon"],
  ["voiceSection", "🎙️", "Voice studio", ""],
  ["cameraSection", "📷", "Camera studio", ""],
  ["creditSection", "🪙", "Buy credit", "soon"],
  ["socialsSection", "🛍️", "MuskySocials", "for sale"],
  ["aboutSection", "ℹ️", "About us", ""],
  ["contactSection", "📞", "Contact us", ""],
  ["privacySection", "🔒", "Privacy", ""],
];

const studio = document.querySelector("#studio");
if (studio) init();

function init() {
  const st = document.createElement("style");
  st.textContent = CSS;
  document.head.appendChild(st);
  apply();

  let credits = null;
  const footer = studio.querySelector(":scope > footer");
  const mk = (id, html) => {
    const s = document.createElement("section");
    s.id = id;
    s.className = "pane";
    s.hidden = true;
    s.innerHTML = '<div class="sh">' + html + "</div>";
    studio.insertBefore(s, footer);
    return s;
  };
  const tile = ([id, ico, label, note]) =>
    '<button class="sh-tile" data-go="' + id + '"><span class="ico">' + ico + "</span>" + label +
    (note ? "<small>" + note + "</small>" : "") + "</button>";

  const home = mk("homeSection", "");
  mk("feedSection", "<h2>Feed</h2><p>News, offers and updates from MuskySocials will appear here.</p>");
  mk("shopSection", "<h2>Gift shop</h2><p>Gifts for the people you care about will appear here soon.</p>");
  const CHAT_FN = "rapid-function"; // name of the Supabase function that runs the chat
  const chat = mk("chatSection",
    "<div class='mx-chat-head'><button type='button' class='mx-chat-back' id='chBack' aria-label='Back to tools'>‹</button><div class='mx-chat-brand'><strong>Musky Assistant</strong><small>Ask, create, and get help</small></div><span aria-hidden='true'>✦</span></div>" +
    "<div class='mx-chat-welcome' id='chWelcome'><h2>What can I help you with?</h2><p>Choose a topic to get started, or type your own question below.</p>" +
    "<div class='mx-chat-prompts'>" +
    "<button type='button' class='mx-chat-prompt' data-prompt='Help me turn a photo into a video. Explain how to use Photo to Video on MuskySocials.'><span class='mx-chat-art video' aria-hidden='true'>🎬</span><strong>Photo to video</strong><small>Make a photo move</small></button>" +
    "<button type='button' class='mx-chat-prompt' data-prompt='Help me understand how gifts work on MuskySocials and how to send or receive one.'><span class='mx-chat-art gift' aria-hidden='true'>🎁</span><strong>Gifts</strong><small>Sending and receiving gifts</small></button>" +
    "<button type='button' class='mx-chat-prompt' data-prompt='Explain payments, coins, and credits on MuskySocials. Tell me where to check my balance.'><span class='mx-chat-art pay' aria-hidden='true'>🪙</span><strong>Payments & coins</strong><small>Credits, balance, and payments</small></button>" +
    "<button type='button' class='mx-chat-prompt' data-prompt='Show me which MuskySocials tools I can use and how to get started with them.'><span class='mx-chat-art tools' aria-hidden='true'>✨</span><strong>Explore tools</strong><small>Find the right AI tool</small></button>" +
    "</div></div>" +
    "<div class='mx-chat-log' id='chLog' hidden></div>" +
    "<div id='chPending' class='ch-pending' hidden></div><div class='ch-bar'><div class='ch-tools'><button type='button' class='ch-tool' id='chAttach' aria-label='Attach photo or document'>＋</button><input id='chFile' type='file' accept='image/*,audio/*,.pdf,.txt' hidden><button type='button' class='ch-tool' id='chVoice' aria-label='Voice input'>🎙</button></div><textarea id='chIn' rows='1' maxlength='1000' placeholder='Message Musky Assistant…' aria-label='Message Musky Assistant'></textarea>" +
    "<button class='ch-go' id='chGo' aria-label='Send message'>↑</button></div><small class='mx-chat-note'>AI can make mistakes. Never share passwords or private information.</small>");
  document.body.appendChild(chat);
  let hist = [];
  let pendingFile = null;
  let loadingHistory = false;
  let recognition = null;
  const chLog = chat.querySelector("#chLog");
  const chWelcome = chat.querySelector("#chWelcome");
  const chIn = chat.querySelector("#chIn");
  const chGo = chat.querySelector("#chGo");
  const chFile = chat.querySelector("#chFile");
  const chPending = chat.querySelector("#chPending");
  const chVoice = chat.querySelector("#chVoice");
  function updatePending() {
    chPending.hidden = !pendingFile;
    chPending.replaceChildren();
    if (!pendingFile) return;
    const label = document.createElement("span");
    label.textContent = (pendingFile.type.startsWith("image/") ? "Photo: " : pendingFile.type.startsWith("audio/") ? "Voice note: " : "Document: ") + pendingFile.name + " (" + Math.ceil(pendingFile.size/1024) + " KB)";
    const remove = document.createElement("button");
    remove.type = "button"; remove.textContent = "×"; remove.setAttribute("aria-label","Remove attachment");
    remove.addEventListener("click", () => { pendingFile = null; updatePending(); });
    chPending.append(label, remove);
  }
  const bubble = (role, text, attachment) => {
    chWelcome.hidden = true; chLog.hidden = false;
    const d = document.createElement("div");
    d.className = "ch-b " + (role === "user" ? "ch-me" : "ch-ai");
    const t = document.createElement("div"); t.textContent = text || ""; d.appendChild(t);
    if (attachment && attachment.attachment_path) {
      const wrap = document.createElement("div"); wrap.className = "ch-attachment"; d.appendChild(wrap);
      const M = window.musky;
      Promise.resolve(M && M.sb.storage.from("assistant-attachments").createSignedUrl(attachment.attachment_path, 3600)).then(({data,error}) => {
        if (error || !data?.signedUrl) return;
        if (String(attachment.attachment_type || "").startsWith("image/")) {
          const img = document.createElement("img"); img.src=data.signedUrl; img.alt=attachment.attachment_name || "Attached photo"; wrap.appendChild(img);
        } else if (String(attachment.attachment_type || "").startsWith("audio/")) {
          const audio=document.createElement("audio"); audio.controls=true; audio.src=data.signedUrl; wrap.appendChild(audio);
        } else {
          const link=document.createElement("a"); link.href=data.signedUrl; link.target="_blank"; link.rel="noopener"; link.textContent="Open " + (attachment.attachment_name || "attachment"); wrap.appendChild(link);
        }
      }).catch(()=>{});
    }
    chLog.appendChild(d); chLog.scrollTop = chLog.scrollHeight; return d;
  };
  async function loadHistory() {
    if (loadingHistory) return;
    const M = window.musky; if (!M) return;
    loadingHistory = true;
    try {
      const session = await M.session(); if (!session?.user?.id) return;
      const {data,error} = await M.sb.from("assistant_messages").select("id,role,content,attachment_path,attachment_name,attachment_type,attachment_size,created_at").eq("user_id",session.user.id).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(200);
      if (error) throw error;
      const rows=(data || []).slice().reverse();
      chLog.replaceChildren(); hist = [];
      rows.forEach((row) => { bubble(row.role,row.content,row.attachment_path ? row : null); hist.push({role:row.role,content:row.content}); });
      hist = hist.slice(-12);
      chWelcome.hidden = rows.length > 0; chLog.hidden = rows.length === 0;
    } catch (e) { console.warn("Could not load assistant history", e); }
    finally { loadingHistory = false; }
  }
  async function saveMessage(role, content, attachment) {
    const M=window.musky; const session=M && await M.session(); if (!session?.user?.id) return null;
    const row={user_id:session.user.id,role,content:content || ""};
    if (attachment) { row.attachment_path=attachment.path; row.attachment_name=attachment.name; row.attachment_type=attachment.type; row.attachment_size=attachment.size; }
    const {data,error}=await M.sb.from("assistant_messages").insert(row).select("id,role,content,attachment_path,attachment_name,attachment_type,attachment_size,created_at").single();
    if (error) { console.warn("Could not save assistant history",error); return null; }
    return data;
  }
  async function uploadPending(M, userId) {
    if (!pendingFile) return null;
    const file=pendingFile;
    if (file.size > 8*1024*1024) throw new Error("Attachments must be 8 MB or smaller for AI processing.");
    const allowed=["image/jpeg","image/png","image/webp","image/gif","application/pdf","text/plain","audio/webm","audio/ogg","audio/mp4","audio/mpeg","audio/wav"];
    if (!allowed.includes(file.type)) throw new Error("Choose a photo, voice recording, PDF or TXT document.");
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-90) || "attachment";
    const path=userId+"/"+crypto.randomUUID()+"_"+safe;
    const {error}=await M.sb.storage.from("assistant-attachments").upload(path,file,{contentType:file.type,upsert:false});
    if(error) throw new Error("Could not upload attachment: "+error.message);
    return {path,name:file.name,type:file.type,size:file.size};
  }
  async function sendChat() {
    const text = chIn.value.trim(); if (!text && !pendingFile) return;
    const M=window.musky; const session=M && await M.session();
    if (!session?.user?.id) { bubble("assistant","Please sign in to use the chat."); return; }
    chGo.disabled=true; chVoice.disabled=true;
    let attachment=null; let content=text;
    try {
      if (pendingFile) { attachment=await uploadPending(M,session.user.id); pendingFile=null; updatePending(); }
      if (!content && attachment) content=attachment.type.startsWith("image/") ? "Please look at the attached photo and help me understand it." : attachment.type.startsWith("audio/") ? "Please transcribe and respond to the attached voice note." : "Please read and help me with the attached document.";
      await saveMessage("user",content,attachment);
      bubble("user",content,attachment ? {attachment_path:attachment.path,attachment_name:attachment.name,attachment_type:attachment.type} : null);
      chIn.value=""; hist.push({role:"user",content});
      const wait=bubble("assistant","Thinking…");
      const body={messages:hist.slice(-12)};
      if(attachment){body.attachmentPath=attachment.path;body.attachmentType=attachment.type;body.attachmentName=attachment.name;}
      const {data,error}=await M.sb.functions.invoke(CHAT_FN,{body});
      if(error){let msg="AI chat is not ready yet. Try again later.";try{const j=await error.context.json();msg=j.error||msg;if(typeof j.credits==="number")M.setBadge(j.credits);}catch{}wait.firstChild.textContent=msg;hist.pop();}
      else{wait.firstChild.textContent=data.reply;hist.push({role:"assistant",content:data.reply});await saveMessage("assistant",data.reply,null);if(typeof data.credits==="number")M.setBadge(data.credits);}
    } catch(e) { bubble("assistant",e?.message || "Could not send your message. Check your internet and try again."); }
    finally { chGo.disabled=false;chVoice.disabled=false;chLog.scrollTop=chLog.scrollHeight; }
  }
  chGo.addEventListener("click",sendChat);
  chat.querySelector("#chAttach").addEventListener("click",()=>chFile.click());
  chFile.addEventListener("change",()=>{pendingFile=chFile.files?.[0]||null;chFile.value="";updatePending();});
  let recorder=null, recordingChunks=[];
  chVoice.addEventListener("click",async()=>{
    if(recorder && recorder.state==="recording"){recorder.stop();return;}
    if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){bubble("assistant","Voice recording is not supported by this browser. Please attach an audio file or type your message.");return;}
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mime=["audio/webm;codecs=opus","audio/webm","audio/mp4"].find((t)=>MediaRecorder.isTypeSupported(t));
      recorder=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);
      recordingChunks=[];
      recorder.ondataavailable=(e)=>{if(e.data&&e.data.size)recordingChunks.push(e.data);};
      recorder.onstop=()=>{
        stream.getTracks().forEach((track)=>track.stop());
        const blob=new Blob(recordingChunks,{type:recorder.mimeType||"audio/webm"});
        const ext=blob.type.includes("mp4")?"m4a":blob.type.includes("ogg")?"ogg":"webm";
        if(blob.size){pendingFile=new File([blob],"voice-note-"+Date.now()+"."+ext,{type:(blob.type||"audio/webm").split(";")[0]});updatePending();}
        recorder=null;chVoice.textContent="🎙";chVoice.setAttribute("aria-label","Record voice note");
      };
      recorder.start();chVoice.textContent="■";chVoice.setAttribute("aria-label","Stop voice note");
    }catch(e){bubble("assistant","Microphone access was not available. Allow microphone permission and try again.");chVoice.textContent="🎙";}
  });
  chIn.addEventListener("keydown",(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}});

  chat.querySelector("#chBack").addEventListener("click", () => go("toolsHubSection"));
  loadHistory();
  chat.querySelectorAll("[data-prompt]").forEach((card) => {
    card.addEventListener("click", () => {
      chIn.value = card.dataset.prompt || "";
      chIn.focus();
      sendChat();
    });
  });

  const settings = mk("settingsSection",
    "<h2>Settings</h2><h3>Account</h3><p id='shEmail'>Signed in</p><p id='shCred'></p>" +
    "<h3>Appearance</h3><div class='sh-row' id='shTheme'><button data-theme='light'>Light</button><button data-theme='dark'>Dark</button></div>" +
    "<h3>Text size</h3><div class='sh-row' id='shSize'><button data-size='1'>Normal</button><button data-size='1.1'>Comfortable</button><button data-size='1.2'>Large</button></div>" +
    "<button class='sh-out' id='shOut'>Sign out</button>");

  const name = () => (document.querySelector("#welcomeName") || {}).textContent || "creator";
  function renderHome() {
    if (window.shell && typeof window.shell.homeRenderer === "function") { window.shell.homeRenderer(home, { name: name(), credits }); return; }
    home.innerHTML = '<div class="sh"><h2>Hello, ' + name().replace(/</g, "&lt;") + " 👋</h2>" +
      '<div class="sh-bal"><div><small>Your credits</small><strong>' + (credits === null ? "…" : credits) +
      "</strong></div><small>Refills to 80 every day</small></div>" +
      '<div class="sh-grid">' + ITEMS.map(tile).join("") + "</div></div>";
  }
  function renderSettings() {
    settings.querySelector("#shCred").textContent = "Credits: " + (credits === null ? "…" : credits);
    settings.querySelectorAll("#shTheme button").forEach((b) => b.classList.toggle("on", b.dataset.theme === S.theme));
    settings.querySelectorAll("#shSize button").forEach((b) => b.classList.toggle("on", +b.dataset.size === S.size));
  }

  // Bottom bar
  const bar = document.createElement("nav");
  bar.id = "mxBar";
  bar.innerHTML = [["homeSection", "🏠", "Home"], ["exploreSection", "🧭", "Explore"], ["jobsSection", "💼", "Jobs"], ["toolsHubSection", "✨", "Tools"], ["profileSection", "👤", "Profile"]]
    .map(([id, i, l]) => '<button data-go="' + id + '"><span>' + i + "</span>" + l + "</button>").join("");
  document.body.appendChild(bar);

  // Global in-app back navigation: remember section transitions and provide Home as fallback.
  const backNav = document.createElement("div");
  backNav.id = "mxBackNav";
  backNav.innerHTML = '<button type="button" id="mxBackButton" aria-label="Go back to the previous screen"><span class="mx-back-arrow" aria-hidden="true">←</span><span>Go back</span></button>';
  studio.insertBefore(backNav, studio.querySelector(".pane") || footer);
  const backButton = backNav.querySelector("#mxBackButton");
  let currentPaneId = null;
  const navigationStack = [];
  function updateBackButton() {
    const isHome = currentPaneId === "homeSection";
    backNav.style.display = (!studio.hidden && currentPaneId && !isHome) ? "flex" : "none";
  }
  function goBack() {
    let previous = navigationStack.pop();
    while (previous && !document.getElementById(previous)) previous = navigationStack.pop();
    if (!previous || previous === currentPaneId) previous = "homeSection";
    go(previous, { fromBack: true });
  }
  backButton.addEventListener("click", goBack);

  function go(id, options = {}) {
    if (!document.getElementById(id)) return;
    if (currentPaneId && currentPaneId !== id) {
      if (!options.fromBack && id !== "homeSection") {
        navigationStack.push(currentPaneId);
        if (navigationStack.length > 30) navigationStack.shift();
      } else if (id === "homeSection" && !options.fromBack) {
        navigationStack.length = 0;
      }
    }
    currentPaneId = id;
    updateBackButton();
    if (id === "homeSection") renderHome();
    if (id === "settingsSection") renderSettings();
    studio.querySelectorAll(".pane").forEach((p) => {
      const hide = p.id !== id;
      if (p.hidden !== hide) p.hidden = hide;
    });
    chat.hidden = id !== "chatSection";
    const GROUPS = {
      exploreSection: ["exploreSection", "datingSection", "designSection", "aitoolsSection", "librarySection", "shopSection", "socialsSection", "askazaSection", "aboutSection", "contactSection", "privacySection", "docsSection"],
      jobsSection: ["jobsSection"],
      toolsHubSection: ["toolsHubSection", "videoSection", "headswapSection", "chatSection", "voiceCloneSection", "voiceSection", "cameraSection", "viralBoostSection", "creditSection"],
      profileSection: ["profileSection", "settingsSection", "adminSection", "membershipSection"],
    };
    chat.classList.toggle("mx-chat-fullscreen", id === "chatSection");
    if (id === "chatSection") loadHistory();
    document.body.classList.toggle("mx-chat-open", id === "chatSection");
    const active = Object.keys(GROUPS).find((k) => GROUPS[k].includes(id)) || "homeSection";
    bar.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.go === active));
    window.scrollTo({ top: 0 });
  }

  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-go]");
    if (g) go(g.dataset.go);
  });
  settings.addEventListener("click", (e) => {
    const t = e.target.closest("[data-theme]");
    const z = e.target.closest("[data-size]");
    if (t) S.theme = t.dataset.theme;
    if (z) S.size = +z.dataset.size;
    if (t || z) { save(); apply(); renderSettings(); }
  });
  settings.querySelector("#shOut").addEventListener("click", async () => {
    try { await window.musky.sb.auth.signOut(); } catch {}
    location.reload();
  });
  window.addEventListener("musky-credits", (e) => {
    credits = e.detail;
    renderSettings();
    if (!home.hidden) renderHome();
  });
  Promise.resolve(window.musky && window.musky.session()).then((s) => {
    if (s) settings.querySelector("#shEmail").textContent = s.user.email;
  }).catch(() => {});

  // Show the bar and Home once the studio is visible; keep the old home pane hidden.
  const old = document.querySelector("#toolsSection");
  let started = false;
  function sync() {
    const open = !studio.hidden;
    bar.style.display = open ? "flex" : "none";
    updateBackButton();
    // Add space for the fixed bar only when real content already needs scrolling.
    // Short/empty sections therefore do not create a blank scroll area.
    document.body.classList.remove("mx-app-open");
    const needsBottomSpace = open && document.documentElement.scrollHeight > window.innerHeight;
    document.body.classList.toggle("mx-app-open", needsBottomSpace);
    if (open && !started) { started = true; go("homeSection"); }
    if (open && old && !old.hidden) {
      old.hidden = true;
      if (![...studio.querySelectorAll(".pane")].some((p) => !p.hidden)) go("homeSection");
    }
  }
  new MutationObserver(sync).observe(studio, { subtree: true, childList: true, attributes: true, attributeFilter: ["hidden"] });
  window.addEventListener("resize", sync, { passive: true });
  sync();

  // Lets other scripts (portal.js, feed.js, shop.js) add Home tiles and bottom-bar buttons.
  window.shell = {
    go,
    renderHome,
    addItem(item) {
      if (!ITEMS.some((i) => i[0] === item[0])) { ITEMS.push(item); if (!home.hidden) renderHome(); }
    },
    isAdmin: false,
    homeRenderer: null,
    addBar(id, ico, label) {
      if (id === "adminSection") {
        window.shell.isAdmin = true;
        window.dispatchEvent(new CustomEvent("musky-admin", { detail: true }));
        return;
      }
      if (bar.querySelector('[data-go="' + id + '"]')) return;
      const b = document.createElement("button");
      b.dataset.go = id;
      b.innerHTML = "<span>" + ico + "</span>" + label;
      bar.appendChild(b);
    },
    removeBar(id) {
      if (id === "adminSection") {
        if (window.shell.isAdmin) { window.shell.isAdmin = false; window.dispatchEvent(new CustomEvent("musky-admin", { detail: false })); }
        return;
      }
      const b = bar.querySelector('[data-go="' + id + '"]');
      if (b) b.remove();
    },
  };
}
