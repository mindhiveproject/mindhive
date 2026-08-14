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
// each field's storage/column configuration. The only allowlisted exception
// is the managed intro-video field (storage=column → Opportunity.videoFile).
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
import { validateValues, formatFieldError, parseInvalidSelectFieldNamesFromError } from "./validation";
import {
  getProposalAnswer,
  upsertProposalEntry,
} from "../../../lib/opportunityProposalData";

/** Managed Opportunity.videoFile column — never serialized into proposalData. */
const INTRO_VIDEO_COLUMN = "videoFile";

function isFileValue(v) {
  return typeof File !== "undefined" && v instanceof File;
}

function isUnchangedMediaPayload(v) {
  return (
    v != null &&
    typeof v === "object" &&
    !isFileValue(v) &&
    !Array.isArray(v) &&
    typeof v.url === "string"
  );
}

/**
 * Exact managed intro-video field: column storage targeting Opportunity.videoFile.
 * Only this allowlisted field may escape the proposalData isolation layer.
 */
export function isManagedIntroVideoField(field) {
  if (!field || field.fieldType !== "file") return false;
  if (field.storage !== "column") return false;
  const col = field.storageColumn || field.name;
  return col === INTRO_VIDEO_COLUMN;
}

/** Flat answer map from current form values, keyed by field.name. */
function buildAnswerFromValues(values, fields, { omitManagedIntroVideo = false } = {}) {
  const answer = {};
  for (const field of fields || []) {
    if (!field?.name) continue;
    if (omitManagedIntroVideo && isManagedIntroVideoField(field)) continue;
    if (values[field.name] !== undefined) {
      answer[field.name] = values[field.name];
    }
  }
  return answer;
}

/**
 * Build a Keystone file upload/clear for Opportunity.videoFile, or null when
 * the field is absent / unchanged.
 */
function buildManagedIntroVideoUpdate(values, fields) {
  const field = (fields || []).find(isManagedIntroVideoField);
  if (!field) return null;
  const v = values[field.name];
  if (isFileValue(v)) {
    return { [INTRO_VIDEO_COLUMN]: { upload: v } };
  }
  if (v === null) {
    return { [INTRO_VIDEO_COLUMN]: null };
  }
  if (isUnchangedMediaPayload(v) || v === undefined) {
    return null;
  }
  return null;
}

/**
 * JSON-safe proposalData stub so follow-up completion (which only inspects
 * proposalData answers) counts a managed intro-video response. The real file
 * still lives on Opportunity.videoFile — this is not the upload payload.
 */
