import TipTapEditor from "../../../TipTap/Main";
import { useQuery } from "@apollo/client";
import ReactHtmlParser from "react-html-parser";
import { Button, Icon, Modal, Tab } from "semantic-ui-react";
import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import {
  GET_PUBLIC_RESOURCES,
  GET_MY_RESOURCES,
  GET_TEMPLATE_ASSIGNMENT,
} from "../../../Queries/Resource";
import { PUBLIC_STUDIES } from "../../../Queries/Study";
import { ALL_PUBLIC_TASKS } from "../../../Queries/Task";
// import { GET_MY_CLASS_ASSIGNMENTS } from "../../../Queries/Assignment";
import { GET_MY_ASSIGNMENTS, GET_AN_ASSIGNMENT, GET_ASSIGNMENTS_CHILD } from "../../../Queries/Assignment";
import { EDIT_ASSIGNMENT } from "../../../Mutations/Assignment";
import AssignmentEditModal from "../../../TipTap/AssignmentEditModal"
import AssignmentViewModal from "../../../TipTap/AssignmentViewModal"
import AssignmentCopyModal from "../../../TipTap/AssignmentCopyModal";
import { styleText } from "util";

export default function LinkedItems({
  proposal,
  user,
  handleChange,
  selectedResources,
  selectedAssignments,
  selectedTasks,
  selectedStudies,
  totalLinked,
}) {
  const { t } = useTranslation("classes");

  // Queries for Resources
  const {
    data: publicData,
    error: publicError,
    loading: publicLoading,
  } = useQuery(GET_PUBLIC_RESOURCES);
  
  // Queries for assignment
  const {
    data: publicAssignment,
    error: publicAssignmentError,
    loading: publicAssignmentLoading,
  } = useQuery(GET_TEMPLATE_ASSIGNMENT);
  
  // Queries for ressource
  const {
    data: myData,
    error: myError,
    loading: myLoading,
  } = useQuery(GET_MY_RESOURCES, {
    variables: { id: user?.id },
  });

  const publicResources = {
    assignments: publicAssignment?.assignments || {},
    resources: publicData?.resources || {}
  } || {};
  const myResources = myData?.resources || [];
  const myResourcesNoParent = myResources.filter((r) => !r?.parent);

  // Queries for Assignments
  const {
    data: myAssignmentsData,
    error: myAssignmentsError,
    loading: myAssignmentsLoading,
  } = useQuery(GET_MY_ASSIGNMENTS, {
    variables: { id: user?.id },
  });
  const myAssignments = myAssignmentsData?.assignments || [];

  // Queries for Tasks
  const {
    data: publicTasksData,
    error: publicTasksError,
    loading: publicTasksLoading,
  } = useQuery(ALL_PUBLIC_TASKS);
  const publicTasks = publicTasksData?.tasks || [];

  // Queries for Studies
  const {
    data: publicStudiesData,
    error: publicStudiesError,
    loading: publicStudiesLoading,
  } = useQuery(PUBLIC_STUDIES);
  const publicStudies = publicStudiesData?.studies || [];

  const [open, setOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [viewAssignmentModalOpen, setViewAssignmentModalOpen] = useState(false);
  const [editAssignmentModalOpen, setEditAssignmentModalOpen] = useState(false);
  const [viewAssignmentId, setViewAssignmentId] = useState(null);
  const [editAssignmentId, setEditAssignmentId] = useState(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyAssignment, setCopyAssignment] = useState(null);

  const openCopyModal = (assignment) => {
    if (!assignment) return;
    setCopyAssignment(assignment);
    setCopyModalOpen(true);
  };

  const openViewAssignmentModal = (assignment) => {
    setViewAssignmentId(assignment.id);
    setViewAssignmentModalOpen(true);
  };

  const openEditAssignmentModal = (assignment) => {
    setEditAssignmentId(assignment.id);
    setEditAssignmentModalOpen(true);
  };


  // Resource-specific merging for selected
  const selectedResourcesMerged = selectedResources.map((selectedResource) => {
    const customResource = myResources.find(
      (myResource) => myResource?.parent?.id === selectedResource?.id
    );
    return customResource || selectedResource;
  });


  // Generic connect/disconnect
  const connectItem = (item, fieldName, selectedArray) => {
    if (!selectedArray.some((s) => s.id === item.id)) {
      const newSelected = [...selectedArray, item];
      handleChange({ target: { name: fieldName, value: newSelected } });
    }
  };

  const disconnectItem = (item, fieldName, selectedArray) => {
    const newSelected = selectedArray.filter((s) => s.id !== item.id);
    handleChange({ target: { name: fieldName, value: newSelected } });
  };

  const openAssignmentModalHandler = (assignment) => {
    if (!assignment) {
      console.error("No assignment provided to openAssignmentModalHandler");
      return;
    }
  
    console.log("Opening modal for assignment ID:", assignment.id);
    setSelectedAssignmentId(assignment.id); // <-- just store the ID
    setAssignmentModalOpen(true);
  };  

  const panes = [
    {
      menuItem: t("board.expendedCard.publicResources"),
      render: () => (
        <ItemTab
          user={user}
          items={publicResources}
          selected={selectedResources}
          connect={(item) => connectItem(item, "resources", selectedResources)}
          disconnect={(item) =>
            disconnectItem(item, "resources", selectedResources)
          }
          myItems={myResources}
          myAssignments={myAssignmentsData}
          proposal={proposal}
          type="public"
          isPublic={true}
          loading={publicLoading}
          openAssignmentModal={openAssignmentModalHandler}
          openViewAssignmentModal={openViewAssignmentModal}
          openCopyModal={openCopyModal}
        />
      ),
    },
    {
      menuItem: t("board.expendedCard.myResources"),
      render: () => (
        <ItemTab
          user={user}
          items={myResourcesNoParent}
          selected={selectedResources}
          connect={(item) => connectItem(item, "resources", selectedResources)}
          disconnect={(item) =>
            disconnectItem(item, "resources", selectedResources)
          }
          myItems={[]}
          proposal={proposal}
          type="resource"
          isPublic={false}
          loading={myLoading}
          openAssignmentModal={openAssignmentModalHandler}
        />
      ),
    },
    {
      menuItem: t("board.expendedCard.myAssignments"),
      render: () => (
        <ItemTab
          user={user}
          items={myAssignments}
          selected={selectedAssignments}
          connect={(item) =>
            connectItem(item, "assignments", selectedAssignments)
          }
          disconnect={(item) =>
            disconnectItem(item, "assignments", selectedAssignments)
          }
          myItems={[]}
          proposal={proposal}
          type="assignment"
          isPublic={false}
          loading={myAssignmentsLoading}
          openAssignmentModal={openAssignmentModalHandler}
          openEditAssignmentModal={openEditAssignmentModal}
        />
      ),
    },
    {
      menuItem: t("board.expendedCard.tasks"),
      render: () => (
        <ItemTab
          user={user}
          items={publicTasks}
          selected={selectedTasks}
          connect={(item) => connectItem(item, "tasks", selectedTasks)}
          disconnect={(item) => disconnectItem(item, "tasks", selectedTasks)}
          myItems={[]}
          proposal={proposal}
          type="task"
          isPublic={true}
          loading={publicTasksLoading}
          openAssignmentModal={openAssignmentModalHandler}
        />
      ),
    },
    {
      menuItem: t("board.expendedCard.studies"),
      render: () => (
        <ItemTab
          user={user}
          items={publicStudies}
          selected={selectedStudies}
          connect={(item) => connectItem(item, "studies", selectedStudies)}
          disconnect={(item) =>
            disconnectItem(item, "studies", selectedStudies)
          }
          myItems={[]}
          proposal={proposal}
          type="study"
          isPublic={true}
          loading={publicStudiesLoading}
          openAssignmentModal={openAssignmentModalHandler}
        />
      ),
    },
  ];

  const styledSecondaryButtonBlue = {
    height: "30px",
    padding: "16px 24px 16px 24px",
    justifyContent: "center",
    gap: "8px",
    flexShrink: 0,
    width: "auto",
    display: "inline-flex",
    alignItems: "center",
    margin: "1rem 0",
    background: "#336F8A",
    color: "white",
    borderRadius: "100px",
    fontSize: "18px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.3s ease",
    border: "1.5px solid #336F8A",
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        style={{
          background: "#f0f4f8",
          color: "#007c70",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
        }}
      >
        {t("board.expendedCard.linkItems", "Link Items")} ({totalLinked})
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="large"
        style={{ borderRadius: "12px", overflow: "hidden" }}
      >
        <Modal.Header
          style={{
            background: "#f9fafb",
            borderBottom: "1px solid #e0e0e0",
            fontFamily: "Nunito",
            fontWeight: 600,
          }}
        >
          {t(
            "board.expendedCard.selectItemsToConnect",
            "Select Items to Connect"
          )}
        </Modal.Header>
        <Modal.Content scrolling style={{ background: "#ffffff", padding: 0 }}>
          <Tab panes={panes} style={{ fontFamily: "Nunito" }} />
        </Modal.Content>
        <Modal.Actions
          style={{ background: "#f9fafb", borderTop: "1px solid #e0e0e0" }}
        >

          <button
            onClick={() => setOpen(false)}
            style={styledSecondaryButtonBlue}
            >
            {t("board.expendedCard.done")}
          </button>
        </Modal.Actions>
      </Modal>

      <AssignmentModal
        open={assignmentModalOpen}
        t={t}
        onClose={() => {
          setAssignmentModalOpen(false);
          // setSelectedAssignment(null);
        }}
        assignmentId={selectedAssignmentId}
        user={user}
      />
  
      <AssignmentViewModal
        open={viewAssignmentModalOpen}
        t={t}
        onClose={() => setViewAssignmentModalOpen(false)}
        assignmentId={viewAssignmentId}
      />
      
      <AssignmentEditModal
        open={editAssignmentModalOpen}
        onClose={() => setEditAssignmentModalOpen(false)}
        assignmentId={editAssignmentId}
        user={user}
        onSaved={() => {
          setEditAssignmentModalOpen(false);
          setEditAssignmentId(null);
        }}
      />

      <AssignmentCopyModal
        open={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        assignment={copyAssignment}
        user={user}
        onCopied={() => {
          // optional: refresh lists / refetch queries if needed
          setCopyModalOpen(false);
          setCopyAssignment(null);
        }}
      />



      {selectedResourcesMerged.length > 0 && (
        <PreviewSection
          title={t("board.expendedCard.previewLinkedResources")}
          items={selectedResourcesMerged}
          type="resource"
          proposal={proposal}
          openAssignmentModal={openAssignmentModalHandler}
          user={user}
        />
      )}
      {selectedAssignments.length > 0 && (
        <PreviewSection
          title={t("board.expendedCard.previewLinkedAssignments")}
          items={selectedAssignments}
          type="assignment"
          proposal={proposal}
          openAssignmentModal={openAssignmentModalHandler}
          user={user}
        />
      )}
      {selectedTasks.length > 0 && (
        <PreviewSection
          title={t("board.expendedCard.previewLinkedTasks")}
          items={selectedTasks}
          type="task"
          proposal={proposal}
          openAssignmentModal={openAssignmentModalHandler}
          user={user}
        />
      )}
      {selectedStudies.length > 0 && (
        <PreviewSection
          title={t("board.expendedCard.previewLinkedStudies")}
          items={selectedStudies}
          type="study"
          proposal={proposal}
          openAssignmentModal={openAssignmentModalHandler}
          user={user}
        />
      )}
    </>
  );
}

const ItemTab = ({
  user,
  items,
  selected,
  connect,
  disconnect,
  myItems,
  proposal,
  type,
  isPublic,
  loading,
  openAssignmentModal,
  openViewAssignmentModal,
  openEditAssignmentModal,
  openCopyModal,
  myAssignments
}) => {
  const { t } = useTranslation("classes");
  
  const styledPrimaryIconButton = {
    display: "inline-flex",
    height: "38px",
    width: "38px",
    padding: "8px",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    flexShrink: "0",
    borderRadius: "100px",
    border: "1px solid #336F8A",
    background: "#336F8A",
  };

  const styledPrimaryButton = {
    height: "30px",
    padding: "8px 16px 8px 16px",
    justifyContent: "center",
    gap: "8px",
    flexShrink: 0,
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    margin: "1rem 0",
    background: "#336F8A",
    color: "white",
    borderRadius: "100px",
    fontSize: "16px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.3s ease",
    border: "none", // Add to reset default browser styles
  };

  const styledSecondaryButtonBlue = {
    height: "30px",
    padding: "8px 16px 8px 16px",
    justifyContent: "center",
    gap: "8px",
    flexShrink: 0,
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    margin: "1rem 0",
    background: "white",
    color: "#3D85B0",
    borderRadius: "100px",
    fontSize: "16px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.3s ease",
    border: "1.5px solid #3D85B0",
  };
  
  const styledAccentButtonPurple = {
    height: "30px",
    padding: "8px 16px 8px 8px",
    justifyContent: "center",
    gap: "8px",
    flexShrink: 0,
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    margin: "1rem 0",
    background: "white",
    color: "#7D70AD",
    borderRadius: "100px",
    fontSize: "16px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.3s ease",
    border: "1.5px solid #7D70AD",
  };
  
  const styledChip = {
    display: "inline-flex",
    height: "fit-content",
    padding: "4px 8px 4px 8px",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: "0",
    borderRadius: "8px",
    border: "1px solid var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
    maxWidth: '100%',
    wordBreak: 'break-word',
  };
  
  const styledChipPublished = {
    display: "inline-flex",
    height: "24px",
    padding: "10px",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: "0",
    borderRadius: "8px",
    background: "#D8D3E7",
    color: "#625B71",
    // border: "1px solid var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
    maxWidth: '100%',
    wordBreak: 'break-word',
  };
  
  const styledChipUnpublished = {
    display: "inline-flex",
    height: "24px",
    padding: "10px",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: "0",
    borderRadius: "8px",
    background: "#F3F3F3",
    // border: "1px solid var(--MH-Theme-Neutrals-Medium, #A1A1A1)",
    maxWidth: '100%',
    wordBreak: 'break-word',
  };

  if (loading) return <div>{t("common.loading", "Loading...")}</div>;

  // --- Accordions UI State (moved outside conditional to fix hooks rule) ---
  const [openAccordion, setOpenAccordion] = useState({
    resources: true,
    assignments: false,
  });

  const toggleAccordion = (key) => {
    setOpenAccordion((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (type === "public") {
    // For public type, render two sections: resources and assignments (in accordions)
    const resources = items?.resources || [];
    const assignments = items?.assignments || [];

    // helper function to render items list (reuse existing item render logic)
    const renderItems = (itemsList, currentType) => {
      const displayItems = itemsList.map((item) => {
        if (currentType === "resource" && isPublic) {
          const custom = myItems.find((p) => p.parent?.id === item.id);
          return custom || item;
        }
        return item;
      });

      return displayItems.map((item) => {
        const isSelected = selected.some((s) => s.id === item.id);
        const isTaskOrStudy = currentType === "task" || currentType === "study";
        const isTask = currentType === "task";
        const isStudy = currentType === "study";
        const isAssignment = currentType === "assignment";
        const isResource = currentType === "resource";
        // TODO: add updatedAt to the card

        const hasChildAssignement = myAssignments?.assignments?.some(
          assignment => assignment.templateSource?.id === item.id
        ) || false;     

        let viewUrl = `/dashboard/${currentType}s/view?id=${item?.id}`;
        
        if (isAssignment) {
          viewUrl = `/dashboard/${currentType}s/view?id=${item?.id}`;
        }
        if (isTask) {
          viewUrl = `/dashboard/discover/tasks?name=${item?.slug}`;
        }
        if (isStudy) {
          viewUrl = `/dashboard/discover/studies?name=${item?.slug}`;
        }
        const editUrl = item?.isCustom
          ? `/dashboard/${currentType}s/edit?id=${item?.id}`
          : `/dashboard/${currentType}s/copy?id=${item?.id}&p=${proposal?.id}`;
        const content = isResource
          ? item?.content?.main || ""
          : item?.content || "";
        const placeholder = isResource
          ? item?.placeholder?.main || ""
          : item?.placeholder || "";

        return (
          <div
            key={item.id}
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              padding: "16px",
              background: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              transition: "box-shadow 0.3s ease",
              marginBottom: "16px",
              height: "fit-content",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)")
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#333",
                  margin: 0,
                }}
              >
                {item?.title || "Untitled"}
              </h2>
              {item?.lastUpdate ? (<p>Last updated: {item?.lastUpdate}</p>) : (<></>)}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#666",
                lineHeight: "1.5",
                marginBottom: "16px",
              }}
            >
              {/* {ReactHtmlParser(truncateHtml(content, 15))} */}
              {/* {ReactHtmlParser(truncateHtml(placeholder, 10))} */}
            </div>
            {isResource && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  width: "100%",
                }}
              >
                <button
                  onClick={() => (isSelected ? disconnect(item) : connect(item))}
                  style={{
                    ...(isSelected
                      ? styledAccentButtonPurple
                      : styledPrimaryButton),
                    flex: "1 1 240px",
                    maxWidth: "79%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={isSelected ? "unlink" : "linkify"} />
                  {isSelected
                    ? t("board.expendedCard.disconnect")
                    : t("board.expendedCard.connect")}
                </button>
                <button
                  onClick={() =>
                    window.open(editUrl, "_blank", "noopener,noreferrer")
                  }
                  style={{
                    ...styledSecondaryButtonBlue,
                    flex: "0 1 120px",
                    maxWidth: "19%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 16px",
                  }}
                  aria-label={t("boardManagement.edit", "Edit")}
                >
                  <Icon name="pencil" />
                </button>
              </div>
            )}
            {/* Add preview buttons for tasks and studies */}
            {(isTask || isStudy) && (
              <div style={{display: "flex",  justifyContent: "flex-start", columnGap: "16px", flexWrap: "wrap"}}>
                <button 
                  onClick={() => (isSelected ? disconnect(item) : connect(item))}
                  style={isSelected
                    ? styledAccentButtonPurple
                    : styledPrimaryButton}
                  >
                    {isSelected
                    ? <Icon name="unlink"/>
                    : <Icon name="linkify"/>
                    }
                    {isSelected
                    ? t("board.expendedCard.disconnect")
                    : t("board.expendedCard.connect")
                    }
                </button>
                <button
                  onClick={() => window.open(viewUrl, '_blank', 'noopener,noreferrer')}
                  style={styledPrimaryButton}
                >
                  <Icon name="eye" /> {t("boardManagement.preview", "Preview")}
                </button>
              </div>
            )}
            {isAssignment && (
              <>
                <div style={{display: "flex",  justifyContent: "flex-start", columnGap: "16px", flexWrap: "wrap"}}>
                  {/* <button
                    onClick={() => openViewAssignmentModal(item)}
                    style={styledSecondaryButtonBlue}
                  >
                    <Icon name="eye" />
                    {t("board.expendedCard.viewContent")}
                  </button> */}

                  {!hasChildAssignement
                  ? (
                    <button
                      onClick={() => openCopyModal?.(item)}
                      style={styledPrimaryButton}
                    >
                      <Icon name="copy outline" /> {t("boardManagement.viewAndCopy", "View & Copy")}
                    </button>
                    )
                  : (<div style={{display: "flex", flexDirection: "column"}}>
                      <p>{t("board.expendedCard.alreadyHaveCopy")}</p>
                      <div style={{display: "flex", columnGap: "4px", rowGap: "8px", marginBottom: "8px", maxWidth: "100%", flexWrap: "wrap", alignItems: "center"}}>
                        {myAssignments?.assignments
                          ?.filter(assignment => assignment.templateSource?.id === item.id)
                          ?.flatMap(assignment => assignment.classes || [])
                          ?.filter((cls, index, self) => index === self.findIndex(c => c.id === cls.id))
                          ?.map(cls => (
                            <span key={cls.id} style={styledChip}>
                              <p style={{ 
                                maxWidth: "100%", 
                                wordBreak: "break-word", 
                                whiteSpace: "normal",
                                overflowWrap: "anywhere",
                                margin: 0
                              }}>
                                {cls.title}
                              </p>
                            </span>
                            // <p><li key={cls.id}>{cls.title}</li></p>
                          ))}
                        </div>
                      <button 
                        onClick={() => openCopyModal?.(item)}
                        style={styledPrimaryButton}
                      >
                        <Icon name="copy outline" /> {t("board.expendedCard.makeAdditionalCopy")}
                      </button>
                    </div>
                    )}
                </div>
              </>
            )}
          </div>
        );
      });
    };

    // Styles for accordion components
    const accordionHeaderStyle = {
      display: "flex",
      alignItems: "center",
      width: "100%",
      cursor: "pointer",
      background: "none",
      border: "none",
      outline: "none",
      padding: "0",
      marginBottom: "24px",
    };

    const accordionTitleStyle = {
      fontSize: "24px",
      fontWeight: "500",
      margin: "0 0.5rem 0 0",
      color: "#3D3669"
    };

    const accordionChevronStyle = (open) => ({
      transition: "transform 0.2s",
      transform: open ? "rotate(90deg)" : "rotate(0deg)",
      fontSize: "0.5em",
      marginRight: "1em",
      color: "#336F8A"
    });

    return (
      <div style={{ padding: "24px", background: "#f9fafb", maxWidth: 1100, margin: "0 auto" }}>
        {/* Resources Accordion */}
        <div style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "24px",
          gap: "16px"
        }}>
          <div style={{ flex: "0 1 25%", maxWidth: "25%" }}>
            <Button
              onClick={() => {
                const url = `/dashboard/resources/`;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              style={{
                ...styledPrimaryButton,
                width: "100%",
                whiteSpace: "nowrap",
                background: "#7D70AD"
              }}
            >
              {t("boardManagement.openResourcesCenter", "Open Resources Center")}
            </Button>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "16px" }}>
              {t("boardManagement.descGoToResourcesCenter", "This page allows you to link resources to your project board cards - to manage resources, go to the resources center.)")}
            </span>
          </div>
        </div>
        <section>
          <button
            type="button"
            onClick={() => toggleAccordion("resources")}
            style={accordionHeaderStyle}
            aria-expanded={openAccordion.resources}
            aria-controls="public-resources-accordion"
          >
            <span style={accordionChevronStyle(openAccordion.resources)}>
              ▶
            </span>
            <span style={accordionTitleStyle}>
              {t("board.expendedCard.resourcesSectionTitle", "Public Resources")}
            </span>
          </button>
          <div
            id="public-resources-accordion"
            style={{
              display: openAccordion.resources ? "block" : "none",
              marginBottom: "28px"
            }}
          >
            {resources.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "24px",
                }}
              >
                {renderItems(resources, "resource")}
              </div>
            ) : (
              <p>{t("noResources", "No public resources.")}</p>
            )}
          </div>
        </section>

        {/* Assignments Accordion */}
        <section>
          <button
            type="button"
            onClick={() => toggleAccordion("assignments")}
            style={accordionHeaderStyle}
            aria-expanded={openAccordion.assignments}
            aria-controls="public-assignments-accordion"
          >
            <span style={accordionChevronStyle(openAccordion.assignments)}>
              ▶
            </span>
            <span style={accordionTitleStyle}>
              {t("board.expendedCard.assignmentsSectionTitle", "Assignments")}
            </span>
          </button>
          <div
            id="public-assignments-accordion"
            style={{
              display: openAccordion.assignments ? "block" : "none"
            }}
          >
            {assignments.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "24px",
                }}
              >
                {renderItems(assignments, "assignment")}
              </div>
            ) : (
              <p>{t("noAssignments", "No assignments available.")}</p>
            )}
          </div>
        </section>
      </div>
    );
  }

  // original behavior for other types
  const displayItems = items.map((item) => {
    if (type === "resource" && isPublic) {
      const custom = myItems.find((p) => p.parent?.id === item.id);
      return custom || item;
    }
    return item;
  });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "24px",
        padding: "24px",
        background: "#f9fafb",
      }}
    >
      {displayItems.map((item) => {
        const isSelected = selected.some((s) => s.id === item.id);
        const isTaskOrStudy = type === "task" || type === "study";
        const isTask = type === "task";
        const isStudy = type === "study";
        const isAssignment = type === "assignment";
        const isResource = type === "resource";
        let viewUrl = `/dashboard/${type}s/view?id=${item?.id}`;
        if (isTask) {
          viewUrl = `/dashboard/discover/tasks?name=${item?.slug}`;
        }
        if (isStudy) {
          viewUrl = `/dashboard/discover/studies?name=${item?.slug}`;
        }
        const editUrl = item?.isCustom
          ? `/dashboard/${type}s/edit?id=${item?.id}`
          : (isResource && item?.author?.id === user?.id)
            ? `/dashboard/resources/edit?id=${item?.id}`
            : `/dashboard/${type}s/copy?id=${item?.id}&p=${proposal?.id}`;
        const content = isResource
          ? item?.content?.main || ""
          : item?.content || "";
        
        const placeholder = isResource
          ? item?.placeholder?.main || ""
          : item?.placeholder || "";

        console.log(`ItemTab: Rendering ${type} item`, {
          id: item.id,
          title: item.title,
          public: item.public,
          content,
          placeholder,
          item: item,
        });

        return (
          <div
            key={item.id}
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              padding: "16px",
              background: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              transition: "box-shadow 0.3s ease",
              height: "fit-content",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)")
            }
          >
            <div style={{display: "flex",justifyContent: "space-between",alignItems: "center",marginBottom: "12px", columnGap: "8px"}}>
              <h2 style={{fontSize: "18px", fontWeight: 600, color: "#333", margin: 0}}>
                {item?.title || "Untitled"}
              </h2>
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#666",
                lineHeight: "1.5",
                marginBottom: "16px",
              }}
            >
              {/* {ReactHtmlParser(truncateHtml(content, 15))}
              {ReactHtmlParser(truncateHtml(placeholder, 10))} */}
            </div>
            {isResource && (
              <p>{item?.lastUpdate ? (<p>Last updated: {item?.lastUpdate}</p>) : (<></>)}</p>
            )}
            {isAssignment && (
              <div style={{display: "flex", columnGap: "4px", rowGap: "8px", marginBottom: "8px", maxWidth: "100%", flexWrap: "wrap", alignItems: "center"}}>
                <span style={item?.public ? styledChipPublished : styledChipUnpublished}><p>{item?.public ? "Published" : "Unpublished"}</p></span>
                {item?.classes?.length ? (
                  <>
                    <p style={{margin: "0px"}}>
                      •
                    </p>
                    {item.classes.map((cls, index) => (
                      <span key={cls.id} style={styledChip}>
                        <p style={{ 
                          maxWidth: "100%", 
                          wordBreak: "break-word", 
                          whiteSpace: "normal",
                          overflowWrap: "anywhere",
                          margin: 0
                        }}>
                          {cls.title}
                        </p>
                      </span>
                    ))}
                    <p>{item?.lastUpdate ? (<p>Last updated: {item?.lastUpdate}</p>) : (<></>)}</p>
                  </>
                  ) : null
                }
              </div>            
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                width: "100%",
              }}
            >
              <button 
                onClick={() => (isSelected ? disconnect(item) : connect(item))}
                style={{
                  ...(isSelected
                    ? styledAccentButtonPurple
                    : styledPrimaryButton),
                  flex: "1 1 240px",
                  maxWidth: "79%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                >
                  <Icon name={isSelected ? "unlink" : "linkify"} />
                  {isSelected
                    ? t("board.expendedCard.disconnect")
                    : t("board.expendedCard.connect")}
              </button>
                {isAssignment && (
                  <button
                    onClick={() => openAssignmentModal?.(item)}
                    style={{
                      ...styledSecondaryButtonBlue,
                      flex: "0 1 120px",
                      maxWidth: "19%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 16px",
                    }}
                    aria-label={t("boardManagement.edit", "Edit")}
                  >
                    <Icon name="pencil" />
                  </button>
                )}
                {(isTask || isStudy) && (
                  <button
                    onClick={() => window.open(viewUrl, '_blank', 'noopener,noreferrer')}
                    style={{
                      ...styledSecondaryButtonBlue,
                      flex: "0 1 120px",
                      maxWidth: "19%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 16px",
                    }}
                    aria-label={t("boardManagement.preview", "Preview")}
                  >
                    <Icon name="external" />
                  </button>
                )}
                {isResource && (
                  <button
                    onClick={() => window.open(editUrl, '_blank', 'noopener,noreferrer')}
                    style={{
                      ...styledSecondaryButtonBlue,
                      flex: "0 1 120px",
                      maxWidth: "19%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 16px",
                    }}
                    aria-label={t("boardManagement.edit", "Edit")}
                  >
                    <Icon name="pencil" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const AssignmentModal = ({ open, t, onClose, assignmentId, user }) => {
  const [editedAssignment, setEditedAssignment] = useState({
    title: '',
    content: '',
    placeholder: ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  const styleField = {
    fontSize: "14px",
    padding: "20px",
    borderRadius: "16px",
    border: "0px",
    background: "rgba(51, 111, 138, 0.04)",
  }

  const editableFieldStyle = {
    ...styleField,
    minWidth: "100%",
    fontFamily: "inherit"
  };
  
  // Add CSS for placeholder styling
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      [contenteditable][data-placeholder]:empty::before {
        content: attr(data-placeholder);
        color: #999;
        font-style: italic;
      }
      [contenteditable]:focus {
        outline: 2px solid #336F8A;
        outline-offset: -2px;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const [editAssignment, { loading: editLoading }] = useMutation(
    EDIT_ASSIGNMENT,
    {
      variables: {
        id: assignmentId,
      },
      refetchQueries: [
        {
          query: GET_AN_ASSIGNMENT,
          variables: { id: assignmentId },
        },
      ],
    }
  );
  
  const { data, loading, error } = useQuery(GET_AN_ASSIGNMENT, {
    variables: { id: assignmentId },
    fetchPolicy: "network-only", // forces fresh fetch each time
    skip: !assignmentId, // don't fetch if no ID
  });

  // Update local state when assignment data loads
  useEffect(() => {
    if (data?.assignments?.[0] && data.assignments[0].id === assignmentId) {
      const assignment = data.assignments[0];
      const newState = {
        title: assignment.title || '',
        content: assignment.content || '',
        placeholder: assignment.placeholder || ''
      };
      setEditedAssignment(newState);
      setHasChanges(false);
    }
  }, [data, assignmentId]);
  

  const handleFieldChange = (field, value) => {
    setEditedAssignment(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  // Helper function to save and restore cursor position
  const saveSelection = (containerEl) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(containerEl);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      return preSelectionRange.toString().length;
    }
    return 0;
  };

  const restoreSelection = (containerEl, savedPos) => {
    const selection = window.getSelection();
    const range = document.createRange();
    let charCount = 0;
    
    const walker = document.createTreeWalker(
      containerEl,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
      const nodeLength = node.textContent.length;
      if (charCount + nodeLength >= savedPos) {
        range.setStart(node, savedPos - charCount);
        range.setEnd(node, savedPos - charCount);
        break;
      }
      charCount += nodeLength;
    }

    selection.removeAllRanges();
    selection.addRange(range);
  };
  
  const handleSave = async () => {
    try {
      await editAssignment({
        variables: {
          input: {
            title: editedAssignment.title,
            content: editedAssignment.content,
            placeholder: editedAssignment.placeholder
          }
        }
      });
      setHasChanges(false);
      // Optional: Show success message
      alert(t("assignment.saveSuccess", "Assignment saved successfully!"));
    } catch (err) {
      alert(err.message);
    }
  };

  const copyLink = () => {
    const copyLink = `${origin}/dashboard/assignments/${assignment?.code}`;
    const temp = document.createElement("input");
    document.body.append(temp);
    temp.value = copyLink;
    temp.select();
    document.execCommand("copy");
    temp.remove();
    alert(t("assignment.linkCopied"));  
  };

  if (!assignmentId) return null;
  if (loading) return <p>Loading assignment…</p>;
  if (error) return <p>Error loading assignment</p>;

  const assignment = data.assignments[0];

  
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="large"
      style={{ borderRadius: "12px", overflow: "hidden" }}
    >
      <Modal.Header
        style={{
          background: "#f9fafb",
          borderBottom: "1px solid #e0e0e0",
          fontFamily: "Nunito",
          fontWeight: 600,
        }}
      >
        {t("board.expendedCard.previewAssignment", "Preview Assignment")}
        {hasChanges && (
          <span style={{ 
            color: "#8A2CF6", 
            fontSize: "12px", 
            marginLeft: "10px",
            fontWeight: 400 
          }}>
            {t("assignment.unsavedChanges", "(Unsaved changes)")}
          </span>
        )}
      </Modal.Header>
      <Modal.Content
        scrolling
        style={{ background: "#ffffff", padding: "24px" }}
      >
      <div>
        <p style={{marginTop: "10px", fontSize: "24px", color: "#274E5B", marginTop: "3rem"}} >{t("board.expendedCard.title")}</p>
        <textarea
          style={editableFieldStyle}
          value={editedAssignment.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder={t("assignment.titlePlaceholder", "Enter assignment title...")}
        />
        <p style={{marginTop: "10px", fontSize: "24px", color: "#274E5B", marginTop: "3rem"}} >{t("assignment.instructions")}</p>
        <TipTapEditor
          content={editedAssignment.content}
          placeholder={t("assignment.instructionsPlaceholder", "Enter assignment instructions...")}
          onUpdate={(newContent) => handleFieldChange('content', newContent)}
        />


        <p style={{marginTop: "10px", fontSize: "24px", color: "#274E5B", marginTop: "3rem"}} >{t("assignment.placeholderInstructions")}</p>
        <TipTapEditor
          content={editedAssignment.placeholder}
          placeholder={t("assignment.instructionsPlaceholder", "Enter placeholder shown to students...")}
          onUpdate={(newContent) => handleFieldChange('placeholder', newContent)}
        />
      </div>
    </Modal.Content>
      <Modal.Actions
        style={{ background: "#f9fafb", borderTop: "1px solid #e0e0e0" }}
      >
        {/* Save button */}
        {hasChanges && (
          <Button
            loading={editLoading}
            disabled={editLoading}
            style={{
              borderRadius: "100px",
              background: "#7D70AD",
              fontSize: "16px",
              color: "white",
              border: "1px solid #7D70AD",
              marginRight: "10px"
            }}
            onClick={handleSave}
          >
            {t("assignment.save", "Save Changes")}
          </Button>
        )}
        
        {!hasChanges && (
          <>
            {/* Show alert if assignment is not connected to a class */}
            {(assignment?.classes?.length === 0 || !assignment.classes) && (
              <div
                style={{
                  background: "#fff7cd",
                  color: "#664d03",
                  border: "1px solid #ffecb5",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "16px",
                  fontSize: "15px",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    marginRight: "8px"
                  }}
                >&#9888;</span>
                {t(
                  "assignment.classWarning",
                  "This assignment is not connected to a class, you can do that by associating this project board to a class."
                )}
              </div>
            )}
            {assignment?.public ? (
              // Button when assignment is public
              <>
                <Button
                  style={{
                    borderRadius: "100px",
                    background: "white",
                    fontSize: "16px",
                    color: "#336F8A",
                    border: "1px solid #336F8A"
                  }}
                  onClick={copyLink}
                >
                  {t("assignment.copyLink")}
                </Button>
                <Button
                  style={{
                    borderRadius: "100px",
                    background: "white",
                    fontSize: "16px",
                    color: "#336F8A",
                    border: "1px solid #336F8A"
                  }}
                  onClick={() => {
                    if (confirm(t("assignment.revokeConfirm"))) {
                      editAssignment({
                        variables: { input: { public: false } },
                      }).catch((err) => {
                        alert(err.message);
                      });
                    }
                  }}
                >
                  {t("assignment.unpublish")}
                </Button>
              </>
            ) : (
              // Button when assignment is not public
              <Button
                style={{
                  borderRadius: "100px",
                  background: "white",
                  fontSize: "16px",
                  color: "#336F8A",
                  border: "1px solid #336F8A"
                }}
                onClick={() => {
                  if (confirm(t("assignment.submitConfirm"))) {
                    editAssignment({
                      variables: { input: { public: true } },
                    }).catch((err) => {
                      alert(err.message);
                    });
                  }
                }}
              >
                {t("assignment.publishToStudents")}
              </Button>
            )}
          </>
        )}


        <Button
          onClick={onClose}
          style={{
            borderRadius: "100px",
            background: "#336F8A",
            fontSize: "16px",
            color: "white",
            border: "1px solid #336F8A"
          }}
        >
          {t("board.expendedCard.close", "Close")}
        </Button>


      </Modal.Actions>
    </Modal>
  );
};

export const PreviewSection = ({
  title,
  items,
  type,
  proposal,
  openAssignmentModal,
  user,
}) => {
  const { t } = useTranslation("classes");

  return (
    <>
      <div
        className="cardHeader"
        style={{
          fontFamily: "Nunito",
          fontSize: "20px",
          fontWeight: 600,
          color: "#333",
          marginTop: "20px",
        }}
      >
        {title}
      </div>
      <div
        className="previewGrid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "20px",
          marginTop: "10px",
        }}
      >
        {items.map((item) => {
          const isTaskOrStudy = type === "task" || type === "study";
          const isTask = type === "task";
          const isStudy = type === "study";
          const isAssignment = type === "assignment";
          const isResource = type === "resource";
          let viewUrl = `/dashboard/${type}s/view?id=${item?.id}`;
          if (isTask) {
            viewUrl = `/dashboard/discover/tasks?name=${item?.slug}`;
          }
          if (isStudy) {
            viewUrl = `/dashboard/discover/studies?name=${item?.slug}`;
          }
          const editUrl = item?.isCustom
            ? `/dashboard/${type}s/edit?id=${item?.id}`
            : `/dashboard/${type}s/copy?id=${item?.id}&p=${proposal?.id}`;
          const content = isResource
            ? item?.content?.main || ""
            : item?.content || "";

          // Handle click based on item type for PreviewSection
          const handlePreviewCardClick = () => {
            if (isAssignment) {
              openAssignmentModal?.(item);
            } else if (isResource) {
              window.open(viewUrl, '_blank', 'noopener,noreferrer');
            } else if (isTask || isStudy) {
              window.open(viewUrl, '_blank', 'noopener,noreferrer');
            }
          };

          return (
            <div
              className="itemBlockPreview"
              key={item.id}
              onClick={handlePreviewCardClick}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "12px",
                padding: "16px",
                background: "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.borderColor = "#336F8A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                e.currentTarget.style.transform = "translateY(0px)";
                e.currentTarget.style.borderColor = "#e0e0e0";
              }}
            >
              <div
                className="titleIcons"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#333",
                    margin: 0,
                  }}
                >
                  {item?.title || "Untitled"}
                </h2>
              </div>
              {!isAssignment && (
                <div
                  style={{ fontSize: "14px", color: "#666", lineHeight: "1.5" }}
                >
                  {/* {ReactHtmlParser(truncateHtml(content, 50))} */}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

function truncateHtml(html, wordLimit = 10) {
  const div = document.createElement("div");
  div.innerHTML = html || "";

  const text = div.textContent || div.innerText;
  const words = text.trim().split(/\s+/);

  if (words.length <= wordLimit) {
    return html || "";
  }

  let charCount = 0;
  for (let i = 0; i < wordLimit; i++) {
    charCount += words[i].length + 1;
  }

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html || "";

  let result = "";
  let currentLength = 0;

  function processNode(node) {
    if (node.nodeType === 3) {
      const text = node.textContent;
      const remaining = charCount - currentLength;

      if (currentLength >= charCount) {
        return false;
      }

      if (currentLength + text.length > charCount) {
        const truncated = text.substr(0, remaining).trim();
        result += truncated;
        currentLength += truncated.length;
        return false;
      }

      result += text;
      currentLength += text.length;
      return true;
    }

    result += `<${node.tagName.toLowerCase()}`;

    Array.from(node.attributes).forEach((attr) => {
      result += ` ${attr.name}="${attr.value}"`;
    });

    result += ">";

    Array.from(node.childNodes).every((child) => processNode(child));

    result += `</${node.tagName.toLowerCase()}>`;
    return true;
  }

  Array.from(tempDiv.childNodes).every((node) => processNode(node));

  return result + "...";
}
