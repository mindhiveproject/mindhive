// A visual's data sources are its own rows (VisualDataSource), and its stream
// mappings point at those. Inside a study the devices belong to the study
// (StudyDataSource), so each visual source stands for the study's source of
// the same catalog block — paired in order when a block is linked twice.

/**
 * @param {Array<{ id: string, block: { id: string } }>} visualSources
 * @param {Array<{ id: string, block: { id: string } }>} studySources
 * @returns {Record<string, object>} The study source for each visual source
 *   id; absent where the study hasn't linked that block.
 */
export function matchStudySources(visualSources, studySources) {
  const unused = [...(studySources || [])];
  const matched = {};
  for (const source of visualSources || []) {
    const index = unused.findIndex((row) => row.block?.id === source.block?.id);
    if (index === -1) continue;
    [matched[source.id]] = unused.splice(index, 1);
  }
  return matched;
}
