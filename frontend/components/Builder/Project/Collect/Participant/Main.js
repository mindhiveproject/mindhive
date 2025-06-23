import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import UserWrapper from "./StudyInfo/UserWrapper";
import GuestWrapper from "./StudyInfo/GuestWrapper";

import ParticipantResults from "./Results/Main";

export default function ParticipantPage({
  query,
  study,
  components,
  participantId,
  type,
}) {
  const { t } = useTranslation("builder");
  return (
    <div className="participantPage">
      <Link
        href={{
          pathname: `/builder/studies`,
          query: {
            selector: study?.id,
            tab: `collect`,
          },
        }}
      >
        <p>{t("participant.goBack", "← Go back")}</p>
      </Link>

      {type === "user" ? (
        <UserWrapper study={study} publicId={participantId} type={type} />
      ) : (
        <GuestWrapper study={study} publicId={participantId} type={type} />
      )}

      <ParticipantResults
        query={query}
        study={study}
        participantId={participantId}
        components={components}
      />
    </div>
  );
}
