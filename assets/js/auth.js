(() => {
  "use strict";

  const SUPABASE_URL = "https://htnziffczbgmaikzfiov.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_sIFiT_rsIK2Eqa_RzkOvpQ_5RqTz5X0";
  const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

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

  function currentRedirect() {
    return window.location.href.split("#")[0];
  }

  function addAuthButton() {
    const actions = document.querySelector(".header-actions");
    if (!actions || document.querySelector("#authButton")) return null;
    const button = document.createElement("button");
    button.id = "authButton";
    button.type = "button";
    button.className = "auth-button";
    button.textContent = "Login";
    button.setAttribute("aria-label", "Login with Google");
    actions.insertBefore(button, actions.firstChild);
    return button;
  }

  async function init() {
    try {
      await loadSupabase();
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      window.COOKIPIE_SUPABASE = client;
      window.COOKIPIE_AUTH_READY = true;

      const button = addAuthButton();
      if (!button) return;

      const paint = (session) => {
        if (session?.user) {
          const name = session.user.user_metadata?.full_name || session.user.email || "Account";
          button.textContent = "Account";
          button.setAttribute("aria-label", name + " — account");
          button.title = name;
          button.onclick = async () => {
            button.disabled = true;
            const { error } = await client.auth.signOut();
            button.disabled = false;
            if (error) alert("Could not log out. Please try again.");
            else window.location.reload();
          };
        } else {
          button.textContent = "Login";
          button.removeAttribute("title");
          button.setAttribute("aria-label", "Login with Google");
          button.onclick = async () => {
            button.disabled = true;
            const { error } = await client.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: currentRedirect() }
            });
            if (error) {
              button.disabled = false;
              alert(error.message || "Google login could not start.");
            }
          };
        }
      };

      const { data } = await client.auth.getSession();
      paint(data.session);
      client.auth.onAuthStateChange((_event, session) => paint(session));
    } catch (error) {
      console.error("Cookipie auth initialization failed:", error);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
