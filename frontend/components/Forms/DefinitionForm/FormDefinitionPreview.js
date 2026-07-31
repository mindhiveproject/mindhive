import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import CardRenderer from "./CardRenderer";
import { RESOLVE_FORM_DEFINITION } from "../../Queries/FormDefinition";
import { getCurriculumType } from "../../../lib/curriculumTypes";
import { resolveReviewFormKey } from "../../../lib/milestones";

const previewShellStyle = {
  border: "1px solid #E6E6E6",
  borderRadius: 12,
  background: "#F7F9F8",
  color: "#5D5763",
  fontSize: 14,
  lineHeight: "20px",
  padding: 16,
  maxHeight: 260,
  overflowY: "auto",
};

export default function FormDefinitionPreview({
  board,
  milestone,
  proposalBoardId = null,
  maxHeight = 260,
}) {
  const { t } = useTranslation("builder");
  const router = useRouter();
  const curriculumType = getCurriculumType(board);

  const formKey = useMemo(() => {
    if (!milestone) return null;
    if (milestone.formDefinition?.key) return milestone.formDefinition.key;
    return resolveReviewFormKey(milestone, curriculumType);
  }, [curriculumType, milestone]);

  const { data, loading } = useQuery(RESOLVE_FORM_DEFINITION, {
    variables: {
      key: formKey || "",
      organizationId: null,
      classNetworkId: null,
      proposalBoardId: proposalBoardId || board?.id || null,
    },
    skip: !formKey,
  });

  if (!milestone) return null;

  const shellStyle = { ...previewShellStyle, maxHeight };

  if (!formKey) {
    return (
      <div style={shellStyle}>
        {t(
          "section.createCardModal.noPreview",
          {},
          { default: "No review form is linked to this card type." }
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={shellStyle}>
        {t(
          "section.createCardModal.previewLoading",
          {},
          { default: "Loading preview..." }
        )}
      </div>
    );
  }

  const definition = data?.resolveFormDefinition;
  if (!definition?.cards?.length) {
    return (
      <div style={shellStyle}>
        {t(
          "section.createCardModal.noPreview",
          {},
          { default: "No review form is linked to this card type." }
        )}
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>
        {t(
          "section.createCardModal.previewLabel",
          {},
          { default: "Review form preview" }
        )}
      </div>
      <div style={{ display: "grid", gap: 12, pointerEvents: "none" }}>
        {definition.cards.map((card) => (
          <CardRenderer
            key={card.id}
            card={card}
            locale={router.locale || "en-us"}
            viewerRoles={["admin"]}
            entityStatus={null}
            values={{}}
            errors={{}}
            onFieldChange={() => {}}
            disabled
            specialCardComponents={{}}
          />
        ))}
      </div>
    </div>
  );
}
