import { useState } from "react";

import useTranslation from "next-translate/useTranslation";

import { StyledBuilderArea } from "../../styles/StyledBuilder";
import StyledTaskBuilder from "../../styles/StyledTaskBuilder";

import Navigation from "./Navigation";
import Basic from "./Basic/Main";
import Parameters from "./Parameters/Main";
import Sharing from "./Sharing";

import Template from "./Template/Main";
// import TaskPreview from "../../Tasks/Preview/Main";
import BuilderTaskPreview from "../../Tasks/Preview/BuilderVersion";

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
  isInStudyBuilder
}) {
  const { t } = useTranslation("classes");

  const [tab, setTab] = useState(isTemplateAuthor ? "template" : "basic");
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false);

  const openFullscreenPreview = () => {
    console.log({ inputs });
    setIsFullscreenPreviewOpen(true);
  };

  if (isFullscreenPreviewOpen) {
    // if (inputs?.isExternal) {
    //   return (
    //     <Labjs>
    //       <StyledPreview>
    //         <div className="frame"></div>
    //         <div className="message">THIS IS A PREVIEW.</div>
    //         <div className="closeBtn">
    //           <span onClick={() => setIsFullscreenPreviewOpen(false)}>
    //             &times;
    //           </span>
    //         </div>
    //       </StyledPreview>
    //       <div>
    //         <p>Hello</p>
    //       </div>
    //     </Labjs>
    //   );
    // }
    return (
      <BuilderTaskPreview
        user={user}
        task={inputs}
        close={() => setIsFullscreenPreviewOpen(false)}
      />
      // <Labjs>
      //   <StyledPreview>
      //     <div className="frame"></div>
      //     <div className="message">
      //       THIS IS A PREVIEW. YOUR DATA ARE NOT SAVED.
      //     </div>
      //     <div className="closeBtn">
      //       <span onClick={() => setIsFullscreenPreviewOpen(false)}>
      //         &times;
      //       </span>
      //     </div>
      //   </StyledPreview>
      //   <ExperimentWindow task={inputs} />
      // </Labjs>
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
          openFullscreenPreview={openFullscreenPreview}
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
              task={inputs}
              handleChange={handleChange}
              handleMultipleUpdate={handleMultipleUpdate}
              loading={loading}
              error={error}
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
