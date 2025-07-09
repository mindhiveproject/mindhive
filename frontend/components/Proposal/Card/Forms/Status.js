import React, { Component } from "react";
import { Dropdown } from "semantic-ui-react";
import styled from "styled-components";
import useTranslation from 'next-translate/useTranslation';

const StyledDropdown = styled.div`
  input {
    all: unset;
  }
  .info-status {
    display: table;
    font-family: Lato;
    font-style: normal;
    font-size: 12px;
    line-height: 100%;
    letter-spacing: 0.05em;
    border-radius: 30px;
    position: absolute;
    margin: 8px;
  }
  .status-not-started {
    color: #896900 !important;
    background: rgba(254, 210, 79, 0.18) !important;
  }
  .status-started {
    color: #0063ce !important;
    background: rgba(0, 117, 224, 0.12) !important;
  }
  .status-needs-feedback {
    color: #c92927 !important;
    background: rgba(224, 103, 102, 0.12) !important;
  }
  .status-feedback-given {
    color: #6f25ce !important;
    background: rgba(111, 37, 206, 0.12) !important;
  }
  .status-completed {
    color: #00635a !important;
    background: rgba(0, 124, 112, 0.12) !important;
  }
  .info-status :hover {
    background: #f7f7f7 !important;
  }
`;

class Status extends Component {
  render() {
    const { t } = useTranslation('classes');
    const status = this.props?.settings?.status;
    const options = [
      {
        key: "Not started",
        text: t('board.statusNotStarted', 'Not started'),
        value: "Not started",
        className: "info-status status-not-started",
      },
      {
        key: "Started",
        text: t('board.statusStarted', 'Started'),
        value: "Started",
        className: "info-status status-started",
      },
      {
        key: "Needs feedback",
        text: t('board.statusNeedsFeedback', 'Needs feedback'),
        value: "Needs feedback",
        className: "info-status status-needs-feedback",
      },
      {
        key: "Feedback given",
        text: t('board.statusFeedbackGiven', 'Feedback given'),
        value: "Feedback given",
        className: "info-status status-feedback-given",
      },
      {
        key: "Completed",
        text: t('board.statusCompleted', 'Completed'),
        value: "Completed",
        className: "info-status status-completed",
      },
    ];

    return (
      <StyledDropdown>
        <Dropdown
          placeholder={t('board.selectStatus', 'Select status')}
          fluid
          selection
          options={options}
          onChange={(event, data) => this.props.onSettingsChange("status", data.value)}
          value={status}
        />
      </StyledDropdown>
    );
  }
}

export default Status;
