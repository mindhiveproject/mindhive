import React, { useState, useRef } from "react";
import { StyledVideoUploader } from "../../../../styles/StyledForm";
import useTranslation from "next-translate/useTranslation";

const VideoUploader = ({ publicReadableId, onFileUpload }) => {
  const { t } = useTranslation("connect");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    const formData = new FormData();
    const fileExtension = file.name.split(".").pop();
    const fileName = `${publicReadableId}-intro.${fileExtension}`;
    formData.append("video", file, fileName);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      if (response.ok) {
        const json = await response.json();
        const { filename } = json;
        onFileUpload({ filename, timestamp: Date.now() });
      } else {
        console.error("Upload failed");
        alert(t("videoUploader.error"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert(t("videoUploader.error"));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFiles = (files) => {
    const file = files[0];
    if (file.type.startsWith("video/")) {
      handleUpload({ file });
    } else {
      alert(t("videoUploader.invalidFile"));
    }
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

      {uploading && <p>{t("videoUploader.uploadProgress", { progress: uploadProgress })}</p>}
    </StyledVideoUploader>
  );
};

export default VideoUploader;
