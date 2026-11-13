// Whether a class follows data collection itself: its own data-collection
// milestone, turned on from the Studies tab (Class.settings
// .dataCollectionMilestone), with or without a project board template. Same
// rule as keystone/lib/studyDataCollection.js classFollowsDataCollection.
export function classFollowsDataCollection(klass) {
  let settings = klass?.settings;
  if (typeof settings === "string") {
    try {
      settings = JSON.parse(settings);
    } catch (err) {
      settings = null;
    }
  }
  return settings?.dataCollectionMilestone === true;
}
