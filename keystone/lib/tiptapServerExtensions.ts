// Server-side TipTap schema used to (de)serialize collaborative documents.
//
// This MUST mirror the extension set + custom attributes configured in the
// frontend editor (frontend/components/TipTap/Main.js + mindHiveImage.js +
// the CustomLink defined inline in Main.js). If the two drift, HTML produced
// on the server when flushing the Yjs document back into ProposalCard fields
// will lose attributes (e.g. media-asset linkage or link targets).

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";

// Mirror frontend CustomLink: adds a `target` attribute (defaults to _blank).
const ServerLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      target: {
        default: "_blank",
        parseHTML: (element: any) => element.getAttribute("target"),
        renderHTML: (attributes: any) =>
          attributes.target ? { target: attributes.target } : {},
      },
    };
  },
});

// Mirror frontend MindHiveImage: adds `data-media-asset-id` for MediaAsset linkage.
const ServerImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      mediaAssetId: {
        default: null,
        parseHTML: (element: any) =>
          element.getAttribute("data-media-asset-id"),
        renderHTML: (attributes: any) =>
          attributes.mediaAssetId
            ? { "data-media-asset-id": attributes.mediaAssetId }
            : {},
      },
    };
  },
});

// Note: the frontend PasteImageExtension is purely an input-rule/paste handler
// with no schema nodes/marks of its own, so it has no representation here.
export const tiptapServerExtensions = [
  StarterKit.configure({
    // The frontend disables StarterKit's bundled link/underline in favour of the
    // custom ones below; match that so node/mark names line up.
    link: false,
    underline: false,
  } as any),
  Underline,
  ServerLink.configure({ HTMLAttributes: { class: "editor-link" } }),
  ServerImage.configure({
    inline: true,
    allowBase64: false,
    HTMLAttributes: { class: "editor-image" },
  }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
];

// The ProposalCard fields backed by named Yjs fragments. Fragment name === field
// name === the `field` passed to the Collaboration extension on the client. This
// is the union of every collaborative editor across the card surfaces:
//   • Project board card (Builder/.../Board/Card/Main.js): content, revisedContent, comment
//   • Template card builder (Proposal/Card/Builder.js):    description, content, comment
// Fields not edited on a given card are still seeded from / mirrored back to their
// HTML so they round-trip untouched.
export const COLLAB_FIELDS = [
  "description",
  "content",
  "revisedContent",
  "comment",
] as const;
export type CollabField = (typeof COLLAB_FIELDS)[number];
