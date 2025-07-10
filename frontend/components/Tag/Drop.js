import { Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

export default function Drop({ study, engine, tags, handleTagsUpdate }) {
  const { t } = useTranslation('common');
  const values = study?.tags.map((tag) => tag?.id) || [];

  return (
    <Dropdown
      placeholder={t('tag.searchPlaceholder')}
      fluid
      multiple
      search
      selection
      options={tags}
      onChange={(event, data) => handleTagsUpdate(data.value)}
      value={values}
      onFocus={() => {
        if (engine) {
          engine.getModel().setLocked(true);
        }
      }}
      onBlur={() => {
        if (engine) {
          engine.getModel().setLocked(false);
        }
      }}
    />
  );
}
