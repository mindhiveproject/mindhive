import { useEffect, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { collabWsUrl } from "../config";

// How long to wait for the first sync before falling back to plain HTML editing.
const CONNECT_TIMEOUT_MS = 5000;
// How long a closing connection may take to push its last Yjs updates.
const FLUSH_TIMEOUT_MS = 3000;

const IDLE = { provider: null, status: "idle", connected: false };

/**
 * One collaboration connection for a whole card (all of its editors bind
 * different fields of the same Yjs document), open only while `active`.
 *
 * status: "idle"        – not active, no connection
 *         "connecting"  – waiting for the first sync
 *         "synced"      – `provider` is ready to hand to the editors
 *         "unavailable" – the collab server did not answer; edit the HTML directly
 * connected: whether the socket is currently up (it can drop after syncing).
 */
export function useCardCollabSession({ documentName, active }) {
  const [session, setSession] = useState(IDLE);

  useEffect(() => {
    if (!active || !documentName) {
      setSession(IDLE);
      return undefined;
    }

    const provider = new HocuspocusProvider({
      url: collabWsUrl,
      name: documentName,
      // Auth travels with the session cookie on the WS upgrade — no token needed.
      token: "",
    });
    let settled = false;
    let destroyed = false;
    setSession({ provider: null, status: "connecting", connected: false });

    const destroy = () => {
      if (destroyed) return;
      destroyed = true;
      provider.destroy();
    };
    const onSynced = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      setSession({ provider, status: "synced", connected: true });
    };
    const giveUp = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      setSession({ provider: null, status: "unavailable", connected: false });
      destroy();
    };
    const onStatus = ({ status }) => {
      if (!settled) return;
      setSession((prev) =>
        prev.provider === provider
          ? { ...prev, connected: status === "connected" }
          : prev
      );
    };

    const timer = setTimeout(giveUp, CONNECT_TIMEOUT_MS);
    provider.on("synced", onSynced);
    provider.on("authenticationFailed", giveUp);
    provider.on("status", onStatus);
    if (provider.synced) onSynced();

    return () => {
      clearTimeout(timer);
      provider.off("synced", onSynced);
      provider.off("authenticationFailed", giveUp);
      provider.off("status", onStatus);
      closeWhenFlushed(provider, destroy);
    };
  }, [active, documentName]);

  return session;
}

// Give the socket a moment to deliver edits made just before closing.
function closeWhenFlushed(provider, destroy) {
  if (!provider.hasUnsyncedChanges) {
    destroy();
    return;
  }
  const done = () => {
    clearTimeout(timer);
    provider.off("unsyncedChanges", check);
    destroy();
  };
  const check = () => {
    if (!provider.hasUnsyncedChanges) done();
  };
  const timer = setTimeout(done, FLUSH_TIMEOUT_MS);
  provider.on("unsyncedChanges", check);
}
