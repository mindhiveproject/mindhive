import ConsentSelector from "./ConsentSelector";
import useTranslation from "next-translate/useTranslation";

import ToggleSwitch from "../../../../DesignSystem/ToggleSwitch";

// settings name -> settingsBlock translation key (title; `${key}Desc` is the description)
const SETTING_KEYS = {
  hideParticipateButton: "acceptParticipants",
  guestParticipation: "allowGuestParticipation",
  consentObtained: "askForConsent",
  zipCode: "askForZip",
  proceedToFirstTask: "autoLaunch",
  forbidRetake: "allowMultipleRetakes",
  showEmailNotificationPropmt: "emailNotifications",
  askStudentsNYC: "nycStudents",
  sonaId: "askForSonaId",
  minorsBlocked: "onlyOver18",
  useExternalDevices: "connectExternalDevices",
};

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
  const key = SETTING_KEYS[name];
  if (!key) return null;

  const title = t(`settingsBlock.${key}`);
  const checked = isReverse ? !value : value;

  return (
    <div className="settingsRow">
      <div className="settingsRowMain">
        <label className="settingsRowText" htmlFor={`setting-${name}`}>
          <span className="settingsRowTitle">{title}</span>
          <span className="settingsRowDesc">
            {t(`settingsBlock.${key}Desc`)}
          </span>
        </label>
        <ToggleSwitch
          id={`setting-${name}`}
          aria-label={title}
          checked={!!checked}
          onChange={() => handleSettingsChange({ target: { name } })}
        />
      </div>

      {name === "consentObtained" && value && (
        <div className="consentArea">
          {hasIRBAccess ? (
            <ConsentSelector
              user={user}
              study={study}
              handleChange={handleChange}
            />
          ) : (
            <p className="settingsSectionNote">
              {t("settingsBlock.onlyTeachersCanEditIRB")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
