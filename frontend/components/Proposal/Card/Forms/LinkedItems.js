import { useQuery } from "@apollo/client";
import { Button, Icon, Modal, Tab } from "semantic-ui-react";
import { useState, useEffect } from "react";
import useTranslation from "next-translate/useTranslation";
import { TYPO } from "./utils";

import {
  GET_PUBLIC_RESOURCES,
  GET_MY_RESOURCES,
  GET_TEMPLATE_ASSIGNMENT,
} from "../../../Queries/Resource";

import { PUBLIC_STUDIES } from "../../../Queries/Study";
import { ALL_PUBLIC_TASKS } from "../../../Queries/Task";

import { GET_MY_ASSIGNMENTS } from "../../../Queries/Assignment";

import AssignmentEditModal from "../../../TipTap/AssignmentEditModal"
import AssignmentViewModal from "../../../TipTap/AssignmentViewModal"
import AssignmentCopyModal from "../../../TipTap/AssignmentCopyModal";
import Chip from "../../../DesignSystem/Chip";
import { PreviewSection } from "./PreviewSection";
import ResourceEditModal from "./ResourceEditModal";
import AssignmentModal from "./AssignmentModal";
import ItemTab from "./ItemTab";

export default function LinkedItems({
  proposal,
  user,
  handleChange,
  selectedResources,
  selectedAssignments,
  selectedTasks,
  selectedStudies,
  totalLinked,
  onAssignmentPublicChange,
  onLinkedItemsClose,
}) {
  const { t } = useTranslation("classes");

  // Track selectedResources changes
  useEffect(() => {
    console.log("📊 [selectedResources Changed]:", {
      count: selectedResources.length,
      resources: selectedResources.map(r => ({
        id: r.id,
        title: r.title,
        isPublic: r.isPublic,
        parentId: r.parent?.id
      }))
    });
  }, [selectedResources]);

  // Queries for Resources
  const {
    data: publicData,
    error: publicError,
    loading: publicLoading,
    refetch: refetchPublicResources,
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
    refetch: refetchMyResources,
  } = useQuery(GET_MY_RESOURCES, {
    variables: { id: user?.id },
  });

  const publicResources = {
    assignments: publicAssignment?.assignments || {},
    resources: publicData?.resources || {}
  } || {};
  const myResources = myData?.resources || [];
  const myResourcesForTab = myResources.filter(
    (resource) => resource?.author?.id === user?.id || !resource?.parent
  );

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

  const handleCloseModal = () => {
    onLinkedItemsClose?.();
    setOpen(false);
  };

  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [viewAssignmentModalOpen, setViewAssignmentModalOpen] = useState(false);
  const [editAssignmentModalOpen, setEditAssignmentModalOpen] = useState(false);
  const [viewAssignmentId, setViewAssignmentId] = useState(null);
  const [editAssignmentId, setEditAssignmentId] = useState(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyAssignment, setCopyAssignment] = useState(null);

  const createInitialResourceModalState = () => ({
    open: false,
    resourceId: null,
    sourceType: null,
    templateId: null,
    existingCustomResourceId: null,
  });

  const [resourceModalState, setResourceModalState] = useState(
    createInitialResourceModalState
  );

  const closeResourceModal = () =>
    setResourceModalState(createInitialResourceModalState());

  const openResourceModalHandler = (resource, context = {}) => {
    console.log("📝 [openResourceModalHandler] Called with:", {
      resourceId: resource?.id,
      resourceTitle: resource?.title,
      resourceIsPublic: resource?.isPublic,
      resourceParentId: resource?.parent?.id,
      context
    });
    
    if (!resource?.id) {
      console.error("❌ [openResourceModalHandler] No resource provided");
      return;
    }

    const derivedSourceType =
      context.sourceType ||
      (resource?.parent?.id ? "custom" : resource?.isPublic ? "public" : "mine");

    const templateId =
      derivedSourceType === "public"
        ? resource.id
        : resource?.parent?.id || resource.id;

    const existingCustom = templateId
      ? myResources.find(
          (myResource) =>
            myResource?.parent?.id === templateId &&
            myResource?.author?.id === user?.id
        )
      : null;

    console.log("📝 [openResourceModalHandler] Derived values:", {
      derivedSourceType,
      templateId,
      existingCustomId: existingCustom?.id,
      existingCustomTitle: existingCustom?.title
    });

    setResourceModalState({
      open: true,
      resourceId: resource.id,
      sourceType: derivedSourceType,
      templateId,
      existingCustomResourceId: existingCustom?.id || null,
    });
  };

  const handleResourceModalSaved = async ({
    mode,
    resourceId: savedResourceId,
    templateId,
  }) => {
    try {
      await refetchPublicResources?.();
    } catch (err) {
      console.error("Failed to refetch public resources after saving:", err);
    }

    let myResourcesResult;
    try {
      if (refetchMyResources) {
        myResourcesResult = await refetchMyResources();
      }
    } catch (err) {
      console.error("Failed to refetch my resources after saving:", err);
    }

    if (!myResourcesResult?.data?.resources || !savedResourceId) {
      return;
    }

    const updatedResource = myResourcesResult.data.resources.find(
      (resource) => resource.id === savedResourceId
    );

    if (!updatedResource) {
      return;
    }

    const currentSelected = selectedResources || [];
    console.log("💾 [handleResourceModalSaved] Current selection:", {
      mode,
      savedResourceId,
      templateId,
      currentSelectedIds: currentSelected.map(r => r.id),
      currentSelectedDetails: currentSelected.map(r => ({
        id: r.id,
        title: r.title,
        isPublic: r.isPublic,
        parentId: r.parent?.id
      })),
      updatedResourceId: updatedResource?.id,
      updatedResourceTitle: updatedResource?.title,
      updatedResourceIsPublic: updatedResource?.isPublic,
      updatedResourceParentId: updatedResource?.parent?.id
    });
    
    let shouldUpdateSelection = false;

    const updatedSelection = currentSelected.map((res) => {
      if (mode === "createCopy" && templateId && res.id === templateId) {
        console.log("🔄 [handleResourceModalSaved] Replacing template with copy:", {
          templateId: res.id,
          newResourceId: updatedResource.id
        });
        shouldUpdateSelection = true;
        return updatedResource;
      }
      if (mode === "update" && res.id === savedResourceId) {
        console.log("🔄 [handleResourceModalSaved] Updating existing resource:", {
          resourceId: res.id,
          newResourceId: updatedResource.id
        });
        shouldUpdateSelection = true;
        return updatedResource;
      }
      return res;
    });

    if (shouldUpdateSelection) {
      console.log("✅ [handleResourceModalSaved] Updating selection:", {
        newSelectionIds: updatedSelection.map(r => r.id),
        newSelectionDetails: updatedSelection.map(r => ({
          id: r.id,
          title: r.title,
          isPublic: r.isPublic,
          parentId: r.parent?.id
        }))
      });
      handleChange({
        target: { name: "resources", value: updatedSelection },
      });
    } else {
      console.log("⚠️ [handleResourceModalSaved] No selection update needed");
    }
  };

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
  // NOTE: We do NOT merge public resources with custom copies here.
  // When a user clicks "Connect" on a public resource, we want to keep the public resource.
  // Custom copies are only relevant when using the "Copy" button flow.
  const selectedResourcesMerged = selectedResources.map((selectedResource) => {
    // Keep the original resource as-is - don't replace with custom copy
    // This ensures that when connecting a public resource, it stays as the public resource
    console.log("🔄 [selectedResourcesMerged] Keeping original resource (no merge):", {
      selectedResourceId: selectedResource?.id,
      selectedResourceTitle: selectedResource?.title,
      selectedResourceIsPublic: selectedResource?.isPublic,
      selectedResourceParentId: selectedResource?.parent?.id
    });
    return selectedResource;
  });


  // Generic connect/disconnect
  const connectItem = (item, fieldName, selectedArray) => {
    console.log("🔗 [connectItem] Called with:", {
      itemId: item?.id,
      itemTitle: item?.title,
      itemIsPublic: item?.isPublic,
      itemParentId: item?.parent?.id,
      fieldName,
      selectedArrayIds: selectedArray.map(s => s.id),
      selectedArrayDetails: selectedArray.map(s => ({
        id: s.id,
        title: s.title,
        isPublic: s.isPublic,
        parentId: s.parent?.id
      }))
    });
    
    if (!selectedArray.some((s) => s.id === item.id)) {
      const newSelected = [...selectedArray, item];
      console.log("✅ [connectItem] Adding item to selection:", {
        newSelectedIds: newSelected.map(s => s.id),
        newSelectedDetails: newSelected.map(s => ({
          id: s.id,
          title: s.title,
          isPublic: s.isPublic,
          parentId: s.parent?.id
        }))
      });
      handleChange({ target: { name: fieldName, value: newSelected } });
    } else {
      console.log("⚠️ [connectItem] Item already in selection, skipping");
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
          openResourceModal={openResourceModalHandler}
        />
      ),
    },
    {
      menuItem: t("board.expendedCard.myResources"),
      render: () => (
        <ItemTab
          user={user}
          items={myResourcesForTab}
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
          openResourceModal={openResourceModalHandler}
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
          openResourceModal={openResourceModalHandler}
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
          openResourceModal={openResourceModalHandler}
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
          openResourceModal={openResourceModalHandler}
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
    ...TYPO.bodyMedium,
    cursor: "pointer",
    transition: "background 0.3s ease",
    border: "1.5px solid #336F8A",
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          height: "40px",
          padding: "8px 24px 8px 16px",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          color: "#336F8A",
          background: "white",
          border: "2px solid #336F8A",
          borderRadius: "100px",
          cursor: "pointer",
          ...TYPO.bodyMedium,
        }}
      >
        {t("board.expendedCard.linkItems", "Link Items")} ({totalLinked})
      </Button>

      <Modal
        open={open}
        onClose={handleCloseModal}
        size="large"
        style={{ borderRadius: "12px", overflow: "hidden" }}
      >
        <Modal.Header
          style={{
            background: "#f9fafb",
            borderBottom: "1px solid #e0e0e0",
            ...TYPO.titleS,
          }}
        >
          {t(
            "board.expendedCard.selectItemsToConnect",
            "Select Items to Connect"
          )}
        </Modal.Header>
        <Modal.Content scrolling style={{ background: "#ffffff", padding: 0, ...TYPO.body }}>
          <Tab panes={panes} style={{ fontFamily: TYPO.fontFamily }} />
        </Modal.Content>
        <Modal.Actions
          style={{ background: "#f9fafb", borderTop: "1px solid #e0e0e0" }}
        >

          <button
            onClick={handleCloseModal}
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
        onAssignmentPublicChange={onAssignmentPublicChange}
      />
  
      <AssignmentViewModal
        user={user}
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

      <ResourceEditModal
        open={resourceModalState.open}
        t={t}
        onClose={closeResourceModal}
        resourceId={resourceModalState.resourceId}
        sourceType={resourceModalState.sourceType}
        templateId={resourceModalState.templateId}
        existingCustomResourceId={resourceModalState.existingCustomResourceId}
        user={user}
        proposal={proposal}
        onSaved={handleResourceModalSaved}
      />



      {/* Assignments first (top section) */}
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
      {/* Combined Resources section: resources, then 24px gap, then tasks and studies */}
      {(selectedResourcesMerged.length > 0 || selectedTasks.length > 0 || selectedStudies.length > 0) && (
        <PreviewSection
          title={t("board.expendedCard.previewLinkedResources")}
          sections={[
            ...(selectedResourcesMerged.length > 0 ? [{ items: selectedResourcesMerged, type: "resource" }] : []),
            ...(selectedTasks.length > 0 ? [{ items: selectedTasks, type: "task" }] : []),
            ...(selectedStudies.length > 0 ? [{ items: selectedStudies, type: "study" }] : []),
          ]}
          proposal={proposal}
          openAssignmentModal={openAssignmentModalHandler}
          openResourceModal={openResourceModalHandler}
          user={user}
        />
      )}
    </>
  );
}

export { ResourceEditModal };