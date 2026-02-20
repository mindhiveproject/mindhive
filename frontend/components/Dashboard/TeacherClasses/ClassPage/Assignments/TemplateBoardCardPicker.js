import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import { GET_TEMPLATE_BOARD_SECTIONS_CARDS } from "../../../../Queries/Proposal";

/**
 * Reusable template board card picker. Renders sections and cards for a given template board.
 * No mutations—controlled selectedCardId + onSelectCard only.
 * Used by ConnectAssignmentToCardModal and BulkActionsModal.
 */
export default function TemplateBoardCardPicker({
  templateBoardId,
  selectedCardId,
  onSelectCard,
  disabled = false,
  showDescription = false,
}) {
  const { t } = useTranslation("classes");

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {showDescription && (
        <p style={{ marginBottom: 0 }}>
          {t(
            "assignment.connectModal.description",
            "Select a card on the class template board. The assignment will be linked to this card and to the same card on all student boards."
          )}
        </p>
      )}
      {sectionsSorted.map((section) => {
        const cards = [...(section.cards || [])].sort(
          (a, b) => (a?.position ?? 0) - (b?.position ?? 0)
        );
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
              {section.title ||
                t("assignment.connectModal.untitledSection", "Untitled section")}
            </div>
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
                      t("assignment.connectModal.untitledCard", "Untitled card")}
                  </li>
                );
              })}
            </ul>
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
