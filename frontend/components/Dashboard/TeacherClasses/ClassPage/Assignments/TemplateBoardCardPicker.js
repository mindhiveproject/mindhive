import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import { GET_TEMPLATE_BOARD_SECTIONS_CARDS } from "../../../../Queries/Proposal";
import Chip from "../../../../DesignSystem/Chip";
import { isActionCard } from "../../../../../lib/milestones";

/**
 * Reusable template board card picker. Renders sections and cards for a given template board.
 * Single-select: selectedCardId + onSelectCard (assignments).
 * Multi-select: selectedCardIds + onToggleCard (resources); cards rendered as Chips.
 * Milestone/action cards are shown disabled — only project cards can be targeted.
 * Used by ConnectAssignmentToCardModal, BulkActionsModal, ConnectResourceToCardModal,
 * and LinkResourceToProjectCardModal.
 */
export default function TemplateBoardCardPicker({
  templateBoardId,
  selectedCardId,
  onSelectCard,
  selectedCardIds,
  onToggleCard,
  disabled = false,
  showDescription = false,
  description,
}) {
  const { t } = useTranslation("classes");
  const multiSelect = Array.isArray(selectedCardIds) && typeof onToggleCard === "function";

  const { data: boardData, loading, error } = useQuery(
    GET_TEMPLATE_BOARD_SECTIONS_CARDS,
    {
      variables: { id: templateBoardId },
      skip: !templateBoardId,
      fetchPolicy: "network-only",
    }
  );

  const board = boardData?.proposalBoard;
  const sections = board?.sections || [];
  const sectionsSorted = [...sections].sort(
    (a, b) => (a?.position ?? 0) - (b?.position ?? 0)
  );

  const milestoneTooltip = t(
    "boardManagement.linkToProjectCard.milestoneDisabledTooltip",
    {},
    {
      default:
        "Milestone cards cannot be linked to resources or assignments.",
    }
  );

  if (!templateBoardId) {
    return (
      <p>
        {t("assignment.connectModal.noTemplate", {}, {
          default: "No template board for this class.",
        })}
      </p>
    );
  }

  if (loading) {
    return (
      <p>
        {t("assignment.connectModal.loading", {}, { default: "Loading..." })}
      </p>
    );
  }

  if (error) {
    return (
      <p>
        {t("assignment.connectModal.error", {}, {
          default: "Error loading board",
        })}
        : {error.message}
      </p>
    );
  }

  const descriptionText =
    description != null
      ? description
      : t("assignment.connectModal.description", {}, {
          default:
            "Select a card on the class template board. The assignment will be linked to this card and to the same card on all student boards.",
        });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {showDescription && <p style={{ marginBottom: 0 }}>{descriptionText}</p>}
      {sectionsSorted.map((section) => {
        const cards = [...(section.cards || [])].sort(
          (a, b) => (a?.position ?? 0) - (b?.position ?? 0)
        );
        const sectionTitle =
          section.title ||
          t("assignment.connectModal.untitledSection", {}, {
            default: "Untitled section",
          });
        return (
          <div key={section.id}>
            <div
              className="MH-Type-Title-Base"
              style={{
                marginBottom: "8px",
              }}
            >
              {sectionTitle}
            </div>
            {multiSelect ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {cards.map((card) => {
                  const isMilestone = isActionCard(card);
                  const isSelected = selectedCardIds.includes(card.id);
                  const cardLabel =
                    card.title ||
                    t("assignment.connectModal.untitledCard", {}, {
                      default: "Untitled card",
                    });
                  if (isMilestone) {
                    return (
                      <Chip
                        key={card.id}
                        label={cardLabel}
                        disabled
                        title={milestoneTooltip}
                        ariaLabel={`${cardLabel}. ${milestoneTooltip}`}
                      />
                    );
                  }
                  return (
                    <Chip
                      key={card.id}
                      label={cardLabel}
                      selected={isSelected}
                      disabled={disabled}
                      onClick={() => onToggleCard(card.id)}
                      onClose={
                        isSelected ? () => onToggleCard(card.id) : undefined
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                {cards.map((card) => {
                  const isMilestone = isActionCard(card);
                  const isSelected = selectedCardId === card.id;
                  const cardLabel =
                    card.title ||
                    t("assignment.connectModal.untitledCard", {}, {
                      default: "Untitled card",
                    });
                  const canSelect = !disabled && !isMilestone;
                  return (
                    <li
                      key={card.id}
                      className="MH-Type-Label-Base"
                      title={isMilestone ? milestoneTooltip : undefined}
                      aria-disabled={isMilestone || disabled}
                      style={{
                        marginBottom: "4px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: isSelected ? "#E3F2FD" : "transparent",
                        border: isSelected
                          ? "1px solid #336F8A"
                          : "1px solid #e0e0e0",
                        cursor: canSelect ? "pointer" : "default",
                        opacity: isMilestone || disabled ? 0.55 : 1,
                      }}
                      onClick={() => canSelect && onSelectCard?.(card.id)}
                    >
                      {cardLabel}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
      {sectionsSorted.length === 0 && (
        <p>
          {t("assignment.connectModal.noSections", {}, {
            default: "This board has no sections or cards yet.",
          })}
        </p>
      )}
    </div>
  );
}
