import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import Link from "next/link";
import useForm from "../../../../lib/useForm";

import { StyledBuilderArea } from "../../../styles/StyledBuilder";
import { StyledInput } from "../../../styles/StyledForm";

import LinkClass from "../Navigation/Connect/LinkClass";
import Collaborators from "../../../Global/Collaborators";

import { COPY_PROPOSAL_MUTATION } from "../../../Mutations/Proposal";
import { GET_USER_CLASSES } from "../../../Queries/User";
import { useEffect } from "react";

export default function StartProject({ query, user }) {
  const { data, error } = useQuery(GET_USER_CLASSES);
  const studentClasses = data?.authenticatedItem?.studentIn || [];

  const userClasses = [
    ...user?.teacherIn.map((cl) => cl?.id),
    ...user?.mentorIn.map((cl) => cl?.id),
    ...user?.studentIn.map((cl) => cl?.id),
  ];

  const { inputs, handleChange } = useForm({
    projectName: "",
    collaborators: [{ id: user?.id }],
    class: undefined,
  });

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
    refetchQueries: [
      // { query: STUDY_PROPOSALS_QUERY, variables: { id: studyId } },
    ],
  });

  const saveNewProject = async () => {
    if (!inputs?.projectName) {
      return alert("Give your project a name");
    }

    // get the class template proposal ID that has to be copied
    const classTemplateProposalId = inputs?.class?.templateProposal?.id;

    // TODO if there is no proposal ID for a chosen class, then use a default one
    const defaultProposalBoardId = `cm2wodtfy008abj0rh8ms8yt9`;

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
                pathname: `/dashboard/develop/studies`,
              }}
            >
              ← Back to home
            </Link>
          </div>
          <div className="centralPanel">
            {inputs?.projectName || `Untitled Project`}
          </div>
        </div>
      </div>
      <div className="newProject">
        <div className="modal">
          <StyledInput>
            <div className="title">Name your project</div>
            <div className="message">
              Give your project a name. This is not the study's title, but what
              you want to call your work space.
            </div>

            <input
              type="text"
              name="projectName"
              placeholder="The name of my project is "
              value={inputs.projectName}
              onChange={handleChange}
            />

            {studentClasses && studentClasses.length > 1 && (
              <div>
                <div className="title">Select the class</div>
                <LinkClass
                  classes={studentClasses}
                  study={inputs}
                  handleChange={handleChange}
                />
              </div>
            )}

            <div>
              <div className="title">Add collaborators</div>
              <Collaborators
                userClasses={userClasses}
                collaborators={
                  (inputs && inputs?.collaborators?.map((c) => c?.id)) || []
                }
                handleChange={handleChange}
              />
            </div>
          </StyledInput>
          <button onClick={saveNewProject}>Create Project</button>
        </div>
      </div>
    </StyledBuilderArea>
  );
}
