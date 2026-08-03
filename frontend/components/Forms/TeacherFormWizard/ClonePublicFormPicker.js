import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { PUBLIC_OPPORTUNITY_FORM_DEFINITIONS } from "../../Queries/FormDefinition";
import { CloneList, CloneRow, ErrorText, StepMeta } from "./styles";

export default function ClonePublicFormPicker({ onPick, disabled }) {
  const { t } = useTranslation("classes");
  const { data, loading, error } = useQuery(PUBLIC_OPPORTUNITY_FORM_DEFINITIONS, {
    fetchPolicy: "cache-and-network",
  });
  const forms = data?.formDefinitions || [];

  if (loading && forms.length === 0) {
    return (
      <StepMeta>
        {t("opportunities.matchingRound.formWizard.cloneLoading", {}, {
          default: "Loading public forms…",
        })}
      </StepMeta>
    );
  }

  if (error) {
    return (
      <ErrorText>
        {t("opportunities.matchingRound.formWizard.cloneError", {}, {
          default: "Could not load public forms.",
        })}
      </ErrorText>
    );
  }

  if (forms.length === 0) {
    return (
      <StepMeta>
        {t("opportunities.matchingRound.formWizard.cloneEmpty", {}, {
          default: "No public forms are available to copy yet.",
        })}
      </StepMeta>
    );
  }

  return (
    <CloneList>
      {forms.map((form) => (
        <CloneRow
          key={form.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(form)}
        >
          <div className="clone-title">{form.title}</div>
          {form.description ? (
            <div className="clone-desc">{form.description}</div>
          ) : null}
        </CloneRow>
      ))}
    </CloneList>
  );
}
