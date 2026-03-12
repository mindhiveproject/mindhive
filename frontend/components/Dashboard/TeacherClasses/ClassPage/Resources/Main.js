import Link from "next/link";
import styled from "styled-components";

import { useQuery } from "@apollo/client";
import { GET_CLASS_RESOURCES } from "../../../../Queries/Resource";
import useTranslation from "next-translate/useTranslation";

import ResourceTab from "./Tab";
import AddResource from "./Add";
import ViewResource from "./View";
import EditResource from "./Edit";
import CreateResource from "./Create";

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

  background: #336f8a;
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

export default function ClassResources({ myclass, user, query }) {
  const { t } = useTranslation("classes");
  const { action, resource: resourceId } = query;

  const { data, loading, error } = useQuery(GET_CLASS_RESOURCES, {
    variables: { classId: myclass?.id },
    fetchPolicy: "cache-and-network",
  });
  const resources = data?.resources || [];

  if (action === "create") {
    return (
      <div className="resources">
        <CreateResource myclass={myclass} user={user} />
      </div>
    );
  }

  if (action === "add") {
    return (
      <div className="resources">
        <AddResource myclass={myclass} user={user} query={query} />
      </div>
    );
  }















  
  if (action === "edit" && resourceId) {
    return (
      <div className="resources">
        <EditResource
          resourceId={resourceId}
          myclass={myclass}
          user={user}
        />
      </div>
    );
  }

















  if (action === "view" && resourceId) {
    return (
      <div className="resources">
        <ViewResource
          resourceId={resourceId}
          myclass={myclass}
          user={user}
          query={query}
        />
      </div>
    );
  }















  
  if (resources?.length === 0) {
    return (
      <div className="empty">
        <div>{t("resource.noResources", "No resources linked to this class yet.")}</div>
        <Link
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: {
              page: "resources",
              action: "add",
            },
          }}
          style={{ textDecoration: "none" }}
        >
          <PrimaryButton>{t("resource.addResources", "Add resources")}</PrimaryButton>
        </Link>
      </div>
    );
  }















  
  return (
    <div className="resources">
      <div className="subheader">
        <div>
          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: {
                page: "resources",
                action: "add",
              },
            }}
            style={{ textDecoration: "none" }}
          >
            <PrimaryButton>{t("resource.addResources", "Add resources")}</PrimaryButton>
          </Link>
        </div>
      </div>

      <ResourceTab
        resources={resources}
        myclass={myclass}
        user={user}
      />
    </div>
  );
}
