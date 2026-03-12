import { useState, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import moment from "moment";
import { useMutation, useApolloClient } from "@apollo/client";
import { Button, Modal } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { AgGridReact } from "ag-grid-react";

import { UPDATE_RESOURCE, DELETE_RESOURCE, CREATE_RESOURCE, SET_RESOURCE_TEMPLATE_CARDS, mergeResourceSettings, isPublishedToClassId } from "../../../../Mutations/Resource";
import { GET_CLASS_RESOURCES, GET_RESOURCE } from "../../../../Queries/Resource";
import ConnectResourceToCardModal from "./ConnectResourceToCardModal";
import DropdownMenu from "../../../../DesignSystem/DropdownMenu";
import Chip from "../../../../DesignSystem/Chip";

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-family: Lato;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  text-align: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
  color: #434343;
  border: 1.5px solid #625B71;
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

const LinkedCardsToggleButton = styled(SecondaryButton)`
  ${(props) =>
    props.$active &&
    `
    background: #DEF8FB;
    border-color: #625B71;
    color: #434343;
    &:hover { background: #DEF8FB; border-color: #625B71; color: #434343; }
    &:active { background: #DEF8FB; border-color: #625B71; color: #434343; }
  `}
`;

const EditButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-family: Lato;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0.05em;
  text-align: center;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;
  color: #5D5763;
  border: 1.5px solid #5D5763;
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

const StatusChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 8px;
  font-family: Lato;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  white-space: nowrap;
  border: 1.5px solid;
  background: transparent;
  ${(props) =>
    props.$isPublished
      ? `
    background: #def8fb;
    border-color: #625b71;
    color: #434343;
  `
      : `
    background: #f3f3f3;
    border-color: #616161;
    color: #616161;
  `}
`;

const LinkedCardChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 8px;
  font-family: Lato;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
  border: 1px solid #625B71;
  background: ${(props) => (props.$placeholder ? "#D8D3E7" : "#F5F5F5")};
  color: #434343;
  margin: 2px 4px 2px 0;
`;

const styledChipPublished = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  height: "32px",
  boxSizing: "border-box",
  justifyContent: "center",
  flexShrink: "0",
  borderRadius: "8px",
  background: "#DEF8FB",
  border: "1px solid #625B71",
  maxWidth: "100%",
  wordBreak: "break-word",
  cursor: "pointer",
  fontFamily: "Lato",
  fontSize: "14px",
  fontWeight: 400,
  color: "#434343",
};

const styledChipUnpublished = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  height: "32px",
  boxSizing: "border-box",
  justifyContent: "center",
  flexShrink: "0",
  borderRadius: "8px",
  background: "#F3F3F3",
  border: "1px solid var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
  maxWidth: "100%",
  wordBreak: "break-word",
  cursor: "pointer",
  fontFamily: "Lato",
  fontSize: "14px",
  fontWeight: 400,
  color: "#434343",
};

export default function ResourceTab({ resources, myclass, user }) {
  const classId = myclass?.id;
  const getIsPublishedForThisClass = (resource) => isPublishedToClassId(resource?.settings, classId);
  const { t } = useTranslation("classes");
  const router = useRouter();

  const [selectedPublishedFilter, setSelectedPublishedFilter] = useState(null);
  const [linkedCardFilter, setLinkedCardFilter] = useState(null);
  const [showLinkedToCardColumn, setShowLinkedToCardColumn] = useState(false);
  const [showClassNetworkColumn, setShowClassNetworkColumn] = useState(false);
  const [resourceForConnectModal, setResourceForConnectModal] = useState(null);
  const [resourceForPublishModal, setResourceForPublishModal] = useState(null);
  const [updatingStatusResourceId, setUpdatingStatusResourceId] = useState(null);
  const [copyingResourceId, setCopyingResourceId] = useState(null);
  const gridRef = useRef(null);
  const client = useApolloClient();

  const refetchClassResources = () =>
    client.refetchQueries({
      include: [{ query: GET_CLASS_RESOURCES, variables: { classId: myclass?.id } }],
    });

  const [updateResource] = useMutation(UPDATE_RESOURCE, {
    refetchQueries: [{ query: GET_CLASS_RESOURCES, variables: { classId: myclass?.id } }],
  });

  const [deleteResource] = useMutation(DELETE_RESOURCE, {
    refetchQueries: [{ query: GET_CLASS_RESOURCES, variables: { classId: myclass?.id } }],
  });

  const [createResource] = useMutation(CREATE_RESOURCE, {
    refetchQueries: [{ query: GET_CLASS_RESOURCES, variables: { classId: myclass?.id } }],
  });

  const [setResourceTemplateCards] = useMutation(SET_RESOURCE_TEMPLATE_CARDS, {
    refetchQueries: [{ query: GET_CLASS_RESOURCES, variables: { classId: myclass?.id } }],
  });

  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").trim();
  };

  const templateBoardId = myclass?.templateProposal?.id;

  const filteredResources = (() => {
    let list =
      selectedPublishedFilter === null
        ? (resources || [])
        : (resources || []).filter(
            (r) => getIsPublishedForThisClass(r) === selectedPublishedFilter
          );
    if (linkedCardFilter && templateBoardId) {
      list = list.filter((r) => {
        const templateCards = (r?.proposalCards || []).filter(
          (c) => c?.section?.board?.id === templateBoardId
        );
        return templateCards.some((c) =>
          linkedCardFilter.type === "section"
            ? (c?.section?.title ?? "") === linkedCardFilter.value
            : (c?.title ?? "") === linkedCardFilter.value
        );
      });
    }
    return list;
  })();

  const clearLinkedCardFilter = () => setLinkedCardFilter(null);
  const handlePublishedFilterToggle = (value) => {
    setSelectedPublishedFilter((prev) => (prev === value ? null : value));
  };

  const getTemplateCardIdsForClass = (resource) => {
    if (!resource?.proposalCards || !templateBoardId) return [];
    return (resource.proposalCards || [])
      .filter((c) => c?.section?.board?.id === templateBoardId)
      .map((c) => c.id)
      .filter(Boolean);
  };

  const handleMakeCopyAndEdit = async (resource) => {
    if (!resource?.id || !myclass?.id || !templateBoardId) {
      alert(t("resource.connectModal.noTemplate", "No template board for this class."));
      return;
    }
    if (copyingResourceId === resource.id) return;
    setCopyingResourceId(resource.id);
    try {
      const { data: fullData } = await client.query({
        query: GET_RESOURCE,
        variables: { id: resource.id },
      });
      const full = fullData?.resource;
      if (!full) {
        alert(t("resource.errorLoading", "Error loading resource."));
        return;
      }
      const templateCardIds = getTemplateCardIdsForClass(resource);

      const createRes = await createResource({
        variables: {
          input: {
            title: `${full.title} (${t("resource.copy", "Copy")})`,
            description: full.description ?? undefined,
            content: full.content ?? undefined,
            settings: mergeResourceSettings(full.settings),
            isPublic: false,
          },
        },
      });
      const newId = createRes?.data?.createResource?.id;
      if (!newId) {
        alert(t("resource.saveError", "Failed to save."));
        return;
      }

      await updateResource({
        variables: {
          id: newId,
          classes: { connect: [{ id: myclass.id }] },
        },
      });

      if (templateCardIds.length > 0) {
        await setResourceTemplateCards({
          variables: {
            resourceId: newId,
            templateCardIds,
            classId: myclass.id,
          },
        });
        await setResourceTemplateCards({
          variables: {
            resourceId: resource.id,
            templateCardIds: [],
            classId: myclass.id,
          },
        });
      }

      await refetchClassResources();
      router.push({
        pathname: `/dashboard/myclasses/${myclass?.code}`,
        query: { page: "resources", action: "edit", resource: newId },
      });
    } catch (err) {
      alert(err?.message ?? t("resource.saveError", "Failed to save."));
    } finally {
      setCopyingResourceId(null);
    }
  };

  const handleOpenPublishConfirm = (resource) => {
    if (!resource?.id) return;
    setResourceForPublishModal(resource);
  };

  const handleConfirmPublishToggle = () => {
    if (!resourceForPublishModal?.id || !classId) return;
    const merged = mergeResourceSettings(resourceForPublishModal.settings);
    const ids = [...(merged.publishedToClassIds || [])];
    const current = ids.includes(classId);
    if (current) {
      ids.splice(ids.indexOf(classId), 1);
    } else {
      ids.push(classId);
    }
    setUpdatingStatusResourceId(resourceForPublishModal.id);
    setResourceForPublishModal(null);
    const nextSettings = { ...merged, publishedToClassIds: ids };
    updateResource({
      variables: {
        id: resourceForPublishModal.id,
        settings: nextSettings,
      },
    }).finally(() => setUpdatingStatusResourceId(null));
  };

  const TitleRenderer = (params) => {
    const title = stripHtml(params?.data?.title || "");
    return <span>{title}</span>;
  };

  const OwnerRenderer = (params) => {
    const resource = params?.data;
    if (!resource) return null;
    const isPublic = resource?.isPublic === true;
    const isYou = resource?.author?.id === user?.id;
    if (isPublic) {
      return <Chip label={t("resource.public", "Public")} shape="pill" />;
    }
    if (isYou) {
      return <Chip label={t("resource.you", "You")} shape="pill" />;
    }
    const username = resource?.author?.username ?? "";
    return <Chip label={username || "—"} shape="pill" />;
  };

  const StatusRenderer = (params) => {
    const resource = params?.data;
    const isPublished = getIsPublishedForThisClass(resource);
    const isUpdating = params?.context?.updatingStatusResourceId === resource?.id;
    const onToggle = params?.context?.onTogglePublishStatus;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle?.(resource);
        }}
        aria-label={
          isPublished
            ? t("resource.unpublish", "Unpublish")
            : t("resource.publishToStudents", "Publish to students")
        }
        disabled={isUpdating}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: isUpdating ? "wait" : "pointer",
          opacity: isUpdating ? 0.7 : 1,
        }}
        title={
          isUpdating
            ? t("common.loading", "Updating…")
            : isPublished
              ? t("resource.unpublish", "Unpublish")
              : t("resource.publishToStudents", "Publish to students")
        }
      >
        <StatusChip $isPublished={isPublished}>
          {isUpdating
            ? t("common.loading", "Updating…")
            : isPublished
              ? t("resource.published", "Published")
              : t("resource.unpublished", "Unpublished")}
        </StatusChip>
      </button>
    );
  };

  const chipButtonStyle = {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    textAlign: "left",
  };

  const LinkedToCardRenderer = (params) => {
    const resource = params?.data;
    const boardId = params?.context?.templateBoardId ?? myclass?.templateProposal?.id;
    const templateCards = !boardId
      ? []
      : (resource?.proposalCards || []).filter(
          (c) => c?.section?.board?.id === boardId
        );
    const onLinkedCardFilterClick = params?.context?.onLinkedCardFilterClick;
    const handleConnectClick = () => {
      if (!boardId) {
        alert(t("resource.connectModal.noTemplate", "No template board for this class."));
        return;
      }
      setResourceForConnectModal(resource);
    };
    if (templateCards.length === 0) {
      if (!boardId) {
        return (
          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: { page: "projects" },
            }}
            style={{ ...chipButtonStyle, display: "flex", alignItems: "center", textDecoration: "none" }}
          >
            <LinkedCardChip $placeholder>
              {t("resource.noTemplateBoardAssociated", "No template board associated to class")}
            </LinkedCardChip>
          </Link>
        );
      }
      return (
        <button
          type="button"
          onClick={handleConnectClick}
          style={{ ...chipButtonStyle, display: "flex", alignItems: "center" }}
        >
          <LinkedCardChip $placeholder>
            {t("resource.clickToConnectToCard", "Click to connect to card")}
          </LinkedCardChip>
        </button>
      );
    }
    const countLabel =
      templateCards.length > 1
        ? t("resource.linkedToCardCount", {
            count: templateCards.length,
            default: "{{count}} cards",
          })
        : null;
    // A visual line divider instead of ampersand
    const separator = (
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: "100%",
          height: "1px",
          background: "#cccccc",
          margin: "8px 0px",
          verticalAlign: "middle",
          alignSelf: "center"
        }}
      />
    );
    return (
      <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0 }}>
        {countLabel && (
          <span style={{ marginRight: "8px", marginBottom: "4px", fontSize: "13px", color: "#616161" }}>
            {countLabel}:
          </span>
        )}
        {templateCards.map((c, i) => (
          <span
            key={c?.id ?? i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              flexWrap: "wrap",
              width: "100%",
              gap: "0px",
            }}
          >
            {i > 0 && separator}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLinkedCardFilterClick?.("section", c?.section?.title ?? "");
              }}
              style={chipButtonStyle}
            >
              <LinkedCardChip>{c?.section?.title || "Section"}</LinkedCardChip>
            </button>
            <span style={{ margin: "0 4px", fontSize: "14px", color: "#616161" }}>/</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLinkedCardFilterClick?.("card", c?.title ?? "");
              }}
              style={chipButtonStyle}
            >
              <LinkedCardChip>{c?.title || "Card"}</LinkedCardChip>
            </button>
          </span>
        ))}
      </span>
    );
  };

  const ChangeLinkRenderer = (params) => {
    const resource = params?.data;
    const templateBoardId = params?.context?.templateBoardId ?? myclass?.templateProposal?.id;
    const handleClick = () => {
      if (!templateBoardId) {
        router.push({
          pathname: `/dashboard/myclasses/${myclass?.code}`,
          query: { page: "projects" },
        });
        return;
      }
      setResourceForConnectModal(resource);
    };
    return (
      <EditButton type="button" onClick={handleClick}>
        {t("resource.changeLinkToCard", "Change card")}
      </EditButton>
    );
  };

  // Class network column: empty for now (no filtering)
  const ClassNetworkRenderer = () => <span />;

  const linkedToCardColumnDef = {
    field: "linkedToCard",
    headerName: t("resource.linkedToCard", "Linked to card"),
    cellRenderer: LinkedToCardRenderer,
    filter: "agTextColumnFilter",
    sortable: true,
    flex: 2,
    wrapText: true,
    autoHeight: true,
    cellStyle: {
      whiteSpace: "normal",
      lineHeight: "1.5",
      display: "flex",
      alignItems: "center",
      wordBreak: "break-word",
    },
    valueGetter: (params) => {
      const r = params?.data;
      const templateBoardId = params?.context?.templateBoardId;
      if (!templateBoardId) return "";
      const templateCards = (r?.proposalCards || []).filter(
        (c) => c?.section?.board?.id === templateBoardId
      );
      return templateCards.length > 0
        ? templateCards.map((c) => `${c?.section?.title} > ${c?.title}`).join(", ")
        : "";
    },
  };

  const changeLinkColumnDef = {
    field: "changeLink",
    headerName: "",
    cellRenderer: ChangeLinkRenderer,
    suppressFilter: true,
    sortable: false,
    flex: 0,
    minWidth: 90,
    maxWidth: 120,
    cellStyle: { display: "flex", alignItems: "center", justifyContent: "center" },
  };

  const classNetworkColumnDef = {
    field: "classNetwork",
    headerName: t("resource.classNetwork", "Class network"),
    cellRenderer: ClassNetworkRenderer,
    suppressFilter: true,
    sortable: false,
    flex: 1,
    cellStyle: { whiteSpace: "normal" },
  };

  const ActionsRenderer = (params) => {
    const resource = params?.data;
    const isPublished = getIsPublishedForThisClass(resource);
    const isOwner = resource?.author?.id === user?.id;
    const isCollaborator = (resource?.collaborators || []).some((c) => c?.id === user?.id);
    const canEditResource = isOwner || isCollaborator;
    const isClassTeacherOrMentor =
      myclass?.creator?.id === user?.id ||
      (myclass?.mentors || []).some((m) => m?.id === user?.id);
    const canManage = isOwner || isClassTeacherOrMentor;
    const isCopying = params?.context?.copyingResourceId === resource?.id;

    const items = [
      ...(canEditResource
        ? [
            {
              key: "edit",
              label: t("resource.edit", "Edit"),
              onClick: () =>
                router.push({
                  pathname: `/dashboard/myclasses/${myclass?.code}`,
                  query: { page: "resources", action: "edit", resource: resource?.id },
                }),
            },
          ]
        : [
            {
              key: "makeCopyAndEdit",
              label: t("resource.makeCopyAndEdit", "Make a copy and edit"),
              onClick: () => handleMakeCopyAndEdit(resource),
              disabled: isCopying,
            },
          ]),
      {
        key: "preview",
        label: t("resource.preview", "Preview"),
        onClick: () =>
          router.push({
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: { page: "resources", action: "view", resource: resource?.id },
          }),
      },
      ...(canManage
        ? [
            {
              key: "publish",
              label: isPublished
                ? t("resource.unpublish", "Unpublish")
                : t("resource.publishToStudents", "Publish to students"),
              onClick: () => {
                const confirmMessage = isPublished
                  ? t("resource.revokeConfirm", "Are you sure you want to unpublish? Students will no longer see this resource.")
                  : t("resource.submitConfirm", "Are you sure you want to publish? Students will see this resource.");
                if (confirm(confirmMessage) && classId) {
                  const merged = mergeResourceSettings(resource.settings);
                  const ids = [...(merged.publishedToClassIds || [])];
                  if (isPublished) {
                    ids.splice(ids.indexOf(classId), 1);
                  } else {
                    ids.push(classId);
                  }
                  const nextSettings = { ...merged, publishedToClassIds: ids };
                  updateResource({
                    variables: { id: resource?.id, settings: nextSettings },
                  }).catch((err) => alert(err.message));
                }
              },
            },
            ...(isOwner
              ? [
                  {
                    key: "delete",
                    label: t("resource.delete", "Delete"),
                    danger: true,
                    onClick: () => {
                      if (confirm(t("resource.deleteConfirm", "Are you sure you want to delete this resource?"))) {
                        deleteResource({ variables: { id: resource?.id } }).catch((err) =>
                          alert(err.message)
                        );
                      }
                    },
                  },
                ]
              : []),
          ]
        : []),
    ];

    return (
      <DropdownMenu
        triggerLabel={isCopying ? t("common.loading", "Loading…") : t("resource.more", "More")}
        items={items}
      />
    );
  };

  const columnDefs = [
    {
      field: "title",
      headerName: t("resource.title", "Title"),
      cellRenderer: TitleRenderer,
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1,
      wrapText: true,
      autoHeight: true,
      cellStyle: {
        whiteSpace: "normal",
        lineHeight: "1.5",
        display: "flex",
        alignItems: "center",
        wordBreak: "break-word",
      },
    },
    {
      field: "status",
      headerName: t("resource.status", "Status"),
      cellRenderer: StatusRenderer,
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 1,
      valueGetter: (params) =>
        getIsPublishedForThisClass(params?.data) ? "Published" : "Unpublished",
    },
    ...(showLinkedToCardColumn ? [linkedToCardColumnDef, changeLinkColumnDef] : []),
    ...(showClassNetworkColumn ? [classNetworkColumnDef] : []),
    ...(!showLinkedToCardColumn
      ? [
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
        ]
      : []),
    {
      field: "owner",
      headerName: t("resource.owner", "Owner"),
      cellRenderer: OwnerRenderer,
      filter: "agTextColumnFilter",
      sortable: true,
      flex: 0,
      minWidth: 100,
      maxWidth: 140,
      valueGetter: (params) => {
        const r = params?.data;
        if (!r) return "";
        if (r.isPublic) return "public";
        if (r?.author?.id === user?.id) return "you";
        return r?.author?.username ?? "";
      },
      cellStyle: { display: "flex", alignItems: "center" },
    },
    {
      field: "actions",
      headerName: t("resource.actions", "Actions"),
      cellRenderer: ActionsRenderer,
      suppressFilter: true,
      sortable: false,
      width: 150,
      pinned: "right",
      cellStyle: {
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
      },
    },
  ];

  const pagination = true;
  const paginationPageSize = 20;
  const paginationPageSizeSelector = [10, 20, 50, 100];
  const autoSizeStrategy = { type: "fitGridWidth", defaultMinWidth: 100 };

  if (!resources || resources.length === 0) return null;

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          borderTop: "1px solid #E0E0E0",
          paddingTop: "16px",
          marginBottom: "16px",
        }}
      >
        <LinkedCardsToggleButton
          type="button"
          $active={showLinkedToCardColumn}
          onClick={() => setShowLinkedToCardColumn((prev) => !prev)}
          style={{ gap: 12, marginRight: 0, paddingRight: 12 }}
        >
          <span>{t("resource.projectCard", "Project card")}</span>
          <img
            src="/assets/icons/project_card_icon.svg"
            alt=""
            width={34}
            height={18}
            style={{ flexShrink: 0, opacity: showLinkedToCardColumn ? 1 : 0.8 }}
          />
        </LinkedCardsToggleButton>
        {/* <LinkedCardsToggleButton
          type="button"
          $active={showClassNetworkColumn}
          onClick={() => setShowClassNetworkColumn((prev) => !prev)}
          style={{ gap: 12, marginRight: 0, paddingRight: 12 }}
        >
          <span>{t("resource.classNetwork", "Class network")}</span>
        </LinkedCardsToggleButton> */}
        <span style={{ flexShrink: 0 }} aria-hidden>|</span>
        <button
          type="button"
          onClick={() => handlePublishedFilterToggle(true)}
          style={{
            ...styledChipPublished,
            padding: selectedPublishedFilter === true ? "6px 8px 6px 12px" : "6px 12px",
            backgroundColor: selectedPublishedFilter === true ? "#DEF8FB" : "#ffffff",
            borderColor: selectedPublishedFilter === true ? "#625B71" : "#A1A1A1",
          }}
        >
          <span>{t("resource.published", "Published")}</span>
          {selectedPublishedFilter === true && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "18px",
                height: "18px",
                flexShrink: 0,
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handlePublishedFilterToggle(true);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#171717" />
              </svg>
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => handlePublishedFilterToggle(false)}
          style={{
            ...styledChipUnpublished,
            padding: selectedPublishedFilter === false ? "6px 8px 6px 12px" : "6px 12px",
            backgroundColor: selectedPublishedFilter === false ? "#F3F3F3" : "#ffffff",
            borderColor: selectedPublishedFilter === false ? "#625B71" : "#A1A1A1",
          }}
        >
          <span>{t("resource.unpublished", "Unpublished")}</span>
          {selectedPublishedFilter === false && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "18px",
                height: "18px",
                flexShrink: 0,
                cursor: "pointer",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handlePublishedFilterToggle(false);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#171717" />
              </svg>
            </span>
          )}
        </button>
        {linkedCardFilter != null && (
          <>
            <span style={{ flexShrink: 0 }} aria-hidden>|</span>
            <button
              type="button"
              onClick={clearLinkedCardFilter}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                height: "32px",
                boxSizing: "border-box",
                justifyContent: "center",
                fontSize: "14px",
                flexShrink: 0,
                borderRadius: "8px",
                padding: "6px 8px 6px 12px",
                background: "#E4DFF6",
                border: "1px solid #625B71",
                color: "#625B71",
                maxWidth: "100%",
                wordBreak: "break-word",
                cursor: "pointer",
              }}
            >
              <span>{t("resource.removeCardColumnFilter", "Remove card/column filter")}</span>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="#171717" />
                </svg>
              </span>
            </button>
          </>
        )}
      </div>

      <div style={{ width: "100%", height: "600px" }}>
        <div className="ag-theme-quartz" style={{ height: "100%", width: "100%" }}>
          <AgGridReact
            ref={gridRef}
            rowData={filteredResources}
            columnDefs={columnDefs}
            getRowId={(params) => params.data?.id}
            context={{
              templateBoardId: myclass?.templateProposal?.id,
              onTogglePublishStatus: handleOpenPublishConfirm,
              updatingStatusResourceId,
              copyingResourceId,
              onLinkedCardFilterClick: (type, value) => setLinkedCardFilter({ type, value }),
            }}
            pagination={pagination}
            paginationPageSize={paginationPageSize}
            paginationPageSizeSelector={paginationPageSizeSelector}
            autoSizeStrategy={autoSizeStrategy}
            defaultColDef={{ resizable: true, sortable: true, filter: true }}
          />
        </div>
      </div>

      <ConnectResourceToCardModal
        open={!!resourceForConnectModal}
        onClose={() => setResourceForConnectModal(null)}
        resource={resourceForConnectModal}
        myclass={myclass}
        onSuccess={() => setResourceForConnectModal(null)}
      />

      <Modal
        open={!!resourceForPublishModal}
        onClose={() => setResourceForPublishModal(null)}
        size="small"
        style={{ borderRadius: "12px" }}
      >
        <Modal.Header>
          {resourceForPublishModal &&
            (getIsPublishedForThisClass(resourceForPublishModal)
              ? t("resource.confirmUnpublishTitle", "Unpublish resource?")
              : t("resource.confirmPublishTitle", "Publish resource?"))}
        </Modal.Header>
        <Modal.Content>
          <p style={{ margin: 0 }}>
            {resourceForPublishModal &&
              (getIsPublishedForThisClass(resourceForPublishModal)
                ? t("resource.confirmUnpublishMessage", "Students will no longer see this resource.")
                : t("resource.confirmPublishMessage", "Students will see this resource in their class."))}
          </p>
        </Modal.Content>
        <Modal.Actions style={{ padding: "1rem 1.5rem", gap: "8px" }}>
          <Button
            onClick={() => setResourceForPublishModal(null)}
            style={{ borderRadius: "100px", border: "1px solid #336F8A", background: "white", color: "#336F8A" }}
          >
            {t("resource.cancel", "Cancel")}
          </Button>
          <Button
            primary
            onClick={handleConfirmPublishToggle}
            style={{ borderRadius: "100px", background: "#336F8A", color: "white" }}
          >
            {resourceForPublishModal &&
              (getIsPublishedForThisClass(resourceForPublishModal)
                ? t("resource.unpublish", "Unpublish")
                : t("resource.publishToStudents", "Publish to students"))}
          </Button>
        </Modal.Actions>
      </Modal>
    </div>
  );
}
