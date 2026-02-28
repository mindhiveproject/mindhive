import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import { GET_TEMPLATE_BOARD_SECTIONS_CARDS } from "../../../../Queries/Proposal";
import Chip from "../../../../DesignSystem/Chip";

const EXCLUDED_CARD_TYPES = new Set([
  "ACTION_SUBMIT",
  "ACTION_PEER_FEEDBACK",
  "ACTION_COLLECTING_DATA",
  "ACTION_PROJECT_REPORT",
]);

/**
 * Reusable template board card picker. Renders sections and cards for a given template board.
 * Single-select: selectedCardId + onSelectCard (assignments).
 * Multi-select: selectedCardIds + onToggleCard (resources); cards rendered as Chips.
 * Used by ConnectAssignmentToCardModal, BulkActionsModal, ConnectResourceToCardModal.
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

  if (!templateBoardId) {
    return (
      <p>
        {t("assignment.connectModal.noTemplate", "No template board for this class.")}
      </p>
    );
  }

  if (loading) {
    return (
      <p>
        {t("assignment.connectModal.loading", "Loading...")}
      </p>
    );
  }

  if (error) {
    return (
      <p>
        {t("assignment.connectModal.error", "Error loading board")}: {error.message}
      </p>
    );
  }

  const descriptionText =
    description != null
      ? description
      : t(
          "assignment.connectModal.description",
          "Select a card on the class template board. The assignment will be linked to this card and to the same card on all student boards."
        );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {showDescription && <p style={{ marginBottom: 0 }}>{descriptionText}</p>}
      {sectionsSorted.map((section) => {
        const cards = [...(section.cards || [])]
          .filter((card) => !EXCLUDED_CARD_TYPES.has(card?.type))
          .sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0));
        const sectionTitle =
          section.title ||
          t("assignment.connectModal.untitledSection", "Untitled section");
        return (
          <div key={section.id}>
            <div
              style={{
                fontWeight: 600,
                marginBottom: "8px",
                fontFamily: "Lato",
                fontSize: "16px",
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
                  const isSelected = selectedCardIds.includes(card.id);
                  return (
                    <Chip
                      key={card.id}
                      label={
                        card.title ||
                        t("assignment.connectModal.untitledCard", "Untitled card")
                      }
                      selected={false}
                      disabled={disabled}
                      onClick={() => onToggleCard(card.id)}
                      onClose={isSelected ? () => onToggleCard(card.id) : undefined}
                      shape="square"
                    />
                  );
                })}
              </div>
            ) : (
              <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
                {cards.map((card) => {
                  const isSelected = selectedCardId === card.id;
                  return (
                    <li
                      key={card.id}
                      style={{
                        marginBottom: "4px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: isSelected ? "#E3F2FD" : "transparent",
                        border: isSelected
                          ? "1px solid #336F8A"
                          : "1px solid #e0e0e0",
                        cursor: disabled ? "default" : "pointer",
                        fontFamily: "Lato",
                        fontSize: "14px",
                        opacity: disabled ? 0.7 : 1,
                      }}
                      onClick={() => !disabled && onSelectCard?.(card.id)}
                    >
                      {card.title ||
                        t(
                          "assignment.connectModal.untitledCard",
                          "Untitled card"
                        )}
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
          {t(
            "assignment.connectModal.noSections",
            "This board has no sections or cards yet."
          )}
        </p>
      )}
    </div>
  );
}
