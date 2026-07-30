import React, { useState, useRef } from "react";
import { StyledVideoUploader } from "../../../../styles/StyledForm";
import useTranslation from "next-translate/useTranslation";

const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB, same cap as opportunity videos

const VideoUploader = ({ publicReadableId, onFileUpload }) => {
  const { t } = useTranslation("connect");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleUpload = async ({ file }) => {
    if (!file) return;

    setUploading(true);
    try {
      // The parent runs the GraphQL mutation (Keystone stores the file in the
      // profile_videos bucket); rename so stored originals stay identifiable.
      const fileExtension = file.name.split(".").pop();
      const fileName = `${publicReadableId}-intro.${fileExtension}`;
      const renamed = new File([file], fileName, { type: file.type });
      await onFileUpload({ file: renamed });
    } catch (error) {
      console.error("Error:", error);
      alert(t("videoUploader.error"));
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files) => {
    const file = files[0];
    if (!file.type.startsWith("video/")) {
      alert(t("videoUploader.invalidFile"));
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      alert(t("videoUploader.error"));
      return;
    }
    handleUpload({ file });
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <StyledVideoUploader
      className={`upload-area ${dragActive ? "drag-active" : ""}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <img src="/assets/icons/profile/upload.svg" alt="upload" />
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleChange}
        style={{ display: "none" }}
      />
      <div className="message">{t("videoUploader.dragAndDrop")}</div>

      <div>
        <button onClick={onButtonClick}>{t("videoUploader.selectFile")}</button>
      </div>

      {uploading && <p>{t("videoUploader.uploading", {}, { default: "Uploading..." })}</p>}
    </StyledVideoUploader>
  );
};

export default VideoUploader;
