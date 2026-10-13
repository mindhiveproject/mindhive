import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import { DownloadIcon } from "../../DesignSystem/Icons";
import exportTaskDescriptions from "./exportTaskDescriptions";

// "Tasks and Surveys descriptions" for signed-in users only. Exports every
// task the user can see in the task bank (lib/taskBankFilter), regardless of
// the chips or search on screen, so a teacher's class filter will narrow the
// PDF the same way it narrows the discover page.
export default function TaskDescriptionsExport({ user, tasks }) {
  const { t } = useTranslation("home");
  const { t: tBuilder } = useTranslation("builder");
  const { locale } = useRouter();

  if (!user) return null;

  return (
    <Button
      variant="subtle"
      leadingIcon={<DownloadIcon />}
      disabled={!tasks?.length}
      onClick={() => exportTaskDescriptions({ tasks, locale, t, tBuilder })}
    >
      {t("tasksAndSurveysDescriptions")}
    </Button>
  );
}
