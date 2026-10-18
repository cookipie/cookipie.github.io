(() => {
  "use strict";
  const SUPABASE_URL = "https://htnziffczbgmaikzfiov.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_sIFiT_rsIK2Eqa_RzkOvpQ_5RqTz5X0";
  const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  function addStyles() {
    if (document.getElementById("cookipie-auth-styles")) return;
    const style = document.createElement("style");
    style.id = "cookipie-auth-styles";
    style.textContent = ".auth-button{border:1px solid var(--line);border-radius:30px;background:var(--green);color:#fff;padding:8px 14px;font-size:12px;font-weight:700;white-space:nowrap}.auth-button:disabled{opacity:.65;cursor:wait}@media(max-width:700px){.auth-button{padding:7px 10px;font-size:11px}}.login-required-note{padding:12px 14px;border-radius:12px;background:#f5f1e8;color:#173f32;margin:12px 0;font-size:14px}";
    document.head.appendChild(style);
  }
  function loadSupabase() {
    if (window.supabase?.createClient) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SUPABASE_CDN;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Supabase library could not load"));
      document.head.appendChild(script);
    });
  }
  function currentRedirect() { return window.location.href.split("#")[0]; }
  function addAuthButton() {
    const actions = document.querySelector(".header-actions");
    if (!actions || document.querySelector("#authButton")) return document.querySelector("#authButton");
    const button = document.createElement("button");
    button.id = "authButton"; button.type = "button"; button.className = "auth-button";
    button.textContent = "Login"; button.setAttribute("aria-label", "Login with Google");
    actions.insertBefore(button, actions.firstChild); return button;
  }
  async function login() {
    await ready;
    if (!window.COOKIPIE_SUPABASE) { alert("Login is loading. Please try again."); return; }
    const { error } = await window.COOKIPIE_SUPABASE.auth.signInWithOAuth({
      provider: "google", options: { redirectTo: currentRedirect() }
    });
    if (error) alert(error.message || "Google login could not start.");
  }
  async function getSession() {
    await ready;
    if (!window.COOKIPIE_SUPABASE) return null;
    const { data } = await window.COOKIPIE_SUPABASE.auth.getSession();
    return data.session || null;
  }
  async function requireLogin(message = "Please sign in with Google to use this feature.") {
    const session = await getSession();
    if (session?.user) return session;
    if (message) alert(message);
    await login();
    return null;
  }
  async function api(path, options = {}) {
    const session = await getSession();
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
    if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (session?.access_token) headers.set("Authorization", "Bearer " + session.access_token);
    const base = location.hostname.endsWith("github.io")
      ? "https://cookipie-github-io.uplakshapanwar.workers.dev" : "";
    const response = await fetch(base + path, { ...options, headers, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "request_failed");
      error.status = response.status; throw error;
    }
    return data;
  }
  async function setSaved(recipeId, saved) {
    return api("/api/account-data", { method: "POST", body: JSON.stringify({ action: saved ? "save" : "unsave", recipeId }) });
  }
  async function getSaved() { return api("/api/account-data?action=list-saved"); }
  async function toggleRecipeLike(recipeId) {
    return api("/api/account-data", { method: "POST", body: JSON.stringify({ action: "toggle-recipe-like", recipeId }) });
  }
  async function getRecipeLikes(recipeId) { return api("/api/account-data?action=recipe-likes&recipeId=" + encodeURIComponent(recipeId)); }
  async function toggleReviewLike(reviewId, recipeId) {
    return api("/api/reviews", { method: "POST", body: JSON.stringify({ action: "toggle-review-like", reviewId, recipeId }) });
  }
  let adminButtonCheck = 0;
  async function updateManageRecipesButton(session) {
    const checkId = ++adminButtonCheck;
    document.querySelector("#manageRecipesButton")?.remove();
    if (!session?.user) return;
    try {
      // The server confirms admin permission; ordinary signed-in users never see this link.
      await api("/api/recipes-admin?action=admin");
      if (checkId !== adminButtonCheck || !document.querySelector(".header-actions")) return;
      const link = document.createElement("a");
      link.id = "manageRecipesButton";
      link.className = "saved-link";
      link.href = "admin-recipes.html";
      link.textContent = "Manage Recipes";
      link.setAttribute("aria-label", "Manage Cookipie recipes");
      const actions = document.querySelector(".header-actions");
      const account = document.querySelector("#authButton");
      actions.insertBefore(link, account || actions.firstChild);
    } catch (_) {
      // No admin permission or API unavailable: keep the management link hidden.
    }
  }
  const buttonPaint = session => {
    updateManageRecipesButton(session);
    const button = addAuthButton(); if (!button) return;
    if (session?.user) {
      const name = session.user.user_metadata?.full_name || session.user.email || "Account";
      button.textContent = "Account"; button.title = name; button.setAttribute("aria-label", name + " — account");
      button.onclick = async () => {
        if (!confirm("Log out of Cookipie?")) return;
        button.disabled = true;
        const { error } = await window.COOKIPIE_SUPABASE.auth.signOut();
        button.disabled = false;
        if (error) alert("Could not log out. Please try again."); else window.location.reload();
      };
    } else {
      button.textContent = "Login"; button.removeAttribute("title"); button.setAttribute("aria-label", "Login with Google");
      button.onclick = login;
    }
  };
  async function init() {
    try {
      addStyles(); await loadSupabase();
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      window.COOKIPIE_SUPABASE = client;
      window.COOKIPIE_AUTH_READY = true;
      const { data } = await client.auth.getSession();
      buttonPaint(data.session);
      client.auth.onAuthStateChange((_event, session) => buttonPaint(session));
    } catch (error) { console.error("Cookipie auth initialization failed:", error); }
    finally { resolveReady(); document.dispatchEvent(new Event("cookipie-auth-ready")); }
  }
  window.COOKIPIE_AUTH = { ready, getSession, requireLogin, login, api, setSaved, getSaved, toggleRecipeLike, getRecipeLikes, toggleReviewLike };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();