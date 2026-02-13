/**
 * DEPRECATED COMPONENT
 * 
 * This Status dropdown UI component is slated for deprecation.
 * 
 * Please use the new <StatusChip /> component from 
 *   frontend/components/Builder/Project/ProjectBoard/Board/PDF/Preview/StatusChip.js
 * instead for all new development.
 * 
 * This file remains only to support legacy forms. Do not make improvements here.
 */



import React from "react";
import { Dropdown } from "semantic-ui-react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

const StyledDropdown = styled.div`
  font-family: Nunito !important;
  font-size: 18px !important;
  font-weight: 500 !important;
  line-height: 24px !important;
  letter-spacing: 0.15000000596046448px !important;
  text-align: left !important;
  text-underline-position: from-font !important;
  text-decoration-skip-ink: none !important;

  display: grid !important;
  grid-template-columns: auto 1fr !important;
  align-items: center !important;

  .ui.dropdown > .text {
    display: grid !important;
    grid-template-columns: auto 1fr !important;
    align-items: center !important;
  }

  input {
    all: unset;
  }

  .info-status {
    display: grid !important;
    grid-template-columns: auto 1fr !important;
    align-items: center !important;

    font-family: Nunito !important;
    font-size: 18px !important;
    font-weight: 500 !important;
    line-height: 24px !important;
    border-radius: 25px !important;
    width: 200px !important;
    height: 42px !important;
    margin: 10px 5px !important;
    padding: 10px 0px !important;
  }

  .menu {
    max-height: none !important;
  }

  .status-in-progress {
    color: #666666 !important;
    background: #fdf2d0 !important;
  }
  .status-completed {
    color: #55808c !important;
    background: #def8fb !important;
  }
  .status-help-needed {
    color: #b9261a !important;
    background: #edcecd !important;
  }
  .status-comments {
    color: #7d70ad !important;
    background: #d8d3e7 !important;
  }
  .status-not-started {
    color: #8a919d !important;
    background: #f3f3f3 !important;
  }
  .status-needs-revision {
    color: white !important;
    background: #8a2cf6 !important;
  }

  .info-status :hover {
    /* background: #f7f7f7 !important; */
  }
`;

export default function Status(props) {
  const { t } = useTranslation("builder");
  const status = props?.settings?.status;
  const options = [
    {
      key: "inProgress",
      text: t("statusCard.inProgress", "In progress"),
      value: "In progress",
      className: "info-status status-in-progress",
      image: { src: "/assets/icons/status/inProgress.svg" },
    },
    {
      key: "completed",
      text: t("statusCard.completed", "Completed"),
      value: "Completed",
      className: "info-status status-completed",
      image: { src: "/assets/icons/status/completed.svg" },
    },
    {
      key: "helpNeeded",
      text: t("statusCard.helpNeeded", "Help needed"),
      value: "Help needed",
      className: "info-status status-help-needed",
      image: { src: "/assets/icons/status/helpNeeded.svg" },
    },
    {
      key: "comments",
      text: t("statusCard.comments", "Comments"),
      value: "Comments",
      className: "info-status status-comments",
      image: { src: "/assets/icons/status/comments.svg" },
    },
    {
      key: "notStarted",
      text: t("statusCard.notStarted", "Not started"),
      value: "Not started",
      className: "info-status status-not-started",
      image: { src: "/assets/icons/status/notStarted.svg" },
    },
    {
      key: "needsRevision",
      text: t("statusCard.needsRevision", "Needs revision"),
      value: "Needs revision",
      className: "info-status status-needs-revision",
      image: { src: "/assets/icons/status/TriangleWarning.svg" },
    },
  ];

  const onChange = (event, data) => {
    props.onSettingsChange("status", data.value);
  };

  return (
    <StyledDropdown>
      <Dropdown
        placeholder={t("statusCard.setStatus", "Set status before closing")}
        selection
        options={options}
        onChange={onChange}
        value={status}
      />
    </StyledDropdown>
  );
}
