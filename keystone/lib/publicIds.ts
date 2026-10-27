// The two public codes every account carries: publicId (random characters)
// and publicReadableId (three random words, e.g. "curious-teal-otter").
// Used when an account is created (schemas/Profile.ts) and when it is
// de-identified and given new codes (lib/purge/deidentify.ts).

import uniqid from "uniqid";
import {
  uniqueNamesGenerator,
  Config,
  adjectives as baseAdjectives,
  colors,
  animals,
} from "unique-names-generator";

const adjectives = baseAdjectives
  .filter((w) => !["booby", "tasty", "nutty"].includes(w))
  .concat(["curious", "kind"]);

const readableIdConfig: Config = {
  dictionaries: [adjectives, colors, animals],
  separator: "-",
  length: 3,
};

export function newPublicId(): string {
  return uniqid();
}

export function newPublicReadableId(): string {
  return uniqueNamesGenerator(readableIdConfig);
}
