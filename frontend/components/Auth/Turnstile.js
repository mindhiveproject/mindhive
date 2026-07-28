import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise = null;

// Load the Cloudflare script once per page, no matter how many widgets mount.
function loadTurnstileScript() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.turnstile));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Cloudflare Turnstile checkbox.
 *
 * Renders nothing when NEXT_PUBLIC_TURNSTILE_SITEKEY is unset, which keeps
 * local dev working — the backend skips verification in the same situation
 * (see keystone/lib/turnstile.ts).
 *
 * Call reset() through the ref after a failed signup: tokens are single-use,
 * so a retry with a spent token would fail verification.
 */
const Turnstile = forwardRef(function Turnstile({ onVerify }, ref) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const [failed, setFailed] = useState(false);

  // Keep the latest callback without re-rendering the widget.
  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY;

  useImperativeHandle(ref, () => ({
    reset() {
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.reset(widgetIdRef.current);
      }
      if (onVerifyRef.current) onVerifyRef.current(null);
    },
  }));

  useEffect(() => {
    if (!sitekey) return undefined;

    let cancelled = false;

    loadTurnstileScript()
      .then((turnstile) => {
        if (cancelled || !turnstile || !containerRef.current) return;
        if (widgetIdRef.current !== null) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey,
          callback: (token) => {
            if (onVerifyRef.current) onVerifyRef.current(token);
          },
          "expired-callback": () => {
            if (onVerifyRef.current) onVerifyRef.current(null);
          },
          "error-callback": () => {
            if (onVerifyRef.current) onVerifyRef.current(null);
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [sitekey]);

  if (!sitekey) return null;

  if (failed) {
    return (
      <p style={{ color: "#991b1b", fontSize: 13 }}>
        Could not load human verification. Please disable any ad blocker for
        this page and reload.
      </p>
    );
  }

  return <div ref={containerRef} style={{ margin: "12px 0" }} />;
});

export default Turnstile;
