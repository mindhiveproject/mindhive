import Link from "next/link";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import useConnectRole from "./useConnectRole";

function LockIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5f6871"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 64px clamp(16px, 6vw, 64px);
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
  align-items: center;
  text-align: center;

  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 28px;
    font-weight: 600;
    color: #171717;
  }

  p {
    margin: 0;
    color: #5f6871;
    font-size: 14px;
    max-width: 480px;
  }

  a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 100px;
    border: 1px solid #336f8a;
    background: #336f8a;
    color: #ffffff;
    font-family: "Nunito", sans-serif;
    font-weight: 600;
    font-size: 14px;
    text-decoration: none;

    &:focus-visible {
      outline: 2px solid #171717;
      outline-offset: 2px;
    }
  }
`;

const ROLE_KEYS = {
  student: "roleGuard.roles.student",
  mentor: "roleGuard.roles.mentor",
  teacher: "roleGuard.roles.teacher",
  admin: "roleGuard.roles.admin",
};

const ROLE_DEFAULTS = {
  student: "students",
  mentor: "mentors",
  teacher: "teachers",
  admin: "admins",
};

export default function RoleGuard({ allow, children }) {
  const { t } = useTranslation("connect");
  const roles = useConnectRole();
  const allowed = (allow || []).some((r) => {
    if (r === "admin") return roles.isAdmin;
    if (r === "teacher") return roles.isTeacher;
    if (r === "mentor") return roles.isMentor;
    if (r === "student") return roles.isStudent;
    return false;
  });

  if (roles.isAdmin || allowed) {
    return children;
  }

  const labels = (allow || [])
    .map((r) =>
      t(ROLE_KEYS[r] || r, {}, { default: ROLE_DEFAULTS[r] || r })
    )
    .join(", ");

  return (
    <Shell role="alert">
      <LockIcon />
      <h1>
        {t("roleGuard.title", { roles: labels }, {
          default: "This area is for {{roles}}",
        })}
      </h1>
      <p>
        {t("roleGuard.description", {}, {
          default:
            "Your account doesn't have access to this section yet. If you think this is a mistake, ask your teacher or an administrator.",
        })}
      </p>
      <Link href="/dashboard/connect">
        {t("roleGuard.backLink", {}, { default: "Back to Connect" })}
      </Link>
    </Shell>
  );
}