function buildManagedIntroVideoAnswerMarker(values, fields) {
  const field = (fields || []).find(isManagedIntroVideoField);
  if (!field) return null;
  const v = values[field.name];
  if (isFileValue(v)) {
    return {
      [field.name]: {
        present: true,
        filename: v.name || null,
        filesize: typeof v.size === "number" ? v.size : null,
      },
    };
  }
  if (isUnchangedMediaPayload(v)) {
    return {
      [field.name]: {
        present: true,
        filename: v.filename || v.name || null,
        filesize:
          typeof v.filesize === "number"
            ? v.filesize
            : typeof v.size === "number"
              ? v.size
              : null,
        // url is intentionally omitted from proposalData; hydrate uses the
        // Opportunity.videoFile column instead.
      },
    };
  }
  // Explicit remove → no marker (form can become incomplete again).
  return null;
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

function buildSelectValidationBanner(failingLabels, t) {
  if (failingLabels.length === 1) {
    return t(
      "definitionForm.selectRequired",
      { field: failingLabels[0] },
      { default: "{{field}} must be chosen." },
    );
  }
  return t(
    "definitionForm.fixMultipleFields",
    { fields: failingLabels.join(", ") },
    {
      default: "Please fix the following fields: {{fields}}",
    },
  );
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
    /** When readOnly: "inline" = 1/3 prompt + 2/3 answer for simple fields. */
    readOnlyLayout = null,
    specialCardComponents = {},
    hideSaveButton = false,
    /** Read-only review: hide blank / unanswered fields and special cards. */
    hideUnansweredFields = false,
    /** Flatter card chrome (e.g. inside a DesignSystem Modal). */
    quiet = false,
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
  // Follow-up form fields often use json_bucket + a non-proposalData bucket
  // (e.g. extraDetails); mirror the flat answer into those buckets too so
  // hydrate can find values.
  const entityForStorage = useMemo(() => {
    if (!entity) return entity;
    if (!forceProposalEntry && !usesProposalDataBucket) return entity;
    const flatAnswer = getProposalAnswer(
      entity.proposalData,
      effectiveProposalEntryId
    );
    const bucketMirrors = {};
    // Strip managed intro-video stubs from the flat answer before spreading
    // onto the entity — the live Opportunity.videoFile column is the source
    // of truth for hydrate / FileUpload display.
    const flatForEntity =
      forceProposalEntry && flatAnswer
        ? { ...flatAnswer }
        : flatAnswer;
    if (forceProposalEntry && flatForEntity) {
      for (const field of allFields) {
        if (isManagedIntroVideoField(field) && field?.name) {
          delete flatForEntity[field.name];
        }
      }
    }
    if (forceProposalEntry && flatForEntity) {
      for (const field of allFields) {
        if (field?.storage !== "json_bucket") continue;
        const bucket = field.storageBucket;
        if (!bucket || bucketMirrors[bucket]) continue;
        const existing =
          entity[bucket] &&
          typeof entity[bucket] === "object" &&
          !Array.isArray(entity[bucket])
            ? entity[bucket]
            : {};
        bucketMirrors[bucket] = { ...existing, ...flatForEntity };
      }
    }
    return {
      ...entity,
      ...(forceProposalEntry ? flatForEntity : null),
      ...bucketMirrors,
      proposalData: flatAnswer,
    };
  }, [
    entity,
    entity?.id,
    entity?.proposalData,
    forceProposalEntry,
    usesProposalDataBucket,
    effectiveProposalEntryId,
    allFields,
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
        formattedErrors[name] = formatFieldError(field, detail, t, locale);
        if (field) {
          failingLabels.push(fieldLabel(field, locale));
        }
      }

      setErrors(formattedErrors);

      const allSelectRequired = Object.values(rawErrors).every(
        (d) => d?.code === "selectRequired",
      );
      const banner = allSelectRequired
        ? buildSelectValidationBanner(failingLabels, t)
        : failingLabels.length === 1
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
      // keyed by this form definition id. The only allowlisted exception is the
      // managed intro-video field (storage=column, storageColumn=videoFile),
      // which writes Opportunity.videoFile via multipart upload.
      const answer = buildAnswerFromValues(values, allFields, {
        omitManagedIntroVideo: true,
      });
      const videoMarker = buildManagedIntroVideoAnswerMarker(
        values,
        allFields
      );
      if (videoMarker) {
        Object.assign(answer, videoMarker);
      }
      const videoUpdate = buildManagedIntroVideoUpdate(values, allFields);
      updateInput = {
        self: {
          proposalData: upsertProposalEntry(
            entity?.proposalData,
            effectiveProposalEntryId,
            answer
          ),
          ...(videoUpdate || {}),
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
      const invalidSelectNames = parseInvalidSelectFieldNamesFromError(err);
      if (invalidSelectNames.length > 0) {
        const formattedErrors = {};
        const failingLabels = [];
        for (const name of invalidSelectNames) {
          const field =
            visibleFields.find((f) => f.name === name) ||
            allFields.find((f) => f.name === name);
          formattedErrors[name] = formatFieldError(
            field,
            { code: "selectRequired" },
            t,
            locale,
          );
          if (field) {
            failingLabels.push(fieldLabel(field, locale));
          } else {
            failingLabels.push(name);
          }
        }
        setErrors((prev) => ({ ...prev, ...formattedErrors }));
        setSubmitError(buildSelectValidationBanner(failingLabels, t));
        scrollToFirstFieldError();
        return false;
      }
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
          readOnly={readOnly}
          specialCardComponents={specialCardComponents}
          hideUnansweredFields={hideUnansweredFields}
          readOnlyLayout={readOnly ? readOnlyLayout : null}
          quiet={quiet || readOnly}
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
