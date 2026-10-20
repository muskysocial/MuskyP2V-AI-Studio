// MuskySocials floating bubbles v1: soft light-blue balls drifting up the screen.
// Loaded automatically by portal.js. Has an On/Off switch in Settings.
const KEY = "musky-bubbles";
const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const write = (v) => { try { localStorage.setItem(KEY, v); } catch {} };
let on = (read() || (reduce ? "off" : "on")) === "on";

const css = document.createElement("style");
css.textContent = `
#mxBubbles{position:fixed;inset:0;z-index:40;pointer-events:none;overflow:hidden}
#mxBubbles i{position:absolute;bottom:-120px;border-radius:50%;opacity:.55;will-change:transform;
 background:radial-gradient(circle at 30% 28%,rgba(255,255,255,.9),rgba(150,210,255,.45) 45%,rgba(90,170,255,.18) 100%);
 border:1px solid rgba(255,255,255,.55);box-shadow:0 0 14px rgba(120,190,255,.35);
 animation:mxFloat linear infinite}
@keyframes mxFloat{
 0%{transform:translate3d(0,0,0)}
 50%{transform:translate3d(var(--dx),-55vh,0)}
 100%{transform:translate3d(calc(var(--dx) * -1),-125vh,0)}}
`;
document.head.appendChild(css);

const box = document.createElement("div");
box.id = "mxBubbles";
box.setAttribute("aria-hidden", "true");
const COUNT = 16;
for (let i = 0; i < COUNT; i++) {
  const b = document.createElement("i");
  const size = 22 + Math.random() * 70;
  b.style.cssText =
    "left:" + Math.random() * 100 + "%;width:" + size + "px;height:" + size + "px;" +
    "--dx:" + (Math.random() * 90 - 45) + "px;" +
    "animation-duration:" + (16 + Math.random() * 20) + "s;" +
    "animation-delay:-" + Math.random() * 30 + "s;";
  box.appendChild(b);
}
document.documentElement.appendChild(box);
const apply = () => { box.style.display = on ? "" : "none"; };
apply();

// On/Off switch inside Settings
(function addSwitch(tries = 0) {
  const pane = document.querySelector("#settingsSection .sh");
  if (!pane) return tries < 60 ? setTimeout(() => addSwitch(tries + 1), 250) : undefined;
  pane.insertAdjacentHTML("beforeend",
    "<h3>Floating bubbles</h3><div class='sh-row' id='shBub'><button data-bub='on'>On</button><button data-bub='off'>Off</button></div>");
  const row = pane.querySelector("#shBub");
  const mark = () => row.querySelectorAll("button").forEach((b) => b.classList.toggle("on", (b.dataset.bub === "on") === on));
  row.addEventListener("click", (e) => {
    const b = e.target.closest("[data-bub]");
    if (!b) return;
    on = b.dataset.bub === "on";
    write(on ? "on" : "off");
    apply();
    mark();
  });
  mark();
})();
