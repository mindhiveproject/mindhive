import { useMemo } from "react";
import { useQuery } from "@apollo/client";

import { RESOLVE_FORM_DEFINITION } from "../../../../Queries/FormDefinition";
import { GET_MILESTONES } from "../../../../Queries/Milestone";
import {
  getMilestoneByKey,
  resolveReviewFormKey,
} from "../../../../../lib/milestones";
import {
  normalizeCurriculumType,
  DEFAULT_CURRICULUM_TYPE,
} from "../../../../../lib/curriculumTypes";
import { fieldLabel, optionLabel } from "../../../../Forms/DefinitionForm/i18n";

const FIELD_TYPE_TO_RESPONSE = {
  select_one_icon: "selectOne",
  task_selector: "taskSelector",
  dual_textarea: "dualTextarea",
  textarea: "textarea",
  text: "textarea",
  rich_text: "textarea",
};

function sortedFields(definition) {
  const cards = (definition?.cards || [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const fields = [];
  for (const card of cards) {
    if (card.cardType !== "fields") continue;
    const cardFields = (card.fields || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    fields.push(...cardFields);
  }
  return fields;
}

function fieldToReviewItem(field, locale) {
  const responseType =
    FIELD_TYPE_TO_RESPONSE[field.fieldType] || "textarea";
  const item = {
    name: field.name,
    responseType,
    question: fieldLabel(field, locale),
    subtitle: "",
    answer: "",
  };

  if (field.fieldType === "select_one_icon") {
    const raw = Array.isArray(field.options) ? field.options : [];
    item.responseOptions = raw
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((option) => ({
        value: option.value,
        title: optionLabel(option, locale),
        subtitle: option.subtitle || "",
        icon: option.icon || "",
      }));
  }

  if (field.fieldType === "dual_textarea") {
    const raw = Array.isArray(field.options) ? field.options : [];
    const sorted = raw
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    item.subQuestionA = sorted[0] ? optionLabel(sorted[0], locale) : "";
    item.subQuestionB = sorted[1] ? optionLabel(sorted[1], locale) : "";
    item.answer = { subA: "", subB: "" };
  }

  if (field.fieldType === "task_selector") {
    item.answer = [];
  }

  return item;
}

export function formDefinitionToReviewContent(definition, locale = "en-us") {
  if (!definition) return [];
  return sortedFields(definition).map((field) =>
    fieldToReviewItem(field, locale)
  );
}

export function reviewContentFromFormDefinition(savedContent, definition, locale) {
  const template = formDefinitionToReviewContent(definition, locale);
  if (!Array.isArray(template) || template.length === 0) {
    return savedContent || [];
  }
  if (!Array.isArray(savedContent) || savedContent.length === 0) {
    return template;
  }

  const savedByName = new Map(
    savedContent.map((item) => [item?.name, item])
  );

  return template.map((templateItem) => {
    const savedItem = savedByName.get(templateItem.name);
    if (!savedItem) {
      return templateItem;
    }

    if (templateItem.responseType === "dualTextarea") {
      const savedAnswer = savedItem.answer;
      const answer =
        savedAnswer && typeof savedAnswer === "object"
          ? {
              subA: savedAnswer.subA ?? "",
              subB: savedAnswer.subB ?? "",
            }
          : templateItem.answer;
      return { ...templateItem, answer };
    }

    return {
      ...templateItem,
      answer: savedItem.answer ?? templateItem.answer ?? "",
      ...(savedItem.rating != null ? { rating: savedItem.rating } : {}),
    };
  });
}

export function useReviewFormDefinition(
  milestoneKey,
  curriculumType,
  scopeContext = {},
  options = {}
) {
  const { milestone: milestoneProp } = options;
  const normalizedType = normalizeCurriculumType(
    curriculumType || DEFAULT_CURRICULUM_TYPE
  );

  const { data: milestonesData, loading: milestonesLoading } = useQuery(
    GET_MILESTONES,
    { skip: !!milestoneProp?.key }
  );
  const milestones = milestonesData?.milestones || [];
  const milestone =
    milestoneProp || getMilestoneByKey(milestoneKey, milestones);

  const formKey = useMemo(() => {
    if (milestone) {
      return resolveReviewFormKey(milestone, normalizedType);
    }
    return `review_${milestoneKey}_${normalizedType}`;
  }, [milestone, milestoneKey, normalizedType]);

  const {
    data: formData,
    loading: formLoading,
    error,
  } = useQuery(RESOLVE_FORM_DEFINITION, {
    variables: {
      key: formKey,
      organizationId: scopeContext.organizationId || null,
      classNetworkId: scopeContext.classNetworkId || null,
    },
    skip: !formKey,
  });

  const definition = formData?.resolveFormDefinition || null;

  return {
    definition,
    formKey,
    milestone,
    milestones,
    loading: milestonesLoading || formLoading,
    error,
  };
}
