import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import { GET_CLASS_ASSIGNMENTS_FOR_STUDENTS } from "../../../../Queries/Assignment";
import AssignmentTab from "./Tab";

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: #666666;
  font-family: Lato;
  font-size: 16px;
`;

export default function Settings({ myclass, user, query }) {
  const { t } = useTranslation("common");
  const { action, assignment } = query;

  const { data, loading, error } = useQuery(
    GET_CLASS_ASSIGNMENTS_FOR_STUDENTS,
    {
      variables: { classId: myclass?.id, userId: user?.id },
    }
  );
  const assignments = data?.assignments || [];

  if (loading) return <Container><div>Loading...</div></Container>;
  if (error) return <Container><div>Error: {error.message}</div></Container>;

  if (action === "view" && assignment) {
    // For now, redirect to the assignment page
    // Students view assignments at /dashboard/assignments/[code]
    window.location.href = `/dashboard/assignments/${assignment}`;
    return <Container><div>Redirecting...</div></Container>;
  }

  if (!assignments || assignments.length === 0) {
    return (
      <Container>
        <EmptyState>
          <p>{t("assignments.noAssignments") || "No assignments available"}</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <AssignmentTab
        assignments={assignments}
        myclass={myclass}
        user={user}
        query={query}
      />
    </Container>
  );
}
