import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import moment from "moment";
import clsx from "clsx";

import { STUDY_PROPOSALS_QUERY } from "../../../Queries/Study";
import { COPY_PROPOSAL_MUTATION, DELETE_COMPLETE_PROPOSAL } from "../../../Mutations/Proposal";
import { UPDATE_STUDY } from "../../../Mutations/Study";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import IconButton from "../../../DesignSystem/IconButton";
import MessageCard from "../../../DesignSystem/MessageCard";
import Tooltip from "../../../DesignSystem/Tooltip";
import {
  getAssociatedTemplateOptionsForClasses,
  getOptionKey,
} from "../../../../lib/classTemplateBoards";

export default function ProposalOverview({
  studyId,
  studyClasses,
  classesLoading,
  proposals,
  proposalMain,
  openProposal,
  onRequestConnectClass,
}) {
  const { t } = useTranslation("builder");
  const router = useRouter();

  const refetchQueries = [
    { query: STUDY_PROPOSALS_QUERY, variables: { id: studyId } },
  ];

  const [selectedKey, setSelectedKey] = useState(null);

  const templateOptions = useMemo(
    () => getAssociatedTemplateOptionsForClasses(studyClasses),
    [studyClasses]
  );
  const hasConnectedClass = (studyClasses || []).length > 0;
  const didPromptConnect = useRef(false);

  useEffect(() => {
    if (didPromptConnect.current) return;
    if (classesLoading) return;
    if (proposals?.length !== 0) return;
    if (hasConnectedClass) return;
    didPromptConnect.current = true;
    onRequestConnectClass?.();
  }, [
    classesLoading,
    proposals?.length,
    hasConnectedClass,
    onRequestConnectClass,
  ]);

  useEffect(() => {
    if (templateOptions.length === 1) {
      setSelectedKey(getOptionKey(templateOptions[0]));
    }
  }, [templateOptions]);

  const selectedOption =
    templateOptions.find((option) => getOptionKey(option) === selectedKey) ||
    null;

  const [copyProposalBoard, { loading: creating }] = useMutation(
    COPY_PROPOSAL_MUTATION
  );
  const [updateStudy] = useMutation(UPDATE_STUDY);
  const [deleteProposal] = useMutation(DELETE_COMPLETE_PROPOSAL);

  const createFromClassTemplate = async () => {
    const templateId = selectedOption?.board?.id;
    if (!templateId) return;
    const res = await copyProposalBoard({
      variables: {
        id: templateId,
        study: studyId,
        classIdUsed: selectedOption?.class?.id,
      },
      refetchQueries,
    });
    const newId = res?.data?.copyProposalBoard?.id;
    if (newId) {
      router.push({
        pathname: "/builder/projects",
        query: { selector: newId },
      });
    }
  };
  if (proposals?.length === 0) {
    if (classesLoading) {
      return null;
    }

    const canCreate = templateOptions.length > 0;
    const needsClassConnection = !hasConnectedClass;

    let emptyMessage;
    if (canCreate) {
      emptyMessage = t(
        "overview.noBoardYet",
        {},
        {
          default:
            "You haven't created a project board yet. Once you create a project board, it will appear here.",
        }
      );
    } else if (needsClassConnection) {
      emptyMessage = t(
        "overview.connectStudyToClass",
        {},
        {
          default:
            "Connect this study to a class to create a project board.",
        }
      );
    } else {
      emptyMessage = t(
        "overview.noClassTemplate",
        {},
        {
          default:
            "You cannot create a project board yet, because your class does not have a project board associated with it. If you think this is an error, please check with your teacher.",
        }
      );
    }

    return (
      <div className="empty">
        <MessageCard
          style={{ width: "100%" }}
          variant="neutral"
          message={emptyMessage}
        />
        {canCreate && templateOptions.length > 1 && (
          <div
            className="classChipRow"
            role="radiogroup"
            aria-label={t("newProject.selectTemplate", {}, {
              default: "Select template",
            })}
          >
            {templateOptions.map((option) => {
              const key = getOptionKey(option);
              return (
                <Chip
                  key={key}
                  label={option.board?.title}
                  selected={key === selectedKey}
                  onClick={() => setSelectedKey(key)}
                />
              );
            })}
          </div>
        )}
        {canCreate && (
          <Button
            variant="filled"
            disabled={!selectedOption || creating}
            onClick={createFromClassTemplate}
          >
            {t("overview.createProjectBoard", {}, {
              default: "Create project board",
            })}
          </Button>
        )}
        {needsClassConnection && (
          <Button variant="filled" onClick={() => onRequestConnectClass?.()}>
            {t("overview.connectToClass", {}, { default: "Connect to class" })}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="studyBoardList">
      {proposals.map((prop) => {
        const isMain = prop?.id === proposalMain?.id;

        const setAsMain = () => {
          if (isMain) return;
          if (
            !confirm(
              t(
                "overview.confirmMain",
                {},
                {
                  default:
                    "Are you sure you want to make this proposal the main one?",
                }
              )
            )
          ) {
            return;
          }
          updateStudy({
            variables: {
              id: studyId,
              input: { proposalMain: { connect: { id: prop.id } } },
            },
            refetchQueries,
          }).catch((err) => alert(err.message));
        };

        const onDelete = () => {
          if (
            !confirm(
              t("deleteProposal.confirm", {}, {
                default:
                  "Are you sure you want to delete this proposal? All sections and cards in this proposal will be deleted as well.",
              })
            )
          ) {
            return;
          }
          deleteProposal({
            variables: { id: prop.id },
            refetchQueries,
          }).catch((err) => alert(err.message));
        };

        return (
          <div
            key={prop?.id}
            className={clsx("studyBoardListRow", isMain && "isMain")}
          >
            <div>
              <div className="studyBoardListTitle">{prop?.title}</div>
              <div className="studyBoardListMeta">
                <span>{moment(prop?.createdAt).format("MMMM D, YYYY")}</span>
                {isMain && (
                  <Chip
                    variant="static"
                    tone="info"
                    label={t("overview.mainBoard", {}, { default: "Main" })}
                  />
                )}
              </div>
            </div>
            <div className="studyBoardListActions">
              <Button
                variant="tonal"
                onClick={() => openProposal(prop?.id)}
              >
                {t("overview.open", {}, { default: "Open" })}
              </Button>
              <Tooltip
                side="top"
                content={t("overview.favoriteRequiredForTeacher", {}, {
                  default:
                    "There must always be a proposal selected as favorite for the teacher to see.",
                })}
              >
                <IconButton
                  variant={isMain ? "tonal" : "text"}
                  ariaLabel={t("overview.favoriteRequiredForTeacher", {}, {
                    default:
                      "There must always be a proposal selected as favorite for the teacher to see.",
                  })}
                  icon={
                    <img
                      src={
                        isMain
                          ? "/assets/icons/builder/medium-star-filled.svg"
                          : "/assets/icons/builder/medium-star.svg"
                      }
                      alt=""
                    />
                  }
                  onClick={setAsMain}
                />
              </Tooltip>
              <Button variant="tonal" style={{ color: "var(--MH-Theme-Danger-Dark)", backgroundColor: "var(--MH-Theme-Danger-Light)" }} onClick={onDelete}>
                {t("overview.delete", {}, { default: "Delete" })}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
