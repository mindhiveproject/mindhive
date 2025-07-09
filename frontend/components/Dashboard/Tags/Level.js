import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { Dropdown } from "semantic-ui-react";

export default function LevelSelector({ handleChange, level }) {
  const { t } = useTranslation("common");
  const levels = [
    { key: 1, text: t("firstLevel"), value: "1" },
    { key: 2, text: t("secondLevel"), value: "2" },
    { key: 3, text: t("thirdLevel"), value: "3" },
  ];

  const onChange = (event, data) => {
    handleChange({
      target: {
        name: "level",
        value: data?.value,
      },
    });
  };

  return (
    <div>
      <label htmlFor="level">
        {t("tag.tagLevel")}
        <Dropdown
          placeholder=""
          fluid
          search
          selection
          lazyLoad
          options={levels}
          onChange={onChange}
          value={level}
        />
      </label>
    </div>
  );
}
