import { Radio } from "semantic-ui-react";
import ConsentSelector from "./ConsentSelector";
import useTranslation from "next-translate/useTranslation";

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
  const { t } = useTranslation("builder");
  return (
    <div className="card">
      <div className="settingsBlock">
        <div className="description">
          {name === "hideParticipateButton" && (
            <label className="name" htmlFor={name}>
              <h4>{t('settingsBlock.acceptParticipants')}</h4>
              <p>{t('settingsBlock.acceptParticipantsDesc')}</p>
            </label>
          )}

          {name === "guestParticipation" && (
            <label className="name" htmlFor={name}>
              <h4>{t('settingsBlock.allowGuestParticipation')}</h4>
              <p>{t('settingsBlock.allowGuestParticipationDesc')}</p>
            </label>
          )}

          {name === "consentObtained" && (
            <>
              <label className="name" htmlFor={name}>
                <h4>{t('settingsBlock.askForConsent')}</h4>
                <p>{t('settingsBlock.askForConsentDesc')}</p>
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
                      <p>{t('settingsBlock.onlyTeachersCanEditIRB')}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {name === "zipCode" && (
            <label className="name" htmlFor={name}>
              <h4>{t('settingsBlock.askForZip')}</h4>
              <p>{t('settingsBlock.askForZipDesc')}</p>
            </label>
          )}

          {name === "proceedToFirstTask" && (
            <label className="name" htmlFor={name}>
              <h4>{t('settingsBlock.autoLaunch')}</h4>
              <p>{t('settingsBlock.autoLaunchDesc')}</p>
            </label>
          )}

          {name === "forbidRetake" && (
            <label className="name" htmlFor={name}>
              <h4>{t('settingsBlock.allowMultipleRetakes')}</h4>
              <p>{t('settingsBlock.allowMultipleRetakesDesc')}</p>
            </label>
          )}

          {name === "showEmailNotificationPropmt" && (
            <label className="name" htmlFor={name}>
              <h4>{t('settingsBlock.emailNotifications')}</h4>
              <p>{t('settingsBlock.emailNotificationsDesc')}</p>
            </label>
          )}

          {name === "askStudentsNYC" && (
            <label className="name" htmlFor={name}>
              <h4>{t('settingsBlock.nycStudents')}</h4>
              <p>{t('settingsBlock.nycStudentsDesc')}</p>
            </label>
          )}

          {name === "sonaId" && (
            <label className="name" htmlFor={name}>
              <h4>{t('settingsBlock.askForSonaId')}</h4>
              <p>{t('settingsBlock.askForSonaIdDesc')}</p>
            </label>
          )}

          {name === "minorsBlocked" && (
            <label className="name" htmlFor={name}>
              <h4>{t('settingsBlock.onlyOver18')}</h4>
              <p>{t('settingsBlock.onlyOver18Desc')}</p>
            </label>
          )}

          {name === "useExternalDevices" && (
            <label className="name" htmlFor={name}>
              <h4>{t('settingsBlock.connectExternalDevices')}</h4>
              <p>{t('settingsBlock.connectExternalDevicesDesc')}</p>
            </label>
          )}
        </div>
        <div className="input">
          <Radio
            toggle
            label={value !== isReverse ? t('settingsBlock.on') : t('settingsBlock.off')}
            checked={isReverse ? !value : value}
            onChange={() => handleSettingsChange({ target: { name } })}
          />
        </div>
      </div>
    </div>
  );
}
