import ReactHtmlParser from "react-html-parser";
import useTranslation from "next-translate/useTranslation";

const getConsent = (consent, name) =>
  consent?.info?.filter((info) => info.name === name).map((info) => info.text) ||
  "";

const isUnder18 = (age) => {
  if (!age && age !== 0) return false;
  const ageNum = typeof age === "string" ? parseInt(age, 10) : Number(age);
  return !isNaN(ageNum) && ageNum < 18;
};

export default function ConsentForm({
  consent,
  userInfo,
  inputs,
  handleChange,
}) {
  const { t } = useTranslation("common");
  const publicStudies = consent?.studies?.filter((study) => study.public) || [];

  const regularAdultsConsent = getConsent(consent, "regularAdults");
  const sonaAdultsConsent = getConsent(consent, "sonaAdults");
  const regularMinorsConsent = getConsent(consent, "regularMinors");
  const sonaMinorsConsent = getConsent(consent, "sonaMinors");
  const regularMinorsKidsConsent = getConsent(consent, "regularMinorsKids");
  const sonaMinorsKidsConsent = getConsent(consent, "sonaMinorsKids");
  const studentsNYCConsent = getConsent(consent, "studentsNYC");
  const studentsMinorsNYCConsent = getConsent(consent, "studentsMinorsNYC");
  const studentsParentsNYCConsent = getConsent(consent, "studentsParentsNYC");
  const anyoneConsent = getConsent(consent, "anyone");

  const handleMinorConsentChange = ({ target }) => {
    const { name, value } = target;
    handleChange({
      target: {
        name: `consent-${consent?.id}-${name}`,
        value,
      },
    });
  };

  let consentContent = [];

  if (anyoneConsent && anyoneConsent.length) {
    consentContent = anyoneConsent;
  } else if (isUnder18(userInfo?.age)) {
    if (
      userInfo.sona === "yes" &&
      sonaMinorsConsent.length &&
      sonaMinorsKidsConsent.length
    ) {
      consentContent = [sonaMinorsConsent, sonaMinorsKidsConsent];
    } else if (
      userInfo.studentNYC === "yes" &&
      studentsParentsNYCConsent.length &&
      studentsMinorsNYCConsent.length
    ) {
      consentContent = [studentsParentsNYCConsent, studentsMinorsNYCConsent];
    } else {
      consentContent = [regularMinorsConsent, regularMinorsKidsConsent];
    }
  } else {
    if (userInfo.sona === "yes" && sonaAdultsConsent.length) {
      consentContent = [sonaAdultsConsent];
    } else if (userInfo.studentNYC === "yes" && studentsNYCConsent.length) {
      consentContent = [studentsNYCConsent];
    } else {
      consentContent = [regularAdultsConsent];
    }
  }

  return (
    <div>
      <div className="consentContent">
        {consentContent.map((text, index) => (
          <div key={index}>{ReactHtmlParser(text)}</div>
        ))}
      </div>

      <div className="consentInfo">
        <div>
          <p>
            {t(
              "consent.form.studyInfo",
              {
                organization: consent?.organization,
                title: consent?.title,
              },
              {
                default:
                  "This study is part of the {{organization}} research protocol {{title}}.",
              },
            )}
          </p>

          {publicStudies?.length ? (
            <div>
              <p>
                {t("consent.form.coveredStudiesDesc", {}, {
                  default:
                    "Tasks and surveys associated with the following studies are covered under this protocol",
                })}
              </p>
              <ul className="coveredStudiesAndTasks">
                {publicStudies.map((study) => (
                  <li key={study.id}>{study.title}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {isUnder18(userInfo?.age) && (
        <>
          <div>
            <label htmlFor="parentname">
              <p className="questionTitle">
                {t("consent.form.parentName", {}, { default: "Parent name" })}
              </p>
              <input
                type="text"
                id="parentname"
                name="parentname"
                value={inputs[`consent-${consent?.id}-parentname`]}
                onChange={handleMinorConsentChange}
              />
            </label>
          </div>

          <div>
            <label htmlFor="parentemail">
              <p className="questionTitle">
                {t("consent.form.parentEmail", {}, {
                  default: "Parent email address",
                })}
              </p>
              <input
                type="email"
                id="parentemail"
                name="parentemail"
                value={inputs[`consent-${consent?.id}-parentemail`]}
                onChange={handleMinorConsentChange}
              />
            </label>
          </div>

          <div>
            <label htmlFor="kidname">
              <p className="questionTitle">
                {t("consent.form.kidName", {}, { default: "Your name" })}
              </p>
              <input
                type="text"
                id="kidname"
                name="kidname"
                value={inputs[`consent-${consent?.id}-kidname`]}
                onChange={handleMinorConsentChange}
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
