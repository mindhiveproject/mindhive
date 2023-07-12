async function archiveStudy(
  root: any,
  {
    study,
    isArchived,
  }: {
    study: string;
    isArchived: boolean;
  },
  context: KeystoneContext
): Promise<ReportCreateInput> {
  // query the current user
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  // get the original proposal board
  const profile = await context.query.Profile.findOne({
    where: { id: sesh.itemId },
    query: "id studiesInfo",
  });

  let studiesInfo = {};
  if (
    profile.studiesInfo &&
    Object.getPrototypeOf(profile.studiesInfo) === Object.prototype &&
    Object.keys(profile.studiesInfo).length > 0
  ) {
    studiesInfo = profile.studiesInfo;
    studiesInfo[study] = {
      ...studiesInfo[study],
      hideInDevelop: isArchived,
    };
  } else {
    studiesInfo[study] = {
      hideInDevelop: isArchived,
    };
  }

  await context.db.Profile.updateOne({
    where: { id: sesh.itemId },
    data: { studiesInfo: studiesInfo },
  });

  return profile;
}

export default archiveStudy;
