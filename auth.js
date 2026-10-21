// MuskySocials accounts v1: email + password via Supabase Auth.
// The publishable key is public by design; row-level security protects the data.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SB_URL = "https://jnsbttwyiwcqhuhveikq.supabase.co";
const SB_KEY = "sb_publishable_LB_HC5TVIdKf7FX3c0q8Hg__81wa5F2";
const sb = createClient(SB_URL, SB_KEY);

// ---- Credit balance badge + helpers shared with other scripts (window.musky)
function setBadge(n) {
  window.dispatchEvent(new CustomEvent("musky-credits", { detail: n }));
  const bar = document.querySelector(".top-actions");
  if (!bar) return;
  let b = document.querySelector("#authCredits");
  if (!b) {
    b = document.createElement("span");
    b.id = "authCredits";
    b.style.cssText = "margin-left:10px;padding:3px 9px;border:1px solid #2c427f;border-radius:999px;font-size:12px;color:#cfe0ff";
    bar.insertBefore(b, document.querySelector("#authOut"));
  }
  b.textContent = n + " credits";
}
window.musky = {
  sb,
  setBadge,
  async session() {
    return (await sb.auth.getSession()).data.session;
  },
  async credits() {
    // get_credits also applies the daily refill (see Supabase SQL).
    const { data, error } = await sb.rpc("get_credits");
    return error || typeof data !== "number" ? null : data;
  },
  async spend(n) {
    const { data, error } = await sb.rpc("spend_credits", { amount: n });
    if (error) throw error;
    setBadge(data);
    return data;
  },
};

const oldForm = document.querySelector("#loginForm");
const nameInput = document.querySelector("#userName");
if (oldForm && nameInput) init();

