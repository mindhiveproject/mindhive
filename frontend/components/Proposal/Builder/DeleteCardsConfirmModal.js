import { useEffect, useState } from "react";
import useTranslation from "next-translate/useTranslation";
import Trans from "next-translate/Trans";

import Modal from "../../DesignSystem/Modal";
import Button from "../../DesignSystem/Button";

function Owned({ children }) {
  return <span style={{ textDecoration: "underline" }}>{children}</span>;
}

const ownedComponents = [<Owned key="owned" />];
const ownedComponentsPair = [
  <Owned key="owned-0" />,
  <Owned key="owned-1" />,
];

const headingStyle = {
  margin: "0 0 4px",
  font: "var(--MH-Type-Title-Small)",
  letterSpacing: 0,
  color: "var(--MH-Theme-Neutrals-Black, #171717)",
};

const bodyStyle = {
  margin: 0,
  font: "var(--MH-Type-Body-Base)",
  letterSpacing: 0,
  color: "var(--MH-Theme-Neutrals-Dark, #6a6a6a)",
};

const partStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 16,
  border: "1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6)",
  borderRadius: 8,
};

const partActionsStyle = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: 8,
};

const doneStyle = {
  ...bodyStyle,
  textAlign: "right",
  color: "var(--MH-Theme-Success-Dark, #1f6b3a)",
};

/**
 * Remove modal for the board's select mode. Regular cards/sections and
 * milestones are separate parts the teacher handles independently; the modal
 * closes itself (onFinished) once every part present is done, and can be
 * closed halfway (onClose), keeping what was already done.
 *
 * milestones: [{ cardId, name, milestone, inSelectedSection }], captured by
 * Inner when the modal opens. onDeleteItems() and
 * onResolveMilestones(deleteMilestones) resolve to true on success.
 */
