// "Copy & Edit": gives the caller their own private copy of a visual they can
// read — code files, linked data sources, parameters and docs — so they can
// change it without touching the original.
//
// Deliberately left behind: the cover (stored files aren't copied) and the
// Yjs docs state (the docs editor reseeds from `docs`). The copy starts private
// and unpublished, with no collaborators, viewers or likes.

/**
 * A parameter's stream mapping points at a VisualDataSource row by id. The copy
 * gets new rows, so every such id has to follow its row to the new one.
 */
function remapSourceIds(value: any, idMap: Map<string, string>): any {
  if (Array.isArray(value)) return value.map((v) => remapSourceIds(v, idMap));
  if (value && typeof value === "object") {
    const next: any = {};
    for (const [key, v] of Object.entries(value)) {
      next[key] = remapSourceIds(v, idMap);
    }
    if (next.kind === "stream" && idMap.has(String(next.sourceId))) {
      next.sourceId = idMap.get(String(next.sourceId));
    }
    return next;
  }
  return value;
}

async function copyVisual(
  root: any,
  { id }: { id: string },
  context: any
): Promise<any> {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  // Read through the caller's own access, so only a visual they can see can be
  // copied.
  const source = await context.query.Visual.findOne({
    where: { id },
    query: `
      title description docs docsVisible parameters extensions version
      participationMode
      codeFiles(orderBy: { order: asc }) { name language role order content }
      dataSources(orderBy: { order: asc }) {
        id label order inputBindings settings block { id }
      }
    `,
  });
  if (!source) {
    throw new Error("Visual not found.");
  }

  const sudo = context.sudo();
  const copy = await sudo.db.Visual.createOne({
    data: {
      title: `${source.title} (copy)`,
      description: source.description || "",
      docs: source.docs ?? undefined,
      docsVisible: !!source.docsVisible,
      extensions: source.extensions ?? [],
      version: source.version || "1",
      participationMode: source.participationMode || "sandbox",
      privacy: "private",
      published: false,
      lastTimeEdited: new Date().toISOString(),
      author: { connect: { id: String(session.itemId) } },
    },
  });

  for (const file of source.codeFiles || []) {
    await sudo.db.VisualCodeFile.createOne({
      data: {
        visual: { connect: { id: copy.id } },
        name: file.name,
        language: file.language,
        role: file.role,
        order: file.order ?? 0,
        content: file.content || "",
        lastTimeEdited: new Date().toISOString(),
      },
    });
  }

  const idMap = new Map<string, string>();
  for (const row of source.dataSources || []) {
    const created = await sudo.db.VisualDataSource.createOne({
      data: {
        visual: { connect: { id: copy.id } },
        ...(row.block?.id ? { block: { connect: { id: row.block.id } } } : {}),
        label: row.label,
        order: row.order ?? 0,
        inputBindings: row.inputBindings ?? {},
        settings: row.settings ?? {},
      },
    });
    idMap.set(String(row.id), String(created.id));
  }

  return sudo.db.Visual.updateOne({
    where: { id: copy.id },
    data: { parameters: remapSourceIds(source.parameters, idMap) },
  });
}

export default copyVisual;
