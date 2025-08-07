import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Drop from "./Drop";

import { GET_TAGS } from "../Queries/Tag";

export default function StudyTagger({ study, engine, handleChange }) {
  const { t } = useTranslation('common');
  const { data, loading, error } = useQuery(GET_TAGS);
  const tags = data?.tags || [];
  const tagValues = tags.map((tag) => ({
    key: tag.id,
    text: tag.title,
    value: tag.id,
  }));

  const handleTagsUpdate = (value) => {
    handleChange({
      target: { name: "tags", value: value.map((tag) => ({ id: tag })) },
    });
  };

  return (
    <div id="studyTags">
      <h2>{t('tag.studyTagsHeader')}</h2>
      <p>{t('tag.chooseKeywords')}</p>
      <Drop
        study={study}
        engine={engine}
        tags={tagValues}
        handleTagsUpdate={handleTagsUpdate}
      />
    </div>
  );
}
