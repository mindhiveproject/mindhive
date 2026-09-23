import { useState } from "react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import IconButton from "../../DesignSystem/IconButton";

import { StyledBuilderArea } from "../../styles/StyledBuilder";
import StyledTaskBuilder from "../../styles/StyledTaskBuilder";

import Navigation from "./Navigation";
import Basic from "./Basic/Main";
import Parameters from "./Parameters/Main";
import Sharing from "./Sharing";

import Template from "./Template/Main";
import TaskPreview from "../../Tasks/Preview/Main";

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
  const title = inputs?.i18nContent?.[locale]?.title || inputs?.title;
  const taskType = inputs?.taskType?.toLowerCase();

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

      {tab === "template" && (
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
      {buildArea}
    </StyledTaskBuilder>
  );

  return <StyledBuilderArea>{form}</StyledBuilderArea>;
}
