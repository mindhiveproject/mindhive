// Reusable three-pane FormDefinition editor: CardListPanel (left) +
// selected card/field editor (middle) + live PreviewPanel (right).
//
// The full admin EditorPage wraps this with a top bar (back link,
// publish/revert/archive) and a version-history panel. The
// CreateCardModal embeds this on its own so admins can build the
// milestone's project-board-scoped form inline without leaving the
// wizard.
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import styled from "styled-components";

import { ADMIN_FORM_DEFINITION } from "../../../Queries/FormDefinition";
import CardListPanel from "./CardListPanel";
import CardEditor from "./CardEditor";
import FieldEditor from "./FieldEditor";
import PreviewPanel from "./PreviewPanel";

const ThreePane = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 280px 1fr 1fr;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const EmptySelection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 16px;
  padding: 40px;
  color: #5f6871;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);
  font-size: 14px;
  text-align: center;
  min-height: 200px;
`;

const Loading = styled.div`
  padding: 40px;
  text-align: center;
  color: #5f6871;
`;

const ErrorBox = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  background: #fcebea;
  border: 1px solid #f5c2bf;
  color: #871b16;
  font-size: 14px;
`;

export default function FormDefinitionEditor({
  definitionId,
  locale = "en-us",
  onDefinitionLoaded,
}) {
  const [selected, setSelected] = useState(null);

  const { data, loading, error } = useQuery(ADMIN_FORM_DEFINITION, {
    variables: { id: definitionId },
    fetchPolicy: "cache-and-network",
    skip: !definitionId,
  });
  const definition = data?.formDefinition;

  // Notify callers (e.g. modal) when the definition first loads or
  // updates — lets them mirror status/version in their own top bar
  // without redoing the query.
  useEffect(() => {
    if (definition && onDefinitionLoaded) {
      onDefinitionLoaded(definition);
    }
  }, [definition, onDefinitionLoaded]);

  const selectedItem = useMemo(() => {
    if (!definition || !selected) return null;
    if (selected.type === "card") {
      return definition.cards.find((c) => c.id === selected.id) || null;
    }
    if (selected.type === "field") {
      for (const card of definition.cards) {
        const f = (card.fields || []).find((x) => x.id === selected.id);
        if (f) return f;
      }
    }
    return null;
  }, [definition, selected]);

  if (!definitionId) {
    return <ErrorBox>No form definition to edit.</ErrorBox>;
  }
  if (loading && !definition) {
    return <Loading>Loading editor…</Loading>;
  }
  if (error) {
    return <ErrorBox>Couldn't load: {error.message}</ErrorBox>;
  }
  if (!definition) {
    return <ErrorBox>Definition not found.</ErrorBox>;
  }

  return (
    <ThreePane>
      <CardListPanel
        definition={definition}
        selected={selected}
        onSelect={setSelected}
      />
      {selected?.type === "card" && selectedItem ? (
        <CardEditor
          card={selectedItem}
          definitionId={definitionId}
          onDeleted={() => setSelected(null)}
        />
      ) : selected?.type === "field" && selectedItem ? (
        <FieldEditor
          field={selectedItem}
          definitionId={definitionId}
          onDeleted={() => setSelected(null)}
        />
      ) : (
        <EmptySelection>
          Select a card or field on the left to edit it.
        </EmptySelection>
      )}
      <PreviewPanel definition={definition} locale={locale} />
    </ThreePane>
  );
}
