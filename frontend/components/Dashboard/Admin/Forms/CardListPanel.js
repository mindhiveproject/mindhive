// Left pane: drag-and-drop sortable list of cards. Each card can be
// expanded to show its fields (also sortable). Buttons:
//   - "+ Add card" at the bottom of the list
//   - "+" per card: add a field
//   - "≡" drag handle on each card and field row
//   - click anywhere else on a row to select it
//
// Reorder is persisted by issuing parallel UPDATE_FORM_{CARD,FIELD}
// mutations with the new `order` values, then refetching the parent
// definition. Optimistic UI is deferred — the refetch is fast enough.
import { Container, Draggable } from "react-smooth-dnd";
import { useMutation } from "@apollo/client";
import styled from "styled-components";

import {
  CREATE_FORM_CARD,
  CREATE_FORM_FIELD,
  UPDATE_FORM_CARD,
  UPDATE_FORM_FIELD,
} from "../../../Mutations/FormDefinition";
import { ADMIN_FORM_DEFINITION } from "../../../Queries/FormDefinition";

const Shell = styled.aside`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);
  max-height: calc(100vh - 200px);
  gap: 12px;

  h3 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #5f6871;
    flex-shrink: 0;
  }

  .empty {
    color: #888;
    font-size: 13px;
    padding: 12px;
  }

  .smooth-dnd-container {
    min-height: 4px;
  }
`;

// The cards list scrolls; the "Add card" button stays pinned outside
// the scroll area so admins always see it even when the form has many
// cards.
const ScrollArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

const CardItem = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  border: 1px solid ${({ $selected }) => ($selected ? "#336f8a" : "transparent")};
  background: ${({ $selected }) => ($selected ? "#eef5f9" : "transparent")};

  .header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    font-weight: 600;
    color: #171717;
    font-size: 14px;
    border-radius: 8px;
    cursor: pointer;

    &:hover {
      background: ${({ $selected }) => ($selected ? "#eef5f9" : "#f7f9f8")};
    }

    .meta {
      color: #888;
      font-size: 11px;
      font-weight: 400;
      margin-left: 8px;
    }

    .title-text {
      flex: 1;
    }
  }
`;

const FieldRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px 6px 22px;
  font-size: 13px;
  cursor: pointer;
  color: ${({ $selected }) => ($selected ? "#336f8a" : "#5f6871")};
  background: ${({ $selected }) => ($selected ? "#eef5f9" : "transparent")};
  border-left: 2px solid
    ${({ $selected }) => ($selected ? "#336f8a" : "transparent")};

  &:hover {
    background: #f7f9f8;
  }

  .type {
    margin-left: auto;
    color: #888;
    font-size: 11px;
    font-family: "Nunito", monospace;
  }

  .name-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const DragHandle = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  color: #888;
  cursor: grab;
  font-size: 12px;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
`;

