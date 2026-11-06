const { loadClassDashboardStudies } = require("../lib/classDashboard");

// The studies of a class for its teacher dashboard. Allowed for whoever may
// read the class; see lib/classDashboard.js.
async function classDashboardStudies(
  root: any,
  { classId }: { classId: string },
  context: any
): Promise<any> {
  return loadClassDashboardStudies(context, classId);
}

export default classDashboardStudies;
