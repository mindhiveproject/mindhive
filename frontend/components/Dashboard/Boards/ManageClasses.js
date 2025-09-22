import { useRouter } from "next/router";
import { useQuery, useMutation } from "@apollo/client";
import { useState, useEffect } from "react";
import { Dropdown, Button, Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import { GET_PROPOSAL_TEMPLATE_CLASSES } from "../../Queries/Proposal";
import { GET_TEACHER_CLASSES } from "../../Queries/Classes";
import { UPDATE_PROJECT_BOARD } from "../../Mutations/Proposal"; // Adjust path to mutations
import StyledBoards from "../../styles/StyledBoards"; // Adjust path

export default function ManageTemplateClasses({ user, boardId }) {
  const router = useRouter();
  const { t } = useTranslation("classes");

  const {
    data: boardData,
    loading: boardLoading,
    error: boardError,
  } = useQuery(GET_PROPOSAL_TEMPLATE_CLASSES, {
    variables: { id: boardId },
    skip: !boardId,
  });

  const {
    data: classesData,
    loading: classesLoading,
    error: classesError,
  } = useQuery(GET_TEACHER_CLASSES, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  const [updateProposalBoard, { loading: updateLoading }] =
    useMutation(UPDATE_PROJECT_BOARD);

  const [selectedClasses, setSelectedClasses] = useState([]);

  useEffect(() => {
    if (boardData?.proposalBoard?.templateForClasses) {
      setSelectedClasses(
        boardData.proposalBoard.templateForClasses.map((c) => c.id)
      );
    }
  }, [boardData]);

  if (!user) return <p>{t("boardManagement.pleaseLogin")}</p>;
  if (boardLoading || classesLoading) return <p>{t("boardManagement.loading")}</p>;
  if (boardError) return <p>{t("boardManagement.error")}: {boardError.message}</p>;
  if (classesError) return <p>{t("boardManagement.error")}: {classesError.message}</p>;
  if (!boardData?.proposalBoard) return <p>{t("boardManagement.boardNotFound")}</p>;

  const board = boardData.proposalBoard;
  const teacherClasses = classesData?.classes || [];
  const clonedBoards = board.prototypeFor || [];

  const classOptions = teacherClasses.map((c) => ({
    key: c.id,
    text: `${c.title} (${c.code || t("boardManagement.noCode")})`,
    value: c.id,
  }));

  const handleChange = (e, { value }) => {
    setSelectedClasses(value);
  };

  const handleSave = async () => {
    const initialIds = board.templateForClasses.map((c) => c.id);
    const connect = selectedClasses
      .filter((id) => !initialIds.includes(id))
      .map((id) => ({ id }));
    const disconnect = initialIds
      .filter((id) => !selectedClasses.includes(id))
      .map((id) => ({ id }));

    try {
      await updateProposalBoard({
        variables: {
          id: boardId,
          input: {
            templateForClasses: {
              connect,
              disconnect,
            },
          },
        },
        refetchQueries: [
          { query: GET_PROPOSAL_TEMPLATE_CLASSES, variables: { id: boardId } },
        ],
      });
      alert(t("boardManagement.changesSaved"));
    } catch (err) {
      alert(`${t("boardManagement.errorSavingChanges")} ${err.message}`);
    }
  };

  const goBack = () => {
    router.back();
  };

  return (
    <StyledBoards>
      <div className="headerSection">
        <h1>{t("boardManagement.manageClassesForTemplate")}: {board.title}</h1>
        <p>{t("boardManagement.selectClassesDescription")}</p>
        <div className="manageActions">
          <Dropdown
            placeholder={t("boardManagement.selectClasses")}
            fluid
            multiple
            selection
            options={classOptions}
            value={selectedClasses}
            onChange={handleChange}
            className="manageDropdown"
          />
          <div className="buttonGroup">
            <Button
              className="saveButton"
              onClick={handleSave}
              loading={updateLoading}
            >
              <Icon name="check" /> {t("boardManagement.saveChanges")}
            </Button>
            <Button className="backButton" onClick={goBack}>
              <Icon name="arrow left" /> {t("boardManagement.goBack")}
            </Button>
          </div>
        </div>
      </div>

      <div className="clonedBoardsSection">
        <h2>{t("boardManagement.clonedProposalBoards")}</h2>
        {clonedBoards.length === 0 ? (
          <p>{t("boardManagement.noClonedProposals")}</p>
        ) : (
          <div className="clonedBoardsGrid">
            {clonedBoards.map((cloned) => (
              <div key={cloned.id} className="clonedBoardItem">
                <h3>{cloned.title}</h3>
                <p>
                  <strong>{t("boardManagement.author")}:</strong> {cloned.author?.username || t("boardManagement.none")}
                </p>
                <p>
                  <strong>{t("boardManagement.collaborators")}:</strong>{" "}
                  {cloned.collaborators.length
                    ? cloned.collaborators
                        .map((collab) => collab.username)
                        .join(", ")
                    : t("boardManagement.none")}
                </p>
                <p>
                  <strong>{t("boardManagement.class")}:</strong>{" "}
                  {cloned.usedInClass
                    ? `${cloned.usedInClass.title} (${
                        cloned.usedInClass.code || t("boardManagement.noCode")
                      })`
                    : t("boardManagement.none")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </StyledBoards>
  );
}
