/** Build the favorited-team-projects line for classmate pick limit copy. */
export function buildFavoritedTeamProjectsNote(teamEligibleOpps, t) {
  const opps = [...(teamEligibleOpps || [])].sort(
    (a, b) => (b.teamSize || 1) - (a.teamSize || 1),
  );
  if (!opps.length) return null;

  const projectList = opps
    .map((opp) =>
      t(
        "opportunities.studentView.rankForm.classmatesTeamProjectLimitItem",
        {
          title: opp.title,
          teamSize: opp.teamSize,
          picks: (opp.teamSize || 1) - 1,
        },
        {
          default: "{{title}} (top {{picks}} count, team of {{teamSize}})",
        },
      ),
    )
    .join("; ");

  return t(
    "opportunities.studentView.rankForm.classmatesFavoritedTeamProjectsNote",
    { projectList },
    {
      default:
        "Your favorited team projects: {{projectList}}. Your highlighted limit uses the largest team size among them — classmates who favorited different projects may see a different number.",
    },
  );
}
