import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Button, Modal } from "semantic-ui-react";
import TipTapEditor from "../../../TipTap/Main";
import Chip from "../../../DesignSystem/Chip";
import { GET_RESOURCE } from "../../../Queries/Resource";
import {
  CREATE_RESOURCE,
  UPDATE_RESOURCE,
  mergeResourceSettings,
} from "../../../Mutations/Resource";
import { TYPO } from "./utils";

export default function ResourceEditModal({
  open,
  t,
  onClose,
  resourceId,
  sourceType,
  templateId,
  existingCustomResourceId,
  user,
  proposal,
  onSaved,
}) {
  const getDefaultFormState = () => ({
    title: "",
    description: "",
    content: "",
    settings: mergeResourceSettings(null),
    isPublic: false,
  });

  const [choice, setChoice] = useState(null);
  const [activeResourceId, setActiveResourceId] = useState(null);
  const [formState, setFormState] = useState(getDefaultFormState);
  const [hasChanges, setHasChanges] = useState(false);
  const [mutationError, setMutationError] = useState(null);

  const isPublicTemplate = sourceType === "public";
  const effectiveTemplateId = templateId || resourceId || null;
  const needsChoice =
    isPublicTemplate && existingCustomResourceId && choice === null;
  const isCreatingCopy =
    isPublicTemplate && choice !== "existing" && !needsChoice;

  useEffect(() => {
    if (open) {
      if (isPublicTemplate) {
        if (existingCustomResourceId) {
          setChoice(null);
          setActiveResourceId(effectiveTemplateId);
        } else {
          setChoice("new");
          setActiveResourceId(effectiveTemplateId);
        }
      } else {
        setChoice("existing");
        setActiveResourceId(resourceId || null);
      }
      setFormState(getDefaultFormState());
      setHasChanges(false);
      setMutationError(null);
    } else {
      setChoice(null);
      setActiveResourceId(null);
      setFormState(getDefaultFormState());
      setHasChanges(false);
      setMutationError(null);
    }
  }, [
    open,
    resourceId,
    isPublicTemplate,
    existingCustomResourceId,
    effectiveTemplateId,
  ]);

  useEffect(() => {
    if (!open || needsChoice) {
      return;
    }

    if (isPublicTemplate) {
      const targetId =
        choice === "existing" && existingCustomResourceId
          ? existingCustomResourceId
          : effectiveTemplateId;

      if (targetId && targetId !== activeResourceId) {
        setActiveResourceId(targetId);
      }
    } else if (resourceId && resourceId !== activeResourceId) {
      setActiveResourceId(resourceId);
    }
  }, [
    choice,
    existingCustomResourceId,
    effectiveTemplateId,
    activeResourceId,
    open,
    needsChoice,
    isPublicTemplate,
    resourceId,
  ]);

  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id: activeResourceId },
    skip: !open || !activeResourceId || needsChoice,
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (!open || needsChoice) {
      return;
    }

    const resource = data?.resource;
    if (resource) {
      setFormState({
        title: resource.title || "",
        description: resource.description || "",
        content: resource.content?.main || "",
        settings: mergeResourceSettings(resource.settings),
        isPublic:
          !isCreatingCopy && resource.isPublic ? resource.isPublic : false,
      });
      setHasChanges(false);
    }
  }, [data, open, needsChoice, isCreatingCopy]);

  const [createResource, { loading: creating }] = useMutation(CREATE_RESOURCE);
  const [updateResource, { loading: updating }] = useMutation(UPDATE_RESOURCE);
  const saving = creating || updating;

  const handleFieldChange = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!onSaved || (!isCreatingCopy && !activeResourceId)) {
      return;
    }

    setMutationError(null);

    try {
      if (isCreatingCopy) {
        const input = {
          title: formState.title,
          description: formState.description,
          content: { main: formState.content },
          settings: mergeResourceSettings(formState.settings),
          isCustom: true,
          parent: { connect: { id: effectiveTemplateId } },
        };

        if (proposal?.id) {
          input.proposalBoard = { connect: { id: proposal.id } };
        }

        const response = await createResource({
          variables: {
            input,
          },
        });

        const newResourceId = response?.data?.createResource?.id;

        if (!newResourceId) {
          throw new Error(
            t(
              "boardManagement.errorCreatingResource",
              "We could not create a copy of this resource."
            )
          );
        }

        await onSaved({
          mode: "createCopy",
          resourceId: newResourceId,
          templateId: effectiveTemplateId,
        });

        alert(t("boardManagement.savedRessource", "Resource saved"));
      } else {
        await updateResource({
          variables: {
            id: activeResourceId,
            title: formState.title,
            description: formState.description,
            content: { main: formState.content },
            settings: mergeResourceSettings(formState.settings),
            isPublic: formState.isPublic,
            updatedAt: new Date().toISOString(),
          },
        });

        await onSaved({
          mode: "update",
          resourceId: activeResourceId,
          templateId: effectiveTemplateId,
        });

        alert(t("assignment.changeSuccess", "Changes saved successfully"));
      }

      setHasChanges(false);
      onClose();
    } catch (err) {
      console.error(err);
      setMutationError(err.message || "Failed to save resource.");
    }
  };

  if (!resourceId) return null;

  const userIsAdmin = user?.permissions
    ?.map((permission) => permission?.name)
    .includes("ADMIN");

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
          ...TYPO.titleS,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          {isCreatingCopy
            ? t("boardManagement.customizeRessource", "Customize Resource")
            : t("boardManagement.editResource", "Edit Resource")}
          {!isCreatingCopy && hasChanges && (
            <span style={{ ...TYPO.caption, color: "#8A2CF6" }}>
              {t("assignment.unsavedChanges", "(Unsaved changes)")}
            </span>
          )}
        </span>
        <Chip
          label={t("board.editMode", "You are in Edit Mode")}
          selected={false}
          shape="square"
        />
      </Modal.Header>
      <Modal.Content
        scrolling
        style={{ background: "#ffffff", padding: "24px" }}
      >
        {needsChoice ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <p style={{ ...TYPO.titleS, color: "#274E5B", margin: 0 }}>
              {t(
                "boardManagement.resourceChoiceExistingCopy",
                "You already personalized this resource. What would you like to do?"
              )}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <Button
                style={{
                  borderRadius: "100px",
                  background: "#336F8A",
                  ...TYPO.bodyMedium,
                  color: "white",
                  border: "1px solid #336F8A",
                }}
                onClick={() => setChoice("existing")}
              >
                {t(
                  "boardManagement.editExistingResource",
                  "Continue with my customized version"
                )}
              </Button>
              <Button
                style={{
                  borderRadius: "100px",
                  background: "white",
                  ...TYPO.bodyMedium,
                  color: "#336F8A",
                  border: "1px solid #336F8A",
                }}
                onClick={() => setChoice("new")}
              >
                {t(
                  "boardManagement.createAnotherCopy",
                  "Create an additional copy"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {mutationError && (
              <div
                style={{
                  background: "#FDECEA",
                  color: "#B42318",
                  border: "1px solid #F97066",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  ...TYPO.label,
                }}
              >
                {mutationError}
              </div>
            )}
            {error && (
              <div
                style={{
                  background: "#FDECEA",
                  color: "#B42318",
                  border: "1px solid #F97066",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  ...TYPO.label,
                }}
              >
                {t(
                  "boardManagement.errorLoadingResource",
                  "We could not load this resource."
                )}
              </div>
            )}
            {isCreatingCopy && (
              <div
                style={{
                  background: "#EEF6FB",
                  color: "#1D4E89",
                  border: "1px solid #B3D4F5",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  ...TYPO.label,
                }}
              >
                {t(
                  "boardManagement.resourceCopyInfo",
                  "Saving will create a personal copy linked to your project."
                )}
              </div>
            )}
            {loading ? (
              <p>{t("common.loading", "Loading...")}</p>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <label
                    htmlFor="resource-title"
                    style={{ ...TYPO.body, color: "#274E5B" }}
                  >
                    {t("boardManagement.titleText", "Title")}
                  </label>
                  <TipTapEditor
                    content={formState.title}
                    onUpdate={(newContent) => handleFieldChange("title", newContent)}
                    toolbarVisible={false}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <label
                    htmlFor="resource-description"
                    style={{ ...TYPO.body, color: "#274E5B" }}
                  >
                    {t("boardManagement.description", "Description")}
                  </label>
                  <textarea
                    id="resource-description"
                    rows={4}
                    value={formState.description || ""}
                    onChange={(e) =>
                      handleFieldChange("description", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid #d0d5dd",
                      ...TYPO.body,
                      minHeight: "120px",
                    }}
                  />
                </div>

                {userIsAdmin && !isCreatingCopy && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <Button
                      type="button"
                      onClick={() =>
                        handleFieldChange("isPublic", !formState.isPublic)
                      }
                      style={{
                        borderRadius: "100px",
                        background: formState.isPublic ? "#336F8A" : "white",
                        ...TYPO.label,
                        color: formState.isPublic ? "white" : "#336F8A",
                        border: "1px solid #336F8A",
                      }}
                    >
                      {formState.isPublic
                        ? t("boardManagement.makePrivate", "Make Private")
                        : t("boardManagement.makePublic", "Make Public")}
                    </Button>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <p
                    style={{
                      margin: 0,
                      ...TYPO.body,
                      color: "#274E5B",
                    }}
                  >
                    {t(
                      "boardManagement.resourceContent",
                      "Resource content"
                    )}
                  </p>
                  <TipTapEditor
                    content={formState.content}
                    placeholder={t(
                      "boardManagement.resourceContentPlaceholder",
                      "Add or update resource content..."
                    )}
                    onUpdate={(newContent) =>
                      handleFieldChange("content", newContent)
                    }
                  />
                </div>
              </>
            )}
          </div>
        )}
      </Modal.Content>
      <Modal.Actions
        style={{ background: "#f9fafb", borderTop: "1px solid #e0e0e0" }}
      >
        {!needsChoice && (
          <Button
            loading={saving}
            disabled={
              saving || (!isCreatingCopy && !hasChanges) || loading || !!error
            }
            style={{
              borderRadius: "100px",
              background: "#7D70AD",
              ...TYPO.bodyMedium,
              color: "white",
              border: "1px solid #7D70AD",
              marginRight: "10px",
            }}
            onClick={handleSave}
          >
            {isCreatingCopy
              ? t("boardManagement.saveOwnRessource", "Save my copy")
              : t("assignment.save", "Save Changes")}
          </Button>
        )}

        <Button
          onClick={onClose}
          style={{
            borderRadius: "100px",
            background: "#336F8A",
            ...TYPO.bodyMedium,
            color: "white",
            border: "1px solid #336F8A",
          }}
        >
          {t("board.expendedCard.close", "Close")}
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
