import { useQuery } from "@apollo/client";
import { useLinkableItems } from "../../../../lib/linkableItems";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { stripHtml, TYPO } from "./utils";

import { PUBLIC_STUDIES } from "../../../Queries/Study";
import { ALL_PUBLIC_TASKS } from "../../../Queries/Task";

import ResourcePreviewModal from "../../../Dashboard/Resources/ResourcePreviewModal";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import Input from "../../../DesignSystem/Input";
import MessageCard from "../../../DesignSystem/MessageCard";
import Modal from "../../../DesignSystem/Modal";
import Navbar, { NavbarItem } from "../../../DesignSystem/Navbar";
import { PreviewSection } from "./PreviewSection";
import { useTemplateAssignmentCompletion } from "../../../../lib/assignmentCompletion";
import { getBoardTemplateClassIds } from "../../../../lib/classTemplateBoards";
import {
  canEditLinkedItem,
  getLinkedItemActions,
  getLinkedItemPreviewUrl,
} from "../../../../lib/linkedItemActions";
import ResourceEditModal from "./ResourceEditModal";
import AssignmentModal from "./AssignmentModal";
import LinkedItemsList from "./LinkedItemsList";

const TOOLBAR_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginBottom: "16px",
};

const FILTER_ROW_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "8px",
};

// Light panel grouping the linked-item previews under the Link Items button.
const PREVIEW_CONTAINER_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  width: "100%",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6)",
  background: "#F6F9F8",
};

// Clears the Modal's frosted footer so the list scrolls underneath it.
const FROSTED_BODY_STYLE = {
  paddingTop: "24px",
  paddingBottom: "var(--ds-modal-frosted-pad-bottom, 96px)",
};

const FOOTER_BUTTONS_STYLE = {
  display: "flex",
  gap: "8px",
};

