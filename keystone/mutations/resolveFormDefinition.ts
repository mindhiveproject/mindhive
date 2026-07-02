// Resolve the most-specific published FormDefinition for a given key.
//
// Lookup precedence (most-specific first):
//   1. scope=project_board  + matching proposalBoardId
//   2. scope=class_network  + matching classNetworkId
//   3. scope=organization   + matching organizationId
//   4. scope=global         (fallback)
//
// When multiple versions of the same row exist, returns the highest
// version. Returns null when nothing is published at any scope.
//
// Returns the raw Keystone item so downstream selection sets (cards,
// nested fields, audit relationships) resolve automatically via the
// auto-generated list resolvers.
async function resolveFormDefinition(
  root: any,
  {
    key,
    organizationId,
    classNetworkId,
    proposalBoardId,
  }: {
    key: string;
    organizationId?: string | null;
    classNetworkId?: string | null;
    proposalBoardId?: string | null;
  },
  context: any
) {
  if (!key) {
    throw new Error("resolveFormDefinition: key is required");
  }

  const baseFilter = {
    key: { equals: key },
    status: { equals: "published" },
  };

  const orderBy = [{ version: "desc" as const }];

  // 1. project_board — most specific. A form scoped to a template
  // board should ALSO resolve for the students whose boards clone that
  // template. We resolve by walking one level of `clonedFrom`: the
  // student's board id gets extended with its template's id so the
  // resolver finds the template-scoped form.
  if (proposalBoardId) {
    const candidateBoardIds: string[] = [String(proposalBoardId)];
    const board = await context.db.ProposalBoard.findOne({
      where: { id: String(proposalBoardId) },
    });
    if (board?.clonedFromId) {
      candidateBoardIds.push(String(board.clonedFromId));
    }

    const [boardMatch] = await context.db.FormDefinition.findMany({
      where: {
        ...baseFilter,
        scope: { equals: "project_board" },
        proposalBoard: { id: { in: candidateBoardIds } },
      },
      orderBy,
      take: 1,
    });
    if (boardMatch) return boardMatch;
  }

  // 2. class_network
  if (classNetworkId) {
    const [networkMatch] = await context.db.FormDefinition.findMany({
      where: {
        ...baseFilter,
        scope: { equals: "class_network" },
        classNetwork: { id: { equals: classNetworkId } },
      },
      orderBy,
      take: 1,
    });
    if (networkMatch) return networkMatch;
  }

  // 3. organization
  if (organizationId) {
    const [orgMatch] = await context.db.FormDefinition.findMany({
      where: {
        ...baseFilter,
        scope: { equals: "organization" },
        organization: { id: { equals: organizationId } },
      },
      orderBy,
      take: 1,
    });
    if (orgMatch) return orgMatch;
  }

  // 4. global fallback
  const [globalMatch] = await context.db.FormDefinition.findMany({
    where: {
      ...baseFilter,
      scope: { equals: "global" },
    },
    orderBy,
    take: 1,
  });
  return globalMatch ?? null;
}

export default resolveFormDefinition;
