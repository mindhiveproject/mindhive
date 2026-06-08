// Collaboration cursor extension using @tiptap/y-tiptap's yCursorPlugin and the
// same ySyncPluginKey that @tiptap/extension-collaboration binds to. Using this
// (rather than y-prosemirror's cursor plugin directly) avoids the plugin-key
// mismatch that otherwise breaks cursor rendering.

import { Extension } from "@tiptap/core";
import { yCursorPlugin } from "@tiptap/y-tiptap";

function buildCursor(user) {
  const caret = document.createElement("span");
  caret.className = "collaboration-cursor__caret";
  caret.style.borderColor = user.color || "#336F8A";

  const label = document.createElement("div");
  label.className = "collaboration-cursor__label";
  label.style.backgroundColor = user.color || "#336F8A";
  label.textContent = user.name || "Editor";

  caret.appendChild(label);
  return caret;
}

const CollaborationCursorExtension = Extension.create({
  name: "collaborationCursor",

  addOptions() {
    return {
      provider: null,
      user: { name: "Editor", color: "#336F8A" },
    };
  },

  addProseMirrorPlugins() {
    const { provider, user } = this.options;
    if (!provider?.awareness) return [];

    const { awareness } = provider;

    // Broadcast this client's identity to peers.
    awareness.setLocalStateField("user", {
      name: user.name,
      color: user.color,
    });

    return [yCursorPlugin(awareness, { cursorBuilder: buildCursor })];
  },
});

export default CollaborationCursorExtension;
