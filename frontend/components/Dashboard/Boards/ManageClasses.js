import { useRouter } from "next/router";
import { useQuery, useMutation } from "@apollo/client";
import { useState, useEffect } from "react";
import { Dropdown, Button, Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";
import { GET_PROPOSAL_TEMPLATE_CLASSES } from "../../Queries/Proposal";
import { GET_TEACHER_CLASSES, GET_MENTOR_CLASSES } from "../../Queries/Classes";
import { GET_USERNAMES_WHERE } from "../../Queries/User";
import { GET_BOARD_ASSIGNMENTS } from "../../Queries/Assignment";
import { UPDATE_PROJECT_BOARD } from "../../Mutations/Proposal"; // Adjust path to mutations
import { EDIT_ASSIGNMENT } from "../../Mutations/Assignment";
import StyledBoards from "../../styles/StyledBoards"; // Adjust path

export default function ManageTemplateClasses({ user, boardId }) {
  const router = useRouter();
  const { t } = useTranslation("classes");

  const userClasses = [
    ...user?.teacherIn.map((cl) => cl?.id),
    ...user?.mentorIn.map((cl) => cl?.id),
    ...user?.studentIn.map((cl) => cl?.id),
  ];

  const {
    data: boardData,
    loading: boardLoading,
    error: boardError,
  } = useQuery(GET_PROPOSAL_TEMPLATE_CLASSES, {
    variables: { id: boardId },
    skip: !boardId,
  });

  // Fetch all assignments attached to any card on this board
  const { data: boardAssignmentsData, loading: boardAssignmentsLoading } = useQuery(
    GET_BOARD_ASSIGNMENTS,
    { variables: { boardId }, skip: !boardId }
  );

  const {
    data: mentorData,
    loading: mentorLoading,
    error: mentorError,
  } = useQuery(GET_MENTOR_CLASSES, {
    variables: { userId: user?.id },
    skip: !user?.id,
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
  const [updateAssignment] = useMutation(EDIT_ASSIGNMENT);

  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState([]);

  useEffect(() => {
    if (boardData?.proposalBoard?.templateForClasses) {
      setSelectedClasses(
        boardData.proposalBoard.templateForClasses.map((c) => c.id)
      );
    }
  }, [boardData]);

  useEffect(() => {
    if (boardData?.proposalBoard?.collaborators) {
      setSelectedCollaborators(
        boardData.proposalBoard.collaborators.map((c) => c.id)
      );
    }
  }, [boardData]);

  const {
    data: possibleCollaboratorsData,
    loading: collabLoading,
    error: collabError,
  } = useQuery(GET_USERNAMES_WHERE, {
    variables: {
      input: {
        OR: [
          { permissions: { some: { name: { equals: "ADMIN" } } } },
          { studentIn: { some: { id: { in: userClasses } } } },
          { teacherIn: { some: { id: { in: userClasses } } } },
          { mentorIn: { some: { id: { in: userClasses } } } },
        ],
      },
    },
    skip: userClasses.length === 0 || !boardData,
  });

  if (!user) return <p>{t("boardManagement.pleaseLogin")}</p>;
  if (boardLoading || classesLoading || mentorLoading || collabLoading || boardAssignmentsLoading)
    return <p>{t("boardManagement.loading")}</p>;
  if (boardError)
    return (
      <p>
        {t("boardManagement.error")}: {boardError.message}
      </p>
    );
  if (classesError)
    return (
      <p>
        {t("boardManagement.error")}: {classesError.message}
      </p>
    );
  if (mentorError)
    return (
      <p>
        {t("boardManagement.error")}: {mentorError.message}
      </p>
    );
  if (collabError)
    return (
      <p>
        {t("boardManagement.error")}: {collabError.message}
      </p>
    );
  if (!boardData?.proposalBoard)
    return <p>{t("boardManagement.boardNotFound")}</p>;

  const board = boardData.proposalBoard;
  const teacherClasses = classesData?.classes || [];
  const mentorClasses = mentorData?.classes || [];
  const clonedBoards = board.prototypeFor || [];
  const possibleUsers = possibleCollaboratorsData?.profiles || [];

  const combinedClassesMap = new Map();

  // Add teacher classes with "(teacher)" label
  teacherClasses.forEach((c) => {
    combinedClassesMap.set(c.id, {
      key: c.id,
      text: `${c.title} (${c.code || t("boardManagement.noCode")}) (teacher)`,
      value: c.id,
    });
  });

  // Add mentor classes only if not already added as teacher, with "(mentor)" label
  mentorClasses.forEach((c) => {
    if (!combinedClassesMap.has(c.id)) {
      combinedClassesMap.set(c.id, {
        key: c.id,
        text: `${c.title} (${c.code || t("boardManagement.noCode")}) (mentor)`,
        value: c.id,
      });
    }
  });

  const classOptions = Array.from(combinedClassesMap.values());

  const combinedCollaboratorsMap = new Map();

  // Add possible collaborators
  possibleUsers.forEach((user) => {
    combinedCollaboratorsMap.set(user.id, {
      key: user.username,
      text: user.username,
      value: user.id,
    });
  });

  // Add existing collaborators if not already included
  board.collaborators.forEach((c) => {
    if (!combinedCollaboratorsMap.has(c.id)) {
      combinedCollaboratorsMap.set(c.id, {
        key: c.username,
        text: c.username,
        value: c.id,
      });
    }
  });

  const collabOptions = Array.from(combinedCollaboratorsMap.values());

  const handleClassesChange = (e, { value }) => {
    setSelectedClasses(value);
  };

  const handleCollaboratorsChange = (e, { value }) => {
    setSelectedCollaborators(value);
  };

  const handleSave = async () => {
    const initialClassIds = board.templateForClasses.map((c) => c.id);
    const connectClasses = selectedClasses
      .filter((id) => !initialClassIds.includes(id))
      .map((id) => ({ id }));
    const disconnectClasses = initialClassIds
      .filter((id) => !selectedClasses.includes(id))
      .map((id) => ({ id }));

    const initialCollabIds = board.collaborators.map((c) => c.id);
    const connectCollaborators = selectedCollaborators
      .filter((id) => !initialCollabIds.includes(id))
      .map((id) => ({ id }));
    const disconnectCollaborators = initialCollabIds
      .filter((id) => !selectedCollaborators.includes(id))
      .map((id) => ({ id }));

    try {
      await updateProposalBoard({
        variables: {
          id: boardId,
          input: {
            templateForClasses: {
              connect: connectClasses,
              disconnect: disconnectClasses,
            },
            collaborators: {
              connect: connectCollaborators,
              disconnect: disconnectCollaborators,
            },
          },
        },
        refetchQueries: [
          { query: GET_PROPOSAL_TEMPLATE_CLASSES, variables: { id: boardId } },
        ],
      });

      // After saving class associations on the board, ensure all board assignments are linked/unlinked to the selected classes
      const assignments = boardAssignmentsData?.assignments || [];
      const selectedClassIds = new Set(selectedClasses);
      const initialClassIdsSet = new Set(initialClassIds);
      
      await Promise.all(
        assignments.map(async (a) => {
          const existing = new Set((a.classes || []).map((c) => c.id));
          
          // Connect assignments to newly selected classes
          const toConnect = Array.from(selectedClassIds).filter((id) => !existing.has(id));
          
          // Disconnect assignments from classes that are being removed from the board
          const toDisconnect = Array.from(existing).filter((id) => 
            initialClassIdsSet.has(id) && !selectedClassIds.has(id)
          );
          
          if (toConnect.length > 0 || toDisconnect.length > 0) {
            await updateAssignment({
              variables: {
                id: a.id,
                input: {
                  classes: {
                    ...(toConnect.length > 0 && { connect: toConnect.map((id) => ({ id })) }),
                    ...(toDisconnect.length > 0 && { disconnect: toDisconnect.map((id) => ({ id })) }),
                  },
                },
              },
            });
          }
        })
      );
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
        <h1>
          {t("boardManagement.manageClassesForTemplate")} {board.title}
        </h1>
        <p>{t("boardManagement.selectClassesDescription")}</p>
        <div className="manageActions">
          <Dropdown
            placeholder={t("boardManagement.selectClasses")}
            fluid
            multiple
            selection
            options={classOptions}
            value={selectedClasses}
            onChange={handleClassesChange}
            className="manageDropdown"
          />
          <h2>
            {t("boardManagement.manageCollaborators") || "Manage Collaborators"}
          </h2>
          <Dropdown
            placeholder={
              t("boardManagement.selectCollaborators") || "Select collaborators"
            }
            fluid
            multiple
            search
            selection
            lazyLoad
            options={collabOptions}
            value={selectedCollaborators}
            onChange={handleCollaboratorsChange}
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
        <h2>{t("boardManagement.studentProposalBoards")}</h2>
        <br></br>
        {clonedBoards.length === 0 ? (
          <p>{t("boardManagement.noClonedProposals")}</p>
        ) : (
          <div className="clonedBoardsGrid">
            {clonedBoards.map((cloned) => (
              <div key={cloned.id} className="clonedBoardItem">
                <h3>{cloned.title}</h3>
                <p>
                  <strong>{t("boardManagement.author")}:</strong>{" "}
                  {cloned.author?.username || t("boardManagement.none")}
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
