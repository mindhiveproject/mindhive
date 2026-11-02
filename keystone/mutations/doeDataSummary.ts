import { isAdmin } from "../access";
import { countDoeData, findDoeData, DoeScope } from "../lib/doe/findDoeData";
import { normalizeDbn } from "../lib/doe/doe";

// How much DOE data a scope holds: all DOE classes, one school (DBN) or one
// person. Counts only, for admins checking a scope before deletion and
// confirming afterwards that nothing is left. canManageUsers or
// canDeleteDoeData.
async function doeDataSummary(
  root: any,
  { school, profileId }: { school?: string | null; profileId?: string | null },
  context: any
) {
  const canDelete = (context.session?.data?.permissions || []).some(
    (p: any) => p?.canDeleteDoeData
  );
  if (!isAdmin({ session: context.session } as any) && !canDelete) {
    throw new Error("Forbidden: canManageUsers or canDeleteDoeData required.");
  }
  if (school && profileId) {
    throw new Error("Pass a school or a profileId, not both.");
  }
  const scope: DoeScope = profileId
    ? { profileId }
    : school
    ? { school: normalizeDbn(school) }
    : { all: true };
  return countDoeData(await findDoeData(context.prisma, scope));
}

export default doeDataSummary;
