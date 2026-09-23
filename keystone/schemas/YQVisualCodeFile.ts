import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  integer,
} from "@keystone-6/core/fields";
import { Session } from "../types";
import { getVisualFilterQuery } from "./YQVisual";

// A source file belonging to a Visual.
//
// `Visual.code` is a `file()`, which means reading it costs a fetch of the
// storage URL and writing it costs an upload round-trip (see YQ's
// `utility/fetch_code.js`). That is workable for a one-shot load and miserable
// for an editor. Keeping the text in a column on a *child* list avoids both,
// and keeps a potentially large blob off the `Visual` row that every list query
// projects.
//
// `Visual.code` stays as the legacy single-file path so the YQ frontend keeps
// working; a visual reads its child rows when it has any and falls back
// otherwise.

// Access mirrors the parent Visual: only someone who may update the Visual may
// touch its files. Rather than duplicating YQVisual's owner/collaborator logic,
// ask Keystone whether the caller can see the parent — the Visual list's query
// filter already encodes the whole privacy model — and then whether they are
// the author or a collaborator.
async function canWriteParent(
  session: Session | undefined,
  visualId: string | null | undefined,
  context: any
) {
  if (!session?.itemId || !visualId) return false;

  const isAdmin = !!session?.data?.permissions?.some(
    (p: any) => p.canAccessAdminUI
  );
  if (isAdmin) return true;

  const visual = await context.sudo().query.Visual.findOne({
    where: { id: String(visualId) },
    query: "author { id } collaborators { id }",
  });
  if (!visual) return false;

  if (String(visual.author?.id) === String(session.itemId)) return true;
  return !!visual.collaborators?.some(
    (collaborator: { id: string }) =>
      String(collaborator.id) === String(session.itemId)
  );
}

export const VisualCodeFile = list({
  access: {
    operation: {
      query: () => true,
      create: ({ session }: { session?: Session }) => !!session,
      update: () => true,
      delete: () => true,
    },
    item: {
      create: ({ session, inputData, context }: any) =>
        canWriteParent(session, inputData?.visual?.connect?.id, context),
      update: ({ session, item, context }: any) =>
        canWriteParent(session, item?.visualId, context),
      delete: ({ session, item, context }: any) =>
        canWriteParent(session, item?.visualId, context),
    },
    filter: {
      // Readable exactly when the parent Visual is readable — reuse the
      // Visual's own filter rather than restating the privacy model here.
      query: ({ session }: { session?: Session }) => {
        const visualFilter = getVisualFilterQuery(session);
        return visualFilter === true ? true : { visual: visualFilter };
      },
    },
  },
  fields: {
    visual: relationship({ ref: "Visual.codeFiles", many: false }),
    name: text({ validation: { isRequired: true } }),
    language: select({
      options: [
        { label: "JavaScript", value: "javascript" },
        { label: "GLSL", value: "glsl" },
        { label: "CSS", value: "css" },
        { label: "HTML", value: "html" },
      ],
      defaultValue: "javascript",
    }),
    // Not a plain `isEntry` flag, because the parameter declaration needs its
    // own identity: the builder pins it first in the file strip and edits it
    // through scoped text splices, separately from the sketch itself.
    role: select({
      options: [
        { label: "Entry", value: "entry" },
        { label: "Parameters", value: "parameters" },
        { label: "Module", value: "module" },
      ],
      defaultValue: "module",
    }),
    order: integer({ defaultValue: 0 }),
    content: text({ ui: { displayMode: "textarea" } }),
    createdAt: timestamp({ defaultValue: { kind: "now" } }),
    lastTimeEdited: timestamp(),
  },
});
