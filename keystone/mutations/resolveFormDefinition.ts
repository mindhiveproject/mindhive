// Resolve the most-specific published FormDefinition for a given key.
//
// Lookup precedence (most-specific first):
//   1. scope=class_network + matching classNetworkId
//   2. scope=organization  + matching organizationId
//   3. scope=global        (fallback)
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
  }: {
    key: string;
    organizationId?: string | null;
    classNetworkId?: string | null;
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

  // 1. class_network — most specific
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

  // 2. organization
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

  // 3. global fallback
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