const AddCardButton = styled.button`
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px dashed #336f8a;
  background: #eef5f9;
  color: #336f8a;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  width: 100%;
  flex-shrink: 0;

  &:hover {
    background: #d9e8f0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddFieldButton = styled.button`
  padding: 6px 10px 6px 22px;
  border-radius: 6px;
  border: 1px dashed #d3dae0;
  background: transparent;
  color: #336f8a;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  margin: 2px 0 6px;

  &:hover {
    background: #f7f9f8;
    border-color: #336f8a;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

function reorderArray(arr, fromIndex, toIndex) {
  const next = arr.slice();
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next;
}

export default function CardListPanel({
  definition,
  selected,
  onSelect,
}) {
  const cards = definition?.cards || [];
  const refetchDef = {
    refetchQueries: [
      { query: ADMIN_FORM_DEFINITION, variables: { id: definition.id } },
    ],
    awaitRefetchQueries: true,
  };

  const [createCard, { loading: addingCard }] = useMutation(
    CREATE_FORM_CARD,
    refetchDef
  );
  const [updateCard] = useMutation(UPDATE_FORM_CARD);
  const [createField] = useMutation(CREATE_FORM_FIELD, refetchDef);
  const [updateField] = useMutation(UPDATE_FORM_FIELD);

  const onCardDrop = async ({ removedIndex, addedIndex }) => {
    if (removedIndex == null || addedIndex == null) return;
    if (removedIndex === addedIndex) return;
    const next = reorderArray(cards, removedIndex, addedIndex);
    // Update only the rows whose order actually changed.
    await Promise.all(
      next.map((card, i) =>
        card.order !== i
          ? updateCard({ variables: { id: card.id, input: { order: i } } })
          : null
      ).filter(Boolean)
    );
    // Single refetch at the end.
    await updateCard({
      variables: { id: next[0].id, input: { order: 0 } },
      refetchQueries: refetchDef.refetchQueries,
      awaitRefetchQueries: true,
    });
  };

  const onFieldDrop = (cardId, fields) => async ({ removedIndex, addedIndex }) => {
    if (removedIndex == null || addedIndex == null) return;
    if (removedIndex === addedIndex) return;
    const next = reorderArray(fields, removedIndex, addedIndex);
    await Promise.all(
      next.map((f, i) =>
        f.order !== i
          ? updateField({ variables: { id: f.id, input: { order: i } } })
          : null
      ).filter(Boolean)
    );
    await updateField({
      variables: { id: next[0].id, input: { order: 0 } },
      refetchQueries: refetchDef.refetchQueries,
      awaitRefetchQueries: true,
    });
  };

  const addCard = async () => {
    const res = await createCard({
      variables: {
        input: {
          definition: { connect: { id: definition.id } },
          cardType: "fields",
          title: "New card",
          order: cards.length,
        },
      },
    });
    const newId = res?.data?.createFormCard?.id;
    if (newId) onSelect({ type: "card", id: newId });
  };

  const addField = async (card) => {
    const fields = card.fields || [];
    const res = await createField({
      variables: {
        input: {
          card: { connect: { id: card.id } },
          name: `new_field_${fields.length + 1}`,
          fieldType: "text",
          label: "New field",
          isRequired: false,
          order: fields.length,
          storage: "json_bucket",
          storageBucket: "extraDetails",
          storageEntity: "self",
        },
      },
    });
    const newId = res?.data?.createFormField?.id;
    if (newId) onSelect({ type: "field", id: newId });
  };

  return (
    <Shell>
      <h3>Cards & fields</h3>
      <ScrollArea>
        {cards.length === 0 ? (
          <div className="empty">No cards yet. Use the button below to add one.</div>
        ) : null}

        <Container
          onDrop={onCardDrop}
          dragHandleSelector=".card-drag-handle"
          dropPlaceholder={{ animationDuration: 150, showOnTop: true }}
        >
          {cards.map((card) => {
            const isCardSelected =
              selected?.type === "card" && selected.id === card.id;
            const isFieldsCard = card.cardType === "fields";
            const fields = isFieldsCard ? card.fields || [] : [];
            return (
              <Draggable key={card.id}>
                <CardItem $selected={isCardSelected}>
                  <div
                    className="header"
                    onClick={(e) => {
                      if (e.target.closest(".no-select")) return;
                      onSelect({ type: "card", id: card.id });
                    }}
                  >
                    <DragHandle className="card-drag-handle no-select" title="Drag to reorder">
                      ≡
                    </DragHandle>
                    <span className="title-text">
                      {card.title || <em>(untitled card)</em>}
                    </span>
                    <span className="meta">
                      {card.cardType === "fields"
                        ? `${fields.length} fields`
                        : card.cardType}
                    </span>
                  </div>
                  {isFieldsCard && fields.length > 0 ? (
                    <Container
                      onDrop={onFieldDrop(card.id, fields)}
                      dragHandleSelector=".field-drag-handle"
                      dropPlaceholder={{
                        animationDuration: 150,
                        showOnTop: true,
                      }}
                    >
                      {fields.map((field) => {
                        const isFieldSelected =
                          selected?.type === "field" &&
                          selected.id === field.id;
                        return (
                          <Draggable key={field.id}>
                            <FieldRow
                              $selected={isFieldSelected}
                              onClick={(e) => {
                                if (e.target.closest(".no-select")) return;
                                onSelect({ type: "field", id: field.id });
                              }}
                            >
                              <DragHandle
                                className="field-drag-handle no-select"
                                title="Drag to reorder"
                              >
                                ≡
                              </DragHandle>
                              <span className="name-text">
                                {field.label || field.name}
                              </span>
                              <span className="type">{field.fieldType}</span>
                            </FieldRow>
                          </Draggable>
                        );
                      })}
                    </Container>
                  ) : null}
                  {isFieldsCard ? (
                    <AddFieldButton
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addField(card);
                      }}
                    >
                      + Add field
                    </AddFieldButton>
                  ) : null}
                </CardItem>
              </Draggable>
            );
          })}
        </Container>
      </ScrollArea>

      <AddCardButton type="button" onClick={addCard} disabled={addingCard}>
        {addingCard ? "Adding…" : "+ Add card"}
      </AddCardButton>
    </Shell>
  );
}
