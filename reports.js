// MuskySocials reports v1: anyone signed in can report a job, a dating listing or a comment;
// you review the reports in Admin. Loaded by portal.js (listed in modules.json).
const q = (s) => document.querySelector(s);
const wait = (test, ms = 15000) =>
  new Promise((res) => {
    const t0 = Date.now();
    (function tick() {
      const v = test();
      if (v || Date.now() - t0 > ms) res(v);
      else setTimeout(tick, 150);
    })();
  });

const ready = await wait(() => window.portal && q("#adminSection .pt #adStats"));
if (ready) start();

function start() {
  const { sb, esc, onShow } = window.portal;

  // Used by the Jobs and Dating screens: window.portal.report("job", id, title)
  window.portal.report = async (kind, id, title) => {
    const reason = prompt("Tell us what is wrong with this listing (3 to 500 characters):");
    if (!reason || reason.trim().length < 3) return;
    const { error } = await sb.from("reports").insert({
      kind, item_id: String(id).slice(0, 60), item_title: String(title || "").slice(0, 150), reason: reason.trim().slice(0, 500),
    });
    alert(error ? "Could not send the report. Please try again." : "Thank you. Your report was sent to the MuskySocials team.");
  };

  q("#adminSection #adStats").insertAdjacentHTML("afterend",
    "<div class='pt-card'><strong>Reports</strong><p class='pt-msg'>Reports sent by members about jobs, dating listings and comments.</p>" +
    "<button class='pt-btn' id='rpRefresh'>Refresh</button><p class='pt-msg' id='rpMsg'></p><div id='rpList'></div></div>");
  const admin = q("#adminSection");
  const $ = (id) => admin.querySelector("#" + id);
  const say = (t) => { $("rpMsg").textContent = t; };
  let rows = [];

  async function load() {
    const { data, error } = await sb.from("reports").select("*").order("status", { ascending: false }).order("created_at", { ascending: false }).limit(100);
    if (error) { $("rpList").textContent = "Run the reports database step first, or admin access is needed."; return; }
    rows = data;
    $("rpList").innerHTML = rows.length ? rows.map((r) =>
      '<div class="pt-row" style="align-items:flex-start"><span>' + (r.status === "open" ? "🚩 " : "✅ ") + "<b>" + esc(r.kind) + "</b>: " + esc(r.item_title || r.item_id) +
      "<br><small>" + esc(r.reason) + "<br>" + new Date(r.created_at).toLocaleDateString("en-NG") + '</small></span><span>' +
      (r.status === "open" ? '<button class="pt-btn" data-res="' + r.id + '">Resolve</button> ' : "") +
      (r.kind !== "other" ? '<button class="pt-btn" data-hide="' + r.id + '">' + (r.kind === "comment" ? "Delete item" : "Hide item") + "</button> " : "") +
      '<button class="pt-btn del" data-del="' + r.id + '">Remove</button></span></div>').join("")
      : "<p>No reports.</p>";
  }
  onShow(admin, load);
  $("rpRefresh").addEventListener("click", load);

  $("rpList").addEventListener("click", async (e) => {
    const res = e.target.closest("[data-res]");
    if (res) {
      const { error } = await sb.from("reports").update({ status: "resolved" }).eq("id", res.dataset.res);
      say(error ? "Could not update: " + error.message : "Marked as resolved.");
      return load();
    }
    const hide = e.target.closest("[data-hide]");
    if (hide) {
      const r = rows.find((x) => x.id === hide.dataset.hide);
      if (!r || !confirm((r.kind === "comment" ? "Delete" : "Hide") + " this item for everyone?")) return;
      let error = null;
      if (r.kind === "job") ({ error } = await sb.from("jobs").update({ active: false }).eq("id", r.item_id));
      else if (r.kind === "dating") ({ error } = await sb.from("dating_sites").update({ active: false }).eq("id", r.item_id));
      else if (r.kind === "comment") ({ error } = await sb.from("post_comments").delete().eq("id", r.item_id));
      if (!error) await sb.from("reports").update({ status: "resolved" }).eq("id", r.id);
      say(error ? "Could not change the item: " + error.message : "Done, and the report is resolved.");
      return load();
    }
    const del = e.target.closest("[data-del]");
    if (del && confirm("Remove this report?")) {
      const { error } = await sb.from("reports").delete().eq("id", del.dataset.del);
      say(error ? "Could not remove: " + error.message : "Report removed.");
      load();
    }
  });
}
