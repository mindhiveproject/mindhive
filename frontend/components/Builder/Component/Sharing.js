import Collaborators from "../../Global/Collaborators";
import useTranslation from "next-translate/useTranslation";

export default function Sharing({ task, handleChange }) {
  const { t } = useTranslation("builder");
  const collaborators = (task && task?.collaborators?.map((c) => c?.id)) || [];

  return (
    <fieldset>
      <div className="block">
        <label>{t("sharing.collaboratorsOn", { taskType: task?.taskType?.toLowerCase() }, "Collaborators on the {{taskType}}")}</label>
        <Collaborators
          collaborators={collaborators}
          handleChange={handleChange}
        />
      </div>
    </fieldset>
  );
}
