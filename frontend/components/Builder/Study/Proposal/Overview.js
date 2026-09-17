import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import moment from "moment";

import DeleteProposal from "./Delete";

import { STUDY_PROPOSALS_QUERY } from "../../../Queries/Study";
import { COPY_PROPOSAL_MUTATION } from "../../../Mutations/Proposal";
import MakeMain from "./MakeMain";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";
import MessageCard from "../../../DesignSystem/MessageCard";
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
  copyProposal,
  createProposal,
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
    <div className="overview" id="overview">
      <div className="navigationHeader">
        <div></div>
        <div>
          <Button variant="filled" onClick={() => createProposal()}>
            {t("proposal.create", {}, { default: "Create a new proposal" })}
          </Button>
        </div>
      </div>

      <div>
        <div className="row">
          <div className="proposalHeader">
            <div>{t("proposal.name", "Proposal name")}</div>
            <div>{t("proposal.dateCreated", "Date created")}</div>
            <div>{t("proposal.status", "Status")}</div>
            <div>{t("proposal.actions", "Actions")}</div>
          </div>
          <div></div>
        </div>
        {proposals?.map((prop) => (
          <div key={prop?.id}>
            <div className="row">
              <div
                className={
                  prop?.id === proposalMain?.id ? `itemRow main` : `itemRow`
                }
              >
                <div>
                  <p>{prop?.title}</p>
                </div>
                <div>
                  <p>{moment(prop?.createdAt).format("MMMM D, YYYY")}</p>
                </div>
                <div>
                  <p>
                    {prop?.isSubmitted
                      ? t("proposal.submitted", "Submitted")
                      : t("proposal.notSubmitted", "Not submitted")}
                  </p>
                </div>

                <div className="actionLinks">
                  <button onClick={() => openProposal(prop?.id)}>
                    {t("proposal.open", "Open")}
                  </button>
                  <button onClick={() => copyProposal(prop?.id)}>
                    {t("proposal.copy", "Copy")}
                  </button>
                  {prop?.id !== proposalMain?.id && (
                    <MakeMain
                      studyId={studyId}
                      proposalId={prop?.id}
                      refetchQueries={refetchQueries}
                    >
                      <button>
                        {t("proposal.selectAsMain", "Select as main")}
                      </button>
                    </MakeMain>
                  )}

                  {!prop?.isSubmitted && (
                    <DeleteProposal
                      proposalId={prop?.id}
                      refetchQueries={refetchQueries}
                    >
                      <button>{t("proposal.delete", "Delete")}</button>
                    </DeleteProposal>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
