import useTranslation from "next-translate/useTranslation";

import ShareStudy from "./Share";
import Parameters from "./Parameters";

export default function Settings({
  user,
  study,
  handleChange,
  handleMultipleUpdate,
  isLocked,
}) {
  const { t } = useTranslation("builder");
  return (
    <aside className="settings">
      <div className="settingsPanelHeader">
        <h1>
          {t("participantPageMain.settingsTitle", {}, {
            default: "Participant page settings",
          })}
        </h1>
      </div>
      {/* Disabling the fieldset makes every control below read-only at once */}
      <fieldset className="studySettings" disabled={isLocked}>
        <section className="settingsCard">
          <ShareStudy study={study} handleChange={handleChange} />
        </section>
        <section className="settingsCard">
          <Parameters
            user={user}
            study={study}
            handleChange={handleChange}
            handleMultipleUpdate={handleMultipleUpdate}
            isLocked={isLocked}
          />
        </section>
      </fieldset>
    </aside>
  );
}
