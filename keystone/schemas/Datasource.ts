import { list } from "@keystone-6/core";
import {
  json,
  text,
  timestamp,
  relationship,
  checkbox,
  select,
} from "@keystone-6/core/fields";
import {
  countWritableVizParts,
  datasourceQueryFilter,
  isAdmin,
  studyUpdateWhere,
  worksOnBoard,
} from "../access";
import { fileTokensRefused } from "../mutations/dataFileAccess";
import { journalContexts, teamProfiles } from "../lib/datasourceTeam";
const { canSeeSimulatedDatasets } = require("../lib/datasourceAccess");
const { newFileTokens } = require("../lib/datasourceFiles");

// Fields only a dataset's author changes; collaborators edit its data.
const authorOnlyUpdate = {
  update: ({ session, item }: any) =>
    !!session?.itemId && item.authorId === session.itemId,
};

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
    // Who sees which dataset: lib/datasourceAccess.js. A filter rather than a
    // closed list, so anything that links to a datasource just sees none.
    // Nobody may change or delete a dataset they cannot see.
    filter: {
      query: datasourceQueryFilter,
      update: datasourceQueryFilter,
      delete: datasourceQueryFilter,
    },
    item: {
      update: async ({ session, item, context }) => {
        if (!session?.itemId) return false;
        if (item.authorId === session.itemId) return true;
        // Collaborators edit in place when the author allows it, shared
        // dataset or not; everyone else edits a copy of their own.
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
    async validateInput({
      operation,
      inputData,
      resolvedData,
      item,
      context,
      addValidationError,
    }) {
      if (operation !== "create" && operation !== "update") return;
      const admin = isAdmin({ session: context.session } as any);

      // Links decide who reads a dataset (a template journal makes it public,
      // a board hands it to the board's team), so a dataset may only be
      // attached to journals and boards the caller works on.
      if (!admin) {
        const journalIds = new Set<string>();
        addConnectIds(journalIds, inputData?.journal?.connect);
        addConnectIds(journalIds, inputData?.journal?.set);
        if (journalIds.size) {
          const writable = await countWritableVizParts(context, [...journalIds]);
          if (writable < journalIds.size) {
            addValidationError(
              "A dataset can only be attached to journals of a study or project you work on."
            );
          }
        }
        const projectId = inputData?.project?.connect?.id;
        if (projectId && !(await worksOnBoard(context, String(projectId)))) {
          addValidationError(
            "Only people working on this project board can link a dataset to it."
          );
        }
      }

      // A dataset reads the files its content points at, so a new address
      // must be a fresh upload or a file the caller could already read
      // (mutations/dataFileAccess.ts fileTokensRefused).
      if (!admin && resolvedData?.content !== undefined) {
        const added = newFileTokens(
          operation === "update" ? (item as any)?.content : null,
          resolvedData.content
        );
        if (added.length) {
          const refused = await fileTokensRefused(
            context,
            added,
            operation === "update" ? String(item?.id) : null
          );
          if (refused.length) {
            addValidationError(
              "This dataset points at a data file you do not have access to."
            );
          }
        }
      }

      // Collaborators come from the dataset's study and board team only: a
      // dataset may hold participant rows (lib/datasourceTeam.ts). Only new
      // names are checked, so older lists can still be trimmed.
      if (!admin) {
        const wanted = new Set<string>();
        addConnectIds(wanted, inputData?.collaborators?.connect);
        addConnectIds(wanted, inputData?.collaborators?.set);
        const current =
          wanted.size && operation === "update" && item?.id
            ? await context.sudo().query.Datasource.findOne({
                where: { id: String(item.id) },
                query: "collaborators { id } journal { id }",
              })
            : null;
        for (const c of current?.collaborators || []) wanted.delete(c.id);
        if (context.session?.itemId) wanted.delete(String(context.session.itemId));
        if (wanted.size) {
          const journalIds = new Set<string>();
          addConnectIds(journalIds, inputData?.journal?.connect);
          for (const j of current?.journal || []) journalIds.add(j.id);
          const fromJournals = await journalContexts(context, [...journalIds]);
          const studyId =
            inputData?.study?.connect?.id ?? (item as any)?.studyId ?? null;
          const projectId =
            inputData?.project?.connect?.id ?? (item as any)?.projectId ?? null;
          const team = await teamProfiles(context, {
            studyIds: [studyId, ...fromJournals.studyIds].filter(Boolean),
            projectIds: [projectId, ...fromJournals.projectIds].filter(Boolean),
          });
          if ([...wanted].some((id) => !team.has(id))) {
            addValidationError(
              "Only people working on this dataset's study or project board can be added as collaborators."
            );
          }
        }
      }
      // A study dataset hands its participant rows to everyone who may read
      // it (lib/datasourceStudyRows.js), so only the study's researchers may
      // link a dataset to a study.
      const studyId = inputData?.study?.connect?.id;
      const session = context.session;
      if (studyId && !isAdmin({ session } as any)) {
        const allowed = session?.itemId
          ? await context.sudo().query.Study.count({
              where: {
                AND: [
                  { id: { equals: String(studyId) } },
                  studyUpdateWhere(String(session.itemId)),
                ],
              },
            })
          : 0;
        if (!allowed) {
          addValidationError(
            "Only people working on this study can link a dataset to it."
          );
        }
      }
      if (
        resolvedData?.dataOrigin === "SIMULATED" &&
        !canSeeSimulatedDatasets(context.session)
      ) {
        addValidationError(
          "Only testers can create simulated datasets."
        );
      }
    },
    async resolveInput({ operation, resolvedData, context, inputData }) {
      if (operation === "create" || operation === "update") {
        resolvedData.updatedAt = new Date().toISOString();
      }

      if (operation !== "create") {
        return resolvedData;
      }
      // A private dataset (a fresh copy) belongs to its author alone: no
      // study or board team is added as collaborators.
      if (resolvedData.sharedWithTeam === false) {
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
    title: text({ access: authorOnlyUpdate }),
    description: text({ access: authorOnlyUpdate }),
    // Set to the creator; never changed afterwards (an editor could otherwise
    // take the dataset over).
    author: relationship({
      ref: "Profile.authoredDatasources",
      access: { update: () => false },
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.author;
        },
      },
    }),
    // People who may read and (with collaboratorsCanEdit) edit this dataset
    // in place. Limited to its study's and board's team (validateInput); only
    // the author changes the list.
    collaborators: relationship({
      ref: "Profile.collaboratorInDatasource",
      many: true,
      access: authorOnlyUpdate,
    }),
    collaboratorsCanEdit: checkbox({
      defaultValue: true,
      isFilterable: true,
      access: authorOnlyUpdate,
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
    // Visible to every signed-in user. Admins only, for now.
    isPublic: checkbox({
      defaultValue: false,
      isFilterable: true,
      access: {
        create: ({ session }) => isAdmin({ session }),
        update: ({ session }) => isAdmin({ session }),
      },
    }),
    // A copy made from another dataset (the copy prompt, or a template
    // journal). Copies are listed with the user's own datasets, not under
    // "Uploaded". Set once at creation, never changed.
    isCopy: checkbox({
      defaultValue: false,
      isFilterable: true,
      access: { update: () => false },
    }),
    // Whether the team of the dataset's study and project board may read it
    // through the team rule (lib/datasourceAccess.js). On for ordinary
    // datasets; off on fresh copies, which only their author and the
    // collaborators they pick can reach. No UI sets it.
    sharedWithTeam: checkbox({
      defaultValue: true,
      isFilterable: true,
      access: authorOnlyUpdate,
    }),
    // Classes whose members (students and staff) may read this dataset.
    // Set only through setDatasourceClassSharing, which checks that the
    // caller staffs the class.
    sharedWithClasses: relationship({
      ref: "Class.sharedDatasources",
      many: true,
      access: {
        create: () => false,
        update: () => false,
      },
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
