// Relationship field hooks that keep links the editor cannot see.
//
// Since the access hardening, an editor may see only part of a relationship
// (e.g. only the classes they belong to). Saving with `set` replaces the whole
// list, so the frontend's "save the list I see" silently unlinked the rest
// (a study collaborator outside a class removed the study from that class; a
// co-teacher editing a shared assignment removed it from other classes).
// These hooks put the existing links the editor cannot read back into the
// write. Links the editor can read behave exactly as before.

/** To-many fields: re-add hidden existing links to a `set` write. */
export function keepHiddenLinksOnSet(targetListKey: string) {
  return async ({
    operation,
    resolvedData,
    item,
    context,
    listKey,
    fieldKey,
  }: any) => {
    const value = resolvedData?.[fieldKey];
    if (operation !== "update" || !value?.set || !item?.id) return value;
    const current = await context.sudo().query[listKey].findOne({
      where: { id: String(item.id) },
      query: `${fieldKey} { id }`,
    });
    const currentIds: string[] = (current?.[fieldKey] || []).map((link: any) =>
      String(link.id)
    );
    if (!currentIds.length) return value;
    // Read as the editor: what they can't read is what they couldn't see.
    const visible = await context.query[targetListKey].findMany({
      where: { id: { in: currentIds } },
      query: "id",
    });
    const visibleIds = new Set(visible.map((row: any) => String(row.id)));
    const hidden = currentIds.filter((id) => !visibleIds.has(id));
    if (!hidden.length) return value;
    const inSet = new Set(value.set.map((where: any) => String(where?.id)));
    return {
      ...value,
      set: [
        ...value.set,
        ...hidden.filter((id) => !inSet.has(id)).map((id) => ({ id })),
      ],
    };
  };
}

/** To-one fields: ignore a `disconnect` of a link the editor cannot see. */
export function keepHiddenLinkOnDisconnect(targetListKey: string) {
  return async ({
    operation,
    resolvedData,
    item,
    context,
    fieldKey,
  }: any) => {
    const value = resolvedData?.[fieldKey];
    if (operation !== "update" || !value?.disconnect || !item) return value;
    const currentId = item[`${fieldKey}Id`];
    if (!currentId) return value;
    const visible = await context.query[targetListKey].count({
      where: { id: { equals: String(currentId) } },
    });
    return visible ? value : undefined;
  };
}
