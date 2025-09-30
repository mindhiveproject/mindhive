import { useQuery } from "@apollo/client";
import ReactHtmlParser from "react-html-parser";
import { Button, Icon, Modal, Tab } from "semantic-ui-react";
import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import {
  GET_PUBLIC_RESOURCES,
  GET_MY_RESOURCES,
} from "../../../Queries/Resource";
import { PUBLIC_STUDIES } from "../../../Queries/Study";
import { ALL_PUBLIC_TASKS } from "../../../Queries/Task";
// import { GET_MY_CLASS_ASSIGNMENTS } from "../../../Queries/Assignment";
import { GET_MY_ASSIGNMENTS, GET_AN_ASSIGNMENT } from "../../../Queries/Assignment";
import { EDIT_ASSIGNMENT } from "../../../Mutations/Assignment";

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

  const {
    data: myData,
    error: myError,
    loading: myLoading,
  } = useQuery(GET_MY_RESOURCES, {
    variables: { id: user?.id },
  });

  const publicResources = publicData?.resources || [];
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
          items={publicResources}
          selected={selectedResources}
          connect={(item) => connectItem(item, "resources", selectedResources)}
          disconnect={(item) =>
            disconnectItem(item, "resources", selectedResources)
          }
          myItems={myResources}
          proposal={proposal}
          type="resource"
          isPublic={true}
          loading={publicLoading}
          openAssignmentModal={openAssignmentModalHandler}
        />
      ),
    },
    {
      menuItem: t("board.expendedCard.myResources"),
      render: () => (
        <ItemTab
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
        />
      ),
    },
    {
      menuItem: t("board.expendedCard.tasks"),
      render: () => (
        <ItemTab
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
          <Button
            onClick={() => setOpen(false)}
            style={{
              background: "#007c70",
              color: "#ffffff",
              borderRadius: "8px",
            }}
          >
            {t("board.expendedCard.done")}
          </Button>
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
}) => {
  const { t } = useTranslation("classes");

  if (loading) return <div>{t("common.loading", "Loading...")}</div>;

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
          content,
          placeholder,
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
              <div style={{ display: "flex", gap: "12px" }}>
                {!isAssignment && (
                  <>
                    <a
                      href={viewUrl}
                      target={isTaskOrStudy ? "_blank" : "_self"}
                      rel={isTaskOrStudy ? "noreferrer" : undefined}
                      style={{ color: "#007c70" }}
                    >
                      <Icon name="external alternate" />
                    </a>
                    {isResource && (
                      <a
                        href={editUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#007c70" }}
                      >
                        <Icon name="pencil alternate" />
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#666",
                lineHeight: "1.5",
                marginBottom: "16px",
              }}
            >
              {ReactHtmlParser(truncateHtml(content, 15))}
              {ReactHtmlParser(truncateHtml(placeholder, 10))}
            </div>
            <Button
              fluid
              onClick={() => (isSelected ? disconnect(item) : connect(item))}
              style={{
                background: isSelected ? "#ff4d4f" : "#52c41a",
                color: "#ffffff",
                borderRadius: "8px",
                fontWeight: 500,
              }}
            >
              {isSelected
                ? t("board.expendedCard.disconnect")
                : t("board.expendedCard.connect")}
            </Button>
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
    lineHeight: "1.5",
    color: "#274E5B",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "3rem"
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
    if (data?.assignments?.[0]) {
      const assignment = data.assignments[0];
      const newState = {
        title: assignment.title || '',
        content: assignment.content || '',
        placeholder: assignment.placeholder || ''
      };
      setEditedAssignment(newState);
      setHasChanges(false);
    }
  }, [data]);

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
  console.log(assignment)

  
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
        <p>{t("board.expendedCard.title")}</p>
        <textarea
          style={editableFieldStyle}
          value={editedAssignment.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder={t("assignment.titlePlaceholder", "Enter assignment title...")}
        />

        <p>{t("assignment.instructions")}</p>
          <div
            ref={(el) => {
              if (el && editedAssignment.content !== el.innerHTML) {
                const savedPos = saveSelection(el);
                el.innerHTML = editedAssignment.content;
                if (document.activeElement === el) {
                  setTimeout(() => restoreSelection(el, savedPos), 0);
                }
              }
            }}
            style={{
              ...editableFieldStyle,
              minHeight: "150px",
              outline: "none"
            }}
            contentEditable
            onInput={(e) => handleFieldChange('content', e.target.innerHTML)}
            suppressContentEditableWarning={true}
            data-placeholder={editedAssignment.content === '' ? t("assignment.instructionsPlaceholder", "Enter assignment instructions...") : ''}
          />

          <p>{t("assignment.placeholder")}</p>
          <div
            ref={(el) => {
              if (el && editedAssignment.placeholder !== el.innerHTML) {
                const savedPos = saveSelection(el);
                el.innerHTML = editedAssignment.placeholder;
                if (document.activeElement === el) {
                  setTimeout(() => restoreSelection(el, savedPos), 0);
                }
              }
            }}
            style={{
              ...editableFieldStyle,
              minHeight: "100px",
              outline: "none"
            }}
            contentEditable
            onInput={(e) => handleFieldChange('placeholder', e.target.innerHTML)}
            suppressContentEditableWarning={true}
            data-placeholder={editedAssignment.placeholder === '' ? t("assignment.placeholder") : ''}
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
                  {t("assignment.revoke")}
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
                {t("assignment.submitToStudents")}
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

          return (
            <div
              className="itemBlockPreview"
              key={item.id}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "12px",
                padding: "16px",
                background: "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
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
                <div style={{ display: "flex", gap: "12px" }}>
                  {isAssignment ? (
                    <div
                      style={{ cursor: "pointer", color: "#007c70" }}
                      onClick={() => openAssignmentModal?.(item)}
                      title={t("board.expendedCard.preview", "Preview")}
                    >
                      <Icon name="external alternate" />
                    </div>
                  ) : (
                    <>
                      <a
                        href={viewUrl}
                        target={isTaskOrStudy ? "_blank" : "_self"}
                        rel={isTaskOrStudy ? "noreferrer" : undefined}
                        style={{ color: "#007c70" }}
                      >
                        <Icon name="external alternate" />
                      </a>
                      {isResource && (
                        <a
                          href={editUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#007c70" }}
                        >
                          <Icon name="pencil alternate" />
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
              {!isAssignment && (
                <div
                  style={{ fontSize: "14px", color: "#666", lineHeight: "1.5" }}
                >
                  {ReactHtmlParser(truncateHtml(content, 50))}
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
