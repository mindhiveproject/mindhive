import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import DropdownSelect from "../../DesignSystem/DropdownSelect";
import CardRenderer from "../../Forms/DefinitionForm/CardRenderer";
import { RESOLVE_FORM_DEFINITION } from "../../Queries/FormDefinition";
import { useBoardMilestones } from "../../../lib/useBoardMilestones";
import {
  getMilestoneByKey,
  resolveReviewFormKey,
} from "../../../lib/milestones";
import { getCurriculumType } from "../../../lib/curriculumTypes";
import {
  CUSTOM_CARD_TYPE,
  getCreateCardTypeOptions,
  getMilestoneForCardType,
  isDefaultActionCardType,
  PROPOSAL_CARD_TYPE,
} from "./cardTypeOptions";

const PERMISSION_OPTIONS = ["MENTOR", "TEACHER", "SCIENTIST", "STUDENT"];

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 20040,
  background: "rgba(23, 23, 23, 0.35)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modalStyle = {
  width: "min(760px, 100%)",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#fff",
  border: "1px solid #A1A1A1",
  borderRadius: 16,
  boxShadow: "0 16px 48px rgba(0, 0, 0, 0.18)",
  padding: 32,
  fontFamily: "Inter, sans-serif",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #A1A1A1",
  borderRadius: 8,
  padding: "12px 16px",
  fontFamily: "Inter, sans-serif",
  fontSize: 16,
  lineHeight: "24px",
  color: "#171717",
};

const labelStyle = {
  display: "grid",
  gap: 8,
  color: "#5D5763",
  fontSize: 14,
  lineHeight: "20px",
  fontWeight: 600,
};

function getMilestoneForPreview({
  selectedType,
  selectedSourceMilestoneId,
  customMode,
  milestones,
}) {
  if (isDefaultActionCardType(selectedType)) {
    return getMilestoneForCardType(selectedType, milestones);
  }
  if (selectedType === CUSTOM_CARD_TYPE && customMode === "clone") {
    return getMilestoneByKey(selectedSourceMilestoneId, milestones);
  }
  return null;
}

