import { useState } from "react";

import useTranslation from "next-translate/useTranslation";

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
}) {
  const { t } = useTranslation("classes");

  const [tab, setTab] = useState(
    isTemplateAuthor ? "template" : isInStudyBuilder ? "parameters" : "basic",
  );
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false);

  const openFullscreenPreview = () => {
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

  return (
    <StyledBuilderArea>
      <StyledTaskBuilder>
        <Navigation
          task={inputs}
          user={user}
          tab={tab}
          setTab={setTab}
          submitBtnName={submitBtnName}
          handleSubmit={handleSubmit}
          openFullscreenPreview={inputs?.id ? openFullscreenPreview : undefined}
          isTemplateAuthor={isTemplateAuthor}
          close={close}
          isInStudyBuilder={isInStudyBuilder}
        />

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
      </StyledTaskBuilder>
    </StyledBuilderArea>
  );
}
