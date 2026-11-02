import { useCallback, useMemo } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { RESOLVE_FORM_DEFINITION } from "../../Queries/FormDefinition";
import { pickText } from "../../Forms/DefinitionForm/i18n";
import {
  CONSENT_AUDIENCES,
  audienceOf,
  consentDefinitionKey,
  definitionSections,
  fallbackSections,
} from "./consentTypes";

// Review states whose sections are frozen to the snapshot taken on submit
// (settings.review.sections, see keystone/mutations/consentReview.ts)
const FROZEN_STATUSES = ["submitted", "approved"];

function useDefinition(audience, classId, classNetworkId, skip) {
  const { data, loading } = useQuery(RESOLVE_FORM_DEFINITION, {
    variables: {
      key: consentDefinitionKey(audience),
      classId: classId || null,
      classNetworkId: classNetworkId || null,
    },
    skip,
  });
  return { definition: data?.resolveFormDefinition, loading };
}

// Sections of each form type of a protocol: the consent FormDefinition of
// its audience (class > class network > global), or the snapshot taken when
// the protocol was submitted for review. Falls back to the built-in
// sections while loading or when nothing is published.
export default function useConsentSections({
  classId,
  classNetworkId,
  review,
}) {
  const { t, lang } = useTranslation("dashboard");
  const frozen = FROZEN_STATUSES.includes(review?.status);
  const adult = useDefinition("adult", classId, classNetworkId, frozen);
  const parent = useDefinition("parent", classId, classNetworkId, frozen);
  const minor = useDefinition("minor", classId, classNetworkId, frozen);

  const byAudience = useMemo(() => {
    const live = {
      adult: adult.definition,
      parent: parent.definition,
      minor: minor.definition,
    };
    return Object.fromEntries(
      CONSENT_AUDIENCES.map((audience) => {
        const sections = frozen
          ? review?.sections?.[audience]?.sections
          : definitionSections(live[audience]);
        return [
          audience,
          sections?.length ? sections : fallbackSections(audience),
        ];
      })
    );
  }, [frozen, review, adult.definition, parent.definition, minor.definition]);

  const sectionsFor = useCallback(
    (name) => byAudience[audienceOf(name)],
    [byAudience]
  );

  // Built-in sections keep their translation keys; defined ones show the
  // wording of the definition
  const sectionLabel = (section, name) =>
    section.builtIn
      ? t(
          `consentAdmin.sections.${section.key}${
            section.key === "activities" && audienceOf(name) === "parent"
              ? "Parent"
              : ""
          }`,
          {},
          { default: section.label }
        )
      : pickText(section.label, section.labelI18n, lang);

  const checklistLabel = (section, name) =>
    section.builtIn
      ? t(
          `consentAdmin.checklist.${section.key}`,
          {},
          { default: section.checklist }
        )
      : sectionLabel(section, name);

  const sectionHint = (section) =>
    pickText(section.helperText, section.helperTextI18n, lang);

  return {
    sectionsFor,
    sectionLabel,
    checklistLabel,
    sectionHint,
    loading: adult.loading || parent.loading || minor.loading,
  };
}
