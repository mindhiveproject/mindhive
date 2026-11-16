import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Card from "../../../../DesignSystem/Card";
import Chip from "../../../../DesignSystem/Chip";
import ToggleSwitch from "../../../../DesignSystem/ToggleSwitch";
import Modal from "../../../../DesignSystem/Modal";
import Button from "../../../../DesignSystem/Button";
import MessageCard from "../../../../DesignSystem/MessageCard";
import IconButton from "../../../../DesignSystem/IconButton";
import { CloseIcon } from "../../../../DesignSystem/Icons";
import { readClassTableOption, writeClassTableOption } from "../classPagePrefs";

// Whether the teacher hid the card from the Studies tab (its ✕), per class.
// The Settings section's "Show this card" switch writes the same preference.
export const MILESTONE_CARD_DISMISSED = "milestoneCardDismissed";

export function readMilestoneCardDismissed(classId) {
  return readClassTableOption(classId, "studies", MILESTONE_CARD_DISMISSED) === true;
}

export function writeMilestoneCardDismissed(classId, dismissed) {
  writeClassTableOption(classId, "studies", MILESTONE_CARD_DISMISSED, !!dismissed);
}
import {
  CLASS_DATA_COLLECTION,
  SET_CLASS_DATA_COLLECTION,
} from "../../../../Queries/Classes";
import { DATA_COLLECTION_REFETCH } from "../../../../Builder/shared/studyDataCollection/useStudyDataCollection";

const StyledMilestoneCard = styled(Card)`
  /* Card pads its inner content div; the card's rows stack inside it. */
  .DesignSystem-Card-content {
    display: grid;
    gap: 12px;
    align-content: start;
  }

  .milestoneCardHeader {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .milestoneCardActions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .milestoneCardTitle {
    margin: 0;
    font: var(--MH-Type-Title-Small);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }

  .milestoneCardText {
    margin: 0;
    font: var(--MH-Type-Body-Small);
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  .milestoneCardChips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
`;

const StyledDialogBody = styled.div`
  display: grid;
  gap: 16px;

  p {
    margin: 0;
    font: var(--MH-Type-Body-Base);
  }

  .dialogImpact {
    display: grid;
    gap: 8px;
    margin: 0;
    padding-left: 20px;
    font: var(--MH-Type-Body-Base);
  }
`;

const STAGES = ["DESIGNING", "COLLECTING", "FINISHED"];

/**
 * The class's own data-collection milestone (Studies tab, next to New study
 * and the search). Turning it on supervises every study of the class like a
 * board milestone does, with no project board template; a template board
 * that carries the milestone supervises them too, and both sources are
 * interchangeable (keystone/lib/studyDataCollection.js). The stage chips
 * count the studies and filter the table.
 *
 * `placement`: "studies" (the card, with stage chips; `onDismiss` hides it
 * from the Studies tab) or "settings" (the class Settings tab section, always
 * available, so a teacher who dismissed the card keeps the same control).
 * `counts`: studies per stage. `stageFilter` / `onStageFilter`: the table's
 * stage filter (null shows every study).
 */
