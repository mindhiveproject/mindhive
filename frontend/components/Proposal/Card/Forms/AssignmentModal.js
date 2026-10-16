import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import ReactHtmlParser from "react-html-parser";
import TipTapEditor from "../../../TipTap/Main";
import { ReadOnlyTipTap } from "../../../TipTap/ReadOnlyTipTap";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import MessageCard from "../../../DesignSystem/MessageCard";
import Modal from "../../../DesignSystem/Modal";
import { GET_AN_ASSIGNMENT } from "../../../Queries/Assignment";
import { CREATE_ASSIGNMENT, EDIT_ASSIGNMENT } from "../../../Mutations/Assignment";
import { getLinkedItemActions } from "../../../../lib/linkedItemActions";
import { stripHtml, TYPO } from "./utils";

const SECTION_LABEL_STYLE = { ...TYPO.sectionLabel, margin: "24px 0 8px" };

const READ_ONLY_STYLE = {
  padding: "16px",
  border: "1px solid #D3E0E3",
  borderRadius: "12px",
};

const ACTIONS_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  width: "100%",
};

const EMPTY_FORM = { title: "", content: "", placeholder: "" };

/**
 * The one assignment modal for the Linked Items flow.
 *
 * - "view": read-only. Offers Edit (owner) or Copy & link (someone else's).
 * - "edit": owner edits title / instructions / placeholder and can publish
 *   the assignment to students.
 * - "copy": prefilled editable copy; saving creates the teacher's own
 *   assignment in the board's classes and hands it to `onCopied` to link.
 *
 * "edit" and "copy" always offer a Preview toggle that shows the current
 * (possibly unsaved) content read-only, and a way back to editing.
 *
 * Built on the DesignSystem Modal so it stacks above the Linked Items picker.
 */
