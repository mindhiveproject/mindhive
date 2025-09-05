import { useRouter } from "next/router";
import { useQuery, useMutation } from "@apollo/client";
import { useState, useEffect } from "react";
import { Dropdown, Button, Icon } from "semantic-ui-react";
import { GET_PROPOSAL_TEMPLATE_CLASSES } from "../../Queries/Proposal";
import { GET_TEACHER_CLASSES } from "../../Queries/Classes";
import { UPDATE_PROJECT_BOARD } from "../../Mutations/Proposal"; // Adjust path to mutations
import StyledBoards from "../../styles/StyledBoards"; // Adjust path

export default function ManageTemplateClasses({ user, boardId }) {
  const router = useRouter();

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

  if (!user) return <p>Please log in to manage classes.</p>;
  if (boardLoading || classesLoading) return <p>Loading...</p>;
  if (boardError) return <p>Error: {boardError.message}</p>;
  if (classesError) return <p>Error: {classesError.message}</p>;
  if (!boardData?.proposalBoard) return <p>Proposal board not found.</p>;

  const board = boardData.proposalBoard;
  const teacherClasses = classesData?.classes || [];
  const clonedBoards = board.prototypeFor || [];

  const classOptions = teacherClasses.map((c) => ({
    key: c.id,
    text: `${c.title} (${c.code || "No code"})`,
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
      alert("Changes saved successfully");
    } catch (err) {
      alert(`Error saving changes: ${err.message}`);
    }
  };

  const goBack = () => {
    router.back();
  };

  return (
    <StyledBoards>
      <div className="headerSection">
        <h1>Manage Classes for Template: {board.title}</h1>
        <p>Select classes that use this proposal board as a template.</p>
        <div className="manageActions">
          <Dropdown
            placeholder="Select classes"
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
              <Icon name="check" /> Save Changes
            </Button>
            <Button className="backButton" onClick={goBack}>
              <Icon name="arrow left" /> Go Back
            </Button>
          </div>
        </div>
      </div>

      <div className="clonedBoardsSection">
        <h2>Cloned Proposal Boards</h2>
        {clonedBoards.length === 0 ? (
          <p>No cloned proposals from this template.</p>
        ) : (
          <div className="clonedBoardsGrid">
            {clonedBoards.map((cloned) => (
              <div key={cloned.id} className="clonedBoardItem">
                <h3>{cloned.title}</h3>
                <p>
                  <strong>Author:</strong> {cloned.author?.username || "None"}
                </p>
                <p>
                  <strong>Collaborators:</strong>{" "}
                  {cloned.collaborators.length
                    ? cloned.collaborators
                        .map((collab) => collab.username)
                        .join(", ")
                    : "None"}
                </p>
                <p>
                  <strong>Class:</strong>{" "}
                  {cloned.usedInClass
                    ? `${cloned.usedInClass.title} (${
                        cloned.usedInClass.code || "No code"
                      })`
                    : "None"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </StyledBoards>
  );
}
