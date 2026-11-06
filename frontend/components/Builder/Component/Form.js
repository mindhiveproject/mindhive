import { useState } from "react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import IconButton from "../../DesignSystem/IconButton";
import MessageCard from "../../DesignSystem/MessageCard";

import { StyledBuilderArea } from "../../styles/StyledBuilder";
import StyledTaskBuilder from "../../styles/StyledTaskBuilder";

import Navigation from "./Navigation";
import Basic from "./Basic/Main";
import Parameters from "./Parameters/Main";
import Sharing from "./Sharing";

import Template from "./Template/Main";
import JsPsychArchive from "./Template/JsPsychArchive";
import JsPsychVersion from "./Template/JsPsychVersion";
import TaskPreview from "../../Tasks/Preview/Main";
import { getLocalizedField } from "../../../lib/i18nContent";
import { blockRelation } from "../../../lib/blockOwnership";

export default function ComponentForm({
  user,
  inputs,
  handleChange,
  handleMultipleUpdate,
  handleSubmit,
  submitBtnName,
  loading,
  error,
  isTemplateAuthor,
  close,
  isInStudyBuilder,
  openPreview,
}) {
  const { t } = useTranslation("builder");
  const router = useRouter();
  const { locale } = router;
  const title = getLocalizedField(inputs, "title", locale);
  const taskType = inputs?.taskType?.toLowerCase();
  // the author's original task (the one in the task bank), on its own page
  const isOwnOriginal =
    !!inputs?.id && !!blockRelation(inputs, user?.id) && !inputs?.copiedFrom?.id;

  const [tab, setTab] = useState(
    isTemplateAuthor ? "template" : isInStudyBuilder ? "parameters" : "basic",
  );
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false);

  const handlePreview = async () => {
    if (openPreview) {
      await openPreview();
      return;
    }
    setIsFullscreenPreviewOpen(true);
  };

  if (isFullscreenPreviewOpen) {
    return (
      <TaskPreview
        user={user}
        id={inputs?.id}
        close={() => setIsFullscreenPreviewOpen(false)}
      />
    );
  }

  const buildArea = (
    <div className="buildArea">
      {tab === "basic" && (
        <Basic
          task={inputs}
          handleChange={handleChange}
          handleMultipleUpdate={handleMultipleUpdate}
          loading={loading}
          error={error}
          isInStudyBuilder={isInStudyBuilder}
        />
      )}

      {tab === "parameters" && (
        <Parameters
          user={user}
          task={inputs}
          handleChange={handleChange}
          handleMultipleUpdate={handleMultipleUpdate}
          loading={loading}
          error={error}
          isInStudyBuilder={isInStudyBuilder}
        />
      )}

      {tab === "sharing" && (
        <Sharing
          task={inputs}
          handleChange={handleChange}
          handleMultipleUpdate={handleMultipleUpdate}
          loading={loading}
          error={error}
        />
      )}

      {tab === "template" && inputs?.runtimeType === "JSPSYCH" && inputs?.id && (
        <JsPsychVersion task={inputs} user={user} allowUpload />
      )}

      {tab === "template" && inputs?.runtimeType === "JSPSYCH" && !inputs?.id && (
        <JsPsychArchive
          jsPsych={inputs?.jsPsych}
          handleMultipleUpdate={handleMultipleUpdate}
          loading={loading}
          error={error}
        />
      )}

      {tab === "template" && inputs?.runtimeType !== "JSPSYCH" && (
        <Template
          template={inputs?.template}
          handleChange={handleChange}
          handleMultipleUpdate={handleMultipleUpdate}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );

  if (isInStudyBuilder) {
    return (
      <div className="blockPanel">
        <div className="blockPanelHeader">
          <div className="blockPanelTitle">
            <h1>{title}</h1>
          </div>
          <div className="blockPanelHeaderMain">
            <div className="blockPanelActions">
              {inputs?.id ? (
                <Button variant="tonal" type="button" onClick={handlePreview}>
                  {t("viewer.preview", { taskType }, {
                    default: "Preview {{taskType}}",
                  })}
                </Button>
              ) : null}
            </div>
            <IconButton
              variant="subtle"
              elevated={false}
              ariaLabel={t("blockPanel.close", {}, { default: "Close" })}
              title={t("blockPanel.close", {}, { default: "Close" })}
              onClick={() => close()}
              icon={<span aria-hidden>&times;</span>}
            />
          </div>
        </div>
        <div className="blockPanelBody">
          <StyledTaskBuilder className="inStudyBuilderPanel">
            {buildArea}
          </StyledTaskBuilder>
        </div>
      </div>
    );
  }

  const form = (
    <StyledTaskBuilder>
      <Navigation
        task={inputs}
        user={user}
        tab={tab}
        setTab={setTab}
        submitBtnName={submitBtnName}
        handleSubmit={handleSubmit}
        openFullscreenPreview={inputs?.id ? handlePreview : undefined}
        isTemplateAuthor={isTemplateAuthor}
        close={close}
      />
      {isOwnOriginal && (
        <div className="originalTaskNotice" style={{ margin: "16px 24px 0" }}>
          <MessageCard
            variant="information"
            message={t("originalTask.pageNotice", {}, {
              default:
                "This is your original task template. Other people's studies run their own copy, so your changes here don't reach them. Blocks in your own studies that still use the original will update.",
            })}
          />
        </div>
      )}
      {buildArea}
    </StyledTaskBuilder>
  );

  return <StyledBuilderArea>{form}</StyledBuilderArea>;
}
