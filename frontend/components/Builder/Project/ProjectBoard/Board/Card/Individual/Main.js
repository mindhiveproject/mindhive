import { useMutation, useQuery } from "@apollo/client";
import { useEffect, useRef } from "react";
import ReactHtmlParser from "react-html-parser";
import useTranslation from "next-translate/useTranslation";

import { GET_MY_HOMEWORK_FOR_PROPOSAL_CARD } from "../../../../../../Queries/Homework";
import {
  EDIT_HOMEWORK,
  CREATE_NEW_HOMEWORK,
} from "../../../../../../Mutations/Homework";
import JoditEditor from "../../../../../../Jodit/Editor";
import useForm from "../../../../../../../lib/useForm";

import Status from "../Forms/Status";
import Navigation from "../../../../Navigation/Main";
import { StyledProposal } from "../../../../../../styles/StyledProposal";

export default function IndividualCard({
  query,
  tab,
  user,
  proposalId,
  proposalCard,
  cardId,
  closeCard,
  isPreview,
}) {
  const { t } = useTranslation("builder");
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
          settings: inputs?.settings,
        },
      });
    } else {
      await createHomework({
        variables: {
          input: {
            title: "Title",
            content: content.current,
            proposalCard: { connect: { id: proposalCard?.id } },
            settings: inputs?.settings,
          },
        },
      });
    }
    closeCard({ cardId: false, lockedByUser: false });
  };

  // update the settings in the local state
  const handleSettingsChange = (name, value) => {
    handleChange({
      target: {
        name: "settings",
        value: { ...inputs.settings, [name]: value },
      },
    });
  };

  return (
    <>
      <Navigation
        query={query}
        user={user}
        tab={tab}
        toggleSidebar={() => {}}
        proposalId={proposalId}
        cardId={cardId}
        saveBtnFunction={() => {
          saveHomework();
        }}
        saveBtnName={t("individualCard.saveExit", "Save & Exit")}
      />

      <StyledProposal>
        <div className="post">
          {isPreview && (
            <div className="closeBtn">
              <span onClick={() => closeCard({})}>&times;</span>
            </div>
          )}

          <div className="lockedMessage">
            <div>
              {t(
                "individualCard.privateWorkspaceMsg",
                "This is your private workspace. Only your teacher and reviewer have access to the content you write here."
              )}
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
                <div>
                  <h4>{t("individualCard.status", "Status")}</h4>
                  <Status
                    settings={inputs?.settings}
                    onSettingsChange={handleSettingsChange}
                  />
                </div>

                <div className="proposalCardComments">
                  <h4>{t("individualCard.comments", "Comments")}</h4>
                  <textarea
                    rows="5"
                    type="text"
                    id="comment"
                    name="comment"
                    value={inputs.comment}
                    onChange={handleChange}
                    disabled
                  />
                </div>

                <div className="buttons">
                  <button className="primary" onClick={() => saveHomework()}>
                    {editLoading
                      ? t("individualCard.saving", "Saving ...")
                      : t("individualCard.save", "Save")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </StyledProposal>
    </>
  );
}
