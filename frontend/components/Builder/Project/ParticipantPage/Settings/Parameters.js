import SettingsBlock from "./SettingsBlock";

export default function Parameters({
  user,
  study,
  handleChange,
  handleMultipleUpdate,
}) {
  const settings = study.settings || {
    forbidRetake: true,
    hideParticipateButton: false,
    showEmailNotificationPropmt: false,
    askStudentsNYC: false,
    zipCode: false,
    guestParticipation: true,
    consentObtained: false,
    proceedToFirstTask: true,
    useExternalDevices: false,
    sonaId: false,
    minorsBlocked: false,
  };

  // settings that are shown only to students
  const settingsOnlyStudents = [
    "hideParticipateButton",
    "guestParticipation",
    // "consentObtained",
    // "zipCode",
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
      user.permissions.map((p) => p.name).includes("ADMIN"));

  const isStudent =
    user &&
    user?.permissions &&
    user.permissions.map((p) => p.name).includes("STUDENT");

  return (
    <div>
      <h2>Participation settings</h2>

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