export default function DataCollectionMilestoneCard({
  myclass,
  placement = "studies",
  onDismiss,
  counts,
  stageFilter,
  onStageFilter,
}) {
  const { t } = useTranslation("classes");
  const [confirming, setConfirming] = useState(null);
  // Settings only: is the card shown in the Studies tab? Read after mount
  // (cookie) to keep SSR in sync.
  const [cardShown, setCardShown] = useState(true);
  useEffect(() => {
    if (placement === "settings") {
      setCardShown(!readMilestoneCardDismissed(myclass?.id));
    }
  }, [placement, myclass?.id]);
  const changeCardShown = (next) => {
    setCardShown(next);
    writeMilestoneCardDismissed(myclass?.id, !next);
  };
  const { data, refetch } = useQuery(CLASS_DATA_COLLECTION, {
    variables: { classId: myclass?.id },
    skip: !myclass?.id,
  });
  const [setClassDataCollection, { loading: saving }] = useMutation(
    SET_CLASS_DATA_COLLECTION,
    {
      refetchQueries: [
        "CLASS_DATA_COLLECTION",
        "GET_CLASS",
        "CLASS_DASHBOARD_PROJECTS_QUERY",
        "CLASS_DASHBOARD_STUDIES_QUERY",
        ...DATA_COLLECTION_REFETCH,
      ],
      awaitRefetchQueries: true,
    }
  );

  const state = data?.classDataCollection;
  const enabled = !!state?.enabled;
  const templateBoards = state?.templateBoards || [];
  const boardTitles = templateBoards
    .map((board) => `“${board.title || ""}”`)
    .join(", ");
  const supervised = enabled || templateBoards.length > 0;
  const carryOver =
    (state?.carryOverCollecting || 0) + (state?.carryOverFinished || 0);

  const apply = async (next) => {
    try {
      await setClassDataCollection({
        variables: { classId: myclass.id, enabled: next },
      });
      setConfirming(null);
    } catch (err) {
      alert(err?.message);
    }
  };

  const stageLabel = {
    DESIGNING: t("studies.status.designing", {}, { default: "Designing" }),
    COLLECTING: t("studies.status.collecting", {}, {
      default: "Collecting data",
    }),
    FINISHED: t("studies.status.finished", {}, { default: "Finished" }),
  };

  let description;
  if (enabled && templateBoards.length) {
    description = t(
      "studies.milestoneCard.onBoth",
      { boards: boardTitles },
      {
        default:
          "Set by this class. Also on board template {{boards}}. Students submit their study, then only a teacher can reopen it.",
      }
    );
  } else if (enabled) {
    description = t("studies.milestoneCard.on", {}, {
      default:
        "Set by this class. Students submit their study for data collection, which locks it; only a teacher can reopen it.",
    });
  } else if (templateBoards.length) {
    description = t(
      "studies.milestoneCard.onBoard",
      { boards: boardTitles },
      {
        default:
          "On through board template {{boards}}. Turn it on here to keep it if the template changes.",
      }
    );
  } else {
    description = t("studies.milestoneCard.off", {}, {
      default:
        "Off: studies are self-managed. Students label them freely and nothing locks. Turn on to supervise submission, participation and finishing.",
    });
  }

  const dialog = confirming ? (
        <Modal
          open
          onClose={() => !saving && setConfirming(null)}
          maxWidth={520}
          title={
            confirming === "ON"
              ? t("studies.milestoneCard.confirmOnTitle", {}, {
                  default: "Follow data collection in this class?",
                })
              : t("studies.milestoneCard.confirmOffTitle", {}, {
                  default: "Stop following data collection in this class?",
                })
          }
          actions={
            <>
              <Button
                variant="text"
                disabled={saving}
                onClick={() => setConfirming(null)}
              >
                {t("studies.milestoneCard.cancel", {}, { default: "Cancel" })}
              </Button>
              <Button
                variant="filled"
                disabled={saving}
                onClick={() => apply(confirming === "ON")}
              >
                {confirming === "ON"
                  ? t("studies.milestoneCard.turnOn", {}, {
                      default: "Turn on",
                    })
                  : t("studies.milestoneCard.turnOff", {}, {
                      default: "Turn off",
                    })}
              </Button>
            </>
          }
        >
          <StyledDialogBody>
            {confirming === "ON" ? (
              <>
                <p>
                  {t("studies.milestoneCard.confirmOnBody", {}, {
                    default:
                      "Every study in this class will follow the data-collection milestone: students submit it when it is ready, which locks it and opens it to participants. Only you and your teaching team can reopen it.",
                  })}
                </p>
                {carryOver > 0 ? (
                  <MessageCard
                    variant="information"
                    message={t(
                      "studies.milestoneCard.carryOver",
                      {
                        collecting: state?.carryOverCollecting || 0,
                        finished: state?.carryOverFinished || 0,
                      },
                      {
                        default:
                          "Students already labelled {{collecting}} studies as collecting data and {{finished}} as finished. They will be marked as submitted (and finished) under your name, and locked. Their participation setting is kept.",
                      }
                    )}
                  />
                ) : null}
              </>
            ) : (
              <>
                {/* What happens to each study (counted on the server). */}
                <ul className="dialogImpact">
                  {state?.turnOffKeep ? (
                    <li>
                      {templateBoards.length
                        ? t(
                            "studies.milestoneCard.offKeepBoard",
                            { count: state.turnOffKeep, boards: boardTitles },
                            {
                              default:
                                "{{count}} studies keep the milestone through board template {{boards}}. Nothing changes for them.",
                            }
                          )
                        : t(
                            "studies.milestoneCard.offKeep",
                            { count: state.turnOffKeep },
                            {
                              default:
                                "{{count}} studies keep the milestone through a project board or another class. Nothing changes for them.",
                            }
                          )}
                    </li>
                  ) : null}
                  {state?.turnOffStaysLocked ? (
                    <li>
                      {t(
                        "studies.milestoneCard.offStaysLocked",
                        { count: state.turnOffStaysLocked },
                        {
                          default:
                            "{{count}} submitted or finished studies stay locked, with nothing supervising them. Reopening one makes it self-managed.",
                        }
                      )}
                    </li>
                  ) : null}
                  {state?.turnOffSelfManaged ? (
                    <li>
                      {t(
                        "studies.milestoneCard.offSelfManaged",
                        { count: state.turnOffSelfManaged },
                        {
                          default:
                            "{{count}} studies become self-managed: students label them freely and nothing locks.",
                        }
                      )}
                    </li>
                  ) : null}
                </ul>
                <MessageCard
                  variant="information"
                  message={t("studies.milestoneCard.offReconnect", {}, {
                    default:
                      "You can turn it back on at any time. Locked studies pick up where they were, and studies labelled Collecting data or Finished are carried over again. Activity is kept.",
                  })}
                />
              </>
            )}
          </StyledDialogBody>
        </Modal>
  ) : null;

  const toggle = state?.canManage ? (
    <ToggleSwitch
      checked={enabled}
      loading={saving}
      onChange={(next) => {
        // Fresh carry-over counts: students relabel their studies.
        refetch?.();
        setConfirming(next ? "ON" : "OFF");
      }}
      aria-label={t("studies.milestoneCard.toggle", {}, {
        default: "Follow data collection in this class",
      })}
    />
  ) : null;

  if (placement === "settings") {
    return (
      <section className="settingsSection" id="settings-data-collection">
        <div className="settingsSectionHeader">
          <h3>
            {t("studies.milestoneCard.title", {}, {
              default: "Data collection milestone",
            })}
          </h3>
          <p>{description}</p>
        </div>
        <div className="informationBlock">
          <div className="block curriculumTypeBlock">
            {state?.canManage ? (
              <ToggleSwitch
                checked={enabled}
                loading={saving}
                onChange={(next) => {
                  refetch?.();
                  setConfirming(next ? "ON" : "OFF");
                }}
                label={t("studies.milestoneCard.toggle", {}, {
                  default: "Follow data collection in this class",
                })}
                aria-label={t("studies.milestoneCard.toggle", {}, {
                  default: "Follow data collection in this class",
                })}
              />
            ) : null}
            <ToggleSwitch
              checked={cardShown}
              onChange={changeCardShown}
              label={t("studies.milestoneCard.showCard", {}, {
                default: "Show this card in the Studies tab",
              })}
              aria-label={t("studies.milestoneCard.showCard", {}, {
                default: "Show this card in the Studies tab",
              })}
            />
            <p className="classDescriptionSettingsHint">
              {t("studies.milestoneCard.settingsHint", {}, {
                default:
                  "Students submit their study when it is ready, which locks it and opens it to participants. The Studies tab shows each study's stage.",
              })}
            </p>
          </div>
        </div>
        {dialog}
      </section>
    );
  }

  return (
    <StyledMilestoneCard
      variant="outline"
      forwardedAs="section"
      className="studiesMilestoneCard"
      aria-label={t("studies.milestoneCard.title", {}, {
        default: "Data collection milestone",
      })}
    >
      <div className="milestoneCardHeader">
        <h4 className="milestoneCardTitle">
          {t("studies.milestoneCard.title", {}, {
            default: "Data collection milestone",
          })}
        </h4>
        <div className="milestoneCardActions">
          {toggle}
          {onDismiss ? (
            <IconButton
              variant="neutral"
              elevated={false}
              icon={<CloseIcon />}
              onClick={onDismiss}
              ariaLabel={t("studies.milestoneCard.dismiss", {}, {
                default: "Hide this card (you can show it again in Settings)",
              })}
              title={t("studies.milestoneCard.dismiss", {}, {
                default: "Hide this card (you can show it again in Settings)",
              })}
            />
          ) : null}
        </div>
      </div>
      <p className="milestoneCardText">{description}</p>
      <div
        className="milestoneCardChips"
        role="group"
        aria-label={t("studies.milestoneCard.filter", {}, {
          default: "Show studies by stage",
        })}
      >
        {STAGES.map((stage) => (
          <Chip
            key={stage}
            label={`${counts?.[stage] || 0} ${stageLabel[stage]}`}
            selected={stageFilter === stage}
            onClick={() =>
              onStageFilter(stageFilter === stage ? null : stage)
            }
          />
        ))}
      </div>
      {supervised ? null : (
        <p className="milestoneCardText">
          {t("studies.milestoneCard.selfManagedCounts", {}, {
            default: "Counts use the students' own labels.",
          })}
        </p>
      )}

      {dialog}
    </StyledMilestoneCard>
  );
}
