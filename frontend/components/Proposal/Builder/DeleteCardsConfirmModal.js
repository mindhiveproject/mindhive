import useTranslation from "next-translate/useTranslation";
import Trans from "next-translate/Trans";

import Modal from "../../DesignSystem/Modal";
import Button from "../../DesignSystem/Button";
import { isActionCard } from "../../../lib/milestones";

function Owned({ children }) {
  return <span style={{ textDecoration: "underline" }}>{children}</span>;
}

const ownedComponents = [<Owned key="owned" />];
const ownedComponentsPair = [
  <Owned key="owned-0" />,
  <Owned key="owned-1" />,
];
const ownedComponentsQuad = [
  <Owned key="owned-0" />,
  <Owned key="owned-1" />,
  <Owned key="owned-2" />,
  <Owned key="owned-3" />,
];

export default function DeleteCardsConfirmModal({
  open,
  onClose,
  onConfirm,
  selectedCards = [],
  cardsOnlyForDeletion = [],
  selectedSectionIds = [],
  deleting = false,
}) {
  const { t } = useTranslation("builder");
  const sectionCount = selectedSectionIds.length;
  const cardOnlyCount = cardsOnlyForDeletion.length;
  const hasDefaultMilestoneCards = selectedCards.some(
    (card) => isActionCard(card) && card?.milestone?.scope !== "template"
  );
  const hasCustomTemplateMilestones = selectedCards.some(
    (card) => isActionCard(card) && card?.milestone?.scope === "template"
  );

  const noteHeadingStyle = {
    margin: "0 0 4px",
    font: 'var(--MH-Type-Title-Small)',
    letterSpacing: 0,
    color: "var(--MH-Theme-Neutrals-Black, #171717)",
  };

  const noteBodyStyle = {
    margin: 0,
    font: 'var(--MH-Type-Body-Base)',
    letterSpacing: 0,
    color: "var(--MH-Theme-Neutrals-Dark, #6A6A6A)",
  };

  const noteBlockStyle = { margin: "0 0 12px" };

  const renderConfirmBody = () => {
    if (sectionCount > 0 && cardOnlyCount > 0) {
      return (
        <Trans
          i18nKey="builder:inner.deleteItemsConfirmMixedBody"
          values={{ sectionCount, cardCount: cardOnlyCount }}
          components={ownedComponentsPair}
        />
      );
    }
    if (sectionCount > 0) {
      return (
        <Trans
          i18nKey="builder:inner.deleteItemsConfirmSectionsBody"
          values={{ sectionCount }}
          components={ownedComponents}
        />
      );
    }
    return (
      <Trans
        i18nKey="builder:inner.deleteItemsConfirmBody"
        values={{ count: cardOnlyCount }}
        components={ownedComponents}
      />
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth={520}
      title={t("inner.deleteItemsConfirmTitle", {}, { default: "Delete items?" })}
      actions={
        <>
          <Button
            variant="subtle"
            type="button"
            onClick={onClose}
            disabled={deleting}
          >
            {t("inner.cancel", {}, { default: "Cancel" })}
          </Button>
          <Button
            variant="filled"
            type="button"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting
              ? t("inner.deleteItemsDeleting", {}, { default: "Deleting…" })
              : t("inner.deleteItems", {}, { default: "Delete items" })}
          </Button>
        </>
      }
    >
      <p style={noteBodyStyle}>{renderConfirmBody()}</p>
      {cardOnlyCount > 0 && sectionCount === 0 ? (
        <p style={{ ...noteBodyStyle, marginTop: 12 }}>
          <Trans
            i18nKey="builder:inner.deleteItemsConfirmCardsOnlyNote"
            components={ownedComponents}
          />
        </p>
      ) : null}
      {hasDefaultMilestoneCards || hasCustomTemplateMilestones ? (
        <div style={{ marginTop: 16 }}>
          <p style={{ ...noteHeadingStyle, marginBottom: 8 }}>
            {t(
              "inner.deleteItemsConfirmReviewStepsHeading",
              {},
              { default: "Selected review step items" }
            )}
          </p>
          {hasDefaultMilestoneCards ? (
            <div style={noteBlockStyle}>
              <p style={noteHeadingStyle}>
                {t(
                  "inner.deleteItemsConfirmMilestonesDefaultHeading",
                  {},
                  { default: "MindHive default review steps" }
                )}
              </p>
              <p style={noteBodyStyle}>
                <Trans
                  i18nKey="builder:inner.deleteItemsConfirmMilestonesDefault"
                  components={ownedComponents}
                />
              </p>
            </div>
          ) : null}
          {hasCustomTemplateMilestones ? (
            <div style={hasDefaultMilestoneCards ? noteBlockStyle : undefined}>
              <p style={noteHeadingStyle}>
                {t(
                  "inner.deleteItemsConfirmMilestonesCustomHeading",
                  {},
                  { default: "Custom review steps on this board" }
                )}
              </p>
              {/* Form-unavailability copy: forms are not deleted today. When
                  teachers can reassociate forms to milestones, update this
                  block and inner.deleteItemsConfirmMilestonesCustom. */}
              <p style={noteBodyStyle}>
                <Trans
                  i18nKey="builder:inner.deleteItemsConfirmMilestonesCustom"
                  components={ownedComponentsQuad}
                />
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