export default function AssignmentModal({
  open,
  mode: initialMode = "view",
  assignmentId,
  user,
  classIds = [],
  t,
  onClose,
  onCopied,
  onAssignmentPublicChange,
}) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(EMPTY_FORM);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [notice, setNotice] = useState(null);

  const { data, loading, error } = useQuery(GET_AN_ASSIGNMENT, {
    variables: { id: assignmentId },
    fetchPolicy: "network-only",
    skip: !open || !assignmentId,
  });
  const assignment = data?.assignments?.[0];
  const actions = getLinkedItemActions(assignment, "assignment", user);

  // Each opening starts from the caller's mode and the saved content.
  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setPreviewing(false);
    setNotice(null);
  }, [open, initialMode, assignmentId]);

  useEffect(() => {
    if (!assignment) return;
    setForm({
      title: assignment.title || "",
      content: assignment.content || "",
      placeholder: assignment.placeholder || "",
    });
    setHasChanges(false);
  }, [assignment, mode]);

  const refetchAssignment = [
    { query: GET_AN_ASSIGNMENT, variables: { id: assignmentId } },
  ];
  const [editAssignment, { loading: saving }] = useMutation(EDIT_ASSIGNMENT, {
    refetchQueries: refetchAssignment,
  });
  const [createAssignment, { loading: copying }] = useMutation(CREATE_ASSIGNMENT);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const runSafely = async (fn) => {
    setNotice(null);
    try {
      await fn();
    } catch (err) {
      setNotice({ variant: "warning", message: err.message });
    }
  };

  const handleSave = () =>
    runSafely(async () => {
      await editAssignment({ variables: { id: assignmentId, input: form } });
      setHasChanges(false);
      setNotice({
        variant: "success",
        message: t("assignment.saveSuccess", "Assignment saved successfully!"),
      });
    });

  const handleTogglePublic = () => {
    const nextPublic = !assignment?.public;
    const confirmKey = nextPublic ? "assignment.submitConfirm" : "assignment.revokeConfirm";
    if (!window.confirm(t(confirmKey))) return;
    runSafely(async () => {
      await editAssignment({
        variables: { id: assignmentId, input: { public: nextPublic } },
      });
      onAssignmentPublicChange?.(assignmentId, nextPublic);
    });
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/dashboard/assignments/${assignment?.code}`;
    await navigator.clipboard?.writeText(link);
    setNotice({ variant: "success", message: t("assignment.linkCopied") });
  };

  const handleCreateCopy = () =>
    runSafely(async () => {
      const response = await createAssignment({
        variables: {
          input: {
            ...form,
            public: false,
            templateSource: { connect: { id: assignmentId } },
            // TODO(class-networks): let the teacher pick a network class here.
            ...(classIds.length > 0
              ? { classes: { connect: classIds.map((id) => ({ id })) } }
              : {}),
          },
        },
      });
      const newId = response?.data?.createAssignment?.id;
      if (!newId) throw new Error(t("assignment.copyFailed", "The copy could not be created."));
      await onCopied?.({ id: newId, originalId: assignmentId });
      onClose();
    });

  const titleText = {
    view: t("board.expendedCard.viewingAssignment", "Viewing Assignment:"),
    edit: t("board.expendedCard.editAssignment", "Edit assignment"),
    copy: t("assignment.makeYourCopy", "Make changes and save this assignment as your own"),
  }[mode];

  const changeMode = (nextMode) => {
    setPreviewing(false);
    setMode(nextMode);
  };

  // Reads from the form so a preview from edit/copy shows unsaved changes.
  const renderReadOnly = () => (
    <>
      <h3 style={{ ...TYPO.titleS, margin: 0 }}>{stripHtml(form.title) || "Untitled"}</h3>
      <p style={SECTION_LABEL_STYLE}>{t("assignment.instructions", "Student Instructions")}</p>
      <div style={READ_ONLY_STYLE}>
        <ReadOnlyTipTap>
          <div className="ProseMirror">{ReactHtmlParser(form.content || "")}</div>
        </ReadOnlyTipTap>
      </div>
      {stripHtml(form.placeholder) && (
        <>
          <p style={SECTION_LABEL_STYLE}>
            {t("assignment.placeholderDescription", "Placeholder presented to students")}
          </p>
          <div style={READ_ONLY_STYLE}>
            <ReadOnlyTipTap>
              <div className="ProseMirror">{ReactHtmlParser(form.placeholder)}</div>
            </ReadOnlyTipTap>
          </div>
        </>
      )}
    </>
  );

  // Editors remount per mode so they pick up the reset form content.
  const renderForm = () => (
    <div key={mode}>
      <p style={{ ...SECTION_LABEL_STYLE, marginTop: 0 }}>{t("board.expendedCard.title", "Title")}</p>
      <TipTapEditor
        content={form.title}
        placeholder={t("assignment.titlePlaceholder", "Enter assignment title...")}
        onUpdate={(value) => setField("title", value)}
        toolbarVisible={false}
      />
      <p style={SECTION_LABEL_STYLE}>{t("assignment.instructions", "Student Instructions")}</p>
      <TipTapEditor
        content={form.content}
        placeholder={t("assignment.instructionsPlaceholder", "Enter assignment instructions...")}
        onUpdate={(value) => setField("content", value)}
      />
      <p style={SECTION_LABEL_STYLE}>
        {t("assignment.placeholderInstructions", "Placeholder for your students:")}
      </p>
      <TipTapEditor
        content={form.placeholder}
        placeholder={t("assignment.placeholderPlaceholder", "Enter placeholder...")}
        onUpdate={(value) => setField("placeholder", value)}
      />
    </div>
  );

  const closeLabel = t("board.expendedCard.close", "Close");
  const previewToggle = (
    <Button variant="outline" onClick={() => setPreviewing((prev) => !prev)}>
      {previewing
        ? t("board.expendedCard.backToEditing", "Back to editing")
        : t("board.expendedCard.preview", "Preview")}
    </Button>
  );
  const renderActions = () => {
    if (mode === "copy") {
      return (
        <>
          <Button variant="text" onClick={onClose}>{closeLabel}</Button>
          {previewToggle}
          <Button variant="filled" onClick={handleCreateCopy} disabled={copying}>
            {t("board.expendedCard.saveCopyAndLink", "Save copy & link")}
          </Button>
        </>
      );
    }
    if (mode === "edit") {
      return (
        <>
          {assignment?.public && (
            <Button variant="text" onClick={handleCopyLink}>{t("assignment.copyLink")}</Button>
          )}
          <Button variant="outline" onClick={handleTogglePublic} disabled={saving}>
            {assignment?.public ? t("assignment.unpublish") : t("assignment.publishToStudents")}
          </Button>
          <Button variant="text" onClick={onClose}>{closeLabel}</Button>
          {previewToggle}
          <Button variant="filled" onClick={handleSave} disabled={!hasChanges || saving}>
            {t("assignment.save", "Save Changes")}
          </Button>
        </>
      );
    }
    return (
      <>
        <Button variant="text" onClick={onClose}>{closeLabel}</Button>
        {actions.edit && (
          <Button variant="outline" onClick={() => changeMode("edit")}>
            {t("boardManagement.edit", "Edit")}
          </Button>
        )}
        {actions.copy && (
          <Button variant="filled" onClick={() => changeMode("copy")}>
            {t("board.expendedCard.copyAndLink", "Copy & link")}
          </Button>
        )}
      </>
    );
  };

  let body;
  if (loading || !assignment) {
    body = <p style={TYPO.body}>{error ? error.message : t("common.loading", "Loading...")}</p>;
  } else {
    body = mode === "view" || previewing ? renderReadOnly() : renderForm();
  }

  return (
    <Modal
      open={open && Boolean(assignmentId)}
      onClose={onClose}
      size="large"
      maxWidth={900}
      height="85vh"
      title={
        <span style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={TYPO.titleS}>{titleText}</span>
          {mode !== "view" && hasChanges && (
            <Chip variant="static" tone="warning" label={t("assignment.unsavedChanges", "(Unsaved changes)")} />
          )}
        </span>
      }
      actions={<div style={ACTIONS_STYLE}>{renderActions()}</div>}
    >
      {notice && (
        <div style={{ marginBottom: "16px" }}>
          <MessageCard
            variant={notice.variant}
            message={notice.message}
            onClose={() => setNotice(null)}
            closeAriaLabel={closeLabel}
          />
        </div>
      )}
      {mode === "edit" && assignment && !assignment.classes?.length && (
        <div style={{ marginBottom: "16px" }}>
          <MessageCard
            variant="warning"
            message={t(
              "assignment.classWarning",
              "This assignment is not connected to a class, you can do that by associating this project board to a class."
            )}
          />
        </div>
      )}
      {body}
    </Modal>
  );
}