function FormDefinitionPreview({
  board,
  customMode,
  milestones,
  selectedSourceMilestoneId,
  selectedType,
}) {
  const { t } = useTranslation("builder");
  const router = useRouter();
  const curriculumType = getCurriculumType(board);
  const milestone = getMilestoneForPreview({
    selectedType,
    selectedSourceMilestoneId,
    customMode,
    milestones,
  });

  const formKey = useMemo(() => {
    if (!milestone) return null;
    if (milestone.formDefinition?.key) return milestone.formDefinition.key;
    return resolveReviewFormKey(milestone, curriculumType);
  }, [curriculumType, milestone]);

  const { data, loading } = useQuery(RESOLVE_FORM_DEFINITION, {
    variables: {
      key: formKey || "",
      organizationId: null,
      classNetworkId: null,
    },
    skip: !formKey,
  });

  if (!selectedType) return null;

  if (selectedType === PROPOSAL_CARD_TYPE) {
    return (
      <div style={previewShellStyle}>
        {t(
          "section.createCardModal.proposalPreview",
          {},
          {
            default:
              "Adds a regular proposal card with content fields for students.",
          }
        )}
      </div>
    );
  }

  if (selectedType === CUSTOM_CARD_TYPE && customMode !== "clone") {
    return (
      <div style={previewShellStyle}>
        {t(
          "section.createCardModal.customPreview",
          {},
          {
            default:
              "Creates a custom review step with its own milestone label.",
          }
        )}
      </div>
    );
  }

  if (!formKey) {
    return (
      <div style={previewShellStyle}>
        {t(
          "section.createCardModal.noPreview",
          {},
          { default: "No review form is linked to this card type." }
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={previewShellStyle}>
        {t("section.createCardModal.previewLoading", {}, { default: "Loading preview..." })}
      </div>
    );
  }

  const definition = data?.resolveFormDefinition;
  if (!definition?.cards?.length) {
    return (
      <div style={previewShellStyle}>
        {t(
          "section.createCardModal.noPreview",
          {},
          { default: "No review form is linked to this card type." }
        )}
      </div>
    );
  }

  return (
    <div style={previewShellStyle}>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>
        {t(
          "section.createCardModal.previewLabel",
          {},
          { default: "Review form preview" }
        )}
      </div>
      <div style={{ display: "grid", gap: 12, pointerEvents: "none" }}>
        {definition.cards.map((card) => (
          <CardRenderer
            key={card.id}
            card={card}
            locale={router.locale || "en-us"}
            viewerRoles={["admin"]}
            entityStatus={null}
            values={{}}
            errors={{}}
            onFieldChange={() => {}}
            disabled
            specialCardComponents={{}}
          />
        ))}
      </div>
    </div>
  );
}

const previewShellStyle = {
  border: "1px solid #E6E6E6",
  borderRadius: 12,
  background: "#F7F9F8",
  color: "#5D5763",
  fontSize: 14,
  lineHeight: "20px",
  padding: 16,
  maxHeight: 260,
  overflowY: "auto",
};

export default function CreateCardModal({
  board,
  creating = false,
  onClose,
  onCreateCard,
  onCreateCustomMilestone,
  open,
  sectionId,
  sections = [],
}) {
  const { t } = useTranslation("builder");
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [customMode, setCustomMode] = useState("clone");
  const [description, setDescription] = useState("");
  const [selectedSourceMilestoneId, setSelectedSourceMilestoneId] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([
    "MENTOR",
    "TEACHER",
    "SCIENTIST",
  ]);

  const { milestones, loading: milestonesLoading } = useBoardMilestones(
    board?.id,
    { skip: !open || !board?.id }
  );

  useEffect(() => {
    if (open) return;
    setTitle("");
    setSelectedType("");
    setCustomMode("clone");
    setDescription("");
    setSelectedSourceMilestoneId("");
    setSelectedPermissions(["MENTOR", "TEACHER", "SCIENTIST"]);
  }, [open]);

  const typeOptions = useMemo(() => {
    return getCreateCardTypeOptions({ t, board, sections }).map((option) => ({
      value: option.value,
      label: option.label,
      disabled: option.disabled,
    }));
  }, [board, sections, t]);

  const cloneSourceOptions = useMemo(() => {
    return (milestones || [])
      .filter((milestone) => milestone?.id && milestone?.isActive !== false)
      .map((milestone) => ({
        value: milestone.id,
        label:
          milestone.scope === "template"
            ? t(
                "section.createCardModal.templateSourceLabel",
                { title: milestone.title || milestone.key },
                { default: "{{title}} (custom)" }
              )
            : milestone.title || milestone.key,
      }));
  }, [milestones, t]);

  useEffect(() => {
    if (
      selectedType === CUSTOM_CARD_TYPE &&
      customMode === "clone" &&
      !selectedSourceMilestoneId &&
      cloneSourceOptions.length > 0
    ) {
      setSelectedSourceMilestoneId(cloneSourceOptions[0].value);
    }
  }, [cloneSourceOptions, customMode, selectedSourceMilestoneId, selectedType]);

  if (!open || typeof document === "undefined") return null;

  const curriculumType = getCurriculumType(board);
  const trimmedTitle = title.trim();
  const selectedMilestone = getMilestoneForCardType(selectedType, milestones);
  const selectedSourceMilestone =
    selectedType === CUSTOM_CARD_TYPE && customMode === "clone"
      ? getMilestoneByKey(selectedSourceMilestoneId, milestones)
      : null;
  const selectedOption = typeOptions.find(
    (option) => option.value === selectedType
  );
  const requiresTitle =
    selectedType === PROPOSAL_CARD_TYPE || selectedType === CUSTOM_CARD_TYPE;
  const createDisabled =
    creating ||
    !sectionId ||
    !selectedType ||
    selectedOption?.disabled ||
    (requiresTitle && !trimmedTitle) ||
    (selectedType === CUSTOM_CARD_TYPE &&
      customMode === "clone" &&
      !selectedSourceMilestone?.id) ||
    (isDefaultActionCardType(selectedType) && !selectedMilestone?.id);

  const togglePermission = (name) => {
    setSelectedPermissions((prev) =>
      prev.includes(name)
        ? prev.filter((permission) => permission !== name)
        : [...prev, name]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (createDisabled) return;

    if (selectedType === CUSTOM_CARD_TYPE) {
      await onCreateCustomMilestone({
        title: trimmedTitle,
        description: description.trim(),
        sectionId,
        clonedFromMilestoneId:
          customMode === "clone" ? selectedSourceMilestone?.id : null,
        sourceFormDefinitionKey:
          customMode === "clone" && selectedSourceMilestone
            ? resolveReviewFormKey(selectedSourceMilestone, curriculumType)
            : null,
        canReviewPermissionNames: selectedPermissions,
      });
      return;
    }

    await onCreateCard({
      sectionId,
      title: requiresTitle
        ? trimmedTitle
        : selectedMilestone?.title || selectedType,
      type: selectedType,
      milestoneId: selectedMilestone?.id || null,
    });
  };

  return createPortal(
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget && !creating) onClose();
      }}
    >
      <form style={modalStyle} onSubmit={handleSubmit}>
        <h2
          style={{
            margin: "0 0 24px",
            fontFamily: "Inter, sans-serif",
            fontSize: 32,
            lineHeight: "40px",
            fontWeight: 800,
            color: "#000",
          }}
        >
          {t("section.createCardModal.title", {}, { default: "Create a new card" })}
        </h2>

        <div style={{ display: "grid", gap: 16 }}>
          <label style={labelStyle}>
            {t(
              "section.createCardModal.typeLabel",
              {},
              { default: "Card type" }
            )}
            <DropdownSelect
              value={selectedType}
              onChange={setSelectedType}
              options={typeOptions}
              placeholder={t(
                "section.createCardModal.typePlaceholder",
                {},
                { default: "Select a card type" }
              )}
              ariaLabel={t(
                "section.createCardModal.typePlaceholder",
                {},
                { default: "Select a card type" }
              )}
              disabled={milestonesLoading}
            />
          </label>

          {requiresTitle ? (
            <label style={labelStyle}>
              {selectedType === CUSTOM_CARD_TYPE
                ? t(
                    "section.createCardModal.custom.label",
                    {},
                    { default: "Action label" }
                  )
                : t(
                    "section.createCardModal.titleLabel",
                    {},
                    { default: "Card title" }
                  )}
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  selectedType === CUSTOM_CARD_TYPE
                    ? t(
                        "section.createCardModal.custom.labelPlaceholder",
                        {},
                        { default: "Enter an action label" }
                      )
                    : t(
                        "section.createCardModal.titlePlaceholder",
                        {},
                        { default: "Enter a card title" }
                      )
                }
                style={inputStyle}
              />
            </label>
          ) : null}

          {selectedType === CUSTOM_CARD_TYPE ? (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button
                  type="button"
                  variant={customMode === "clone" ? "filled" : "outline"}
                  onClick={() => setCustomMode("clone")}
                >
                  {t(
                    "section.createCardModal.custom.cloneFrom",
                    {},
                    { default: "Copy an existing form" }
                  )}
                </Button>
                <Button
                  type="button"
                  variant={customMode === "scratch" ? "filled" : "outline"}
                  onClick={() => setCustomMode("scratch")}
                >
                  {t(
                    "section.createCardModal.custom.fromScratch",
                    {},
                    { default: "Start from scratch" }
                  )}
                </Button>
              </div>

              {customMode === "clone" ? (
                <label style={labelStyle}>
                  {t(
                    "section.createCardModal.custom.selectSource",
                    {},
                    { default: "Form to copy" }
                  )}
                  <DropdownSelect
                    value={selectedSourceMilestoneId}
                    onChange={setSelectedSourceMilestoneId}
                    options={cloneSourceOptions}
                    placeholder={t(
                      "section.createCardModal.custom.selectSourcePlaceholder",
                      {},
                      { default: "Select a review step" }
                    )}
                    ariaLabel={t(
                      "section.createCardModal.custom.selectSourcePlaceholder",
                      {},
                      { default: "Select a review step" }
                    )}
                    disabled={milestonesLoading || cloneSourceOptions.length === 0}
                  />
                </label>
              ) : (
                <label style={labelStyle}>
                  {t(
                    "section.createCardModal.custom.description",
                    {},
                    { default: "Description" }
                  )}
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ ...inputStyle, minHeight: 96, resize: "vertical" }}
                  />
                </label>
              )}

              <div style={labelStyle}>
                {t(
                  "section.createCardModal.custom.canReview",
                  {},
                  { default: "Who can review" }
                )}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {PERMISSION_OPTIONS.map((permission) => (
                    <label
                      key={permission}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 500,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                      />
                      {permission}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <FormDefinitionPreview
            board={board}
            customMode={customMode}
            milestones={milestones}
            selectedSourceMilestoneId={selectedSourceMilestoneId}
            selectedType={selectedType}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            marginTop: 28,
          }}
        >
          <Button
            type="button"
            variant="outline"
            disabled={creating}
            onClick={onClose}
          >
            {t("section.createCardModal.cancel", {}, { default: "Cancel" })}
          </Button>
          <Button type="submit" disabled={createDisabled}>
            {creating
              ? t(
                  "section.createCardModal.creating",
                  {},
                  { default: "Creating..." }
                )
              : t("section.createCardModal.create", {}, { default: "Create" })}
          </Button>
        </div>
      </form>
    </div>,
    document.body
  );
}
