// Between-subjects conditions at run time. Study.components counts the
// participants assigned to each condition, keyed by the condition's `name`
// (its id), so renaming a condition keeps its count. Runs recorded before
// that were counted by `label`; those counts still add up while the label
// is unchanged.

/** Participants already assigned to a condition. */
function conditionCount(components, condition) {
  const byName = Number(components?.[condition?.name]) || 0;
  const byLabel =
    condition?.label && condition.label !== condition.name
      ? Number(components?.[condition.label]) || 0
      : 0;
  return byName + byLabel;
}

/**
 * Picks a condition at random, weighted by the places each one has left
 * (its probability minus the participants it already has). When every
 * condition is full the places are scaled up until one has room.
 */
function selectCondition({ conditions, components, random = Math.random }) {
  const list = conditions || [];
  const places = (multiplier) =>
    list
      .map((condition, num) => {
        const placesLeft =
          parseInt(condition?.probability * multiplier, 10) -
          conditionCount(components, condition);
        // a missing probability gives no places
        return Number.isFinite(placesLeft) && placesLeft > 0
          ? Array(placesLeft).fill(num)
          : [];
      })
      .flat();

  let pool = places(1);
  // conditions all set to 0% never get room; fall back to an even split
  for (let multiplier = 2; pool.length === 0 && multiplier < 10000; multiplier += 1) {
    pool = places(multiplier);
  }
  const conditionNumber = pool.length
    ? pool[Math.floor(random() * pool.length)]
    : Math.floor(random() * list.length);
  return {
    conditionName: list[conditionNumber]?.name,
    conditionLabel: list[conditionNumber]?.label,
  };
}

/**
 * The flow of the condition a participant was assigned to, found by the
 * condition's name, or by its label for paths recorded before names were
 * stored.
 */
function conditionFlow(conditions, { conditionName, conditionLabel } = {}) {
  const list = conditions || [];
  const match =
    (conditionName && list.find((c) => c?.name === conditionName)) ||
    (conditionLabel && list.find((c) => c?.label === conditionLabel));
  return match?.flow;
}

module.exports = { conditionCount, selectCondition, conditionFlow };
