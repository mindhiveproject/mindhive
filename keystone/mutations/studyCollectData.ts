import { studyUpdateFilter } from "../access";
const { loadStudyCollectData } = require("../lib/studyCollect");

// The Collect page's participants, guests and results for one study. Allowed
// for whoever may edit the study; see lib/studyCollect.js.
async function studyCollectData(
  root: any,
  { studyId }: { studyId: string },
  context: any
): Promise<any> {
  const accessFilter = studyUpdateFilter({ session: context.session } as any);
  return loadStudyCollectData(context, studyId, accessFilter);
}

export default studyCollectData;
