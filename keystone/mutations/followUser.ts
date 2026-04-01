async function followUser(
  root: any,
  { userId }: { userId: string },
  context: any
): Promise<any> {
  const sesh = context.session;
  if (!sesh?.itemId) {
    throw new Error("You must be logged in to follow someone.");
  }

  const currentUserId = sesh.itemId;

  if (currentUserId === userId) {
    throw new Error("You cannot follow yourself.");
  }

  // Verify the target user exists
  const target = await context.query.Profile.findOne({
    where: { id: userId },
    query: "id",
  });
  if (!target) {
    throw new Error("User not found.");
  }

  // Prevent duplicate friendships
  const existing = await context.query.Friendship.findMany({
    where: {
      requester: { id: { equals: currentUserId } },
      recipient: { id: { equals: userId } },
    },
    query: "id",
  });
  if (existing.length > 0) {
    return existing[0];
  }

  const friendship = await context.query.Friendship.createOne({
    data: {
      requester: { connect: { id: currentUserId } },
      recipient: { connect: { id: userId } },
      status: "accepted",
    },
    query: "id requester { id } recipient { id } status",
  });

  return friendship;
}

export default followUser;
