import ReactHtmlParser from 'react-html-parser';

const getConsent = (consent, name) =>
    consent?.info.filter(info => info.name === name).map(info => info.text) ||
    '';

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
    handleChange 
}) {

    const publicStudies = consent?.studies.filter(study => study.public) || [];

    const regularAdultsConsent = getConsent(consent, 'regularAdults');
    const sonaAdultsConsent = getConsent(consent, 'sonaAdults');
    const regularMinorsConsent = getConsent(consent, 'regularMinors');
    const sonaMinorsConsent = getConsent(consent, 'sonaMinors');
    const regularMinorsKidsConsent = getConsent(
      consent,
      'regularMinorsKids'
    );
    const sonaMinorsKidsConsent = getConsent(consent, 'sonaMinorsKids');
    const studentsNYCConsent = getConsent(consent, 'studentsNYC');
    const studentsMinorsNYCConsent = getConsent(
      consent,
      'studentsMinorsNYC'
    );
    const studentsParentsNYCConsent = getConsent(
      consent,
      'studentsParentsNYC'
    );

    const handleMinorConsentChange = ({ target }) => {
        const { name, value } = target;
        console.log({ name, value });
        handleChange({ 
            target: {
                name: `consent-${consent?.id}-${name}`,
                value, 
            }
        })
    }

    return (
        <div>

            {isUnder18(userInfo?.bd) && (
                <>
                    {(userInfo.sona === 'no' ||
                    typeof userInfo.sona === 'undefined' ||
                    !sonaMinorsConsent.length ||
                    !sonaMinorsKidsConsent.length) &&
                    (userInfo.studentNYC === 'no' ||
                        typeof userInfo.studentNYC === 'undefined' ||
                        !studentsParentsNYCConsent.length ||
                        !studentsMinorsNYCConsent.length) && (
                        <>
                        <div>{ReactHtmlParser(regularMinorsConsent)}</div>
                        <div>{ReactHtmlParser(regularMinorsKidsConsent)}</div>
                        </>
                    )}

                    {userInfo.sona === 'yes' &&
                    sonaMinorsConsent &&
                    sonaMinorsKidsConsent && (
                        <>
                        <div>{ReactHtmlParser(sonaMinorsConsent)}</div>
                        <div>{ReactHtmlParser(sonaMinorsKidsConsent)}</div>
                        </>
                    )}

                    {userInfo?.studentNYC === 'yes' &&
                    studentsParentsNYCConsent &&
                    studentsMinorsNYCConsent && (
                        <>
                        <div>{ReactHtmlParser(studentsParentsNYCConsent)}</div>
                        <div>{ReactHtmlParser(studentsMinorsNYCConsent)}</div>
                        </>
                    )}
                </>
                )}

                {!isUnder18(userInfo?.bd) && (
                    <>
                        {( userInfo.sona === 'no' ||
                        userInfo.sona === '' ||
                        typeof userInfo.sona === 'undefined' ||
                        !sonaAdultsConsent.length) &&
                        (userInfo.studentNYC === 'no' ||
                            typeof userInfo.studentNYC === 'undefined' ||
                            !studentsNYCConsent.length) && (
                            <div>{ ReactHtmlParser(regularAdultsConsent) }</div>
                        )}

                        {userInfo.sona === 'yes' && sonaAdultsConsent && (
                        <div>{ ReactHtmlParser(sonaAdultsConsent) }</div>
                        )}

                        {userInfo?.studentNYC === 'yes' && studentsNYCConsent && (
                        <div>{ ReactHtmlParser(studentsNYCConsent) }</div>
                        )}
                    </>
                )}

        
          <div className="consentInfo">
            <div>
              <p>
                This study is part of the{' '}
                <strong>{consent?.organization}</strong> research protocol{' '}
                <strong>{consent?.title}</strong>.
              </p>

              {publicStudies?.length ? (
                <div>
                  <p>
                    Tasks and surveys associated with the following studies are
                    covered under this protocol
                  </p>

                  <div className="coveredStudiesAndTasks">
                    {publicStudies.map(study => (
                      <li key={study.id}>{study.title}</li>
                    ))}
                  </div>
                </div>
              ) : (
                <div></div>
              )}
            </div>
          </div>

          {isUnder18(userInfo?.bd) && (
              <>
                <div>
                  <label htmlFor="parentname">
                    <p>Parent name</p>
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
                    <p>Parent email address</p>
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
                    <p>Your name</p>
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
    )

}