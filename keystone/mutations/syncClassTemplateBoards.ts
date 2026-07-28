import { syncClassTemplateBoards as syncClassTemplateBoardsUtil } from "./utils/classTemplateBoards";

async function syncClassTemplateBoards(
  _root: unknown,
  { classId }: { classId: string },
  context: any
) {
  const sesh = context.session;
  if (!sesh?.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  // The util writes to Class.classTemplateBoards and ProposalBoard.templatesForClass
  // via context.db (which bypasses list-level access rules), so we must gate the
  // call here. Allow: platform admins (canManageUsers) OR the class creator OR any
  // class mentor. Follow the same pattern as assertTemplateBoardTeacher in
  // resolveMilestonesForBoard.ts.
  const profile = await context.query.Profile.findOne({
    where: { id: sesh.itemId },
    query: "permissions { canManageUsers }",
  });
  const isAdmin = (profile?.permissions || []).some(
    (p: any) => p.canManageUsers
  );

  if (!isAdmin) {
    const cls = await context.query.Class.findOne({
      where: { id: classId },
      query: "id creator { id } mentors { id }",
    });
    if (!cls) {
      throw new Error("Class not found.");
    }
    const authorizedIds = [
      cls.creator?.id,
      ...(cls.mentors || []).map((m: any) => m?.id),
    ].filter(Boolean);
    if (!authorizedIds.includes(sesh.itemId)) {
      throw new Error(
        "Forbidden: only class creators, mentors, or admins can sync class template boards."
      );
    }
  }

  await syncClassTemplateBoardsUtil(context, classId);

  return context.query.Class.findOne({
    where: { id: classId },
    query: "id",
  });
}

export default syncClassTemplateBoards;
