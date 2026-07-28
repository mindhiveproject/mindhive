import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

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

function canManageMilestones(user) {
  const perms = user?.permissions || [];
  return perms.some(
    (p) =>
      p?.canManageForms ||
      p?.canManageUsers ||
      p?.canAccessAdminUI ||
      p?.name === "ADMIN"
  );
}

export default function AdminMilestonesMain({ query, user }) {
  const { t } = useTranslation("dashboard");

  if (!canManageMilestones(user)) {
    return (
      <DeniedShell>
        <h1>{t("adminMilestones.accessDeniedTitle", {}, { default: "Admin only" })}</h1>
        <p>
          {t(
            "adminMilestones.accessDeniedBody",
            {},
            {
              default:
                "You need the canManageForms permission to manage milestones.",
            }
          )}
        </p>
      </DeniedShell>
    );
  }

  if (query?.id) {
    return <EditorPage milestoneId={query.id} />;
  }

  return <ListPage />;
}
