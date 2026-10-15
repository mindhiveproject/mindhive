import { useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client";

import {
  PROPOSAL_TEMPLATES_QUERY,
  CLASS_TEMPLATE_PROJECTS_QUERY,
  OVERVIEW_PROPOSAL_BOARD_QUERY,
  GET_MY_AUTHORED_PROJECT_BOARDS,
} from "../../../../Queries/Proposal";
import {
  COPY_PROPOSAL_MUTATION,
  CREATE_NEW_PROPOSAL_AS_AUTHOR,
  UPDATE_PROJECT_BOARD,
  SYNC_CLASS_TEMPLATE_BOARDS,
} from "../../../../Mutations/Proposal";
import { EDIT_CLASS } from "../../../../Mutations/Classes";
import { GET_CLASS } from "../../../../Queries/Classes";

export const TEMPLATE_SOURCE_PUBLIC = "public";
export const TEMPLATE_SOURCE_OWNED = "owned";

// Templates a class board can start from, and the two ways to create one
// (copy a template, or start blank). Nothing is written until a create call.
// Each template carries `templateSource`: a public library template, or a
// board the teacher owns.
export default function useCreateClassBoard({ myclass, user, initialTemplateId }) {
  const classId = myclass?.id;
  const code = myclass?.code;

  const { data, loading } = useQuery(PROPOSAL_TEMPLATES_QUERY);
  const publicTemplates = data?.proposalBoards || [];

  const { data: authoredData } = useQuery(GET_MY_AUTHORED_PROJECT_BOARDS, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  const { data: classTemplatesData } = useQuery(CLASS_TEMPLATE_PROJECTS_QUERY, {
    variables: { classId },
    skip: !classId,
  });

  const classTemplateIds = useMemo(() => {
    const boards = classTemplatesData?.proposalBoards || [];
    return new Set(boards.map((board) => board.id));
  }, [classTemplatesData]);

  // The teacher's boards used as templates in other classes, not this one.
  const mineTemplates = useMemo(() => {
    const authoredBoards = authoredData?.proposalBoards || [];
    return authoredBoards.filter(
      (board) =>
        !board.isTemplate
        && board.templateForClasses?.length > 0
        && !classTemplateIds.has(board.id)
    );
  }, [authoredData, classTemplateIds]);

  // A template opened by link (e.g. from Discover) may not be in the lists.
  const needsInitialTemplate =
    !!initialTemplateId
    && !publicTemplates.some((item) => item.id === initialTemplateId)
    && !mineTemplates.some((item) => item.id === initialTemplateId);

  const { data: initialTemplateData, loading: initialTemplateLoading } =
    useQuery(OVERVIEW_PROPOSAL_BOARD_QUERY, {
      variables: { id: initialTemplateId },
      skip: !needsInitialTemplate,
    });

  const templates = useMemo(() => {
    const byId = new Map();
    publicTemplates.forEach((item) =>
      byId.set(item.id, { ...item, templateSource: TEMPLATE_SOURCE_PUBLIC })
    );
    mineTemplates.forEach((item) => {
      if (!byId.has(item.id)) {
        byId.set(item.id, { ...item, templateSource: TEMPLATE_SOURCE_OWNED });
      }
    });
    const initial = initialTemplateData?.proposalBoard;
    if (initial?.id && !byId.has(initial.id)) {
      byId.set(initial.id, {
        ...initial,
        templateSource: initial.isTemplate
          ? TEMPLATE_SOURCE_PUBLIC
          : initial.author?.id && initial.author.id === user?.id
            ? TEMPLATE_SOURCE_OWNED
            : null,
      });
    }
    return Array.from(byId.values());
  }, [publicTemplates, mineTemplates, initialTemplateData, user?.id]);

  const refetchQueries = [
    { query: CLASS_TEMPLATE_PROJECTS_QUERY, variables: { classId } },
    // The class's own board list feeds the board row above the tabs.
    { query: GET_CLASS, variables: { code } },
  ];

  const [copyProposal, { loading: copyLoading }] = useMutation(
    COPY_PROPOSAL_MUTATION,
    { refetchQueries, awaitRefetchQueries: true }
  );
  const [createProposal, { loading: createLoading }] = useMutation(
    CREATE_NEW_PROPOSAL_AS_AUTHOR
  );
  const [updateProjectBoard, { loading: linkLoading }] = useMutation(
    UPDATE_PROJECT_BOARD
  );
  const [syncClassTemplateBoards, { loading: syncLoading }] = useMutation(
    SYNC_CLASS_TEMPLATE_BOARDS,
    { refetchQueries, awaitRefetchQueries: true }
  );
  const [editClass, { loading: editClassLoading }] = useMutation(EDIT_CLASS, {
    refetchQueries,
  });

  const creating =
    copyLoading || createLoading || linkLoading || syncLoading || editClassLoading;

  // Returns the new board's id.
  const createFromTemplate = async ({ templateId, title }) => {
    const res = await copyProposal({
      variables: {
        id: templateId,
        classIdTemplate: classId,
        ...(title ? { title } : {}),
      },
    });
    return res?.data?.copyProposalBoard?.id ?? null;
  };

  // Returns the new board's id.
  const createBlank = async ({ title, description }) => {
    if (!classId || !user?.id) return null;
    const res = await createProposal({
      variables: {
        title,
        description,
        settings: null,
        authorId: user.id,
      },
    });
    const newBoardId = res?.data?.createProposalBoard?.id;
    if (!newBoardId) return null;

    await updateProjectBoard({
      variables: {
        id: newBoardId,
        input: {
          templateForClasses: { connect: [{ id: classId }] },
          templatesForClass: { connect: [{ id: classId }] },
        },
      },
    });

    await syncClassTemplateBoards({ variables: { classId } });

    if (!myclass?.templateProposal?.id) {
      await editClass({
        variables: {
          id: classId,
          templateProposal: { connect: { id: newBoardId } },
        },
      });
    }
    return newBoardId;
  };

  return {
    templates,
    templatesLoading: loading && !data,
    initialTemplateLoading: needsInitialTemplate && initialTemplateLoading,
    creating,
    createFromTemplate,
    createBlank,
  };
}
