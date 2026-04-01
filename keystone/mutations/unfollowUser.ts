async function unfollowUser(
  root: any,
  { userId }: { userId: string },
  context: any
): Promise<boolean> {
  const sesh = context.session;
  if (!sesh?.itemId) {
    throw new Error("You must be logged in to unfollow someone.");
  }

  const currentUserId = sesh.itemId;

  const existing = await context.query.Friendship.findMany({
    where: {
      requester: { id: { equals: currentUserId } },
      recipient: { id: { equals: userId } },
    },
    query: "id",
  });

  if (existing.length === 0) {
    // Not following — treat as a no-op success
    return false;
  }

  await context.query.Friendship.deleteOne({
    where: { id: existing[0].id },
  });

  return true;
}

export default unfollowUser;
