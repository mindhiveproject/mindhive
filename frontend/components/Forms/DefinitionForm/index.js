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
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import { RESOLVE_FORM_DEFINITION } from "../../Queries/FormDefinition";
import CardRenderer from "./CardRenderer";
import { fieldLabel } from "./i18n";
import { hydrate, buildUpdate } from "./storage";
import { getVisibleFields } from "./visibility";
import { validateValues, formatFieldError } from "./validation";

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

function scrollToFirstFieldError() {
  requestAnimationFrame(() => {
    document
      .querySelector('[data-field-error="true"]')
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

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
  const { t } = useTranslation("common");
  const { data, loading, error } = useQuery(RESOLVE_FORM_DEFINITION, {
    variables: {
      key: definitionKey,
      organizationId: scopeContext.organizationId || null,
      classNetworkId: scopeContext.classNetworkId || null,
    },
    fetchPolicy: "cache-and-network",
  });

  const definition = data?.resolveFormDefinition;

  // Flatten all fields across all cards for hydration and update-building.
  // Validation uses getVisibleFields() so hidden cards are not checked.
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

  const entityStatus = values.status ?? entity?.status ?? null;

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

    const visibleFields = getVisibleFields(definition, {
      viewerRoles,
      entityStatus,
    });
    const rawErrors = validateValues(values, visibleFields);

    if (Object.keys(rawErrors).length > 0) {
      const formattedErrors = {};
      const failingLabels = [];

      for (const [name, detail] of Object.entries(rawErrors)) {
        const field = visibleFields.find((f) => f.name === name);
        formattedErrors[name] = formatFieldError(field, detail, t);
        if (field) {
          failingLabels.push(fieldLabel(field, locale));
        }
      }

      setErrors(formattedErrors);

      const banner =
        failingLabels.length === 1
          ? t(
              "definitionForm.fixSingleField",
              { field: failingLabels[0] },
              { default: "Please fix {{field}} before saving." }
            )
          : t(
              "definitionForm.fixMultipleFields",
              { fields: failingLabels.join(", ") },
              {
                default:
                  "Please fix the following fields: {{fields}}",
              }
            );

      setSubmitError(banner);
      scrollToFirstFieldError();
      return;
    }

    setSubmitError(null);
    const updateInput = buildUpdate(values, allFields, entity, related);
    setSubmitting(true);
    try {
      await onSubmit(updateInput);
    } catch (err) {
      setSubmitError(
        err?.message ||
          t("definitionForm.saveFailed", {}, {
            default: "Save failed. Please try again.",
          })
      );
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
          entityStatus={entityStatus}
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
