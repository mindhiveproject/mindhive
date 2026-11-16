import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import MessageCard from "../../../../DesignSystem/MessageCard";
import ToggleSwitch from "../../../../DesignSystem/ToggleSwitch";
import SubmitStudyDialog from "../../../shared/studyDataCollection/SubmitStudyDialog";
import DataCollectionHistory from "../../../shared/studyDataCollection/DataCollectionHistory";
import {
  otherPeople,
  useStudyDataCollection,
} from "../../../shared/studyDataCollection/useStudyDataCollection";
import {
  legacyStatusLabel,
  stageLabel,
} from "../../../shared/studyDataCollection/labels";
import { studyLifecycle } from "../../../../../lib/studyLifecycle";

const STAGE_TONE = { DESIGNING: "neutral", COLLECTING: "success", FINISHED: "info" };
const STAGES = ["DESIGNING", "COLLECTING", "FINISHED"];

// The study builder's Study status card (styles: .settingsSection & co. in
// styles/StyledBuilder.js).
// - Supervised (a class data-collection milestone through a linked board):
//   the milestone sets the status. Students submit (confirming with everyone
//   sharing the study), finish and open/close participation; teachers and
//   the teaching team set any stage. Everything goes through
//   setStudyDataCollection, which updates every linked board and logs who
//   did it and when.
// - Self-managed: the status is the students' own label, never locks the
//   study, and no teacher follows it.
export default function StudyStatus({ study, user }) {
  const { t } = useTranslation("builder");
  const { state, saving, run } = useStudyDataCollection(study?.id);
  const [dialogMode, setDialogMode] = useState(null);

  const header = (
    <div className="settingsSectionHeader">
      <h2>{t("status.title", {}, { default: "Study status" })}</h2>
    </div>
  );

  if (!study?.id) {
    return (
      <div className="settingsSection" id="studyStatus">
        {header}
        <p className="settingsSectionNote">
          {t("dataCollection.saveFirst", {}, {
            default: "Save your study to set its status.",
          })}
        </p>
      </div>
    );
  }

  const life = studyLifecycle(study, { supervised: !!state?.supervised });
  const stage = state?.stage || life.stage;
  const open = state ? state.open : life.open;
  const milestoneMode = !!state && (state.supervised || state.locked);
  // Submitted or finished, but nothing supervises it any more (its board was
  // unlinked or its class stopped following data collection): still locked
  // until a teacher reopens it.
  const orphaned = !!state && state.locked && !state.supervised;
  const canEdit = !!state?.canEdit;
  const canManage = !!state?.canManage;
  const others = otherPeople(state, user?.id);
  const supervisingBoards = (state?.boards || []).filter((b) => b.supervising);
  // A class follows the milestone through a project board, or itself (its
  // Studies-tab milestone card, no board needed).
  const supervisingClasses = (state?.classes || []).filter((c) => c.supervising);
  const classTitles = [
    ...new Set(
      [
        ...supervisingBoards.map((b) => b.classTitle),
        ...supervisingClasses.map((c) => c.title),
      ].filter(Boolean)
    ),
  ];
  const stageOptions = STAGES.map((value) => ({
    value,
    label: stageLabel(t, value),
  }));
  const stageAria = t("status.title", {}, { default: "Study status" });

  const confirmDialog = async (acknowledgedProfileIds) => {
    const done = await run(dialogMode, {
      acknowledgedProfileIds,
      confirmed: true,
    });
    if (done) setDialogMode(null);
  };

  // A teacher picks any stage; each move maps to one action. Confirmations
  // use the design-system dialog: native confirm() is blocked in some
  // browsers (and embedded views), which silently cancelled the reopen.
  const teacherSetStage = async (next) => {
    if (next === stage) return;
    if (next === "DESIGNING") {
      setDialogMode("REOPEN");
      return;
    }
    if (next === "COLLECTING") {
      if (stage === "FINISHED") await run("RESUME");
      else setDialogMode("SUBMIT");
      return;
    }
    setDialogMode("FINISH");
  };

  const showParticipation =
    canEdit && (!milestoneMode || stage === "COLLECTING");

  let stageControl;
  if (!milestoneMode && canEdit) {
    stageControl = (
      <DropdownSelect
        value={stage}
        onChange={(next) => run("SET_LABEL", { stage: next })}
        options={stageOptions}
        disabled={saving}
        ariaLabel={stageAria}
      />
    );
  } else if (milestoneMode && canManage) {
    stageControl = (
      <DropdownSelect
        value={stage}
        onChange={teacherSetStage}
        options={stageOptions}
        disabled={saving}
        ariaLabel={stageAria}
      />
    );
  } else {
    stageControl = (
      <div>
        <Chip
          variant="static"
          tone={STAGE_TONE[stage]}
          label={
            stage === "COLLECTING"
              ? `${stageLabel(t, stage)} · ${
                  open
                    ? t("dataCollection.open", {}, { default: "Open" })
                    : t("dataCollection.paused", {}, { default: "Paused" })
                }`
              : stageLabel(t, stage)
          }
        />
      </div>
    );
  }

  let lockNotice = null;
  if (milestoneMode && stage !== "DESIGNING") {
    lockNotice = canManage
      ? supervisingBoards.length
        ? t("dataCollection.teacherLockedHint", {}, {
            default:
              "Changes you make here update the milestone on every linked board.",
          })
        : t("dataCollection.teacherLockedHintClass", {}, {
            default:
              "The study is locked for its students. Changes you make here are recorded in its activity.",
          })
      : stage === "FINISHED"
      ? t("dataCollection.finishedHint", {}, {
          default:
            "Participation is closed. Only your teacher can resume data collection.",
        })
      : t("dataCollection.lockedHint", {}, {
          default:
            "This study is locked for everyone who shares it. Only your teacher can reopen it for editing.",
        });
  }

  return (
    <div className="settingsSection" id="studyStatus">
      {header}

      {state ? (
        <div className="settingsField">
          <p className="settingsFieldLabel">
            {orphaned
              ? t("dataCollection.noLongerSupervised", {}, {
                  default: "No longer supervised",
                })
              : milestoneMode
              ? classTitles.length
                ? t("dataCollection.supervisedBy", { classes: classTitles.join(", ") }, {
                    default: "Supervised by {{classes}}",
                  })
                : t("dataCollection.supervised", {}, {
                    default: "Supervised by a class",
                  })
              : t("dataCollection.selfManaged", {}, { default: "Self-managed" })}
          </p>
          <p className="settingsSectionNote">
            {orphaned
              ? t("dataCollection.noLongerSupervisedHint", {}, {
                  default:
                    "Locked from an earlier submission. No class milestone follows this study now. A teacher can reopen it, which makes it self-managed.",
                })
              : milestoneMode && !supervisingBoards.length
              ? t("dataCollection.supervisedByClassHint", {}, {
                  default:
                    "Your class follows data collection: submit this study when it is ready. Your teacher follows it.",
                })
              : milestoneMode
              ? t("dataCollection.supervisedHint", {
                  boards: supervisingBoards
                    .map((b) => b.title)
                    .filter(Boolean)
                    .join(", "),
                }, {
                  default:
                    "The data-collection milestone of your project board ({{boards}}) sets this status. Your teacher follows it.",
                })
              : t("dataCollection.selfManagedHint", {}, {
                  default:
                    "No class milestone follows this study. The status below is a label for you and your collaborators: no teacher reviews it, and it never locks your study.",
                })}
          </p>
        </div>
      ) : null}

      {stageControl}

      {life.legacyStatus ? (
        <p className="settingsSectionNote">
          {t("dataCollection.previously", {
            label: legacyStatusLabel(t, life.legacyStatus),
          }, { default: "Previously: {{label}}" })}
        </p>
      ) : null}

      {milestoneMode && stage === "DESIGNING" && !canManage ? (
        <>
          <p className="settingsSectionNote">
            {t("dataCollection.designingHint", {}, {
              default:
                "When your study is ready, submit it for data collection. It is then locked, and only your teacher can reopen it.",
            })}
          </p>
          {canEdit ? (
            <div>
              <Button
                variant="filled"
                disabled={saving}
                onClick={() => setDialogMode("SUBMIT")}
              >
                {t("dataCollection.submit", {}, {
                  default: "Submit for data collection",
                })}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      {lockNotice ? (
        <MessageCard
          variant={canManage ? "information" : "warning"}
          message={lockNotice}
        />
      ) : null}

      {showParticipation ? (
        <ToggleSwitch
          checked={open}
          onChange={(next) => run("SET_PARTICIPATION", { open: next })}
          loading={saving}
          label={
            open
              ? t("dataCollection.participationOpen", {}, {
                  default: "Participation open",
                })
              : t("dataCollection.participationClosed", {}, {
                  default: "Participation closed",
                })
          }
        />
      ) : null}

      {milestoneMode && stage === "COLLECTING" && canEdit && !canManage ? (
        <div>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => setDialogMode("FINISH")}
          >
            {t("dataCollection.markFinished", {}, {
              default: "Mark data collection as finished",
            })}
          </Button>
        </div>
      ) : null}

      {others.length ? (
        <p className="settingsSectionNote">
          {t("dataCollection.sharedWith", {
            people: others.map((p) => p.username).join(", "),
          }, {
            default:
              "Shared with {{people}}. Submitting or finishing applies to all of you.",
          })}
        </p>
      ) : null}

      <DataCollectionHistory history={state?.history} />

      <SubmitStudyDialog
        open={!!dialogMode}
        mode={dialogMode || "SUBMIT"}
        studyTitle={study?.title}
        state={state}
        userId={user?.id}
        saving={saving}
        onCancel={() => setDialogMode(null)}
        onConfirm={confirmDialog}
      />
    </div>
  );
}
