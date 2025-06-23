import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import Link from "next/link";
import useForm from "../../../../lib/useForm";

import { StyledBuilderArea } from "../../../styles/StyledBuilder";
import { StyledInput } from "../../../styles/StyledForm";
import { MessageHeader, Message } from "semantic-ui-react";

import LinkClass from "./LinkClass";
import Collaborators from "../../../Global/Collaborators";

import { GET_USER_CLASSES } from "../../../Queries/User";
import {
  DEFAULT_PROJECT_BOARDS,
  GET_MY_PROJECT_BOARDS_IN_CLASS,
} from "../../../Queries/Proposal";
import { COPY_PROPOSAL_MUTATION } from "../../../Mutations/Proposal";

import { useEffect } from "react";
import useTranslation from "next-translate/useTranslation";

export default function StartProject({ query, user }) {
  const { t } = useTranslation("builder");
  const { data, error } = useQuery(GET_USER_CLASSES);
  const studentClasses = data?.authenticatedItem?.studentIn || [];
  const userClasses = [
    ...user?.teacherIn.map((cl) => cl?.id),
    ...user?.mentorIn.map((cl) => cl?.id),
    ...user?.studentIn.map((cl) => cl?.id),
  ];

  const isStudent = user?.permissions.map((p) => p?.name).includes("STUDENT");

  const { data: proposalData } = useQuery(DEFAULT_PROJECT_BOARDS);
  const defaultProposalBoardId =
    proposalData?.proposalBoards?.map((p) => p?.id)[0] || [];

  const { inputs, handleChange } = useForm({
    projectName: "",
    collaborators: [{ id: user?.id }],
    class: studentClasses?.length ? studentClasses[0] : undefined,
  });

  const {
    data: dataProjects,
    error: errorProjects,
    refetch,
  } = useQuery(GET_MY_PROJECT_BOARDS_IN_CLASS, {
    variables: {
      userId: user?.id,
      classId: inputs?.class?.id,
    },
    skip: !inputs?.class?.id,
  });

  // get the class template proposal ID that has to be copied
  const classTemplateProposalId = inputs?.class?.templateProposal?.id;

  useEffect(() => {
    function selectClass() {
      handleChange({
        target: {
          name: "class",
          value: studentClasses[0],
        },
      });
    }
    if (studentClasses && studentClasses.length) {
      selectClass();
    }
  }, [studentClasses]);

  const router = useRouter();

  const [copyProposal, { loading }] = useMutation(COPY_PROPOSAL_MUTATION, {
    variables: {},
    refetchQueries: [],
  });

  const saveNewProject = async () => {
    if (!inputs?.projectName) {
      return alert(t('newProject.giveNameAlert'));
    }

    const res = await copyProposal({
      variables: {
        id: classTemplateProposalId || defaultProposalBoardId,
        title: inputs?.projectName,
        classIdUsed: inputs?.class?.id,
        collaborators: inputs?.collaborators.map((c) => c?.id),
      },
    });
    if (res?.data?.copyProposalBoard) {
      router.push({
        pathname: `/builder/projects/`,
        query: {
          selector: res?.data?.copyProposalBoard?.id,
        },
      });
    }
  };

  return (
    <StyledBuilderArea>
      <div className="navigation">
        <div className="firstLineNewProject">
          <div>
            <Link
              href={{
                pathname: `/dashboard/develop`,
              }}
            >
              {t('newProject.backToHome')}
            </Link>
          </div>
          <div className="centralPanel">
            {inputs?.projectName || t('newProject.untitledProject')}
          </div>
        </div>
      </div>
      <div className="newProject">
        {!classTemplateProposalId && isStudent ? (
          <>
            <div className="modalEmpty">
              <div className="title">
                {t('newProject.noTemplatesTitle')}
              </div>
              <div className="subtitle">
                {t('newProject.noTemplatesSubtitle')}
              </div>

              {studentClasses && studentClasses.length > 1 && (
                <div>
                  <div className="title">{t('newProject.selectClass')}</div>
                  <LinkClass
                    classes={studentClasses}
                    project={inputs}
                    handleChange={handleChange}
                    refetchUserProjectsInClass={refetch}
                  />
                </div>
              )}

              <Link
                href={{
                  pathname: `/dashboard/develop/studies`,
                }}
              >
                <div className="backBtn">{t('newProject.goBackHome')}</div>
              </Link>
            </div>
          </>
        ) : (
          <div className="modal">
            <StyledInput>
              <div className="title">{t('newProject.nameYourProject')}</div>
              <div className="message">
                {t('newProject.nameMessage')}
              </div>

              <input
                type="text"
                name="projectName"
                placeholder={t('newProject.namePlaceholder')}
                value={inputs.projectName}
                onChange={handleChange}
              />

              {studentClasses && studentClasses.length > 1 && (
                <div>
                  <div className="title">{t('newProject.selectClass')}</div>
                  <LinkClass
                    classes={studentClasses}
                    project={inputs}
                    handleChange={handleChange}
                    refetchUserProjectsInClass={refetch}
                  />
                </div>
              )}

              <div>
                <div className="title">{t('newProject.addCollaborators')}</div>
                <Collaborators
                  userClasses={userClasses}
                  collaborators={
                    (inputs && inputs?.collaborators?.map((c) => c?.id)) || []
                  }
                  handleChange={handleChange}
                />
              </div>

              {dataProjects && dataProjects?.proposalBoards.length > 1 && (
                <Message warning>
                  <MessageHeader>
                    {t('newProject.alreadyAssociatedTitle')}
                  </MessageHeader>
                  <p>
                    {t('newProject.alreadyAssociatedWarning')}
                  </p>
                </Message>
              )}
            </StyledInput>
            <button onClick={saveNewProject}>{t('newProject.createProject')}</button>
          </div>
        )}
      </div>
    </StyledBuilderArea>
  );
}
