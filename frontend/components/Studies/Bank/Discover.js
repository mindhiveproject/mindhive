import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { PUBLIC_STUDIES } from "../../Queries/Study";
import { GET_USER_STUDIES } from "../../Queries/User";

import StudyCard from "./StudyCard";
import { StyledDiscover } from "../../styles/StyledDiscover";

export default function DiscoverStudyBank({ query, user, isDashboard }) {
  const { t } = useTranslation("builder");
  const router = useRouter();
  const tab = query?.tab || "all";

  const filterOptions = [
    {
      key: "all",
      text: t("allStudies"),
      value: "all",
      content: t("allStudies"),
    },
    {
      key: "participated",
      text: t("studiesIParticipatedIn"),
      value: "participated",
      content: t("studiesIParticipatedIn"),
    },
    {
      key: "notparticipated",
      text: t("studiesIHaventParticipatedIn"),
      value: "notparticipated",
      content: t("studiesIHaventParticipatedIn"),
    },
  ];

  const { data, error, loading } = useQuery(PUBLIC_STUDIES);
  const studies = data?.studies || [];

  const { data: userData } = useQuery(GET_USER_STUDIES);
  const studiesParticipated = userData?.authenticatedItem?.participantIn || [];

  const setTab = (tab) => {
    router.push({
      pathname: `${isDashboard ? "/dashboard" : ""}/discover/study`,
      query: {
        tab,
      },
    });
  };

  let filteredStudies;
  if (tab === "participated") {
    filteredStudies = studies.filter((study) =>
      studiesParticipated?.map((study) => study?.id).includes(study?.id)
    );
  } else if (tab === "notparticipated") {
    filteredStudies = studies.filter(
      (study) =>
        !studiesParticipated?.map((study) => study?.id).includes(study?.id)
    );
  } else {
    filteredStudies = studies;
  }

  return (
    <StyledDiscover>
      {user && (
        <div className="filterHeader">
          <div>
            <Dropdown
              selection
              value={tab}
              options={filterOptions}
              onChange={(event, data) => setTab(data?.value)}
            />
          </div>
        </div>
      )}

      <div className="cardBoard">
        {filteredStudies.map((study) => (
          <StudyCard
            user={user}
            key={study?.id}
            study={study}
            url={
              user ? "/dashboard/discover/studies/" : `/studies/${study?.slug}`
            }
            id="slug"
            name="name"
          />
        ))}
      </div>
    </StyledDiscover>
  );
}
