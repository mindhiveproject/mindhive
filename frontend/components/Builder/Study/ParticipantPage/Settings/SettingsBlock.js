import { Radio } from "semantic-ui-react";

import ConsentSelector from "./ConsentSelector";

export default function SettingBlock({
  user,
  study,
  handleChange,
  handleSettingsChange,
  name,
  value,
  isReverse,
  hasIRBAccess,
}) {
  return (
    <div className="card">
      <div className="settingsBlock">
        <div className="description">
          {name === "hideParticipateButton" && (
            <label className="name" htmlFor={name}>
              <h4>Accept participants</h4>
              <p>
                Shows the “Participate” button on the study page visitors and
                allows visitors to participate in your study
              </p>
            </label>
          )}

          {name === "guestParticipation" && (
            <label className="name" htmlFor={name}>
              <h4>Allow guest participation</h4>
              <p>
                Visitors won’t need MindHive accounts to participate in your
                study.
              </p>
            </label>
          )}

          {name === "consentObtained" && (
            <>
              <label className="name" htmlFor={name}>
                <h4>Ask for participant’s consent</h4>
                <p>
                  Visitors will be shown IRB forms and will be asked to consent
                  prior to participation
                </p>
              </label>
              {value && (
                <div className="consentArea">
                  {hasIRBAccess ? (
                    <div>
                      <ConsentSelector
                        user={user}
                        study={study}
                        handleChange={handleChange}
                      />
                    </div>
                  ) : (
                    <div>
                      <p>
                        Only teachers, scientists, and administrators can add or
                        edit IRB forms.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {name === "zipCode" && (
            <label className="name" htmlFor={name}>
              <h4>Ask for participant’s zip code</h4>
              <p>
                Visitors will be asked to type in their zip code when joining
                the study
              </p>
            </label>
          )}

          {name === "proceedToFirstTask" && (
            <label className="name" htmlFor={name}>
              <h4>Automatically launch study</h4>
              <p>
                Participants will be automatically taken to the first task after
                joining the study
              </p>
            </label>
          )}

          {name === "forbidRetake" && (
            <label className="name" htmlFor={name}>
              <h4>Allow multiple retakes</h4>
              <p>
                Allow participants to retake tasks or surveys multiple times
              </p>
            </label>
          )}
        </div>
        <div className="input">
          <Radio
            toggle
            label={value !== isReverse ? "On" : "Off"}
            checked={isReverse ? !value : value}
            onChange={() => handleSettingsChange({ target: { name } })}
          />
        </div>
      </div>
    </div>
  );
}
