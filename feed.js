// MuskySocials Feed v1. You post in the Admin studio; everyone reads it in the Feed tab.
// Loaded automatically by portal.js. Needs the "posts" table from the Supabase setup.
const WA = "2349041259863";
const wait = (test, ms = 15000) =>
  new Promise((res) => {
    const t0 = Date.now();
    (function tick() {
      const v = test();
      if (v || Date.now() - t0 > ms) res(v);
      else setTimeout(tick, 150);
    })();
  });

const ready = await wait(() => window.portal && document.querySelector("#feedSection .sh") && document.querySelector("#adminSection .pt #adStats"));
if (ready) start();

function start() {
  const { sb, esc, onShow } = window.portal;
  const feed = document.querySelector("#feedSection");
  const admin = document.querySelector("#adminSection");
  const wa = (t) => "https://wa.me/" + WA + "?text=" + encodeURIComponent(t);

  const st = document.createElement("style");
  st.textContent = `
.fd-date{font-size:12px;color:var(--sh-sub,#65676b)}
.fd-pin{font-size:12px;font-weight:700;color:var(--sh-blue,#1877f2)}
.fd-body{white-space:pre-wrap;line-height:1.45;margin:8px 0}
html.mx-light #studio .fd-date{color:#65676b!important}
html.mx-light #studio .fd-pin{color:#1877f2!important}
`;
  document.head.appendChild(st);

  // ---------- Feed screen (everyone)
  feed.querySelector(".sh").innerHTML = "<h2>Feed</h2><div id='fdList'>Loading…</div>";
  const list = feed.querySelector("#fdList");
  const when = (d) => new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

  async function loadFeed() {
    const { data, error } = await sb.from("posts").select("*")
      .order("pinned", { ascending: false }).order("created_at", { ascending: false });
    if (error) { list.textContent = "Could not load the feed. Sign in and try again."; return; }
    if (!data.length) { list.innerHTML = "<p>No posts yet. Check back soon.</p>"; return; }
    list.innerHTML = data.map((p) =>
      '<div class="pt-card">' + (p.pinned ? '<div class="fd-pin">📌 Pinned</div>' : "") +
      "<strong>" + esc(p.title) + "</strong>" +
      (p.body ? '<div class="fd-body">' + esc(p.body) + "</div>" : "") +
      '<div class="fd-date">' + when(p.created_at) + "</div>" +
      (p.cta !== "none"
        ? '<div style="margin-top:10px"><button class="pt-btn" data-cta="' + p.cta + '" data-title="' + esc(p.title) + '">' +
          (p.cta === "buy" ? "Buy" : "Contact us") + "</button></div>"
        : "") + "</div>").join("");
  }
  feed.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cta]");
    if (!b) return;
    const t = b.dataset.title;
    const msg = b.dataset.cta === "buy"
      ? "Hello MuskySocials, I saw your post \"" + t + "\" and I want to buy."
      : "Hello MuskySocials, I saw your post \"" + t + "\" and I have a question.";
    window.open(wa(msg), "_blank", "noopener");
  });
  onShow(feed, loadFeed);

  // ---------- Admin: post to feed
  admin.querySelector("#adStats").insertAdjacentHTML("afterend",
    "<div class='pt-card'><strong>Post to feed</strong>" +
    "<input id='fpTitle' class='pt-in' maxlength='120' placeholder='Title'>" +
    "<textarea id='fpBody' class='pt-in' rows='4' maxlength='2000' placeholder='What do you want to tell people?'></textarea>" +
    "<select id='fpCta' class='pt-in'><option value='none'>No button</option><option value='buy'>Buy button</option><option value='contact'>Contact us button</option></select>" +
    "<label style='display:flex;gap:8px;align-items:center;margin:6px 0'><input id='fpPin' type='checkbox'> Pin to the top</label>" +
    "<button class='pt-btn' id='fpGo'>Post</button><p class='pt-msg' id='fpMsg'></p>" +
    "<strong>Your posts</strong><div id='fpList'></div></div>");
  const $ = (id) => admin.querySelector("#" + id);
  const say = (t) => { $("fpMsg").textContent = t; };

  async function loadPosts() {
    const { data, error } = await sb.from("posts").select("id,title,pinned,created_at")
      .order("pinned", { ascending: false }).order("created_at", { ascending: false });
    if (error) { $("fpList").textContent = "Admin access needed."; return; }
    $("fpList").innerHTML = data.length ? data.map((p) =>
      '<div class="pt-row"><span>' + (p.pinned ? "📌 " : "") + esc(p.title) + '</span><span>' +
      '<button class="pt-btn" data-pin="' + p.id + '" data-on="' + (p.pinned ? "1" : "0") + '">' + (p.pinned ? "Unpin" : "Pin") + "</button> " +
      '<button class="pt-btn del" data-delpost="' + p.id + '">Delete</button></span></div>').join("")
      : "<p>No posts yet.</p>";
  }
  onShow(admin, loadPosts);

  $("fpGo").addEventListener("click", async () => {
    const title = $("fpTitle").value.trim();
    if (!title) return say("Type a title first.");
    const btn = $("fpGo");
    btn.disabled = true;
    const { error } = await sb.from("posts").insert({
      title, body: $("fpBody").value.trim() || null, cta: $("fpCta").value, pinned: $("fpPin").checked,
    });
    btn.disabled = false;
    if (error) return say("Could not post: " + error.message);
    $("fpTitle").value = "";
    $("fpBody").value = "";
    $("fpPin").checked = false;
    $("fpCta").value = "none";
    say("Posted. Everyone can see it in the Feed.");
    loadPosts();
  });

  $("fpList").addEventListener("click", async (e) => {
    const pin = e.target.closest("[data-pin]");
    if (pin) {
      const { error } = await sb.from("posts").update({ pinned: pin.dataset.on !== "1" }).eq("id", pin.dataset.pin);
      if (error) say("Could not change the pin: " + error.message);
      return loadPosts();
    }
    const del = e.target.closest("[data-delpost]");
    if (del && confirm("Delete this post?")) {
      const { error } = await sb.from("posts").delete().eq("id", del.dataset.delpost);
      say(error ? "Could not delete: " + error.message : "Post deleted.");
      loadPosts();
    }
  });
}
