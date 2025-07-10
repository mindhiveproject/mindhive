import { useQuery } from "@apollo/client";
import moment from "moment";
import { GET_TAGS } from "../../Queries/Tag";

import Link from "next/link";

import DeleteTag from "./Delete";
import useTranslation from "next-translate/useTranslation";

export default function TagsList({ query, user }) {
  const { t } = useTranslation("common");
  const { data, error, loading } = useQuery(GET_TAGS);

  const tags = data?.tags || [];

  return (
    <div className="board">
      <div className="heading">
        <p>{t("tag.title")}</p>
        <p>{t("tag.level")}</p>
        <p>{t("tag.createdAt")}</p>
        <p>{t("tag.updatedAt")}</p>
      </div>
      {tags?.map((tag, i) => (
        <div className="line">
          <Link
            href={{
              pathname: `/dashboard/tags/edit`,
              query: {
                id: tag?.id,
              },
            }}
          >
            <div key={i} className="item">
              <p>{tag?.title}</p>
              <p>{tag?.level}</p>
              <p>{moment(tag?.createdAt).format("MMMM D, YYYY")}</p>
              <p>{moment(tag?.updatedAt).format("MMMM D, YYYY")}</p>
            </div>
          </Link>
          <DeleteTag id={tag?.id} />
        </div>
      ))}
    </div>
  );
}
