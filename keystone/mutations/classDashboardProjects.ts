const { loadClassDashboardProjects } = require("../lib/classDashboard");

// Local Keystone runs on SQLite, which stores JSON fields as text (keystone.ts).
const jsonAsText = process.env.NODE_ENV === "development";

// The project boards of a class for its teacher dashboard. Allowed for whoever
// may read the class; see lib/classDashboard.js.
async function classDashboardProjects(
  root: any,
  { classId }: { classId: string },
  context: any
): Promise<any> {
  return loadClassDashboardProjects(context, classId, jsonAsText);
}

export default classDashboardProjects;
