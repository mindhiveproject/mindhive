import { useQuery } from "@apollo/client";
import { GET_TAGS } from "../../Queries/Tag";

import { Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

export default function TagSelector({ handleChange, parentTag }) {
  const { t } = useTranslation("common");
  const { data, error, loading } = useQuery(GET_TAGS);

  const tags =
    data?.tags?.map((tag) => ({
      key: tag?.id,
      text: tag?.title,
      value: tag?.id,
    })) || [];

  const tagsIncludingEmpty = [
    {
      key: 0,
      text: `❌    ${t("tag.noParentTag")}`,
      value: "$$$-parent-not-connected-$$$",
    },
    ...tags,
  ];

  const onChange = (event, data) => {
    handleChange({
      target: {
        name: "parent",
        value: data.value.includes("$$$-parent-not-connected-$$$")
          ? null
          : { id: data?.value },
      },
    });
  };

  return (
    <div>
      <label htmlFor="parent">
        {t("tag.selectParentTag")}
        <Dropdown
          placeholder=""
          fluid
          search
          selection
          lazyLoad
          options={tagsIncludingEmpty}
          onChange={onChange}
          value={parentTag?.id}
        />
      </label>
    </div>
  );
}
