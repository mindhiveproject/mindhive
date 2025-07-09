import { Dropdown } from "semantic-ui-react";
import useTranslation from 'next-translate/useTranslation';

export default function CardType({ type, handleChange }) {
  const { t } = useTranslation('classes');
  const options = [
    { key: "proposal", text: t('board.proposal', 'Proposal'), value: "PROPOSAL" },
    // { key: "assignment", text: "Assignment", value: "ASSIGNMENT" },
    //{ key: "lesson", text: "Lesson", value: "LESSON" },
    //{ key: "article", text: "Article", value: "ARTICLE" },
    //{ key: "survey", text: "Survey", value: "SURVEY" },
    //{ key: "link", text: "Link", value: "LINK" },
    {
      key: "actionSubmit",
      text: t('board.actionSubmit', 'Action card - Submit Proposal'),
      value: "ACTION_SUBMIT",
    },
    {
      key: "actionPeerFeedback",
      text: t('board.actionPeerFeedback', 'Action card - Submit for Peer Feedback'),
      value: "ACTION_PEER_FEEDBACK",
    },
    {
      key: "actionCollectingData",
      text: t('board.actionCollectingData', 'Action card - Start Collecting Data'),
      value: "ACTION_COLLECTING_DATA",
    },
    {
      key: "actionProjectReport",
      text: t('board.actionProjectReport', 'Action card - Submit Project Report'),
      value: "ACTION_PROJECT_REPORT",
    },
  ];

  return (
    <Dropdown
      placeholder={t('board.selectType', 'Select type')}
      fluid
      selection
      options={options}
      onChange={(e, data) => {
        handleChange({ target: { name: "type", value: data?.value } });
      }}
      value={type}
    />
  );
}