const FOOTER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
};

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
  // Class template boards: per-assignment completion count of its students.
  const assignmentCompletion = useTemplateAssignmentCompletion(
    proposal,
    selectedAssignments
  );

  // Resources and assignments scoped to the board's classes + mine + public.
  const {
    classIds,
    resources: linkableResources,
    assignments: linkableAssignments,
    resourcesLoading,
    assignmentsLoading,
    refetchResources,
    refetchAssignments,
  } = useLinkableItems(proposal, user);

  const myResources = linkableResources.filter((r) => r.sources.includes("mine"));
  // LinkedItemCard reads `myAssignments.assignments` to spot existing copies.
  const myAssignmentsData = {
    assignments: linkableAssignments.filter((a) => a.sources.includes("mine")),
  };

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
    setNotice(null);
    setSummaryDismissed(false);
    onLinkedItemsClose?.();
    setOpen(false);
  };

  // One assignment modal: { id, mode: "view" | "edit" | "copy" } or null.
  const [assignmentModal, setAssignmentModal] = useState(null);
  // Success line shown at the top of the picker.
  const [notice, setNotice] = useState(null);
  // Linked-count summary at the top; dismissed until the picker reopens.
  const [summaryDismissed, setSummaryDismissed] = useState(false);

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

  // `intent` is "edit" or "copy". Someone else's resource can only be
  // copied, whatever the caller asks for.
  const openResourceModalHandler = (resource, intent = "edit") => {
    if (!resource?.id) {
      console.error("[openResourceModalHandler] No resource provided");
      return;
    }

    const isCopy = intent === "copy" || !canEditLinkedItem(resource, user);
    const templateId = isCopy
      ? resource.id
      : resource?.parent?.id || resource.id;

    const existingCustom = isCopy
      ? myResources.find(
          (myResource) =>
            myResource?.parent?.id === templateId &&
            myResource?.author?.id === user?.id
        )
      : null;

    setResourceModalState({
      open: true,
      resourceId: resource.id,
      // ResourceEditModal treats "public" as copy mode.
      sourceType: isCopy ? "public" : "mine",
      templateId,
      existingCustomResourceId: existingCustom?.id || null,
    });
  };

  const handleResourceModalSaved = async ({
    mode,
    resourceId: savedResourceId,
    templateId,
  }) => {
    let myResourcesResult;
    try {
      myResourcesResult = await refetchResources?.();
    } catch (err) {
      console.error("Failed to refetch resources after saving:", err);
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
    // Copy & link: the copy replaces the original if it was linked,
    // otherwise it is added. An edit refreshes the linked entry in place.
    const isTarget = (res) =>
      mode === "createCopy" ? res.id === templateId : res.id === savedResourceId;
    const replaced = currentSelected.some(isTarget);
    let updatedSelection = currentSelected.map((res) =>
      isTarget(res) ? updatedResource : res
    );
    if (mode === "createCopy" && !replaced) {
      updatedSelection = [...updatedSelection, updatedResource];
    }
    if (mode === "createCopy" || replaced) {
      handleChange({ target: { name: "resources", value: updatedSelection } });
    }
    setNotice(
      mode === "createCopy"
        ? t("board.expendedCard.copyLinked", "Your copy was created and linked to this card.")
        : t("assignment.changeSuccess", "Changes saved successfully")
    );
  };

  // Copy & link for assignments: link the new copy in place of the original.
  const handleAssignmentCopied = async ({ id, originalId }) => {
    let copy = { id };
    try {
      const result = await refetchAssignments?.();
      copy = result?.data?.assignments?.find((a) => a.id === id) || copy;
    } catch (err) {
      console.error("Failed to refetch assignments after copying:", err);
    }
    const withoutOriginal = selectedAssignments.filter((a) => a.id !== originalId);
    handleChange({
      target: { name: "assignments", value: [...withoutOriginal, copy] },
    });
    setNotice(
      t("board.expendedCard.copyLinked", "Your copy was created and linked to this card.")
    );
  };

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

  const openAssignmentModal = (assignment, mode) => {
    if (!assignment?.id) return;
    setAssignmentModal({ id: assignment.id, mode });
  };

  // The resource being previewed (the item, so ownership can offer Edit).
  const [previewResource, setPreviewResource] = useState(null);

  const previewItem = (item, type) => {
    if (type === "assignment") openAssignmentModal(item, "view");
    else if (type === "resource") setPreviewResource(item);
    else {
      const url = getLinkedItemPreviewUrl(item, type);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const editItem = (item, type) => {
    if (type === "assignment") openAssignmentModal(item, "edit");
    else if (type === "resource") openResourceModalHandler(item, "edit");
  };

  const copyItem = (item, type) => {
    if (type === "assignment") openAssignmentModal(item, "copy");
    else if (type === "resource") openResourceModalHandler(item, "copy");
  };

  // Plain click on a linked chip: edit what you own, preview the rest.
  const openLinkedItem = (item, type) => {
    if (getLinkedItemActions(item, type, user).open === "edit") editItem(item, type);
    else previewItem(item, type);
  };

  // --- Picker state: one kind at a time, filtered by source and search ---
  const [kind, setKind] = useState("resources");
  const [sourceFilter, setSourceFilter] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedByField = {
    resources: selectedResources,
    assignments: selectedAssignments,
    tasks: selectedTasks,
    studies: selectedStudies,
  };
  const fieldForType = {
    resource: "resources",
    assignment: "assignments",
    task: "tasks",
    study: "studies",
  };
  const isLinked = (item, type) =>
    (selectedByField[fieldForType[type]] || []).some((s) => s.id === item.id);
  const linkItem = (item, type) => {
    const field = fieldForType[type];
    connectItem(item, field, selectedByField[field] || []);
  };
  const unlinkItem = (item, type) => {
    const field = fieldForType[type];
    disconnectItem(item, field, selectedByField[field] || []);
  };

  const sourceOptions = [
    ...(classIds.length > 0
      ? [{ value: "class", label: t("board.expendedCard.thisClass", "This class") }]
      : []),
    { value: "mine", label: t("board.expendedCard.sourceMine", "Mine") },
    { value: "public", label: t("board.expendedCard.sourcePublic", "Public") },
  ];
  const toggleSource = (value) =>
    setSourceFilter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );

  const matchesSearch = (item) => {
    const query = searchQuery.trim().toLowerCase();
    return !query || stripHtml(item?.title || "").toLowerCase().includes(query);
  };
  // No source selected means every source.
  const matchesSource = (item) =>
    sourceFilter.length === 0 ||
    item.sources?.some((source) => sourceFilter.includes(source));

  const entriesByKind = {
    resources: linkableResources.map((item) => ({ item, type: "resource" })),
    assignments: linkableAssignments.map((item) => ({ item, type: "assignment" })),
    tasks: publicTasks.map((item) => ({ item, type: "task" })),
    studies: publicStudies.map((item) => ({ item, type: "study" })),
  };
  const showSources = kind === "resources" || kind === "assignments";
  const visibleEntries = entriesByKind[kind].filter(
    ({ item }) => matchesSearch(item) && (!showSources || matchesSource(item))
  );
  const kindLoading = {
    resources: resourcesLoading,
    assignments: assignmentsLoading,
    tasks: publicTasksLoading,
    studies: publicStudiesLoading,
  }[kind];

  const linkedCount = {
    resources: selectedResources.length,
    assignments: selectedAssignments.length,
    tasks: selectedTasks.length,
    studies: selectedStudies.length,
  };
  const kindItems = [
    {
      value: "resources",
      label: t("board.expendedCard.resources", "Resources"),
    },
    {
      value: "assignments",
      label: t("board.expendedCard.assignments", "Assignments"),
    },
    {
      value: "tasks",
      label: t("board.expendedCard.tasksAndSurveys", "Tasks & surveys"),
    },
    {
      value: "studies",
      label: t("board.expendedCard.studies", "Studies"),
    },
  ];

  const emptyLabel = searchQuery || (showSources && sourceFilter.length > 0)
    ? t("board.expendedCard.noSearchResults", "No items found matching your search.")
    : t("board.expendedCard.noItems", "No items available.");

  // Semantic sub-modals (edit / copy) sit above the picker; while one is
  // open, Escape and backdrop clicks belong to it, not the picker.
  const totalLinkedPreview =
    selectedAssignments.length +
    selectedResources.length +
    selectedTasks.length +
    selectedStudies.length;

  const subModalOpen =
    Boolean(assignmentModal) ||
    resourceModalState.open ||
    Boolean(previewResource);

  return (
    <>
      <Button
        variant="subtle"
        leadingIcon={<img src="/assets/icons/plus.svg" alt="Link Items" />}
        onClick={() => setOpen(true)}
      >
        {t("board.expendedCard.linkItems", "Link Items")} ({totalLinked})
      </Button>

      <Modal
        open={open}
        onClose={subModalOpen ? undefined : handleCloseModal}
        size="large"
        maxWidth={1040}
        height="90vh"
        frostedChrome
        actions={
          <div style={FOOTER_STYLE}>
            <span style={{ ...TYPO.body, color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)" }}>
              {t(
                "board.expendedCard.linkedCount",
                { count: totalLinked },
                { default: "{{count}} linked" }
              )}
            </span>
            <div style={FOOTER_BUTTONS_STYLE}>
              <Button variant="outline" onClick={handleCloseModal}>
                {t("board.expendedCard.close", "Close")}
              </Button>
              <Button variant="filled" onClick={handleCloseModal}>
                {t("board.expendedCard.done", {}, { default: "Done" })}
              </Button>
            </div>
          </div>
        }
      >
        <div style={FROSTED_BODY_STYLE}>
          {!summaryDismissed && (
            <div style={{ marginBottom: "16px" }}>
              <MessageCard
                variant="information"
                message={t(
                  "board.expendedCard.linkedSummary",
                  linkedCount,
                  {
                    default:
                      "Linked to this card: {{resources}} resources, {{assignments}} assignments, {{tasks}} tasks & surveys, {{studies}} studies",
                  }
                )}
                onClose={() => setSummaryDismissed(true)}
                closeAriaLabel={t("board.expendedCard.close", "Close")}
              />
            </div>
          )}
          <div style={TOOLBAR_STYLE}>
            <Navbar
              variant="underline"
              showRule
              aria-label={t("board.expendedCard.linkItemsTitle", "Link items to this card")}
            >
              {kindItems.map((option) => (
                <NavbarItem
                  key={option.value}
                  selected={kind === option.value}
                  onClick={() => setKind(option.value)}
                >
                  {option.label}
                </NavbarItem>
              ))}
            </Navbar>
            <div style={FILTER_ROW_STYLE}>
              <Input
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t("board.expendedCard.searchPlaceholder", "Search by title...")}
                aria-label={t("board.expendedCard.searchPlaceholder", "Search by title...")}
                wrapperStyle={{ flex: "1 1 240px", width: "auto" }}
              />
              {showSources &&
                sourceOptions.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    selected={sourceFilter.includes(option.value)}
                    onClick={() => toggleSource(option.value)}
                  />
                ))}
            </div>
          </div>
          {notice && (
            <div style={{ marginBottom: "16px" }}>
              <MessageCard
                variant="success"
                message={notice}
                onClose={() => setNotice(null)}
                closeAriaLabel={t("board.expendedCard.close", "Close")}
              />
            </div>
          )}
          <LinkedItemsList
            entries={visibleEntries}
            loading={kindLoading}
            isLinked={isLinked}
            onLink={linkItem}
            onUnlink={unlinkItem}
            onPreview={previewItem}
            onEdit={editItem}
            onCopy={copyItem}
            myAssignments={myAssignmentsData}
            showSources={showSources}
            emptyLabel={emptyLabel}
            user={user}
            t={t}
          />
        </div>
      </Modal>

      <AssignmentModal
        open={Boolean(assignmentModal)}
        mode={assignmentModal?.mode}
        assignmentId={assignmentModal?.id}
        user={user}
        classIds={classIds}
        t={t}
        onClose={() => setAssignmentModal(null)}
        onCopied={handleAssignmentCopied}
        onAssignmentPublicChange={onAssignmentPublicChange}
      />

      <ResourcePreviewModal
        id={previewResource?.id}
        onClose={() => setPreviewResource(null)}
        onEdit={
          canEditLinkedItem(previewResource, user)
            ? () => {
                openResourceModalHandler(previewResource, "edit");
                setPreviewResource(null);
              }
            : undefined
        }
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

      {totalLinkedPreview > 0 && (
      <div style={PREVIEW_CONTAINER_STYLE}>
      {/* Assignments first (top section) */}
      {selectedAssignments.length > 0 && (
        <PreviewSection
          title={t("board.expendedCard.previewLinkedAssignments")}
          items={selectedAssignments}
          type="assignment"
          proposal={proposal}
          classId={proposal?.usedInClass?.id}
          openAssignmentModal={(item) => openLinkedItem(item, "assignment")}
          user={user}
          completionByAssignmentId={assignmentCompletion}
        />
      )}
      {/* Combined Resources section: resources, then 24px gap, then tasks and studies */}
      {(selectedResources.length > 0 || selectedTasks.length > 0 || selectedStudies.length > 0) && (
        <PreviewSection
          title={t("board.expendedCard.previewLinkedResources")}
          sections={[
            ...(selectedResources.length > 0 ? [{ items: selectedResources, type: "resource" }] : []),
            ...(selectedTasks.length > 0 ? [{ items: selectedTasks, type: "task" }] : []),
            ...(selectedStudies.length > 0 ? [{ items: selectedStudies, type: "study" }] : []),
          ]}
          proposal={proposal}
          classId={proposal?.usedInClass?.id}
          openAssignmentModal={(item) => openLinkedItem(item, "assignment")}
          openResourceModal={(item) => openLinkedItem(item, "resource")}
          user={user}
          templateClassIds={getBoardTemplateClassIds(proposal)}
        />
      )}
      </div>
      )}
    </>
  );
}

export { ResourceEditModal };