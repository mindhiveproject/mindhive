// How each relation of an account is treated when the account is
// de-identified or deleted. Read from the Prisma schema, so a relation added
// to Profile later is unlinked by default rather than left pointing at a
// person.

import { Prisma } from "@prisma/client";

/** Participation: kept on the de-identified account, under its new codes. */
export const KEEP_RELATIONS = new Set([
  "participantIn",
  "datasets",
  "dataSourceRecords",
  "summaryResults",
]);

/**
 * Personal records the account owns alone, mostly free text that cannot be
 * reliably cleaned of names: deleted, not kept. Order matters where one
 * points at another (posts before journals).
 */
export const DELETE_OWNED_RELATIONS = [
  "posts",
  "journals",
  "authorOfWord",
  "reviews",
  "authorOfHomework",
  "questionAnswers",
  "connectPreferences",
  "teamPreferencesSubmitted",
  "connectRatingsGiven",
  "opportunityReviewNotes",
  "updates",
  "logs",
  "yqGenAI",
  "following",
  "followers",
  "networkInvites",
];

/**
 * Content the account authored or worked on. De-identification keeps it,
 * with the account removed, and records it in DoeRetainedRecord so
 * termination can still find it.
 */
export const CONTENT_RELATIONS = [
  "creatorOfProposal",
  "authorOfProposal",
  "collaboratorInProposal",
  "researcherIn",
  "collaboratorInStudy",
  "visuals",
  "collaboratorInVisual",
  "jsPsychExperiments",
  "collaboratorInJsPsychExperiment",
  "authoredDataSourceBlocks",
  "collaboratorInDataSourceBlock",
  "authoredDatasources",
  "collaboratorInDatasource",
  "authoredSpecs",
  "consentCreatorIn",
  "collaboratorInConsent",
  "authoredMediaAssets",
  "authorOfTalk",
  "tickets",
  // teaching materials
  "templates",
  "collaboratorInTemplate",
  "taskCreatorIn",
  "collaboratorInTask",
  "authorOfLesson",
  "collaboratorInLesson",
  "authorOfResource",
  "collaboratorInResource",
  "authorOfCurriculum",
  "collaboratorInCurriculum",
  "authorOfAssignment",
];

/** Lists whose records are teaching materials, kept while in use. */
export const TEACHING_MATERIAL_LISTS = new Set([
  "Template",
  "Task",
  "Lesson",
  "Resource",
  "Curriculum",
  "Assignment",
]);

/** Handled on their own (the photo, through Keystone). */
const SPECIAL_RELATIONS = new Set(["image"]);

export type ProfileRelation = {
  field: string; // the relation field on Profile
  model: string; // the model on the other side
  fk: string | null; // that model's foreign key to Profile, when it has one
  backField: string | null; // that model's relation field back to Profile
  backIsList: boolean; // whether that field holds many profiles
};

let cached: ProfileRelation[] | null = null;

export function profileRelations(): ProfileRelation[] {
  if (cached) return cached;
  const models = Prisma.dmmf.datamodel.models;
  const profile = models.find((m) => m.name === "Profile");
  cached = (profile?.fields || [])
    .filter((f) => f.kind === "object")
    .map((f) => {
      const other = models.find((m) => m.name === f.type);
      const back = other?.fields.find(
        (g) =>
          g.relationName === f.relationName &&
          !(other?.name === "Profile" && g.name === f.name)
      );
      return {
        field: f.name,
        model: f.type,
        fk: back?.relationFromFields?.[0] || null,
        backField: back?.name || null,
        backIsList: !!back?.isList,
      };
    });
  return cached;
}

export function relationByField(field: string): ProfileRelation {
  const relation = profileRelations().find((r) => r.field === field);
  if (!relation) throw new Error(`Profile has no relation "${field}".`);
  return relation;
}

/** Relations de-identification sets to empty: all but kept, deleted, special. */
export function unlinkRelations(): string[] {
  const deleted = new Set(DELETE_OWNED_RELATIONS);
  return profileRelations()
    .map((r) => r.field)
    .filter(
      (field) =>
        !KEEP_RELATIONS.has(field) &&
        !deleted.has(field) &&
        !SPECIAL_RELATIONS.has(field)
    );
}

/** Prisma client accessor for a model: "ProposalBoard" -> "proposalBoard". */
export function accessor(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}
