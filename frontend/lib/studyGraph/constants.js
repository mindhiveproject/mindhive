// The study design graph drawn in the Study Builder, independent of the
// canvas library that renders it.
//
//   graph = {
//     nodes: [{ id, type, position: { x, y }, data }],
//     edges: [{ id, source, sourceHandle, target, targetHandle }],
//     viewport: { x, y, zoom },
//   }
//
// The order of `edges` matters: when a handle has more than one link (only
// possible in designs saved before the one-link rule), the blocks run in that
// order. Plain CommonJS so the collaboration server can require it as well.

const NODE_TYPES = {
  ANCHOR: "anchor",
  TASK: "task",
  DESIGN: "design",
  COMMENT: "comment",
};

// Node `type` as stored in the saved diagram and in study.flow. The study
// runtime (Studies/Run/Manager.js) reads these, so they never change.
const LEGACY_TYPES = {
  anchor: "my-anchor",
  task: "my-node",
  design: "design",
  comment: "my-comment",
};

const TYPE_FROM_LEGACY = Object.fromEntries(
  Object.entries(LEGACY_TYPES).map(([type, legacy]) => [legacy, type])
);

const IN_HANDLE = "in";
const OUT_HANDLE = "out";

// Links one output may have. A starting point or task block leads to one
// next block, and so does each condition of a between-subjects design block.
const MAX_LINKS_PER_OUTPUT = 1;

// Task fields kept on the block (and copied into study.flow)
const TASK_FIELDS = [
  "name",
  "details",
  "componentID",
  "testId",
  "taskType",
  "subtitle",
  "createCopy",
  "askDataUsageQuestion",
];

const CONDITION_FIELDS = [
  "name",
  "label",
  "probability",
  "assignmentType",
  "rule",
];

module.exports = {
  NODE_TYPES,
  LEGACY_TYPES,
  TYPE_FROM_LEGACY,
  IN_HANDLE,
  OUT_HANDLE,
  MAX_LINKS_PER_OUTPUT,
  TASK_FIELDS,
  CONDITION_FIELDS,
};
