import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import Link from "next/link";
import { Icon, Dropdown } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import StyledBoards from "../../styles/StyledBoards"; // Adjust path to your StyledBoards.js
import {
  GET_MY_AUTHORED_PROJECT_BOARDS,
  GET_MY_COLLABORATED_PROJECT_BOARDS,
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
  const { t } = useTranslation("classes");
  
  const {
    data: authoredData,
    loading: authoredLoading,
    error: authoredError,
    refetch,
  } = useQuery(GET_MY_AUTHORED_PROJECT_BOARDS, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  const {
    data: collaboratedData,
    loading: collaboratedLoading,
    error: collaboratedError,
  } = useQuery(GET_MY_COLLABORATED_PROJECT_BOARDS, {
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
          title: t("boardManagement.newBoard"),
          description: t("boardManagement.newBoardDesc"),
          settings: null, // Optional, can be an empty object {} if needed
          authorId: user?.id,
        },
      });
      if (res?.data?.createProposalBoard) {
        const newBoardId = res.data.createProposalBoard.id;
        alert(t("boardManagement.success"));
        setIsCreating(false);
        refetch();
        window.location.href = `/dashboard/boards/edit?id=${newBoardId}`;
      }
    } catch (err) {
      alert(t("boardManagement.errorCreatingBoard") + err.message);
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
        alert(t("boardManagement.success"));
        refetch();
      }
    } catch (err) {
      alert(t("boardManagement.errorCopyingBoard") + err.message);
    }
  };

  const handleCopyFromPublic = async () => {
    if (!selectedTemplateId) {
      alert(t("boardManagement.selectToCopy"));
      return;
    }
    try {
      const res = await copyProposal({
        variables: {
          id: selectedTemplateId,
        },
      });
      if (res?.data?.copyProposalBoard) {
        alert(t("boardManagement.successCopy"));
        setIsCreating(false);
        refetch();
      }
    } catch (err) {
      alert(t("boardManagement.errorCopyingPublicBoard") + err.message);
    }
  };

  const handleDelete = async (boardId) => {
    if (confirm(t("boardManagement.confirmDelete"))) {
      try {
        await deleteProposal({
          variables: {
            id: boardId,
          },
        });
        alert(t("boardManagement.successDelete"));
        refetch();
      } catch (err) {
        alert(t("boardManagement.errorDeletingBoard") + err.message);
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

  if (!user) return <p>{t("boardManagement.login")}</p>;
  if (authoredLoading) return <p>{t("boardManagement.loading")}</p>;
  if (authoredError)
    return <p>{t("boardManagement.errorLoadingBoards")}{authoredError.message}</p>;

  const authoredIds = new Set(
    authoredData?.proposalBoards?.map((board) => board.id)
  );

  const uniqueCollaboratedBoards = collaboratedData?.proposalBoards?.filter(
    (board) => !authoredIds.has(board.id)
  );


  return (
    <StyledBoards>
      <div className="headerSection">
        <h3>{t("boardManagement.title")}</h3>
        <p style={{fontSize: "18px"}}>{t("boardManagement.intro")}</p>
        <button onClick={handleCreateNew} className="createButton narrowButton">
          {/* <Icon name="plus" /> */}
          {t("boardManagement.createBtn")}
        </button>
      </div>

      {isCreating && (
        <div className="modalOverlay">
          <div className="modalContent">
            <div className="modalHeader">
              <h3>{t("boardManagement.createNew")}</h3>
              <span className="closeBtn" onClick={handleCancel}>
                &times;
              </span>
            </div>
            <div className="createOptions">
              <button
                className="createButton narrowButton"
                onClick={handleCreateFromScratch}
                disabled={createLoading}
              >
                <Icon name="file outline" /> {t("boardManagement.createNewScratch")}
              </button>
              <button
                className="createButton narrowButton"
                onClick={() => setCreateMode("copy")}
                disabled={publicLoading}
              >
                <Icon name="copy outline" /> {t("boardManagement.createFromNewTemplate")}
              </button>
            </div>
            {createMode === "copy" && (
              <div className="dropdownSection">
                <Dropdown
                  placeholder={t("boardManagement.selectPublic")}
                  fluid
                  selection
                  options={dropdownTemplates}
                  onChange={(e, { value }) => setSelectedTemplateId(value)}
                  value={selectedTemplateId}
                  loading={publicLoading}
                />
                <button
                  className="createButton narrowButton"
                  onClick={handleCopyFromPublic}
                  disabled={copyLoading || !selectedTemplateId}
                >
                  <Icon name="copy" />  {t("boardManagement.copySelection")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {authoredData?.proposalBoards?.length ? (
        <div className="cardGrid">
          {[...authoredData.proposalBoards]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((board) => (
            <div key={board.id} className="projectCard">
              <h3>{board.title}</h3>
              <p className="description">
                {board.description
                  ? board.description.length > 100
                    ? `${board.description.substring(0, 100)}...`
                    : board.description
                  : t("boardManagement.noDescription")}
              </p>
              <div className="meta">
                <p>
                  <strong>{t("boardManagement.usedInClasses")}</strong>{" "}
                  {board.templateForClasses.length
                    ? board.templateForClasses
                        .map((c) => `${c.title} (${c.code || t("boardManagement.noCode")})`)
                        .join(", ")
                    : t("boardManagement.none")}
                </p>
                <p>
                  <strong>{t("boardManagement.created")}</strong>{" "}
                  {new Date(board.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="cardActions">
                <Link href={`/dashboard/boards/manage?id=${board.id}`}>
                  <button className="viewButton" title={t("boardManagement.manageClasses")}>
                    <Icon name="folder open" />
                  </button>
                </Link>
                <Link href={`/dashboard/boards/edit?id=${board.id}`}>
                  <button className="editButton" title={t("boardManagement.edit")}>
                    <Icon name="edit" />
                  </button>
                </Link>
                <button
                  className="duplicateButton"
                  onClick={() => handleCopy(board.id)}
                  disabled={copyLoading}
                  title={t("boardManagement.duplicate")}
                >
                  <Icon name="copy" />
                </button>
                <button
                  className="deleteButton"
                  onClick={() => handleDelete(board.id)}
                  disabled={deleteLoading}
                  title={t("boardManagement.delete")}
                >
                  <Icon name="trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>{t("boardManagement.noBoardsYet")}</p>
      )}

      {collaboratedLoading ? (
        <p>{t("boardManagement.loadingCollaborated")}</p>
      ) : uniqueCollaboratedBoards?.length ? (
        <>
          <div style={{margin: "2rem auto", maxWidth: "1200px"}} ><h3>{t("boardManagement.collaboratedTitle")}</h3></div>
          <div className="cardGrid">
            {[...(uniqueCollaboratedBoards || [])]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((board) => (
              <div key={board.id} className="projectCard">
                <h3>{board.title}</h3>
                <p className="description">
                  {board.description
                    ? board.description.length > 100
                      ? `${board.description.substring(0, 100)}...`
                      : board.description
                    : t("boardManagement.noDescription")}
                </p>
                <div className="meta">
                  <p>
                    <strong>{t("boardManagement.created")}</strong>{" "}
                    {new Date(board.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>{t("boardManagement.author")}</strong> {board.author?.username}
                  </p>
                </div>
                <div className="cardActions">
                  <Link href={`/dashboard/boards/manage?id=${board.id}`}>
                    <button className="viewButton" title={t("boardManagement.manageClasses")}>
                      <Icon name="folder open" />
                    </button>
                  </Link>
                  <Link href={`/dashboard/boards/edit?id=${board.id}`}>
                    <button className="editButton" title={t("boardManagement.viewOrEdit")}>  
                      <Icon name="edit" />
                    </button>
                  </Link>
                  <button
                    className="duplicateButton"
                    onClick={() => handleCopy(board.id)}
                    disabled={copyLoading}
                    title={t("boardManagement.duplicate")}
                  >
                    <Icon name="copy" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <></>
      )}
    </StyledBoards>
  );
};

export default TeacherProjects;
