// What someone about to join a class by code may see: the class title and
// its teacher's username. Class reads are limited to members, so the join
// page (often visited before signing in) uses this instead of GET_CLASS.
async function classJoinPreview(
  root: any,
  { code }: { code: string },
  context: any
): Promise<any> {
  if (!code) return null;
  const klass = await context.sudo().query.Class.findOne({
    where: { code },
    query: "id code title creator { username }",
  });
  if (!klass) return null;
  return {
    id: klass.id,
    code: klass.code,
    title: klass.title,
    creatorUsername: klass.creator?.username ?? null,
  };
}

export default classJoinPreview;
