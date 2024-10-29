import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useRef } from "react";
import ReactHtmlParser from "react-html-parser";

import { GET_MY_HOMEWORK_FOR_PROPOSAL_CARD } from "../../../Queries/Homework";
import {
  EDIT_HOMEWORK,
  CREATE_NEW_HOMEWORK,
} from "../../../Mutations/Homework";
import JoditEditor from "../../../Jodit/Editor";
import useForm from "../../../../lib/useForm";

export default function IndividualCard({
  user,
  proposalCard,
  closeCard,
  isPreview,
}) {
  const { data, loading, error } = useQuery(GET_MY_HOMEWORK_FOR_PROPOSAL_CARD, {
    variables: {
      userId: user?.id,
      cardId: proposalCard?.id,
    },
  });
  const homeworks = data?.homeworks || [];
  const homework = homeworks?.length ? homeworks[0] : {};

  const { inputs, handleChange } = useForm({
    ...homework,
  });

  const content = useRef(homework?.content);

  useEffect(() => {
    async function updateEditor() {
      content.current = homework?.content;
    }
    if (homework.content) {
      updateEditor();
    }
  }, [homework]);

  const [editHomework, { loading: editLoading }] = useMutation(EDIT_HOMEWORK, {
    refetchQueries: [
      {
        query: GET_MY_HOMEWORK_FOR_PROPOSAL_CARD,
        variables: { userId: user?.id, cardId: proposalCard?.id },
      },
    ],
  });

  const [createHomework, { loading: createLoading }] = useMutation(
    CREATE_NEW_HOMEWORK,
    {
      refetchQueries: [
        {
          query: GET_MY_HOMEWORK_FOR_PROPOSAL_CARD,
          variables: { userId: user?.id, cardId: proposalCard?.id },
        },
      ],
    }
  );

  const saveHomework = async () => {
    if (inputs?.id) {
      await editHomework({
        variables: {
          id: homework?.id,
          updatedAt: new Date(),
          content: content.current,
        },
      });
    } else {
      await createHomework({
        variables: {
          input: {
            title: "Title",
            content: content.current,
            proposalCard: { connect: { id: proposalCard?.id } },
          },
        },
      });
    }
    closeCard({ cardId: false, lockedByUser: false });
  };

  return (
    <div className="post">
      {isPreview && (
        <div className="closeBtn">
          <span onClick={() => closeCard({})}>&times;</span>
        </div>
      )}

      <div className="lockedMessage">
        <div>
          This is your private workspace. Only your teacher and reviewer have
          access to the content you write here.
        </div>
      </div>

      <div className="proposalCardBoard">
        <div className="textBoard">
          <div className="cardHeader">{proposalCard?.title}</div>
          <div className="cardDescription">
            {ReactHtmlParser(proposalCard?.description)}
          </div>

          {!isPreview && (
            <JoditEditor
              content={content?.current}
              setContent={(newContent) => {
                content.current = newContent;
              }}
            />
          )}
        </div>

        {!isPreview && (
          <div className="infoBoard">
            <div className="buttons">
              <button
                className="secondary"
                onClick={() =>
                  closeCard({ cardId: false, lockedByUser: false })
                }
              >
                Close without saving
              </button>

              <button className="primary" onClick={() => saveHomework()}>
                {editLoading ? "Saving ..." : "Save & close"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}