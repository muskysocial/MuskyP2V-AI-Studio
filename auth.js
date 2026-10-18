// MuskySocials accounts v1: email + password via Supabase Auth.
// The publishable key is public by design; row-level security protects the data.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SB_URL = "https://jnsbttwyiwcqhuhveikq.supabase.co";
const SB_KEY = "sb_publishable_LB_HC5TVIdKf7FX3c0q8Hg__81wa5F2";
const sb = createClient(SB_URL, SB_KEY);

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

  // Hand over to the site's own studio screen with the account's display name.
  function enter(session) {
    if (entered) return;
    entered = true;
    const u = session.user;
    const name = (u.user_metadata && u.user_metadata.display_name) || (u.email || "Creator").split("@")[0];
    nameInput.value = name.slice(0, 40);
    addSignOut();
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
        if (data.session) enter(data.session);
        else say("Account created. Check your email to confirm it, then sign in.");
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        enter(data.session);
      }
    } catch (err) {
      say(friendly(err), true);
    } finally {
      go.disabled = false;
    }
  });

  // Returning visitor with a saved session: go straight in.
  const { data } = await sb.auth.getSession();
  if (data && data.session) enter(data.session);
}
