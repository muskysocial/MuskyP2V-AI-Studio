// Enforce the free HeadSwap daily allowance without replacing the existing generator.
const waitForHeadSwap = (test, ms = 20000) => new Promise((resolve) => {
  const started = Date.now();
  (function tick() {
    const value = test();
    if (value || Date.now() - started > ms) resolve(value);
    else setTimeout(tick, 150);
  })();
});
const headSwapReady = await waitForHeadSwap(() => window.musky && window.musky.sb && document.querySelector("#hsGo") && document.querySelector("#hsStatus"));
if (headSwapReady) {
  let replaying = false;
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("#hsGo");
    if (!button) return;
    if (replaying) { replaying = false; return; }
    event.preventDefault();
    event.stopImmediatePropagation();
    if (button.disabled) return;

    const status = document.querySelector("#hsStatus");
    const say = (message, bad) => {
      if (!status) return;
      status.textContent = message;
      status.classList.toggle("err", !!bad);
    };
    button.disabled = true;
    let allowance;
    try {
      const session = await window.musky.session();
      if (!session) throw new Error("Please sign in before generating HeadSwap.");
      say("Checking your daily HeadSwap allowance…");
      const result = await window.musky.sb.rpc("claim_headswap_daily");
      if (result.error || !result.data) throw new Error("Could not check your daily limit. Please try again.");
      allowance = result.data;
      if (!allowance.allowed) {
        say("Your free HeadSwap for today has been used. Upgrade to Gold, Diamond, or Platinum for paid-member access.", true);
        if (window.shell) window.shell.go("membershipSection");
        button.disabled = false;
        return;
      }
    } catch (error) {
      say(error && error.message ? error.message : "Could not check your daily limit. Please try again.", true);
      button.disabled = false;
      return;
    }

    if (!allowance.unlimited && status) {
      let settled = false;
      const observer = new MutationObserver(() => {
        const message = status.textContent || "";
        if (/^Done\./i.test(message)) {
          settled = true;
          observer.disconnect();
        } else if (/failed|quota|busy|try again|could not|error/i.test(message)) {
          settled = true;
          observer.disconnect();
          void window.musky.sb.rpc("release_headswap_daily");
        }
      });
      observer.observe(status, { childList: true, subtree: true, characterData: true });
      setTimeout(() => {
        if (settled) return;
        observer.disconnect();
        void window.musky.sb.rpc("release_headswap_daily");
      }, 180000);
    }
    button.disabled = false;
    replaying = true;
    button.click();
  }, true);
}