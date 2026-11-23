// Who may be a collaborator on a Data Journal dataset: the people working on
// its study or project board. A dataset can hold participant rows (a study
// dataset, or a snapshot copy of one), so collaborators are limited to that
// team; nobody can hand a dataset to someone outside it.
//
// The team of a study: its author and collaborators, the author and
// collaborators of every board linked to it, and the staff (creator, teaching
// team, mentors) of its classes. The team of a board: its author and
// collaborators, and the staff of the class it is used in.

type Person = { id: string; username?: string | null };

const STAFF = "creator { id username } teachingTeam { id username } mentors { id username }";

function addPeople(into: Map<string, Person>, people: any) {
  for (const p of Array.isArray(people) ? people : [people]) {
    if (p?.id) into.set(String(p.id), { id: String(p.id), username: p.username ?? null });
  }
}

function addStaff(into: Map<string, Person>, cls: any) {
  if (!cls) return;
  addPeople(into, cls.creator);
  addPeople(into, cls.teachingTeam || []);
  addPeople(into, cls.mentors || []);
}

/** The people on the given studies' and boards' teams, by id. */
export async function teamProfiles(
  context: any,
  { studyIds = [], projectIds = [] }: { studyIds?: string[]; projectIds?: string[] }
): Promise<Map<string, Person>> {
  const team = new Map<string, Person>();
  const sudo = context.sudo();
  const studies = [...new Set(studyIds.filter(Boolean).map(String))];
  const projects = [...new Set(projectIds.filter(Boolean).map(String))];

  if (studies.length) {
    const rows = await sudo.query.Study.findMany({
      where: { id: { in: studies } },
      query: `author { id username } collaborators { id username }
        proposal { author { id username } collaborators { id username } }
        classes { ${STAFF} }`,
    });
    for (const s of rows) {
      addPeople(team, s.author);
      addPeople(team, s.collaborators || []);
      for (const b of s.proposal || []) {
        addPeople(team, b.author);
        addPeople(team, b.collaborators || []);
      }
      for (const cls of s.classes || []) addStaff(team, cls);
    }
  }

  if (projects.length) {
    const rows = await sudo.query.ProposalBoard.findMany({
      where: { id: { in: projects } },
      query: `author { id username } collaborators { id username }
        usedInClass { ${STAFF} }`,
    });
    for (const b of rows) {
      addPeople(team, b.author);
      addPeople(team, b.collaborators || []);
      addStaff(team, b.usedInClass);
    }
  }

  return team;
}

/** The studies and boards a journal part belongs to. */
export async function journalContexts(context: any, vizPartIds: string[]) {
  const studyIds: string[] = [];
  const projectIds: string[] = [];
  const ids = [...new Set(vizPartIds.filter(Boolean).map(String))];
  if (!ids.length) return { studyIds, projectIds };
  const parts = await context.sudo().query.VizPart.findMany({
    where: { id: { in: ids } },
    query: "vizJournal { study { id } project { id } }",
  });
  for (const part of parts) {
    if (part?.vizJournal?.study?.id) studyIds.push(part.vizJournal.study.id);
    if (part?.vizJournal?.project?.id) projectIds.push(part.vizJournal.project.id);
  }
  return { studyIds, projectIds };
}

/**
 * The people who may be added as collaborators on a dataset: its study's and
 * board's team, without its author. Answers the dataset's author only (the
 * one person who changes the list); empty for anyone else.
 */
export async function datasourceCollaboratorCandidates(
  _root: unknown,
  { datasourceId }: { datasourceId: string },
  context: any
): Promise<Person[]> {
  if (!context.session?.itemId || !datasourceId) return [];
  // as the caller: the dataset read rule decides whether they may look
  const ds = await context.query.Datasource.findOne({
    where: { id: String(datasourceId) },
    query: "author { id } study { id } project { id } journal { id }",
  });
  // only the author picks collaborators, so only the author sees the team
  if (!ds || String(ds.author?.id) !== String(context.session.itemId)) return [];
  const fromJournals = await journalContexts(
    context,
    (ds.journal || []).map((j: { id: string }) => j.id)
  );
  const team = await teamProfiles(context, {
    studyIds: [ds.study?.id, ...fromJournals.studyIds].filter(Boolean),
    projectIds: [ds.project?.id, ...fromJournals.projectIds].filter(Boolean),
  });
  if (ds.author?.id) team.delete(String(ds.author.id));
  return [...team.values()].sort((a, b) =>
    String(a.username || "").localeCompare(String(b.username || ""))
  );
}
