// Admin Forms area. Routes:
//   /dashboard/admin-forms          → list page
//   /dashboard/admin-forms?id=xxx   → editor for that definition
//
// Gated by canManageForms or canManageUsers — non-admins see a clear
// access-denied panel rather than a blank page or a routing loop.
import styled from "styled-components";
import ListPage from "./ListPage";
import EditorPage from "./EditorPage";

const DeniedShell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 64px clamp(16px, 6vw, 64px);
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
  text-align: center;
  color: #5f6871;

  h1 {
    margin: 0;
    color: #171717;
  }
`;

function canManageForms(user) {
  const perms = user?.permissions || [];
  return perms.some(
    (p) =>
      p?.canManageForms ||
      p?.canManageUsers ||
      p?.canAccessAdminUI ||
      p?.name === "ADMIN"
  );
}

export default function AdminFormsMain({ query, user }) {
  if (!canManageForms(user)) {
    return (
      <DeniedShell>
        <h1>Admin only</h1>
        <p>
          You need the <code>canManageForms</code> permission to manage
          Connect form definitions.
        </p>
      </DeniedShell>
    );
  }
  if (query?.id) {
    return <EditorPage definitionId={query.id} />;
  }
  return <ListPage />;
}
