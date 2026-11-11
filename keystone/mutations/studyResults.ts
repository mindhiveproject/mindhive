import { studyUpdateFilter } from "../access";
const { loadStudyResults } = require("../lib/studyResults");

// A study's results for its Collect page and downloads. Allowed for whoever
// may edit the study; see lib/studyResults.js.
async function studyResults(
  root: any,
  { studyId }: { studyId: string },
  context: any
): Promise<any> {
  const accessFilter = studyUpdateFilter({ session: context.session } as any);
  return loadStudyResults(context, studyId, accessFilter);
}

export default studyResults;
