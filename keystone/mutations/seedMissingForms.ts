// Safe self-service seeder for the admin UI. Checks each baseline
// FormDefinition key (opportunity, profile_*, and review_* forms)
// and only inserts the seed when no row with that key exists at all
// (any scope, any status). Never clobbers existing definitions, so it's
// safe to call from a "Seed default forms" button without confirmation.
//
// Returns the list of inserted definition rows. An empty list means
// every baseline was already present — nothing to do.
import { OPPORTUNITY_FORM_SEED } from "./seedData/opportunityFormSeed";
import { PROFILE_INDIVIDUAL_FORM_SEED } from "./seedData/profileIndividualFormSeed";
import { PROFILE_ORGANIZATION_FORM_SEED } from "./seedData/profileOrganizationFormSeed";
import { ALL_REVIEW_FORM_SEEDS } from "./seedData/reviewForms";
import { insertSeed } from "./seedData/insertSeed";

const BASELINE_SEEDS = [
  OPPORTUNITY_FORM_SEED,
  PROFILE_INDIVIDUAL_FORM_SEED,
  PROFILE_ORGANIZATION_FORM_SEED,
  ...ALL_REVIEW_FORM_SEEDS,
];

async function seedMissingForms(root: any, _args: {}, context: any) {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be signed in to do this.");
  }

  const profile = await context.query.Profile.findOne({
    where: { id: session.itemId },
    query: "permissions { canManageUsers canManageForms }",
  });
  const canManage = (profile?.permissions || []).some(
    (p: any) => p.canManageUsers || p.canManageForms
  );
  if (!canManage) {
    throw new Error(
      "Forbidden: you need canManageUsers or canManageForms to seed forms."
    );
  }

  const inserted: string[] = [];

  for (const seed of BASELINE_SEEDS) {
    const existing = await context.query.FormDefinition.findMany({
      where: { key: { equals: seed.key } },
      query: "id",
    });
    if (existing.length > 0) continue; // skip — never clobber edits
    const id = await insertSeed(
      seed,
      session,
      context,
      "Auto-seeded from admin UI."
    );
    inserted.push(id);
  }

  if (inserted.length === 0) {
    return [];
  }

  return context.db.FormDefinition.findMany({ where: { id: { in: inserted } } });
}

export default seedMissingForms;
