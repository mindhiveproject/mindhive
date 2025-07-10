import ReactHtmlParser from "react-html-parser";
import useTranslation from "next-translate/useTranslation";

const getConsent = (consent, name) =>
  consent?.info.filter((info) => info.name === name).map((info) => info.text) || "";

// to check whether a participant is under 18 based on the birthday
const isUnder18 = (birthdayTimestamp) => {
  const ageInMilliseconds = Date.now() - birthdayTimestamp;
  const millisecondsInYear = 1000 * 60 * 60 * 24 * 365.2425;
  return ageInMilliseconds / millisecondsInYear < 18;
};

export default function ConsentForm({
  consent,
  settings,
  userInfo,
  inputs,
  handleChange,
}) {
  const { t } = useTranslation('common');
  const publicStudies = consent?.studies.filter((study) => study.public) || [];

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

  // Determine which consent content to display
  let consentContent = [];

  if (anyoneConsent && anyoneConsent.length) {
    // If an "anyone" consent exists, use it regardless of age
    consentContent = anyoneConsent;
  } else if (isUnder18(userInfo?.bd)) {
    // For participants under 18, choose based on other criteria:
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
    // For participants 18 or older, choose based on other criteria:
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
      {/* Consent Text Section */}
      <div>
        {consentContent.map((text, index) => (
          <div key={index}>{ReactHtmlParser(text)}</div>
        ))}
      </div>

      {/* Study & Protocol Information */}
      <div className="consentInfo">
        <div>
          <p>
            {t('consent.form.studyInfo', {
              organization: consent?.organization,
              title: consent?.title,
            })}
          </p>

          {publicStudies?.length ? (
            <div>
              <p>{t('consent.form.coveredStudiesDesc')}</p>
              <div className="coveredStudiesAndTasks">
                {publicStudies.map((study) => (
                  <li key={study.id}>{study.title}</li>
                ))}
              </div>
            </div>
          ) : (
            <div></div>
          )}
        </div>
      </div>

      {/* Additional fields for participants under 18 */}
      {isUnder18(userInfo?.bd) && (
        <>
          <div>
            <label htmlFor="parentname">
              <p>{t('consent.form.parentName')}</p>
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
              <p>{t('consent.form.parentEmail')}</p>
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
              <p>{t('consent.form.kidName')}</p>
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
