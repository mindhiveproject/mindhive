import QuestionsList from "./List";
import QuestionEditor from "./Editor";
import RoleGuard from "../RoleGuard";

export default function QuestionsMain({ query, user }) {
  const { q } = query;

  return (
    <RoleGuard allow={["admin", "teacher"]}>
      {q ? (
        <QuestionEditor query={query} user={user} questionId={q} />
      ) : (
        <QuestionsList query={query} user={user} />
      )}
    </RoleGuard>
  );
}
