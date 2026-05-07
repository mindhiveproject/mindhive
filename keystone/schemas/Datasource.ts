import { list } from "@keystone-6/core";
import {
  json,
  text,
  timestamp,
  relationship,
  checkbox,
  select,
} from "@keystone-6/core/fields";

function addConnectIds(
  ids: Set<string>,
  connect: unknown
) {
  if (!connect) return;
  const arr = Array.isArray(connect) ? connect : [connect];
  for (const x of arr) {
    if (x && typeof x === "object" && "id" in x && (x as { id: string }).id) {
      ids.add((x as { id: string }).id);
    }
  }
}

export const Datasource = list({
  access: {
    operation: {
      query: () => true,
      create: ({ session }) => !!session?.itemId,
      update: ({ session }) => !!session?.itemId,
      delete: ({ session }) => !!session?.itemId,
    },
    item: {
      update: async ({ session, item, context }) => {
        if (!session?.itemId) return false;
        if (item.authorId === session.itemId) return true;
        const d = await context.query.Datasource.findOne({
          where: { id: String(item.id) },
          query: "collaboratorsCanEdit collaborators { id }",
        });
        if (!d?.collaboratorsCanEdit) return false;
        return (d.collaborators || []).some(
          (c: { id: string }) => c.id === session.itemId
        );
      },
      delete: ({ session, item }) =>
        !!session?.itemId &&
        item.authorId != null &&
        item.authorId === session.itemId,
    },
  },
  hooks: {
    async resolveInput({ operation, resolvedData, context, inputData }) {
      if (operation !== "create") {
        return resolvedData;
      }
      const sessionId = context.session?.itemId as string | undefined;
      const ids = new Set<string>();

      addConnectIds(ids, inputData.collaborators?.connect);
      addConnectIds(ids, resolvedData.collaborators?.connect);

      const collectFromStudy = async (studyId: string) => {
        const s = await context.query.Study.findOne({
          where: { id: studyId },
          query: "author { id } collaborators { id }",
        });
        if (s?.author?.id) ids.add(s.author.id);
        for (const c of s?.collaborators || []) {
          if (c?.id) ids.add(c.id);
        }
      };

      const collectFromProject = async (projectId: string) => {
        const p = await context.query.ProposalBoard.findOne({
          where: { id: projectId },
          query: "author { id } collaborators { id }",
        });
        if (p?.author?.id) ids.add(p.author.id);
        for (const c of p?.collaborators || []) {
          if (c?.id) ids.add(c.id);
        }
      };

      const jc = inputData.journal?.connect;
      const journalIds = jc
        ? (Array.isArray(jc) ? jc : [jc])
            .map((j: { id?: string }) => j?.id)
            .filter(Boolean)
        : [];
      for (const vid of journalIds) {
        const part = await context.query.VizPart.findOne({
          where: { id: vid as string },
          query: "vizJournal { study { id } project { id } }",
        });
        const vj = part?.vizJournal;
        if (vj?.study?.id) await collectFromStudy(vj.study.id);
        if (vj?.project?.id) await collectFromProject(vj.project.id);
      }

      const studyConnect = inputData.study?.connect?.id;
      if (studyConnect) await collectFromStudy(studyConnect);

      const projectConnect = inputData.project?.connect?.id;
      if (projectConnect) await collectFromProject(projectConnect);

      if (sessionId) ids.delete(sessionId);

      if (ids.size > 0) {
        resolvedData.collaborators = {
          connect: [...ids].map((id) => ({ id })),
        };
      }
      return resolvedData;
    },
  },
  fields: {
    title: text(),
    description: text(),
    author: relationship({
      ref: "Profile.authoredDatasources",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            return { connect: { id: context.session.itemId } };
          } else {
            return inputData.author;
          }
        },
      },
    }),
    collaborators: relationship({
      ref: "Profile.collaboratorInDatasource",
      many: true,
    }),
    collaboratorsCanEdit: checkbox({
      defaultValue: true,
      isFilterable: true,
    }),
    journal: relationship({
      ref: "VizPart.datasources",
      many: true,
    }),
    study: relationship({
      ref: "Study.datasources",
    }),
    project: relationship({
      ref: "ProposalBoard.datasources",
    }),
    dataOrigin: select({
      options: [
        { label: "study", value: "STUDY" },
        { label: "simulated", value: "SIMULATED" },
        { label: "uploaded", value: "UPLOADED" },
        { label: "template", value: "TEMPLATE" },
      ],
    }),
    settings: json(),
    content: json(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
