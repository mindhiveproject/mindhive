// Main DefinitionForm renderer. Resolves a FormDefinition by key (with
// optional scope context), hydrates initial values from the entity, and
// hands a build-ready update input to the parent's onSubmit handler.
//
// The parent owns the actual mutation call — DefinitionForm stays mostly
// entity-agnostic. Opportunity.proposalData is the exception: it is stored
// as [{ formDefinitionId, answer }], so this file unwraps/re-wraps that
// bucket around the flat storage helpers.
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
//
// Follow-up questionnaires (e.g. matching-round forms) should pass
// `proposalEntryFormDefinitionId` so Save always writes
// Opportunity.proposalData as [{ formDefinitionId, answer }], regardless of
// each field's storage/column configuration.
//
// Imperative API (via ref): `save()` runs the same path as the submit button
// so parents can drive Save from a top bar while `hideSaveButton` is set.
import {
  forwardRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
} from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import {
  FORM_DEFINITION_BY_ID,
  RESOLVE_FORM_DEFINITION,
} from "../../Queries/FormDefinition";
import CardRenderer from "./CardRenderer";
import { fieldLabel } from "./i18n";
import { hydrate, buildUpdate } from "./storage";
import { getVisibleFields } from "./visibility";
import { validateValues, formatFieldError } from "./validation";
import {
  getProposalAnswer,
  upsertProposalEntry,
} from "../../../lib/opportunityProposalData";

/** Flat answer map from current form values, keyed by field.name. */
function buildAnswerFromValues(values, fields) {
  const answer = {};
  for (const field of fields || []) {
    if (!field?.name) continue;
    if (values[field.name] !== undefined) {
      answer[field.name] = values[field.name];
    }
  }
  return answer;
}

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

const DefinitionForm = forwardRef(function DefinitionForm(
  {
    definitionKey,
    definitionId = null,
    /** When set, Save upserts answers into Opportunity.proposalData under this id. */
    proposalEntryFormDefinitionId = null,
    entity,
    related = {},
    scopeContext = {},
    viewerRoles = [],
    locale = "en",
    onSubmit,
    saveLabel = "Save",
    readOnly = false,
    specialCardComponents = {},
    hideSaveButton = false,
  },
  ref,
) {
  const { t } = useTranslation("common");
  const loadById = Boolean(definitionId);

  const resolveQuery = useQuery(RESOLVE_FORM_DEFINITION, {
    variables: {
      key: definitionKey,
      organizationId: scopeContext.organizationId || null,
      classNetworkId: scopeContext.classNetworkId || null,
    },
    fetchPolicy: "cache-and-network",
    skip: loadById || !definitionKey,
  });

  const byIdQuery = useQuery(FORM_DEFINITION_BY_ID, {
    variables: { id: definitionId },
    fetchPolicy: "cache-and-network",
    skip: !loadById,
  });

  const data = loadById ? byIdQuery.data : resolveQuery.data;
  const loading = loadById ? byIdQuery.loading : resolveQuery.loading;
  const error = loadById ? byIdQuery.error : resolveQuery.error;

  const definition = loadById
    ? data?.formDefinition
    : data?.resolveFormDefinition;

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

  // Prefer explicit prop from follow-up panels; also treat fields stored in
  // proposalData the same way for hydrate / wrap.
  const usesProposalDataBucket = useMemo(
    () =>
      allFields.some(
        (f) =>
          f?.storage === "json_bucket" && f?.storageBucket === "proposalData"
      ),
    [allFields]
  );

  const effectiveProposalEntryId =
    proposalEntryFormDefinitionId || definition?.id || null;
  const forceProposalEntry = Boolean(proposalEntryFormDefinitionId);

  // storage.js assumes flat json buckets; Opportunity.proposalData is an
  // array of { formDefinitionId, answer }. Unwrap for hydrate/merge.
  // When forcing a proposal entry, also spread the flat answer onto the
  // entity so column-storage fields can hydrate from the saved answers.
  const entityForStorage = useMemo(() => {
    if (!entity) return entity;
    if (!forceProposalEntry && !usesProposalDataBucket) return entity;
    const flatAnswer = getProposalAnswer(
      entity.proposalData,
      effectiveProposalEntryId
    );
    return {
      ...entity,
      ...(forceProposalEntry ? flatAnswer : null),
      proposalData: flatAnswer,
    };
  }, [
    entity,
    forceProposalEntry,
    usesProposalDataBucket,
    effectiveProposalEntryId,
  ]);

  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const entityStatus = values.status ?? entity?.status ?? null;

  // Hydrate values whenever the definition, entity, or related entities change.
  useEffect(() => {
    if (allFields.length === 0) return;
    setValues(hydrate(entityForStorage, allFields, related));
    setErrors({});
    setSubmitError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFields, entityForStorage, related?.organization?.id]);

  const handleFieldChange = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const save = useCallback(async () => {
    if (readOnly || submitting) return false;
    if (!definition) return false;

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
      return false;
    }

    setSubmitError(null);

    let updateInput;

    if (forceProposalEntry && effectiveProposalEntryId) {
      // Follow-up / forced entry: always persist under Opportunity.proposalData
      // keyed by this form definition id — ignore per-field storage targets so
      // we never write accidental top-level columns on the opportunity.
      const answer = buildAnswerFromValues(values, allFields);
      updateInput = {
        self: {
          proposalData: upsertProposalEntry(
            entity?.proposalData,
            effectiveProposalEntryId,
            answer
          ),
        },
      };
    } else {
      updateInput = buildUpdate(
        values,
        allFields,
        entityForStorage,
        related
      );

      // Re-wrap flat proposalData answer into [{ formDefinitionId, answer }].
      if (
        usesProposalDataBucket &&
        definition?.id &&
        updateInput?.self?.proposalData &&
        !Array.isArray(updateInput.self.proposalData)
      ) {
        updateInput.self.proposalData = upsertProposalEntry(
          entity?.proposalData,
          definition.id,
          updateInput.self.proposalData
        );
      }
    }

    setSubmitting(true);
    try {
      await onSubmit(updateInput);
      return true;
    } catch (err) {
      setSubmitError(
        err?.message ||
          t("definitionForm.saveFailed", {}, {
            default: "Save failed. Please try again.",
          })
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [
    readOnly,
    submitting,
    definition,
    viewerRoles,
    entityStatus,
    values,
    t,
    locale,
    forceProposalEntry,
    effectiveProposalEntryId,
    allFields,
    entity,
    entityForStorage,
    related,
    usesProposalDataBucket,
    onSubmit,
  ]);

  useImperativeHandle(ref, () => ({ save }), [save]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await save();
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
        {loadById ? (
          <>
            Couldn&apos;t find form definition{" "}
            <code>{definitionId}</code>.
          </>
        ) : (
          <>
            No published form for <code>{definitionKey}</code> at the current
            scope. Ask an admin to publish one.
          </>
        )}
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
      {!readOnly && !hideSaveButton && (
        <Actions>
          <SaveButton type="submit" disabled={submitting}>
            {submitting ? "Saving…" : saveLabel}
          </SaveButton>
        </Actions>
      )}
    </Shell>
  );
});

export default DefinitionForm;
