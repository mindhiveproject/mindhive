const ROLE_CONFIG: Record<
  string,
  { permission: string; relation: "studentIn" | "mentorIn" }
> = {
  student: { permission: "STUDENT", relation: "studentIn" },
  mentor: { permission: "MENTOR", relation: "mentorIn" },
};

// Join a class by its code as a student or mentor. Profile.permissions is
// admin-only in the generated API, so the role grant happens here with sudo,
// limited to the role that matches the membership being created.
async function joinClass(
  root: any,
  { classCode, role }: { classCode: string; role: string },
  context: any
): Promise<any> {
  const me = context.session?.itemId;
  if (!me) {
    throw new Error("You must be logged in to join a class.");
  }

  const config = ROLE_CONFIG[role];
  if (!config) {
    throw new Error("Unsupported role.");
  }

  const klass = await context.sudo().query.Class.findOne({
    where: { code: classCode },
    query: "id",
  });
  if (!klass) {
    throw new Error("Class not found.");
  }

  // Profile.afterOperation syncs new mentors as round reviewers.
  const profile = await context.sudo().query.Profile.updateOne({
    where: { id: me },
    data: {
      permissions: { connect: [{ name: config.permission }] },
      [config.relation]: { connect: [{ id: klass.id }] },
    },
    query: "id",
  });

  return profile;
}

export default joinClass;
