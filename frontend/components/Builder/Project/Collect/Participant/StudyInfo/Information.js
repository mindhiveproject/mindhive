import moment from "moment";
import useTranslation from "next-translate/useTranslation";

export default function ParticipantInformation({ study, participant, type }) {
  const { t } = useTranslation("builder");
  const studyInfo =
    (participant?.studiesInfo && participant?.studiesInfo[study?.id]) || {};
  const generalInfo =
    { ...participant?.generalInfo, ...participant?.info } || {};

  const path = studyInfo?.info?.path || [];
  const condition = path
    .filter((stage) => stage?.conditionLabel)
    .map((stage) => stage?.conditionLabel)
    .join(", ");

  return (
    <div>
      <div className="infoItem">
        <p>{t("participantInfo.participantId", "Participant ID")}</p>
        <p>{participant?.publicId}</p>
      </div>
      <div className="infoItem">
        <p>{t("participantInfo.publicReadableId", "Public readable ID")}</p>
        <p>{participant?.publicReadableId}</p>
      </div>

      <h2>
        {t("participantInfo.studyRelatedInfo", "Study-related information")}
      </h2>
      <div>
        {Object.keys(generalInfo).map((key) => {
          if (key === "eng") {
            return (
              <div className="infoItem" key={key}>
                <p>
                  {t(
                    "participantInfo.englishQuestion",
                    "Do you understand basic instruction written in English?"
                  )}
                </p>
                <p>
                  {generalInfo[key] === "yes"
                    ? t("participantInfo.yes", "Yes")
                    : t("participantInfo.no", "No")}
                </p>
              </div>
            );
          }
          if (key === "blockName") {
            return (
              <div className="infoItem" key={key}>
                <p>
                  {t(
                    "participantInfo.betweenSubjectCondition",
                    "Between-subject condition"
                  )}
                </p>
                <p>{generalInfo[key]}</p>
              </div>
            );
          }
          if (key === "share") {
            return (
              <div className="infoItem" key={key}>
                <p>
                  {t(
                    "participantInfo.agreedToSave",
                    "Agreed to save information for future studies"
                  )}
                </p>
                <p>
                  {generalInfo[key] === "true"
                    ? t("participantInfo.yes", "Yes")
                    : t("participantInfo.no", "No")}
                </p>
              </div>
            );
          }
          if (key === "zip" && generalInfo.zip) {
            return (
              <div className="infoItem" key={key}>
                <p>{t("participantInfo.zipCode", "Zip code")}</p>
                <p>{generalInfo[key]}</p>
              </div>
            );
          }
          if (key === "zipcode" && generalInfo.zipcode) {
            return (
              <div className="infoItem" key={key}>
                <p>{t("participantInfo.zipCode", "Zip code")}</p>
                <p>{generalInfo[key]}</p>
              </div>
            );
          }
          if (key === "bd" && generalInfo.bd) {
            return (
              <div className="infoItem" key={key}>
                <p>{t("participantInfo.birthday", "Birthday")}</p>
                <p>
                  {moment(parseInt(generalInfo[key])).format("MMMM D, YYYY")}
                </p>
              </div>
            );
          }
          if (key === "age" && generalInfo.age) {
            return (
              <div className="infoItem" key={key}>
                <p>{t("participantInfo.age", "Age")}</p>
                <p>{generalInfo[key]}</p>
              </div>
            );
          }
        })}
      </div>

      {study?.consent?.length > 0 && (
        <>
          <h2>{t("participantInfo.irbConsent", "IRB consent decisions")}</h2>
          {study?.consent?.map((consent) => {
            return (
              <div className="infoItem" key={consent?.id}>
                <p>{consent?.title}</p>
                <p>{generalInfo?.[`consent-${consent?.id}`]}</p>

                {generalInfo?.[`consent-${consent?.id}-parentname`] && (
                  <p>
                    {t("participantInfo.parentName", "Parent name:")}{" "}
                    {generalInfo?.[`consent-${consent?.id}-parentname`]}
                  </p>
                )}

                {generalInfo?.[`consent-${consent?.id}-parentemail`] && (
                  <p>
                    {t("participantInfo.parentEmail", "Parent email:")}{" "}
                    {generalInfo?.[`consent-${consent?.id}-parentemail`]}
                  </p>
                )}

                {generalInfo?.[`consent-${consent?.id}-kidname`] && (
                  <p>
                    {t("participantInfo.kidName", "Your name:")}{" "}
                    {generalInfo?.[`consent-${consent?.id}-kidname`]}
                  </p>
                )}
              </div>
            );
          })}
        </>
      )}

      {condition && (
        <div className="infoItem">
          <p>
            {t(
              "participantInfo.betweenSubjectCondition",
              "Between-subject condition"
            )}
          </p>
          <p>{condition}</p>
        </div>
      )}
    </div>
  );
}
