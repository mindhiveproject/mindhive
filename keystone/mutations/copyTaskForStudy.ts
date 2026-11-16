import { copyTask } from "../lib/taskCopy";

// Make the signed-in user's own copy of a task for a study block, so the
// block keeps working the same however the original is edited later.
// The copy points back to the original through `copiedFrom` (a copy of a
// copy points to the same original) and is private. Consent comes along only
// when the user owns the task copied; otherwise it belongs to its author.
async function copyTaskForStudy(
  root: any,
  { id }: { id: string },
  context: any
) {
  return copyTask(context, id, { consent: "ifOwner", linkToOriginal: true });
}

export default copyTaskForStudy;
