import { useQuery } from "@apollo/client";
import { MY_STUDY } from "../../Queries/Study";
import Router from "./Router";

import useForm from "../../../lib/useForm";
import { useState } from "react";

import { Menu, Segment, Sidebar } from "semantic-ui-react";
import Slidebar from "../../Slidebar/Main";
import StyledSlidebar from "../../styles/StyledSlidebar";

export default function StudyState({ query, user }) {
  const studyId = query?.selector;

  const { data, error, loading } = useQuery(MY_STUDY, {
    variables: { id: studyId },
  });
  const study = data?.study || {
    title: "",
    description: "",
  };

  // save and edit the study information
  const { inputs, handleChange, handleMultipleUpdate, captureFile, clearForm } =
    useForm({
      ...study,
    });

  // console.log({ inputs });
  // to do
  // include unsavedChanges: true in any update of the study state

  const chatId = (study?.talks?.length && study?.talks[0].id) || undefined;
  const [visible, setVisible] = useState(false);
  const toggleSlidebar = () => {
    setVisible(!visible);
  };

  return (
    <Sidebar.Pushable as={Segment}>
      <StyledSlidebar>
        <Sidebar
          as={Menu}
          animation="overlay"
          icon="labeled"
          // onHide={() => setVisible(false)}
          vertical
          visible={visible}
          width="very wide"
          direction="right"
          className="slidebar"
        >
          <Slidebar
            user={user}
            chatId={chatId}
            toggleSlidebar={toggleSlidebar}
          />
        </Sidebar>
      </StyledSlidebar>

      <Sidebar.Pusher dimmed={visible}>
        <Router
          query={query}
          user={user}
          study={inputs}
          handleChange={handleChange}
          handleMultipleUpdate={handleMultipleUpdate}
          captureFile={captureFile}
          toggleSlidebar={toggleSlidebar}
        />
      </Sidebar.Pusher>
    </Sidebar.Pushable>
  );
}
