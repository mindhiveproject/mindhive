// Test helper: evaluates the subset of Keystone `where` filters our access
// rules emit (OR/AND, equals, in, not.equals, some, to-one relations) against
// plain objects, so access tests can check real rows per persona instead of
// clause shapes.

function matchesValue(value, cond) {
  if ("equals" in cond) return (value ?? null) === cond.equals;
  if ("in" in cond) return cond.in.includes(value);
  return false;
}

function matches(row, where) {
  if (where === true) return true;
  if (!where) return false;
  return Object.entries(where).every(([key, cond]) => {
    if (key === "OR") return cond.some((w) => matches(row, w));
    if (key === "AND") return cond.every((w) => matches(row, w));
    const value = row?.[key];
    if ("equals" in cond) return (value ?? null) === cond.equals;
    if ("in" in cond) return cond.in.includes(value);
    if ("not" in cond) return !matchesValue(value, cond.not);
    if ("some" in cond) return (value || []).some((v) => matches(v, cond.some));
    // a to-one relation: the nested where applies to the related row
    if (value == null) return false;
    return matches(value, cond);
  });
}

module.exports = { matches };
