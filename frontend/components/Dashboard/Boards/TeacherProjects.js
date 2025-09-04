import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import Link from "next/link";
import { Icon, Dropdown } from "semantic-ui-react";
import StyledBoards from "../../styles/StyledBoards"; // Adjust path to your StyledBoards.js
import {
  GET_MY_AUTHORED_PROJECT_BOARDS,
  PROPOSAL_TEMPLATES_QUERY,
} from "../../Queries/Proposal";
import {
  COPY_PROPOSAL_MUTATION,
  DELETE_COMPLETE_PROPOSAL,
  CREATE_NEW_PROPOSAL_AS_AUTHOR,
} from "../../Mutations/Proposal"; // Updated import

const TeacherProjects = ({ user, query }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [createMode, setCreateMode] = useState(null); // 'scratch' or 'copy'
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  const {
    data: authoredData,
    loading: authoredLoading,
    error: authoredError,
    refetch,
  } = useQuery(GET_MY_AUTHORED_PROJECT_BOARDS, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  const { data: publicData, loading: publicLoading } = useQuery(
    PROPOSAL_TEMPLATES_QUERY,
    {
      skip: !isCreating,
    }
  );

  const [copyProposal, { loading: copyLoading }] = useMutation(
    COPY_PROPOSAL_MUTATION,
    {
      refetchQueries: [
        {
          query: GET_MY_AUTHORED_PROJECT_BOARDS,
          variables: { userId: user?.id },
        },
      ],
    }
  );

  const [deleteProposal, { loading: deleteLoading }] = useMutation(
    DELETE_COMPLETE_PROPOSAL,
    {
      refetchQueries: [
        {
          query: GET_MY_AUTHORED_PROJECT_BOARDS,
          variables: { userId: user?.id },
        },
      ],
    }
  );

  const [createProposal, { loading: createLoading }] = useMutation(
    CREATE_NEW_PROPOSAL_AS_AUTHOR,
    {
      refetchQueries: [
        {
          query: GET_MY_AUTHORED_PROJECT_BOARDS,
          variables: { userId: user?.id },
        },
      ],
    }
  );

  const handleCreateNew = () => {
    setIsCreating(true);
    setCreateMode(null);
    setSelectedTemplateId(null);
  };

  const handleCreateFromScratch = async () => {
    try {
      const res = await createProposal({
        variables: {
          title: "New Project Board",
          description: "A new project board created from scratch",
          settings: null, // Optional, can be an empty object {} if needed
          authorId: user?.id,
        },
      });
      if (res?.data?.createProposalBoard) {
        const newBoardId = res.data.createProposalBoard.id;
        alert("Project board created successfully!");
        setIsCreating(false);
        refetch();
        window.location.href = `/dashboard/boards/edit?id=${newBoardId}`;
      }
    } catch (err) {
      alert("Error creating project board: " + err.message);
    }
  };

  const handleCopy = async (boardId) => {
    try {
      const res = await copyProposal({
        variables: {
          id: boardId,
        },
      });
      if (res?.data?.copyProposalBoard) {
        alert("Project board copied successfully!");
        refetch();
      }
    } catch (err) {
      alert("Error copying project board: " + err.message);
    }
  };

  const handleCopyFromPublic = async () => {
    if (!selectedTemplateId) {
      alert("Please select a public project board to copy.");
      return;
    }
    try {
      const res = await copyProposal({
        variables: {
          id: selectedTemplateId,
        },
      });
      if (res?.data?.copyProposalBoard) {
        alert("Public project board copied successfully!");
        setIsCreating(false);
        refetch();
      }
    } catch (err) {
      alert("Error copying public project board: " + err.message);
    }
  };

  const handleDelete = async (boardId) => {
    if (confirm("Are you sure you want to delete this project board?")) {
      try {
        await deleteProposal({
          variables: {
            id: boardId,
          },
        });
        alert("Project board deleted successfully!");
        refetch();
      } catch (err) {
        alert("Error deleting project board: " + err.message);
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setCreateMode(null);
    setSelectedTemplateId(null);
  };

  const dropdownTemplates =
    publicData?.proposalBoards?.map((template) => ({
      key: template.id,
      text: template.title,
      value: template.id,
    })) || [];

  if (!user) return <p>Please log in to view your project boards.</p>;
  if (authoredLoading) return <p>Loading your project boards...</p>;
  if (authoredError)
    return <p>Error loading project boards: {authoredError.message}</p>;

  return (
    <StyledBoards>
      <div className="headerSection">
        <h2>Your Authored Project Boards</h2>
        <p>
          Explore your authored project boards below. Use the buttons to manage,
          edit, duplicate, or delete.
        </p>
        <button onClick={handleCreateNew} className="createButton narrowButton">
          <Icon name="plus" /> Create New Project Board
        </button>
      </div>

      {isCreating && (
        <div className="modalOverlay">
          <div className="modalContent">
            <div className="modalHeader">
              <h3>Create a New Project Board</h3>
              <span className="closeBtn" onClick={handleCancel}>
                &times;
              </span>
            </div>
            <div className="createOptions">
              <button
                className="createButton optionButton"
                onClick={handleCreateFromScratch}
                disabled={createLoading}
              >
                <Icon name="file outline" /> Create from Scratch
              </button>
              <button
                className="createButton optionButton"
                onClick={() => setCreateMode("copy")}
                disabled={publicLoading}
              >
                <Icon name="copy outline" /> Copy from Public Template
              </button>
            </div>
            {createMode === "copy" && (
              <div className="dropdownSection">
                <Dropdown
                  placeholder="Select a public project board"
                  fluid
                  selection
                  options={dropdownTemplates}
                  onChange={(e, { value }) => setSelectedTemplateId(value)}
                  value={selectedTemplateId}
                  loading={publicLoading}
                />
                <button
                  className="createButton optionButton"
                  onClick={handleCopyFromPublic}
                  disabled={copyLoading || !selectedTemplateId}
                >
                  <Icon name="copy" /> Copy Selected Template
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {authoredData?.proposalBoards?.length ? (
        <div className="cardGrid">
          {authoredData.proposalBoards.map((board) => (
            <div key={board.id} className="projectCard">
              <h3>{board.title}</h3>
              <p className="description">
                {board.description
                  ? board.description.length > 100
                    ? `${board.description.substring(0, 100)}...`
                    : board.description
                  : "No description provided."}
              </p>
              <div className="meta">
                <p>
                  <strong>Used in Classes:</strong>{" "}
                  {board.templateForClasses.length
                    ? board.templateForClasses
                        .map((c) => `${c.title} (${c.code || "No code"})`)
                        .join(", ")
                    : "None"}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(board.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="cardActions">
                <Link href={`/dashboard/boards/manage?id=${board.id}`}>
                  <button className="viewButton" title="Manage Classes">
                    <Icon name="folder open" />
                  </button>
                </Link>
                <Link href={`/dashboard/boards/edit?id=${board.id}`}>
                  <button className="editButton" title="Edit">
                    <Icon name="edit" />
                  </button>
                </Link>
                <button
                  className="duplicateButton"
                  onClick={() => handleCopy(board.id)}
                  disabled={copyLoading}
                  title="Duplicate"
                >
                  <Icon name="copy" />
                </button>
                <button
                  className="deleteButton"
                  onClick={() => handleDelete(board.id)}
                  disabled={deleteLoading}
                  title="Delete"
                >
                  <Icon name="trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>You haven't authored any project boards yet.</p>
      )}
    </StyledBoards>
  );
};

export default TeacherProjects;
