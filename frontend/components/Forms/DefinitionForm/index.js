// Main DefinitionForm renderer. Resolves a FormDefinition by key (with
// optional scope context), hydrates initial values from the entity, and
// hands a build-ready update input to the parent's onSubmit handler.
//
// The parent owns the actual mutation call — DefinitionForm stays
// entity-agnostic so the same component drives Opportunity, Profile,
// and Organization forms with no per-entity branches here.
//
// Usage:
//   <DefinitionForm
//     definitionKey="opportunity"
//     entity={opportunity}                    // null when creating
//     scopeContext={{ organizationId, classNetworkId }}
//     viewerRoles={["mentor", "sponsor"]}
//     locale={router.locale}
//     onSubmit={(updateInput) => mutate({ variables: { input: updateInput } })}
//     saveLabel="Save changes"
//     readOnly={false}
//     specialCardComponents={{ members_panel: MembersPanel,
//                              interest_selector: InterestSelector }}
//   />
import { useMemo, useState, useEffect, useCallback } from "react";
import { useQuery } from "@apollo/client";
import styled from "styled-components";

import { RESOLVE_FORM_DEFINITION } from "../../Queries/FormDefinition";
import CardRenderer from "./CardRenderer";
import { hydrate, buildUpdate } from "./storage";
import { validateValues } from "./validation";

const Shell = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const SaveButton = styled.button`
  padding: 10px 24px;
  border-radius: 100px;
  background: #336f8a;
  color: #ffffff;
  border: none;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorBox = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  background: #fcebea;
  border: 1px solid #f5c2bf;
  color: #871b16;
  font-size: 14px;
`;

const Loading = styled.div`
  padding: 32px;
  text-align: center;
  color: #5f6871;
`;

export default function DefinitionForm({
  definitionKey,
  entity,
  related = {},
  scopeContext = {},
  viewerRoles = [],
  locale = "en",
  onSubmit,
  saveLabel = "Save",
  readOnly = false,
  specialCardComponents = {},
}) {
  const { data, loading, error } = useQuery(RESOLVE_FORM_DEFINITION, {
    variables: {
      key: definitionKey,
      organizationId: scopeContext.organizationId || null,
      classNetworkId: scopeContext.classNetworkId || null,
    },
    fetchPolicy: "cache-and-network",
  });

  const definition = data?.resolveFormDefinition;

  // Flatten all fields across all cards for hydration / validation /
  // update-building. Card-level filtering for rendering happens
  // separately in CardRenderer.
  const allFields = useMemo(() => {
    if (!definition?.cards) return [];
    const out = [];
    for (const card of definition.cards) {
      if (card.cardType !== "fields") continue;
      for (const f of card.fields || []) out.push(f);
    }
    return out;
  }, [definition]);

  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Hydrate values whenever the definition, entity, or related entities change.
  useEffect(() => {
    if (allFields.length === 0) return;
    setValues(hydrate(entity, allFields, related));
    setErrors({});
    setSubmitError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFields, entity, related?.organization?.id]);

  const handleFieldChange = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly || submitting) return;
    const validationErrors = validateValues(values, allFields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitError(
        "Please fix the highlighted fields before saving."
      );
      return;
    }
    setSubmitError(null);
    const updateInput = buildUpdate(values, allFields, entity, related);
    setSubmitting(true);
    try {
      await onSubmit(updateInput);
    } catch (err) {
      setSubmitError(err?.message || "Save failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !definition) {
    return <Loading>Loading form…</Loading>;
  }
  if (error) {
    return (
      <ErrorBox>
        Couldn't load the form definition: {error.message}
      </ErrorBox>
    );
  }
  if (!definition) {
    return (
      <ErrorBox>
        No published form for <code>{definitionKey}</code> at the current
        scope. Ask an admin to publish one.
      </ErrorBox>
    );
  }

  return (
    <Shell onSubmit={handleSubmit}>
      {submitError ? <ErrorBox>{submitError}</ErrorBox> : null}
      {(definition.cards || []).map((card) => (
        <CardRenderer
          key={card.id}
          card={card}
          locale={locale}
          viewerRoles={viewerRoles}
          entityStatus={entity?.status}
          values={values}
          errors={errors}
          onFieldChange={handleFieldChange}
          disabled={readOnly || submitting}
          specialCardComponents={specialCardComponents}
        />
      ))}
      {!readOnly && (
        <Actions>
          <SaveButton type="submit" disabled={submitting}>
            {submitting ? "Saving…" : saveLabel}
          </SaveButton>
        </Actions>
      )}
    </Shell>
  );
}
