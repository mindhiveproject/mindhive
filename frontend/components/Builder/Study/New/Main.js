import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import Link from "next/link";
import useForm from "../../../../lib/useForm";

import { StyledBuilderArea } from "../../../styles/StyledBuilder";
import { StyledInput } from "../../../styles/StyledForm";

import { CREATE_STUDY } from "../../../Mutations/Study";
import { MY_STUDIES } from "../../../Queries/Study";

import LinkClass from "../Navigation/Connect/LinkClass";
import Collaborators from "../../../Global/Collaborators";

export default function NewStudy({ query, user }) {
  const userClasses = [
    ...user?.teacherIn.map((cl) => cl?.id),
    ...user?.mentorIn.map((cl) => cl?.id),
    ...user?.studentIn.map((cl) => cl?.id),
  ];

  const { inputs, handleChange } = useForm({
    projectName: "",
    collaborators: [{ id: user?.id }],
    clases: [],
  });

  const router = useRouter();

  const [
    createStudy,
    { data: studyData, loading: studyLoading, error: studyError },
  ] = useMutation(CREATE_STUDY, {
    refetchQueries: [{ query: MY_STUDIES, variables: { id: user?.id } }],
  });

  const saveNewProject = async () => {
    if (!inputs?.projectName) {
      return alert("Give your project a name");
    }
    const collaboratorsIncludingAuthor = [
      ...inputs?.collaborators,
      { id: user?.id },
    ];
    const study = await createStudy({
      variables: {
        input: {
          title: inputs?.projectName + "-study",
          projectName: inputs?.projectName,
          collaborators: collaboratorsIncludingAuthor?.length
            ? {
                connect: collaboratorsIncludingAuthor?.map((cl) => ({
                  id: cl?.id,
                })),
              }
            : null,
          classes: inputs?.classes?.length
            ? { connect: inputs?.classes?.map((cl) => ({ id: cl?.id })) }
            : null,
          settings: {
            forbidRetake: true,
            hideParticipateButton: false,
            showEmailNotificationPropmt: false,
            askStudentsNYC: false,
            zipCode: false,
            guestParticipation: false,
            consentObtained: false,
            proceedToFirstTask: false,
            useExternalDevices: false,
            sonaId: false,
            minorsBlocked: false,
          },
        },
      },
    });

    router.push({
      pathname: `/builder/studies/`,
      query: {
        selector: study?.data?.createStudy?.id,
      },
    });
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
            <div>
              <div className="title">Select the class</div>
              <LinkClass study={inputs} handleChange={handleChange} />
            </div>

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
