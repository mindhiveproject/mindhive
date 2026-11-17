const test = require("node:test");
const assert = require("node:assert/strict");
const {
  shouldCopyResources,
  collectResourceLinks,
  classCopySettings,
  staffCanEditClassResource,
} = require("./classResourceCopies");

test("only a copy into a class template duplicates resources", () => {
  assert.equal(shouldCopyResources({ classIdTemplate: "c1" }), true);
  assert.equal(shouldCopyResources({ classIdTemplate: null }), false);
  assert.equal(shouldCopyResources({}), false);
});

test("one entry per resource, with every copied card and the board link", () => {
  const sections = [
    {
      cards: [
        { newId: "n1", resources: [{ id: "r1" }, { id: "r2" }] },
        { newId: "n2", resources: [{ id: "r1" }] },
      ],
    },
    { cards: [{ newId: "n3", resources: [] }, { resources: [{ id: "r9" }] }] },
  ];
  const links = collectResourceLinks(sections, [{ id: "r2" }, { id: "r3" }]);
  const byId = Object.fromEntries(links.map((l) => [l.sourceId, l]));
  assert.deepEqual(Object.keys(byId).sort(), ["r1", "r2", "r3"]);
  assert.deepEqual(byId.r1, { sourceId: "r1", cardIds: ["n1", "n2"], onBoard: false });
  assert.deepEqual(byId.r2, { sourceId: "r2", cardIds: ["n1"], onBoard: true });
  assert.deepEqual(byId.r3, { sourceId: "r3", cardIds: [], onBoard: true });
});

test("copy settings keep the source's options but publish to the new class only", () => {
  assert.deepEqual(
    classCopySettings({ publishedToClassIds: ["old"], foo: 1 }, "c1"),
    { foo: 1, publishedToClassIds: ["c1"] }
  );
  assert.deepEqual(classCopySettings('{"foo":2}', "c1"), {
    foo: 2,
    publishedToClassIds: ["c1"],
  });
  assert.deepEqual(classCopySettings(null, "c1"), { publishedToClassIds: ["c1"] });
});

test("staff edit custom copies of their classes, never shared originals", () => {
  const copy = { isCustom: true, classes: [{ id: "c1" }] };
  assert.equal(staffCanEditClassResource(copy, ["c1"]), true);
  assert.equal(staffCanEditClassResource(copy, ["c2"]), false);
  assert.equal(staffCanEditClassResource(copy, []), false);
  assert.equal(
    staffCanEditClassResource({ isCustom: false, classes: [{ id: "c1" }] }, ["c1"]),
    false
  );
});
