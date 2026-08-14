import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import FormDefinitionPreview from "../../Forms/DefinitionForm/FormDefinitionPreview";
import TeacherFormWizard from "../../Forms/TeacherFormWizard";
import { isClassTemplateBoard } from "../../Utils/proposalBoard";
import { useBoardMilestones } from "../../../lib/useBoardMilestones";
import { milestoneHasReviewQuestionnaire, resolveReviewFormKey } from "../../../lib/milestones";
import { getCurriculumType } from "../../../lib/curriculumTypes";
import {
  BLANK_TEMPLATE_VALUE,
  CARD_CATEGORY_ACTION,
  CARD_CATEGORY_PROPOSAL,
  getDefaultCheckpointOptions,
  getDefaultFormTemplateOptions,
  getMilestoneForCardType,
  isDefaultActionCardType,
  NEW_CHECKPOINT_VALUE,
  PROPOSAL_CARD_TYPE,
} from "./cardTypeOptions";

const DEFAULT_PERMISSIONS = ["MENTOR", "TEACHER", "SCIENTIST"];

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
  // Fluid width up to 90vw so the chip wizard rows breathe on wide
  // displays. Hard-capped at 1400px so it doesn't turn into a
  // full-screen sheet on ultra-wide monitors (chip content would
  // sprawl and become harder to scan).
  width: "min(1400px, 90vw)",
  maxHeight: "90vh",
  overflowY: "auto",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  background: "#fff",
  border: "1px solid #A1A1A1",
  borderRadius: 16,
  boxShadow: "0 16px 48px rgba(0, 0, 0, 0.18)",
  padding: 32,
  fontFamily: "Inter, sans-serif",
};

const newActionCardChipStyle = {
  border: "2px solid #A1A1A1",
  fontWeight: 700,
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

const chipRowStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

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

const helperTextStyle = {
  margin: 0,
  color: "#5D5763",
  fontSize: 14,
  lineHeight: "20px",
  fontWeight: 400,
};

function StepSection({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ ...labelStyle, marginBottom: 0 }}>{label}</div>
      {children}
    </div>
  );
}

function CardTypeStep({ cardCategory, onSelect, t }) {
  return (
    <StepSection
      label={t(
        "section.createCardModal.steps.cardType",
        {},
        { default: "Card type" }
      )}
    >
      <div style={chipRowStyle}>
        <Chip
          shape="square"
          label={t(
            "section.createCardModal.categories.proposal",
            {},
            { default: "Proposal card" }
          )}
          selected={cardCategory === CARD_CATEGORY_PROPOSAL}
          onClick={() => onSelect(CARD_CATEGORY_PROPOSAL)}
        />
        <Chip
          shape="square"
          label={t(
            "section.createCardModal.categories.action",
            {},
            { default: "Milestone" }
          )}
          selected={cardCategory === CARD_CATEGORY_ACTION}
          onClick={() => onSelect(CARD_CATEGORY_ACTION)}
        />
      </div>
    </StepSection>
  );
}

function CheckpointStep({
  checkpointChoice,
  checkpointOptions,
  canCreateNew,
  onSelect,
  t,
}) {
  return (
    <StepSection
      label={t(
        "section.createCardModal.steps.checkpoint",
        {},
        { default: "Checkpoint" }
      )}
    >
      <div style={chipRowStyle}>
        {checkpointOptions.map((option) => (
          <Chip
            key={option.value}
            shape="square"
            label={option.label}
            selected={checkpointChoice === option.value}
            disabled={option.disabled}
            title={
              option.disabled
                ? t(
                    "section.createCardModal.alreadyAddedTooltip",
                    {},
                    { default: "This checkpoint is already on the board" }
                  )
                : undefined
            }
            onClick={() => {
              if (!option.disabled) onSelect(option.value);
            }}
          />
        ))}
        {canCreateNew ? (
          <Chip
            shape="square"
            label={t(
              "section.createCardModal.newCheckpoint",
              {},
              { default: "+ New Milestone" }
            )}
            selected={checkpointChoice === NEW_CHECKPOINT_VALUE}
            onClick={() => onSelect(NEW_CHECKPOINT_VALUE)}
            style={newActionCardChipStyle}
          />
        ) : null}
      </div>
    </StepSection>
  );
}

