// Dual-render gate for the Opportunity editor. Reads the
// NEXT_PUBLIC_USE_CUSTOMIZABLE_FORMS env flag — a comma-separated list of
// form keys to route through DefinitionForm instead of the hardcoded
// Editor.js. While the new path is incomplete (no media / rich-text
// support yet), the env flag is the kill-switch for rollback.
//
// Example values:
//   NEXT_PUBLIC_USE_CUSTOMIZABLE_FORMS=opportunity
//   NEXT_PUBLIC_USE_CUSTOMIZABLE_FORMS=opportunity,profile_individual
import OpportunityEditor from "./Editor";
import EditorDefinitionMode from "./EditorDefinitionMode";

function isEnabledFor(key) {
  const raw = process.env.NEXT_PUBLIC_USE_CUSTOMIZABLE_FORMS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(key);
}

export default function EditorSwitch(props) {
  if (isEnabledFor("opportunity")) {
    return <EditorDefinitionMode opportunityId={props.opportunityId} />;
  }
  return <OpportunityEditor {...props} />;
}