export default function DeleteCardsConfirmModal({
  open,
  onClose,
  onFinished,
  sectionCount = 0,
  cardCount = 0,
  milestones = [],
  onDeleteItems,
  onResolveMilestones,
  deleting = false,
}) {
  const { t } = useTranslation("builder");

  // Counts change as parts complete, so describe the selection as it was on
  // opening.
  const [snapshot, setSnapshot] = useState(null);
  const [itemsDone, setItemsDone] = useState(false);
  const [milestonesDone, setMilestonesDone] = useState(null); // "removed" | "deleted"
  useEffect(() => {
    if (!open) return;
    setSnapshot({ sectionCount, cardCount });
    setItemsDone(false);
    setMilestonesDone(null);
    // Only on opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const view = snapshot ?? { sectionCount, cardCount };
  const hasItems = view.sectionCount + view.cardCount > 0;
  const hasMilestones = milestones.length > 0;
  const hasCustomMilestones = milestones.some(
    (item) => item.milestone?.scope === "template"
  );
  const hasDefaultMilestones = milestones.some(
    (item) => item.milestone?.scope !== "template"
  );
  const milestonesInSections = milestones.some((item) => item.inSelectedSection);

  useEffect(() => {
    if (!open || (!itemsDone && !milestonesDone)) return;
    if ((!hasItems || itemsDone) && (!hasMilestones || milestonesDone)) {
      onFinished?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsDone, milestonesDone]);

  const handleDeleteItems = async () => {
    if (await onDeleteItems?.()) setItemsDone(true);
  };

  const handleMilestones = async (deleteMilestones) => {
    if (await onResolveMilestones?.(deleteMilestones)) {
      setMilestonesDone(deleteMilestones ? "deleted" : "removed");
    }
  };

  const renderItemsBody = () => {
    const { sectionCount: sections, cardCount: cards } = view;
    if (sections > 0 && cards > 0) {
      return (
        <Trans
          i18nKey="builder:inner.deleteItemsConfirmMixedBody"
          values={{ sectionCount: sections, cardCount: cards }}
          components={ownedComponentsPair}
        />
      );
    }
    if (sections > 0) {
      return (
        <Trans
          i18nKey="builder:inner.deleteItemsConfirmSectionsBody"
          values={{ sectionCount: sections }}
          components={ownedComponents}
        />
      );
    }
    return (
      <Trans
        i18nKey="builder:inner.deleteItemsConfirmBody"
        values={{ count: cards }}
        components={ownedComponents}
      />
    );
  };

  const anyDone = itemsDone || !!milestonesDone;

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth={560}
      title={t("inner.deleteItemsConfirmTitle", {}, { default: "Remove items" })}
      actions={
        <Button
          variant="subtle"
          type="button"
          onClick={onClose}
          disabled={deleting}
        >
          {anyDone
            ? t("inner.close", {}, { default: "Close" })
            : t("inner.cancel", {}, { default: "Cancel" })}
        </Button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {hasItems ? (
          <section style={partStyle}>
            <div>
              <p style={headingStyle}>
                {t(
                  "inner.removeItemsCardsHeading",
                  {},
                  { default: "Cards and sections" }
                )}
              </p>
              <p style={bodyStyle}>{renderItemsBody()}</p>
              {view.cardCount > 0 && view.sectionCount === 0 ? (
                <p style={{ ...bodyStyle, marginTop: 8 }}>
                  <Trans
                    i18nKey="builder:inner.deleteItemsConfirmCardsOnlyNote"
                    components={ownedComponents}
                  />
                </p>
              ) : null}
              {milestonesInSections ? (
                <p style={{ ...bodyStyle, marginTop: 8 }}>
                  {t(
                    "inner.removeItemsMilestonesInSectionsNote",
                    {},
                    {
                      default:
                        "Milestone cards inside these sections go with them, and cards are unlinked from those milestones. You can still delete the milestones below.",
                    }
                  )}
                </p>
              ) : null}
            </div>
            {itemsDone ? (
              <p style={doneStyle}>
                {t("inner.removeItemsDeleted", {}, { default: "✓ Deleted" })}
              </p>
            ) : (
              <div style={partActionsStyle}>
                <Button
                  variant="filled"
                  tone="warning"
                  type="button"
                  onClick={handleDeleteItems}
                  disabled={deleting}
                >
                  {t("inner.removeItemsDelete", {}, { default: "Delete" })}
                </Button>
              </div>
            )}
          </section>
        ) : null}

        {hasMilestones ? (
          <section style={partStyle}>
            <div>
              <p style={headingStyle}>
                {t("inner.removeItemsMilestonesHeading", {}, { default: "Milestones" })}
              </p>
              <ul style={{ ...bodyStyle, margin: "0 0 8px", paddingLeft: 20 }}>
                {milestones.map((item) => (
                  <li key={item.cardId}>{item.name}</li>
                ))}
              </ul>
              <p style={bodyStyle}>
                <strong>
                  {t(
                    "inner.removeMilestonesFromBoard",
                    {},
                    { default: "Remove from board" }
                  )}
                </strong>
                {": "}
                {t(
                  "inner.removeMilestonesFromBoardBody",
                  {},
                  {
                    default:
                      "the milestone cards leave the board and every card is unlinked from these milestones. The milestones are kept, and you can put them back from \"Link a milestone to cards\" → \"Add to board\".",
                  }
                )}
              </p>
              <p style={{ ...bodyStyle, marginTop: 8 }}>
                <strong>
                  {t("inner.deleteMilestones", {}, { default: "Delete milestones" })}
                </strong>
                {": "}
                {t(
                  "inner.deleteMilestonesBody",
                  {},
                  {
                    default:
                      "the same, and the milestones are deleted too.",
                  }
                )}
                {hasCustomMilestones ? (
                  <>
                    {" "}
                    {/* Form-unavailability copy: forms are not deleted today.
                        When teachers can reassociate forms to milestones,
                        update this and inner.deleteMilestonesCustomNote. */}
                    <Trans
                      i18nKey="builder:inner.deleteMilestonesCustomNote"
                      components={ownedComponentsPair}
                    />
                  </>
                ) : null}
                {hasDefaultMilestones ? (
                  <>
                    {" "}
                    {t(
                      "inner.deleteMilestonesDefaultNote",
                      {},
                      {
                        default:
                          "MindHive default milestones are shared with other boards, so they can't be deleted and stay available to add back.",
                      }
                    )}
                  </>
                ) : null}
              </p>
            </div>
            {milestonesDone ? (
              <p style={doneStyle}>
                {milestonesDone === "deleted"
                  ? t("inner.removeItemsDeleted", {}, { default: "✓ Deleted" })
                  : t(
                      "inner.removeItemsRemovedFromBoard",
                      {},
                      { default: "✓ Removed from the board" }
                    )}
              </p>
            ) : (
              <div style={partActionsStyle}>
                <Button
                  variant="outline"
                  tone="warning"
                  type="button"
                  onClick={() => handleMilestones(true)}
                  disabled={deleting}
                >
                  {t("inner.deleteMilestones", {}, { default: "Delete milestones" })}
                </Button>
                <Button
                  variant="filled"
                  type="button"
                  onClick={() => handleMilestones(false)}
                  disabled={deleting}
                >
                  {t(
                    "inner.removeMilestonesFromBoard",
                    {},
                    { default: "Remove from board" }
                  )}
                </Button>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </Modal>
  );
}
