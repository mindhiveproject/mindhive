import Link from "next/link";
import AddTag from "./AddTag";
import EditTag from "./EditTag";

import TagsList from "./TagsList";

import { StyledTag } from "../../styles/StyledTag";
import Button from "../../DesignSystem/Button";
import useTranslation from "next-translate/useTranslation";

export default function TagsMain({ query, user }) {
  const { t } = useTranslation("common");
  const { selector } = query;

  if (!selector) {
    return (
      <StyledTag>
        <h1 className="MH-Type-Heading-Base">{t("tag.myTags")}</h1>
        <Link href="/dashboard/tags/add">
          <Button variant="filled" type="button">
            {t("tag.createTag")}
          </Button>
        </Link>
        <TagsList query={query} user={user} />
      </StyledTag>
    );
  }
  if (selector === "add") {
    return <AddTag user={user} />;
  }
  return <EditTag selector={selector} user={user} query={query} />;
}