function MilestonePreviewStep({
  board,
  checkpointChoice,
  description,
  isNewCheckpoint,
  milestone,
  onDescriptionChange,
  onTitleChange,
  title,
  t,
}) {
  if (!checkpointChoice) return null;

  if (isNewCheckpoint) {
    return (
      <StepSection
        label={t(
          "section.createCardModal.steps.milestone",
          {},
          { default: "Milestone" }
        )}
      >
        <div style={{ display: "grid", gap: 14 }}>
          <label style={labelStyle}>
            {t(
              "section.createCardModal.milestone.actionLabel",
              {},
              { default: "Milestone label" }
            )}
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={t(
                "section.createCardModal.custom.labelPlaceholder",
                {},
                { default: "Enter a milestone label" }
              )}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            {t(
              "section.createCardModal.milestone.description",
              {},
              { default: "Description" }
            )}
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              style={{ ...inputStyle, minHeight: 96, resize: "vertical" }}
            />
          </label>
          <p style={helperTextStyle}>
            {t(
              "section.createCardModal.milestone.configureFormNext",
              {},
              { default: "The review form is configured in the next step." }
            )}
          </p>
        </div>
      </StepSection>
    );
  }

  if (!milestone) return null;

  return (
    <StepSection
      label={t(
        "section.createCardModal.steps.milestone",
        {},
        { default: "Milestone" }
      )}
    >
      <div style={{ display: "grid", gap: 14 }}>
        <label style={labelStyle}>
          {t(
            "section.createCardModal.milestone.actionLabel",
            {},
            { default: "Milestone label" }
          )}
          <input
            type="text"
            value={milestone.title || ""}
            readOnly
            disabled
            style={{ ...inputStyle, background: "#F3F3F3", color: "#5D5763" }}
          />
        </label>
        {milestone.description ? (
          <label style={labelStyle}>
            {t(
              "section.createCardModal.milestone.description",
              {},
              { default: "Description" }
            )}
            <textarea
              value={milestone.description}
              readOnly
              disabled
              style={{
                ...inputStyle,
                minHeight: 96,
                resize: "vertical",
                background: "#F3F3F3",
                color: "#5D5763",
              }}
            />
          </label>
        ) : null}
        <FormDefinitionPreview board={board} milestone={milestone} />
        {milestoneHasReviewQuestionnaire(milestone) ? (
          <p style={helperTextStyle}>
            {t(
              "section.createCardModal.defaultFormReadOnly",
              {},
              {
                default:
                  "This is a MindHive default. To customize the form, add a New milestone and copy this review form as a template.",
              }
            )}
          </p>
        ) : null}
      </div>
    </StepSection>
  );
}

function PermissionsAndTemplateStep({
  board,
  checkpointChoice,
  formTemplateOptions,
  isNewCheckpoint,
  milestone,
  selectedTemplateKey,
  onTemplateSelect,
  previewMilestone,
  t,
}) {
  const resolvedTemplateLabel = (() => {
    if (!checkpointChoice) return "";
    if (isNewCheckpoint) {
      if (selectedTemplateKey === BLANK_TEMPLATE_VALUE) {
        return t(
          "section.createCardModal.formTemplate.blank",
          {},
          { default: "Blank form" }
        );
      }
      const templateOption = formTemplateOptions.find(
        (option) => option.value === selectedTemplateKey
      );
      return templateOption?.label || "";
    }
    const templateOption = formTemplateOptions.find(
      (option) => option.value === checkpointChoice
    );
    return templateOption?.label || milestone?.title || "";
  })();

  if (!checkpointChoice) return null;

  return (
    <StepSection
      label={t(
        "section.createCardModal.steps.permissions",
        {},
        { default: "Form template" }
      )}
    >
      <div style={{ display: "grid", gap: 14 }}>
        <div style={labelStyle}>
          {t(
            "section.createCardModal.formTemplate.label",
            {},
            { default: "Form template" }
          )}
          {isNewCheckpoint ? (
            <div style={chipRowStyle}>
              {formTemplateOptions.map((option) => (
                <Chip
                  key={option.value}
                  shape="square"
                  label={option.label}
                  selected={selectedTemplateKey === option.value}
                  onClick={() => onTemplateSelect(option.value)}
                />
              ))}
              <Chip
                shape="square"
                label={t(
                  "section.createCardModal.formTemplate.blank",
                  {},
                  { default: "Blank form" }
                )}
                selected={selectedTemplateKey === BLANK_TEMPLATE_VALUE}
                onClick={() => onTemplateSelect(BLANK_TEMPLATE_VALUE)}
              />
            </div>
          ) : (
            <div style={chipRowStyle}>
              <Chip
                shape="square"
                label={t(
                  "section.createCardModal.formTemplate.defaultLabel",
                  { label: resolvedTemplateLabel },
                  { default: "{{label}}" }
                )}
                disabled
              />
            </div>
          )}
        </div>

        {isNewCheckpoint &&
        selectedTemplateKey &&
        selectedTemplateKey !== BLANK_TEMPLATE_VALUE &&
        previewMilestone ? (
          <FormDefinitionPreview board={board} milestone={previewMilestone} />
        ) : null}

        {isNewCheckpoint && selectedTemplateKey === BLANK_TEMPLATE_VALUE ? (
          <div style={previewShellStyle}>
            {t(
              "section.createCardModal.scratchPreview",
              {},
              {
                default:
                  "Creates an empty draft review form linked to this step. Once you click Create you'll build the form's cards and fields right here in the modal, then Publish. Student clones inherit whatever you publish.",
              }
            )}
          </div>
        ) : null}
      </div>
    </StepSection>
  );
}

