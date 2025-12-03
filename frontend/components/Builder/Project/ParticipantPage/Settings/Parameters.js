import SettingsBlock from "./SettingsBlock";
import useTranslation from "next-translate/useTranslation";

export default function Parameters({
  user,
  study,
  handleChange,
  handleMultipleUpdate,
}) {
  const { t } = useTranslation("builder");

  const settings = study.settings || {
    forbidRetake: true,
    hideParticipateButton: false,
    showEmailNotificationPropmt: false,
    askStudentsNYC: false,
    zipCode: false,
    guestParticipation: true,
    consentObtained: false,
    proceedToFirstTask: false,
    useExternalDevices: false,
    sonaId: false,
    minorsBlocked: false,
  };

  // settings that are shown only to students
  const settingsOnlyStudents = [
    "hideParticipateButton",
    "guestParticipation",
    "consentObtained",
    "proceedToFirstTask",
    "forbidRetake",
  ];

  // scales that should be reversed because of the naming and description
  const reverseScales = ["hideParticipateButton", "forbidRetake"];

  const handleSettingsChange = (e) => {
    const { name } = e.target;
    settings[name] = !settings[name];
    handleMultipleUpdate({ settings, unsavedChanges: true });
  };

  const hasIRBAccess =
    user &&
    user?.permissions &&
    (user.permissions.map((p) => p.name).includes("TEACHER") ||
      user.permissions.map((p) => p.name).includes("SCIENTIST") ||
      user.permissions.map((p) => p.name).includes("ADMIN") ||
      user.permissions.map((p) => p.name).includes("STUDENT"));

  const isStudent =
    user &&
    user?.permissions &&
    user.permissions.map((p) => p.name).includes("STUDENT");

  return (
    <div>
      <h2>{t('parameters.participationSettings')}</h2>

      <div>
        {Object.keys(settings)
          .filter((name) => !isStudent || settingsOnlyStudents.includes(name))
          .map((name, i) => (
            <SettingsBlock
              key={i}
              study={study}
              handleChange={handleChange}
              handleSettingsChange={handleSettingsChange}
              name={name}
              value={settings?.[name]}
              isReverse={reverseScales.includes(name)}
              hasIRBAccess={hasIRBAccess}
            />
          ))}
      </div>
    </div>
  );
}
