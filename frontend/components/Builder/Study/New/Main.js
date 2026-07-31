import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import useForm from "../../../../lib/useForm";

import { StyledBuilderArea } from "../../../styles/StyledBuilder";
import Button from "../../../DesignSystem/Button";

import { CREATE_STUDY } from "../../../Mutations/Study";
import { MY_STUDIES } from "../../../Queries/Study";

import LinkClass from "../Navigation/Connect/LinkClass";
import Collaborators from "../../../Global/Collaborators";

export default function NewStudy({ query, user }) {
  const { t } = useTranslation("builder");
  const ownerId = user?.id;
  const isStudent = user?.permissions?.map((p) => p?.name).includes("STUDENT");
  const userClasses = [
    ...user?.teacherIn.map((cl) => cl?.id),
    ...user?.mentorIn.map((cl) => cl?.id),
    ...user?.studentIn.map((cl) => cl?.id),
  ];

  const { inputs, handleChange } = useForm(
    {
      projectName: "",
      collaborators: ownerId ? [{ id: ownerId }] : [],
      classes: [],
    },
    { freezeInitialSync: true }
  );

  const collaboratorIdsForUi = (inputs?.collaborators || [])
    .map((c) => c?.id)
    .filter((id) => id && id !== ownerId);

  const handleCollaboratorsChange = (e) => {
    const selected = e?.target?.value || [];
    const withoutOwner = selected.filter((c) => c?.id !== ownerId);
    handleChange({
      target: {
        name: "collaborators",
        value: ownerId
          ? [{ id: ownerId }, ...withoutOwner]
          : withoutOwner,
      },
    });
  };

  const selectedClass = inputs?.classes?.[0] || null;

  const router = useRouter();

  const [createStudy, { loading: studyLoading }] = useMutation(CREATE_STUDY, {
    refetchQueries: [{ query: MY_STUDIES, variables: { id: user?.id } }],
  });

  const saveNewProject = async () => {
    if (!inputs?.projectName) {
      return alert(
        t("newProject.giveNameAlertStudy", {}, {
          default: "Give your study a name",
        })
      );
    }
    const collaboratorsIncludingAuthor = [
      ...(inputs?.collaborators || []).filter((c) => c?.id !== ownerId),
      ...(ownerId ? [{ id: ownerId }] : []),
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
            guestParticipation: true,
            consentObtained: false,
            proceedToFirstTask: true,
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
      <div className="newProject">
        <div className="modal">
          <div className="formSections">
            <div className="formSection">
              <div className="title">
                {t("newProject.nameYourStudy", {}, {
                  default: "Name your study",
                })}
              </div>
              <div className="helpText">
                {t("newProject.nameMessageStudy", {}, {
                  default:
                    "Give your study a name. This is what you want to call your work space.",
                })}
              </div>
              <input
                type="text"
                name="projectName"
                placeholder={t("newProject.namePlaceholderStudy", {}, {
                  default: "The name of my study is ",
                })}
                value={inputs.projectName}
                onChange={handleChange}
              />
            </div>

            <div className="formSection">
              <div className="title">
                {t("newProject.selectClass", {}, {
                  default: "Select the class",
                })}
              </div>
              <LinkClass study={inputs} handleChange={handleChange} />
            </div>

            <div className="formSection">
              <div className="title">
                {t("newProject.addCollaborators", {}, {
                  default: "Add collaborators",
                })}
              </div>
              <Collaborators
                userClasses={userClasses}
                collaborators={collaboratorIdsForUi}
                handleChange={handleCollaboratorsChange}
                selectedClass={selectedClass}
                isStudent={isStudent}
                excludeUserId={ownerId}
              />
            </div>
          </div>

          <div className="createAction createActionSplit">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push("/dashboard/develop")}
            >
              {t("newProject.backToHome", {}, {
                default: "← Back to home",
              })}
            </Button>
            <Button
              variant="filled"
              onClick={saveNewProject}
              disabled={studyLoading}
            >
              {t("newProject.createStudy", {}, {
                default: "Create Study",
              })}
            </Button>
          </div>
        </div>
      </div>
    </StyledBuilderArea>
  );
}
