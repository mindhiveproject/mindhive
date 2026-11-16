import Collaborators from "../../Global/Collaborators";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import { ShareIcon } from "../../DesignSystem/Icons";

/**
 * The builder's sharing tab: giving people in your classes their own copy
 * (`onShareCopy`, when you may share this task) and, separately, the
 * collaborators who edit this same task with you.
 */
export default function Sharing({ task, handleChange, onShareCopy }) {
  const { t } = useTranslation("builder");
  const collaborators = (task && task?.collaborators?.map((c) => c?.id)) || [];
  const taskType = task?.taskType?.toLowerCase();

  return (
    <fieldset>
      {onShareCopy && (
        <div className="block">
          <label>
            {t("shareCopy.tabHeading", {}, {
              default: "Give someone their own copy",
            })}
          </label>
          <p>
            {t("shareCopy.tabDescription", { taskType }, {
              default:
                "Share a copy with your class, or with people in it. Each person gets an independent copy to edit; nobody can change yours. Use this to hand out work, not the collaborators below.",
            })}
          </p>
          <div>
            <Button
              variant="outline"
              type="button"
              onClick={onShareCopy}
              leadingIcon={<ShareIcon aria-hidden />}
            >
              {t("shareCopy.open", {}, { default: "Share a copy" })}
            </Button>
          </div>
        </div>
      )}
      <div className="block">
        <label>{t("sharing.collaboratorsOn", { taskType }, "Collaborators on the {{taskType}}")}</label>
        <p>
          {t("sharing.collaboratorsHint", { taskType }, {
            default:
              "Collaborators edit this same {{taskType}} with you, and every change reaches everyone. To give a student something to work on, share a copy instead.",
          })}
        </p>
        <Collaborators
          collaborators={collaborators}
          handleChange={handleChange}
        />
      </div>
    </fieldset>
  );
}
