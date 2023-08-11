import { Dropdown } from "semantic-ui-react";

export default function Drop({ study, engine, tags, handleTagsUpdate }) {
  const values = study?.tags.map((tag) => tag?.id) || [];

  return (
    <Dropdown
      placeholder="Search for tags"
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
