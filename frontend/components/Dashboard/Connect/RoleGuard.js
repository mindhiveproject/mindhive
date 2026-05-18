import Link from "next/link";
import styled from "styled-components";
import { Icon } from "semantic-ui-react";

import useConnectRole from "./useConnectRole";

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
  }
`;

const ROLE_LABELS = {
  student: "students",
  mentor: "mentors",
  teacher: "teachers",
  admin: "admins",
};

export default function RoleGuard({ allow, children }) {
  const roles = useConnectRole();
  const allowed = (allow || []).some((r) => {
    if (r === "admin") return roles.isAdmin;
    if (r === "teacher") return roles.isTeacher;
    if (r === "mentor") return roles.isMentor;
    if (r === "student") return roles.isStudent;
    return false;
  });

  // Admins always pass — they need to administer everything
  if (roles.isAdmin || allowed) {
    return children;
  }

  const labels = (allow || []).map((r) => ROLE_LABELS[r] || r).join(", ");

  return (
    <Shell>
      <Icon name="lock" size="big" style={{ color: "#5f6871" }} />
      <h1>This area is for {labels}</h1>
      <p>
        Your account doesn&apos;t have access to this section yet. If you
        think this is a mistake, ask your teacher or an administrator.
      </p>
      <Link href="/dashboard/connect">Back to Connect</Link>
    </Shell>
  );
}