export default function CreateCardModal({
  board,
  creating = false,
  onClose,
  onCreateCard,
  onCreateCustomMilestone,
  onFinishCustomMilestoneEdit,
  open,
  sectionId,
  sections = [],
  initialCardCategory = "",
}) {
  const { t } = useTranslation("builder");
  const [cardCategory, setCardCategory] = useState("");
  const [checkpointChoice, setCheckpointChoice] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState(DEFAULT_PERMISSIONS);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("");
  const [createdMilestone, setCreatedMilestone] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardDefinitionId, setWizardDefinitionId] = useState(null);
  const [wizardSource, setWizardSource] = useState(null);

  const { milestones, loading: milestonesLoading } = useBoardMilestones(
    board?.id,
    { skip: !open || !board?.id }
  );

  const curriculumType = getCurriculumType(board);
  const canCreateNew = isClassTemplateBoard(board);
  const isNewCheckpoint = checkpointChoice === NEW_CHECKPOINT_VALUE;
  const isDefaultCheckpoint = isDefaultActionCardType(checkpointChoice);
  const selectedMilestone = isDefaultCheckpoint
    ? getMilestoneForCardType(checkpointChoice, milestones)
    : null;
  const templatePreviewMilestone =
    isNewCheckpoint &&
    selectedTemplateKey &&
    selectedTemplateKey !== BLANK_TEMPLATE_VALUE
      ? getMilestoneForCardType(selectedTemplateKey, milestones)
      : null;

  const checkpointOptions = useMemo(
    () => getDefaultCheckpointOptions({ t, sections }),
    [sections, t]
  );

  const formTemplateOptions = useMemo(
    () => getDefaultFormTemplateOptions({ t }),
    [t]
  );

  const resetDownstreamFromCategory = () => {
    setCheckpointChoice("");
    setTitle("");
    setDescription("");
    setSelectedPermissions(DEFAULT_PERMISSIONS);
    setSelectedTemplateKey("");
  };

  const resetDownstreamFromCheckpoint = () => {
    setTitle("");
    setDescription("");
    setSelectedTemplateKey("");
  };

  useEffect(() => {
    if (!open) {
      setCardCategory("");
      setCheckpointChoice("");
      setTitle("");
      setDescription("");
      setSelectedPermissions(DEFAULT_PERMISSIONS);
      setSelectedTemplateKey("");
      setCreatedMilestone(null);
      setWizardOpen(false);
      setWizardDefinitionId(null);
      setWizardSource(null);
      return;
    }
    if (initialCardCategory) {
      setCardCategory(initialCardCategory);
    }
  }, [open, initialCardCategory]);

  useEffect(() => {
    if (!isDefaultCheckpoint || !selectedMilestone) return;
    const names = (selectedMilestone.canReview || [])
      .map((p) => p?.name)
      .filter(Boolean);
    if (names.length > 0) {
      setSelectedPermissions(names);
    }
  }, [checkpointChoice, isDefaultCheckpoint, selectedMilestone]);

  useEffect(() => {
    if (!isNewCheckpoint) return;
    setSelectedPermissions(DEFAULT_PERMISSIONS);
    if (!selectedTemplateKey) {
      setSelectedTemplateKey(BLANK_TEMPLATE_VALUE);
    }
  }, [isNewCheckpoint, selectedTemplateKey]);

  if (!open || typeof document === "undefined") return null;

  const trimmedTitle = title.trim();
  const createDisabled =
    creating ||
    !sectionId ||
    milestonesLoading ||
    !cardCategory ||
    (cardCategory === CARD_CATEGORY_PROPOSAL && !trimmedTitle) ||
    (cardCategory === CARD_CATEGORY_ACTION &&
      (!checkpointChoice ||
        (isDefaultCheckpoint &&
          (!selectedMilestone?.id ||
            checkpointOptions.find((o) => o.value === checkpointChoice)
              ?.disabled)) ||
        (isNewCheckpoint &&
          (!trimmedTitle || selectedPermissions.length === 0))));

  const handleCardCategorySelect = (category) => {
    if (category === cardCategory) return;
    setCardCategory(category);
    resetDownstreamFromCategory();
  };

  const handleCheckpointSelect = (choice) => {
    if (choice === checkpointChoice) return;
    setCheckpointChoice(choice);
    resetDownstreamFromCheckpoint();
    if (choice === NEW_CHECKPOINT_VALUE) {
      setSelectedPermissions(DEFAULT_PERMISSIONS);
      setSelectedTemplateKey(BLANK_TEMPLATE_VALUE);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (createDisabled) return;

    if (cardCategory === CARD_CATEGORY_PROPOSAL) {
      await onCreateCard({
        sectionId,
        title: trimmedTitle,
        type: PROPOSAL_CARD_TYPE,
        milestoneId: null,
      });
      return;
    }

    if (isNewCheckpoint) {
      const templateMilestone =
        selectedTemplateKey && selectedTemplateKey !== BLANK_TEMPLATE_VALUE
          ? getMilestoneForCardType(selectedTemplateKey, milestones)
          : null;

      const created = await onCreateCustomMilestone({
        title: trimmedTitle,
        description: description.trim(),
        sectionId,
        clonedFromMilestoneId: null,
        sourceFormDefinitionKey: templateMilestone
          ? resolveReviewFormKey(templateMilestone, curriculumType)
          : null,
        canReviewPermissionNames: selectedPermissions,
      });
      // Pivot into the embedded form-editor step. Falls back to the
      // old behaviour (parent closes the modal after the mutation) if
      // no formDefinition came back — nothing to edit inline anyway.
      if (created?.formDefinition?.id) {
        setCreatedMilestone(created);
        setWizardDefinitionId(created.formDefinition.id);
        setWizardSource("created");
        setWizardOpen(true);
      }
      return;
    }

    await onCreateCard({
      sectionId,
      title: selectedMilestone?.title || checkpointChoice,
      type: checkpointChoice,
      milestoneId: selectedMilestone?.id || null,
    });
  };

  const closeWizard = () => {
    const source = wizardSource;
    const milestone = createdMilestone;
    setWizardOpen(false);
    setWizardDefinitionId(null);
    setWizardSource(null);
    if (source === "created") {
      setCreatedMilestone(null);
      onFinishCustomMilestoneEdit?.(milestone);
    }
  };

  return (
    <>
      {!createdMilestone
        ? createPortal(
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget && !creating && !wizardOpen) onClose();
      }}
    >
      <style>{`
        .createCardModalForm::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <form
        className="createCardModalForm"
        style={modalStyle}
        onSubmit={handleSubmit}
      >
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

        <div style={{ display: "grid", gap: 20 }}>
          {!initialCardCategory ? (
            <CardTypeStep
              cardCategory={cardCategory}
              onSelect={handleCardCategorySelect}
              t={t}
            />
          ) : null}

          {cardCategory === CARD_CATEGORY_PROPOSAL ? (
            <label style={labelStyle}>
              {t(
                "section.createCardModal.titleLabel",
                {},
                { default: "Card title" }
              )}
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t(
                  "section.createCardModal.titlePlaceholder",
                  {},
                  { default: "Enter a card title" }
                )}
                style={inputStyle}
              />
            </label>
          ) : null}

          {cardCategory === CARD_CATEGORY_ACTION ? (
            <CheckpointStep
              checkpointChoice={checkpointChoice}
              checkpointOptions={checkpointOptions}
              canCreateNew={canCreateNew}
              onSelect={handleCheckpointSelect}
              t={t}
            />
          ) : null}

          {cardCategory === CARD_CATEGORY_ACTION ? (
            <MilestonePreviewStep
              board={board}
              checkpointChoice={checkpointChoice}
              description={description}
              isNewCheckpoint={isNewCheckpoint}
              milestone={selectedMilestone}
              onDescriptionChange={setDescription}
              onTitleChange={setTitle}
              title={title}
              t={t}
            />
          ) : null}

          {cardCategory === CARD_CATEGORY_ACTION ? (
            <PermissionsAndTemplateStep
              board={board}
              checkpointChoice={checkpointChoice}
              formTemplateOptions={formTemplateOptions}
              isNewCheckpoint={isNewCheckpoint}
              milestone={selectedMilestone}
              selectedTemplateKey={selectedTemplateKey}
              onTemplateSelect={setSelectedTemplateKey}
              previewMilestone={templatePreviewMilestone}
              t={t}
            />
          ) : null}
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
          )
        : null}
      <TeacherFormWizard
        open={wizardOpen}
        onClose={closeWizard}
        mode="review"
        proposalBoardId={board?.id}
        definitionId={wizardDefinitionId}
        milestoneKey={
          wizardSource === "created"
            ? createdMilestone?.key
            : selectedMilestone?.key
        }
      />
    </>
  );
}
