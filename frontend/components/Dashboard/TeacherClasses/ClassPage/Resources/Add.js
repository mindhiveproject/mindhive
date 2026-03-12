import Link from "next/link";
import { useRouter } from "next/router";
import moment from "moment";
import { useQuery, useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import Button from "../../../../DesignSystem/Button";
import { GET_MY_RESOURCES, GET_PUBLIC_RESOURCES, GET_CLASS_RESOURCES } from "../../../../Queries/Resource";
import { UPDATE_RESOURCE } from "../../../../Mutations/Resource";

const SectionContainer = styled.div`
  margin-bottom: 48px;
  .ag-theme-quartz .ag-cell-value {
    line-height: 1.2;
  }
`;

const SectionTitle = styled.h2`
  font-family: Lato;
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16px;
`;

const SectionDescription = styled.p`
  font-family: Lato;
  font-size: 16px;
  color: #666666;
  margin-bottom: 16px;
`;

const TopSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;
`;

export default function AddResource({ myclass, user, query }) {
  const router = useRouter();
  const { t } = useTranslation("classes");

  const { data: classResourcesData } = useQuery(GET_CLASS_RESOURCES, {
    variables: { classId: myclass?.id },
    fetchPolicy: "cache-and-network",
  });
  const alreadyLinkedIds = new Set(
    (classResourcesData?.resources || []).map((r) => r?.id).filter(Boolean)
  );

  const { data: myData } = useQuery(GET_MY_RESOURCES, {
    variables: { id: user?.id },
    skip: !user?.id,
    fetchPolicy: "cache-and-network",
  });
  const { data: publicData } = useQuery(GET_PUBLIC_RESOURCES, {
    fetchPolicy: "cache-and-network",
  });

  const myResources = myData?.resources || [];
  const publicResources = publicData?.resources || [];
  // Union: resources the user owns + resources already linked to this class (prefer my when same id)
  const byId = new Map();
  myResources.forEach((r) => r?.id && byId.set(r.id, r));
  (classResourcesData?.resources || []).forEach((r) => {
    if (r?.id && !byId.has(r.id)) byId.set(r.id, r);
  });
  const myResourcesUnionClass = Array.from(byId.values());

  const [updateResource, { loading: linkUnlinkLoading }] = useMutation(UPDATE_RESOURCE, {
    refetchQueries: [
      { query: GET_CLASS_RESOURCES, variables: { classId: myclass?.id } },
      { query: GET_MY_RESOURCES, variables: { id: user?.id } },
      { query: GET_PUBLIC_RESOURCES },
    ],
    awaitRefetchQueries: true,
  });

  const handleLinkToClass = async (resourceId) => {
    if (!resourceId || !myclass?.id) return;
    try {
      await updateResource({
        variables: {
          id: resourceId,
          classes: { connect: [{ id: myclass.id }] },
        },
      });
    } catch (err) {
      alert(err?.message || t("resource.linkError", "Failed to link resource."));
    }
  };

  const handleUnlinkFromClass = async (resourceId) => {
    if (!resourceId || !myclass?.id) return;
    try {
      await updateResource({
        variables: {
          id: resourceId,
          classes: { disconnect: [{ id: myclass.id }] },
        },
      });
    } catch (err) {
      alert(err?.message || t("resource.unlinkError", "Failed to unlink resource."));
    }
  };

  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  };

  const columnDefs = [
    {
      field: "title",
      headerName: t("resource.title", "Title"),
      valueGetter: (params) => stripHtml(params?.data?.title || ""),
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 2,
      wrapText: true,
      autoHeight: true,
    },
    {
      field: "author",
      headerName: t("resource.creator", "Creator"),
      valueGetter: (params) => params?.data?.author?.username || "",
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1,
    },
    {
      field: "createdAt",
      headerName: t("resource.dateCreated", "Date created"),
      valueGetter: (params) => params?.data?.createdAt || null,
      valueFormatter: (params) =>
        params.value ? moment(params.value).format("MMMM D, YYYY") : "",
      filter: "agDateColumnFilter",
      sortable: true,
      flex: 1,
    },
    {
      field: "action",
      headerName: t("resource.action", "Action"),
      cellRenderer: (params) => {
        const resource = params?.data;
        const id = resource?.id;
        const isLinked = alreadyLinkedIds.has(id);
        const buttonStyle = { height: "32px", padding: "0px 12px", fontSize: "12px" };
        if (isLinked) {
          return (
            <Button
              variant="outline"
              type="button"
              style={buttonStyle}
              disabled={linkUnlinkLoading}
              onClick={() => handleUnlinkFromClass(id)}
            >
              {t("resource.unlinkFromClass", "Unlink")}
            </Button>
          );
        }
        return (
          <Button
            variant="filled"
            type="button"
            style={buttonStyle}
            disabled={linkUnlinkLoading}
            onClick={() => handleLinkToClass(id)}
          >
            {t("resource.linkToClass", "Link to class")}
          </Button>
        );
      },
      suppressFilter: true,
      sortable: false,
      width: 140,
    },
  ];

  const pagination = true;
  const paginationPageSize = 50;
  const paginationPageSizeSelector = [ 50, 100, 200, 500, 1000];
  const autoSizeStrategy = { type: "fitGridWidth", defaultMinWidth: 100 };

  return (
    <div className="resources add">
      <TopSection>
        <Button
          variant="outline"
          onClick={() =>
            router.push({
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: { page: "resources" },
            })
          }
        >
          {t("resource.goBackToResources", "Back to resources")}
        </Button>
      </TopSection>

      {/* Create from scratch section */}
      <SectionContainer>
        <SectionTitle>{t("resource.startFromScratch", "Create from scratch")}</SectionTitle>
        <SectionDescription>
          {t("resource.startFromScratchDescription", "Create a new resource and add it to this class.")}
        </SectionDescription>
        <ButtonWrapper>
          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: {
                page: "resources",
                action: "create",
              },
            }}
            style={{ textDecoration: "none" }}
          >
            <Button variant="filled">{t("resource.createFromScratch", "Create from scratch")}</Button>
          </Link>
        </ButtonWrapper>
      </SectionContainer>

      {/* Add your resources to this class */}
      <SectionContainer>
        <SectionTitle>{t("resource.addResourcesTitle", "Add your resources to this class")}</SectionTitle>
        <SectionDescription>
          {t("resource.addResourcesDescription", "Select resources below to link them to this class. Linked resources can be published to students.")}
        </SectionDescription>
        {myResourcesUnionClass.length === 0 ? (
          <p style={{ color: "#999", fontStyle: "italic" }}>
            {t("resource.noResourcesToLink", "No resources available to link.")}
          </p>
        ) : (
          <div className="ag-theme-quartz" style={{ height: 500, width: "100%" }}>
            <AgGridReact
              rowData={myResourcesUnionClass}
              columnDefs={columnDefs}
              getRowId={(params) => params.data?.id}
              pagination={pagination}
              paginationPageSize={paginationPageSize}
              paginationPageSizeSelector={paginationPageSizeSelector}
              autoSizeStrategy={autoSizeStrategy}
              defaultColDef={{ resizable: true, sortable: true, filter: true }}
            />
          </div>
        )}
      </SectionContainer>

      {/* Public resources section */}
      <SectionContainer>
        <SectionTitle>{t("resource.publicResourcesTitle", "Add a public resource")}</SectionTitle>
        <SectionDescription>
          {t("resource.publicResourcesDescription", "Link public resources shared by the community to this class.")}
        </SectionDescription>
        {publicResources.length === 0 ? (
          <p style={{ color: "#999", fontStyle: "italic" }}>
            {t("resource.noPublicResourcesToLink", "No public resources available to link.")}
          </p>
        ) : (
          <div className="ag-theme-quartz" style={{ height: 500, width: "100%" }}>
            <AgGridReact
              rowData={publicResources}
              columnDefs={columnDefs}
              getRowId={(params) => params.data?.id}
              pagination={pagination}
              paginationPageSize={paginationPageSize}
              paginationPageSizeSelector={paginationPageSizeSelector}
              autoSizeStrategy={autoSizeStrategy}
              defaultColDef={{ resizable: true, sortable: true, filter: true }}
            />
          </div>
        )}
      </SectionContainer>
    </div>
  );
}