async function init() {
  let mode = "signin";
  let entered = false;

  // Hide the old demo form and add the real one in the same place.
  oldForm.style.display = "none";
  const form = document.createElement("form");
  form.id = "authForm";
  form.className = "entry-form";
  form.innerHTML = `
    <div id="authNameRow" hidden>
      <label for="authName">What should we call you?</label>
      <input id="authName" autocomplete="nickname" placeholder="Display name" maxlength="40">
    </div>
    <label for="authEmail">Email</label>
    <input id="authEmail" type="email" autocomplete="email" placeholder="you@example.com" required>
    <label for="authPass">Password</label>
    <input id="authPass" type="password" autocomplete="current-password" placeholder="At least 8 characters" minlength="8" required>
    <button class="primary enter-button" id="authGo" type="submit">Sign in</button>
    <button type="button" id="authSwap" style="margin-top:10px;background:none;border:0;color:#9fb4f0;font-size:14px;text-decoration:underline">New here? Create an account</button>
    <p id="authMsg" role="status" style="margin:10px 0 0;font-size:14px;color:#9fb4f0"></p>`;
  oldForm.after(form);

  const $ = (id) => form.querySelector("#" + id);
  const note = document.querySelector("#loginPanel .fineprint");
  if (note) note.textContent = "Your account keeps your name and, later, your credits.";

  const say = (t, bad = false) => {
    const m = $("authMsg");
    m.textContent = t;
    m.style.color = bad ? "#ff9a9a" : "#9fb4f0";
  };

  const friendly = (e) => {
    const m = String((e && e.message) || e);
    if (/invalid login/i.test(m)) return "Email or password is wrong.";
    if (/already registered|already been registered/i.test(m)) return "This email already has an account. Tap Sign in.";
    if (/password/i.test(m) && /least|weak/i.test(m)) return "Use a stronger password (at least 8 characters).";
    if (/rate|too many|seconds/i.test(m)) return "Too many tries. Wait a minute and try again.";
    if (/confirm/i.test(m)) return "Please confirm your email first, then sign in.";
    return "Something went wrong: " + m.slice(0, 120);
  };

  function setMode(m) {
    mode = m;
    $("authNameRow").hidden = m !== "signup";
    $("authGo").textContent = m === "signup" ? "Create account" : "Sign in";
    $("authSwap").textContent = m === "signup" ? "Have an account? Sign in" : "New here? Create an account";
    $("authPass").autocomplete = m === "signup" ? "new-password" : "current-password";
    say("");
  }
  $("authSwap").addEventListener("click", () => setMode(mode === "signup" ? "signin" : "signup"));


  // Require an authenticator code whenever Supabase says this account needs AAL2.
  async function continueAfterAuth(session) {
    const { data: levels, error: levelError } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (levelError) throw levelError;
    if (levels.currentLevel === "aal1" && levels.nextLevel === "aal2") {
      const { data: factors, error: factorsError } = await sb.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      const factor = (factors.totp || []).find((f) => f.status === "verified");
      if (!factor) throw new Error("Two-factor sign-in is enabled but no verified authenticator was found. Contact support.");
      const { data: challenge, error: challengeError } = await sb.auth.mfa.challenge({ factorId: factor.id });
      if (challengeError) throw challengeError;
      form.innerHTML = `
        <h2 style="margin-top:0">Two-factor verification</h2>
        <p>Open your authenticator app and enter the 6-digit code for MuskySocials.</p>
        <label for="authMfaCode">Authenticator code</label>
        <input id="authMfaCode" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="000000" required>
        <button class="primary enter-button" id="authMfaVerify" type="button">Verify and sign in</button>
        <button id="authMfaCancel" type="button" style="margin-top:10px;background:none;border:0;color:#9fb4f0;text-decoration:underline">Cancel and sign out</button>
        <p id="authMsg" role="status" style="margin:10px 0 0;font-size:14px;color:#9fb4f0"></p>`;
      $("authMfaCode").focus();
      $("authMfaCancel").addEventListener("click", async () => { await sb.auth.signOut(); location.reload(); });
      $("authMfaVerify").addEventListener("click", async () => {
        const code = $("authMfaCode").value.trim();
        if (!/^[0-9]{6}$/.test(code)) return say("Enter the 6-digit code from your authenticator app.", true);
        $("authMfaVerify").disabled = true;
        say("Checking your code…");
        try {
          const { data, error } = await sb.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code });
          if (error) throw error;
          const current = data.session || (await sb.auth.getSession()).data.session || session;
          const { data: confirmed } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
          if (confirmed.currentLevel !== "aal2") throw new Error("The second step was not confirmed. Please try again.");
          enter(current);
        } catch (err) {
          say(/invalid|code|challenge/i.test(String(err.message || err)) ? "That code was not accepted. Check your phone's clock and try the latest code." : friendly(err), true);
          $("authMfaVerify").disabled = false;
          $("authMfaCode").value = "";
          $("authMfaCode").focus();
        }
      });
      return;
    }
    enter(session);
  }

  // Authenticator-app setup and management, opened from Profile > Two-factor sign-in.
  window.musky.manageMFA = async function () {
    let modal = document.querySelector("#muskyMfaModal");
    if (modal) modal.remove();
    modal = document.createElement("div");
    modal.id = "muskyMfaModal";
    modal.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px";
    modal.innerHTML = `<section role="dialog" aria-modal="true" aria-labelledby="muskyMfaTitle" style="box-sizing:border-box;width:min(100%,440px);max-height:90vh;overflow:auto;background:#fff;color:#111;border-radius:16px;padding:20px;font-family:system-ui,sans-serif">
      <button id="muskyMfaClose" type="button" aria-label="Close" style="float:right;border:0;background:none;font-size:24px">×</button>
      <h2 id="muskyMfaTitle">Two-factor sign-in</h2>
      <p>Use an authenticator app such as Google Authenticator, Microsoft Authenticator, or 1Password. Your password alone will no longer be enough after setup.</p>
      <p id="muskyMfaStatus" role="status">Checking your account…</p>
      <div id="muskyMfaSetup"></div>
    </section>`;
    document.body.appendChild(modal);
    const status = modal.querySelector("#muskyMfaStatus");
    const setup = modal.querySelector("#muskyMfaSetup");
    modal.querySelector("#muskyMfaClose").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });

    const load = async () => {
      status.textContent = "Checking your account…";
      setup.replaceChildren();
      try {
        const { data, error } = await sb.auth.mfa.listFactors();
        if (error) throw error;
        const active = (data.totp || []).find((f) => f.status === "verified");
        if (active) {
          status.textContent = "Two-factor sign-in is enabled for this account.";
          const off = document.createElement("button");
          off.type = "button"; off.textContent = "Turn off two-factor sign-in";
          off.style.cssText = "padding:12px;border:0;border-radius:8px;background:#b42318;color:#fff;width:100%";
          off.addEventListener("click", async () => {
            off.disabled = true; status.textContent = "Turning off two-factor sign-in…";
            const { error: removeError } = await sb.auth.mfa.unenroll({ factorId: active.id });
            if (removeError) { status.textContent = "Could not turn it off: " + removeError.message; off.disabled = false; return; }
            await load();
          });
          setup.appendChild(off);
          return;
        }
        status.textContent = "Two-factor sign-in is not enabled yet.";
        const start = document.createElement("button");
        start.type = "button"; start.textContent = "Set up authenticator app";
        start.style.cssText = "padding:12px;border:0;border-radius:8px;background:#1877f2;color:#fff;width:100%";
        start.addEventListener("click", async () => {
          start.disabled = true; status.textContent = "Creating your secure setup…";
          try {
            const { data: enrolled, error: enrollError } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "MuskySocials authenticator" });
            if (enrollError) throw enrollError;
            status.textContent = "Scan this QR code with your authenticator app, then enter the 6-digit code it generates.";
            const img = document.createElement("img");
            img.alt = "Authenticator setup QR code";
            img.style.cssText = "display:block;width:200px;height:200px;max-width:100%;margin:12px auto";
            img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(enrolled.totp.qr_code);
            const secretLabel = document.createElement("p");
            secretLabel.textContent = "If you cannot scan the QR code, enter this setup key manually:";
            const secret = document.createElement("code");
            secret.style.cssText = "display:block;overflow-wrap:anywhere;padding:10px;background:#f2f4f7;border-radius:8px";
            secret.textContent = enrolled.totp.secret;
            const input = document.createElement("input");
            input.type = "text"; input.inputMode = "numeric"; input.autocomplete = "one-time-code";
            input.maxLength = 6; input.placeholder = "6-digit authenticator code";
            input.setAttribute("aria-label", "6-digit authenticator code");
            input.style.cssText = "box-sizing:border-box;width:100%;padding:12px;margin:10px 0;border:1px solid #bbb;border-radius:8px;font-size:18px";
            const verify = document.createElement("button");
            verify.type = "button"; verify.textContent = "Verify and enable";
            verify.style.cssText = "padding:12px;border:0;border-radius:8px;background:#1877f2;color:#fff;width:100%";
            setup.replaceChildren(img, secretLabel, secret, input, verify);
            verify.addEventListener("click", async () => {
              const code = input.value.trim();
              if (!/^[0-9]{6}$/.test(code)) { status.textContent = "Enter the 6-digit code from your authenticator app."; return; }
              verify.disabled = true; status.textContent = "Verifying your authenticator…";
              try {
                const { data: ch, error: chError } = await sb.auth.mfa.challenge({ factorId: enrolled.id });
                if (chError) throw chError;
                const { error: verifyError } = await sb.auth.mfa.verify({ factorId: enrolled.id, challengeId: ch.id, code });
                if (verifyError) throw verifyError;
                status.textContent = "Two-factor sign-in is now enabled.";
                setup.replaceChildren();
                const done = document.createElement("button");
                done.type = "button"; done.textContent = "Done";
                done.style.cssText = "padding:12px;border:0;border-radius:8px;background:#1877f2;color:#fff;width:100%";
                done.addEventListener("click", () => modal.remove());
                setup.appendChild(done);
              } catch (err) {
                status.textContent = "Could not verify that code: " + String(err.message || err);
                verify.disabled = false;
              }
            });
          } catch (err) {
            status.textContent = "Could not start setup: " + String(err.message || err);
            start.disabled = false;
          }
        });
        setup.appendChild(start);
      } catch (err) {
        status.textContent = "Could not check two-factor settings: " + String(err.message || err);
      }
    };
    await load();
  };

  // Hand over to the site's own studio screen with the account's display name.
  function enter(session) {
    if (entered) return;
    entered = true;
    const u = session.user;
    const name = (u.user_metadata && u.user_metadata.display_name) || (u.email || "Creator").split("@")[0];
    nameInput.value = name.slice(0, 40);
    addSignOut();
    window.musky.credits().then((n) => n !== null && setBadge(n));
    oldForm.requestSubmit();
  }

  function addSignOut() {
    const bar = document.querySelector(".top-actions");
    if (!bar || document.querySelector("#authOut")) return;
    const b = document.createElement("button");
    b.id = "authOut";
    b.type = "button";
    b.textContent = "Sign out";
    b.style.cssText = "margin-left:10px;background:none;border:1px solid #2c427f;color:#b8c6ee;border-radius:8px;padding:4px 10px;font-size:12px";
    b.addEventListener("click", async () => {
      await sb.auth.signOut();
      location.reload();
    });
    bar.appendChild(b);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Pressing Enter in the MFA code field should run MFA verification, not password sign-in.
    if ($("authMfaCode")) { $("authMfaVerify").click(); return; }
    const go = $("authGo");
    const email = $("authEmail").value.trim();
    const password = $("authPass").value;
    if (password.length < 8) return say("Use at least 8 characters.", true);
    go.disabled = true;
    say(mode === "signup" ? "Creating your account…" : "Signing in…");
    try {
      if (mode === "signup") {
        const display_name = ($("authName").value.trim() || email.split("@")[0]).slice(0, 40);
        const { data, error } = await sb.auth.signUp({ email, password, options: { data: { display_name } } });
        if (error) throw error;
        if (data.session) await continueAfterAuth(data.session);
        else say("Account created. Check your email to confirm it, then sign in.");
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await continueAfterAuth(data.session);
      }
    } catch (err) {
      say(friendly(err), true);
    } finally {
      go.disabled = false;
    }
  });

  // Returning visitor with a saved session: go straight in.
  const { data } = await sb.auth.getSession();
  if (data && data.session) await continueAfterAuth(data.session);
}
