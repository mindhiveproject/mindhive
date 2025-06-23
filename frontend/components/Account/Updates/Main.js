import { useQuery } from "@apollo/client";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import { GET_MY_UPDATES } from "../../Queries/Update";

import UpdateCard from "./UpdateCard";

export default function MyUpdates({ user }) {
  const { t } = useTranslation("home");
  const { data, error, loading } = useQuery(GET_MY_UPDATES, {
    variables: {
      id: user?.id,
    },
  });

  const updates = data?.updates || [];

  return (
    <div className="updatesBoard">
      <div className="h26">{t("updates.latestUpdates")}</div>
      {updates.length === 0 && <p>{t("updates.noUpdate")}</p>}
      <div className="updates">
        {updates.map((update, num) => (
          <UpdateCard key={num} user={user} update={update} />
        ))}
      </div>
    </div>
  );
}
