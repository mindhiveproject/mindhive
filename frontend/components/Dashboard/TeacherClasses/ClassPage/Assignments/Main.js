import Link from "next/link";
import { useRouter } from "next/router";
import styled from "styled-components";

import { useQuery } from "@apollo/client";
import { GET_MY_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";
import useTranslation from "next-translate/useTranslation";

import AssignmentTab from "./Tab";
import AddAssignment from "./Add";
import ViewAssignment from "./View";
import CreateAssignment from "./Create";
import EditAssignment from "./Edit";
import CopyAssignment from "./Copy";
import Overview from "../Overview/HomeworkCompletion";

// Styled button matching Figma design (Primary Action - Teal)
const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  font-family: Lato;
  font-size: 18px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.05em;
  text-align: center;
  border-radius: 100px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: #336F8A;
  color: #ffffff;
  
  &:hover {
    background: #ffc107;
    color: #1a1a1a;
  }
  
  &:active {
    background: #4db6ac;
    color: #1a1a1a;
  }
  
  &:disabled {
    background: #e0e0e0;
    color: #9e9e9e;
    cursor: not-allowed;
  }
`;

// Styled secondary button (Outline style from Figma)
const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  font-family: Lato;
  font-size: 18px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.05em;
  text-align: center;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: #ffffff;
  color: #336F8A;
  border: 1.5px solid #336F8A;
  
  &:hover {
    background: #f5f5f5;
    border-color: #b3b3b3;
    color: #666666;
  }
  
  &:active {
    background: #e0f2f1;
    border-color: #4db6ac;
    color: #4db6ac;
  }
`;

export default function Settings({ myclass, user, query }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const { action, assignment } = query;

  const { data, loading, error } = useQuery(GET_MY_CLASS_ASSIGNMENTS, {
    variables: { userId: user?.id, classId: myclass?.id },
  });
  const assignments = data?.assignments || [];

  if (action === "create") {
    return (
      <div className="assignments">
        <CreateAssignment myclass={myclass} user={user} />
      </div>
    );
  }

  if (action === "copy" && assignment) {
    return (
      <div className="assignments">
        <CopyAssignment
          code={assignment}
          myclass={myclass}
          user={user}
        />
      </div>
    );
  }

  if (action === "add") {
    return (
      <div className="assignments">
        <AddAssignment myclass={myclass} user={user} query={query} />
      </div>
    );
  }

  if (action === "overview") {
    return (
      <div className="assignments">
        <Overview
          myclass={myclass}
          user={user}
          query={query}
          assignments={assignments}
        />
      </div>
    );
  }

  if (action === "edit" && assignment) {
    return (
      <div className="assignments">
        <EditAssignment
          code={assignment}
          myclass={myclass}
          user={user}
        />
      </div>
    );
  }

  if (action === "view" && assignment) {
    return (
      <div className="assignments">
        <ViewAssignment
          code={assignment}
          myclass={myclass}
          user={user}
          query={query}
        />
      </div>
    );
  }

  if (assignments?.length === 0) {
    return (
      <div className="empty">
        <div>{t("assignment.noAssignments")}</div>
        <Link
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: {
              page: "assignments",
              action: "add",
            },
          }}
          style={{ textDecoration: 'none' }}
        >
          <PrimaryButton>{t("assignment.linkAssignments")}</PrimaryButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="assignments">
      <div className="subheader">
        <div>
          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: {
                page: "assignments",
                action: "add",
              },
            }}
            style={{ textDecoration: 'none' }}
          >
            <PrimaryButton>{t("assignment.linkAssignments")}</PrimaryButton>
          </Link>
        </div>
        <div>
          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: {
                page: "assignments",
                action: "overview",
              },
            }}
            style={{ textDecoration: 'none' }}
          >
            <SecondaryButton>{t("assignment.classHomeworkOverview")}</SecondaryButton>
          </Link>
        </div>
      </div>

      <AssignmentTab
        assignments={assignments}
        myclass={myclass}
        user={user}
      />
    </div>
  );
}
