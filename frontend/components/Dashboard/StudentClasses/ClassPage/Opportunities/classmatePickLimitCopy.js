/** Build the favorited-team-projects line for classmate pick limit copy. */
export function getLargestTeamOpportunity(teamEligibleOpps) {
  const opps = [...(teamEligibleOpps || [])].sort(
    (a, b) => (b.teamSize || 1) - (a.teamSize || 1),
  );
  return opps[0] || null;
}

export function buildFavoritedTeamProjectsNote(teamEligibleOpps, t) {
  const biggest = getLargestTeamOpportunity(teamEligibleOpps);
  if (!biggest) return null;

  const teamSize = biggest.teamSize || 1;
  const picks = Math.max(teamSize - 1, 0);

  return t(
    "opportunities.studentView.rankForm.classmatesFavoritedTeamProjectsNote",
    {
      title: biggest.title,
      teamSize,
      picks,
    },
    {
      default:
        "Example: {{title}} (team of {{teamSize}}) — {{picks}} top spots are highlighted. Classmates who favorited different projects may see a different number.",
    },
  );
}
