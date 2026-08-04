import OpportunitiesList from "./List";
import EditorDefinitionMode from "./EditorDefinitionMode";
import RoleGuard from "../../Connect/RoleGuard";

export default function OpportunitiesMain({ query, user }) {
  const { op } = query;

  return (
    <RoleGuard allow={["sponsor"]}>
      {op ? (
        <EditorDefinitionMode opportunityId={op} />
      ) : (
        <OpportunitiesList query={query} user={user} />
      )}
    </RoleGuard>
  );
}
