import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import Button from "../../../../DesignSystem/Button";
import Modal from "../../../../DesignSystem/Modal";
import CardRenderer from "../../../../Forms/DefinitionForm/CardRenderer";
import { FORM_DEFINITION_BY_ID } from "../../../../Queries/FormDefinition";

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FormBlock = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-Soft, #f7f9f8);
`;

const FormTitle = styled.h3`
  margin: 0;
  font: var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const Cards = styled.div`
  display: grid;
  gap: 12px;
  pointer-events: none;
`;

const StatusText = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
`;

function SingleFormPreview({ formDefinitionId, label, locale }) {
  const { t } = useTranslation("classes");
  const { data, loading, error } = useQuery(FORM_DEFINITION_BY_ID, {
    variables: { id: formDefinitionId },
    skip: !formDefinitionId,
    fetchPolicy: "cache-and-network",
  });

  const definition = data?.formDefinition;
  const title =
    label ||
    definition?.title ||
    t("opportunities.matchingRound.formPicker.previewUntitled", {}, {
      default: "Questionnaire",
    });

  if (loading && !definition) {
    return (
      <FormBlock>
        <FormTitle>{title}</FormTitle>
        <StatusText>
          {t("opportunities.matchingRound.formPicker.previewLoading", {}, {
            default: "Loading preview…",
          })}
        </StatusText>
      </FormBlock>
    );
  }

  if (error || !definition?.cards?.length) {
    return (
      <FormBlock>
        <FormTitle>{title}</FormTitle>
        <StatusText>
          {t("opportunities.matchingRound.formPicker.previewUnavailable", {}, {
            default: "This form could not be loaded for preview.",
          })}
        </StatusText>
      </FormBlock>
    );
  }

  return (
    <FormBlock>
      <FormTitle>{title}</FormTitle>
      <Cards>
        {definition.cards.map((card) => (
          <CardRenderer
            key={card.id}
            card={card}
            locale={locale}
            viewerRoles={["sponsor", "teacher", "admin"]}
            entityStatus={null}
            values={{}}
            errors={{}}
            onFieldChange={() => {}}
            disabled
            specialCardComponents={{}}
          />
        ))}
      </Cards>
    </FormBlock>
  );
}

export default function MatchingRoundFormPreviewModal({
  open,
  onClose,
  formDefinitionIds = [],
  formLabelsById = {},
}) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const locale = router.locale || "en-us";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="large"
      title={t("opportunities.matchingRound.formPicker.previewTitle", {}, {
        default: "Preview questionnaires",
      })}
      actions={
        <Button type="button" variant="filled" onClick={onClose}>
          {t("opportunities.matchingRound.formPicker.previewClose", {}, {
            default: "Close",
          })}
        </Button>
      }
    >
      {formDefinitionIds.length === 0 ? (
        <StatusText>
          {t("opportunities.matchingRound.formPicker.previewEmpty", {}, {
            default: "Select at least one questionnaire to preview.",
          })}
        </StatusText>
      ) : (
        <Stack>
          {formDefinitionIds.map((id) => (
            <SingleFormPreview
              key={id}
              formDefinitionId={id}
              label={formLabelsById[id]}
              locale={locale}
            />
          ))}
        </Stack>
      )}
    </Modal>
  );
}
