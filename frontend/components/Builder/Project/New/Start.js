import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import Link from "next/link";
import useForm from "../../../../lib/useForm";

import { StyledBuilderArea } from "../../../styles/StyledBuilder";
import { MessageHeader, Message } from "semantic-ui-react";

import Collaborators from "../../../Global/Collaborators";
import TemplateOptionCards from "./TemplateOptionCards";
import Button from "../../../DesignSystem/Button";
import Chip from "../../../DesignSystem/Chip";

import { GET_USER_CLASSES } from "../../../Queries/User";
import {
  DEFAULT_PROJECT_BOARDS,
  GET_MY_PROJECT_BOARDS_IN_CLASS,
  TEMPLATE_PROPOSAL_BOARDS_LITE,
} from "../../../Queries/Proposal";
import { COPY_PROPOSAL_MUTATION } from "../../../Mutations/Proposal";

import {
  getOptionKey,
  getPublicTemplateOptions,
  getVisibleTemplateOptionsForClasses,
} from "../../../../lib/classTemplateBoards";
import { useEffect, useMemo, useState } from "react";
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
  const isProjectFlow = isStudent;
  const ownerId = user?.id;

  const { data: proposalData } = useQuery(DEFAULT_PROJECT_BOARDS);
  const defaultProposalBoardId =
    proposalData?.proposalBoards?.map((p) => p?.id)[0] || [];

  const { inputs, handleChange } = useForm({
    projectName: "",
    collaborators: [{ id: ownerId }],
    class: studentClasses?.length ? studentClasses[0] : undefined,
  });

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

  const handleClassSelect = (cl) => {
    handleChange({
      target: {
        name: "class",
        value: cl,
      },
    });
    refetch();
  };

  const classOptions = useMemo(
    () => getVisibleTemplateOptionsForClasses(studentClasses),
    [studentClasses]
  );

  const {
    data: publicTemplateData,
    loading: publicTemplatesLoading,
  } = useQuery(TEMPLATE_PROPOSAL_BOARDS_LITE, {
    skip: classOptions.length > 0,
  });

  const publicOptions = useMemo(() => {
    if (classOptions.length > 0) return [];
    return getPublicTemplateOptions(publicTemplateData?.proposalBoards);
  }, [classOptions.length, publicTemplateData?.proposalBoards]);

  const templateOptions =
    classOptions.length > 0 ? classOptions : publicOptions;
  const usingPublicFallback =
    classOptions.length === 0 && publicOptions.length > 0;
  const hasAnyTemplates = templateOptions.length > 0;
  const showTemplatePicker = hasAnyTemplates;
  const showEmptyState =
    isStudent
    && classOptions.length === 0
    && !publicTemplatesLoading
    && publicOptions.length === 0;

  const [selectedOptionKey, setSelectedOptionKey] = useState(null);

  const selectedOption = useMemo(
    () =>
      templateOptions.find(
        (option) => getOptionKey(option) === selectedOptionKey
      ) ?? null,
    [templateOptions, selectedOptionKey]
  );

  useEffect(() => {
    if (inputs?.class?.id || !studentClasses?.length) return;
    handleChange({
      target: {
        name: "class",
        value: studentClasses[0],
      },
    });
  }, [studentClasses]);

  useEffect(() => {
    if (templateOptions.length === 0) {
      setSelectedOptionKey(null);
      return;
    }

    setSelectedOptionKey((current) => {
      if (
        current
        && templateOptions.some((option) => getOptionKey(option) === current)
      ) {
        const option = templateOptions.find(
          (item) => getOptionKey(item) === current
        );
        if (option?.class) {
          handleChange({
            target: {
              name: "class",
              value: option.class,
            },
          });
        }
        return current;
      }

      const first = templateOptions[0];
      if (first?.class) {
        handleChange({
          target: {
            name: "class",
            value: first.class,
          },
        });
      }
      return getOptionKey(first);
    });
  }, [templateOptions]);

  const router = useRouter();

  const [copyProposal, { loading }] = useMutation(COPY_PROPOSAL_MUTATION, {
    variables: {},
    refetchQueries: [],
  });

  const handleTemplateSelect = (key) => {
    setSelectedOptionKey(key);
    const option = templateOptions.find(
      (item) => getOptionKey(item) === key
    );
    if (option?.class) {
      handleChange({
        target: {
          name: "class",
          value: option.class,
        },
      });
      refetch();
    }
  };

  const saveNewProject = async () => {
    if (!inputs?.projectName) {
      return alert(
        isProjectFlow
          ? t("newProject.giveNameAlert")
          : t("newProject.giveNameAlertStudy", {}, {
              default: "Give your study a name",
            })
      );
    }

    const templateId = selectedOption?.board?.id;
    const classIdUsed = selectedOption?.class?.id ?? inputs?.class?.id;

    if (showTemplatePicker && !templateId) {
      return alert(
        t("newProject.selectTemplateAlert", {}, {
          default: "Please choose the proposal template",
        })
      );
    }

    const res = await copyProposal({
      variables: {
        id: templateId || defaultProposalBoardId,
        title: inputs?.projectName,
        classIdUsed,
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

  const showClassChips =
    studentClasses
    && studentClasses.length > 1
    && (usingPublicFallback || !showTemplatePicker);

  const classChipRow = showClassChips ? (
    <div className="formSection">
      <div className="title">{t("newProject.selectClass")}</div>
      <div
        className="classChipRow"
        role="radiogroup"
        aria-label={t("newProject.selectClass")}
      >
        {studentClasses.map((cl) => (
          <Chip
            key={cl.id}
            label={cl.title}
            selected={inputs?.class?.id === cl.id}
            onClick={() => handleClassSelect(cl)}
          />
        ))}
      </div>
    </div>
  ) : null;

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
              {t("newProject.backToHome")}
            </Link>
          </div>
          <div className="centralPanel">
            {inputs?.projectName
              || (isProjectFlow
                ? t("newProject.untitledProject")
                : t("newProject.untitledStudy", {}, {
                    default: "Untitled Study",
                  }))}
          </div>
        </div>
      </div>
      <div className="newProject">
        {showEmptyState ? (
          <>
            <div className="modalEmpty">
              <div className="title">
                {t("newProject.noTemplatesTitle")}
              </div>
              <div className="subtitle">
                {t("newProject.noTemplatesSubtitle")}
              </div>

              {studentClasses && studentClasses.length > 1 && (
                <div className="formSection">
                  <div className="title">{t("newProject.selectClass")}</div>
                  <div
                    className="classChipRow"
                    role="radiogroup"
                    aria-label={t("newProject.selectClass")}
                  >
                    {studentClasses.map((cl) => (
                      <Chip
                        key={cl.id}
                        label={cl.title}
                        selected={inputs?.class?.id === cl.id}
                        onClick={() => handleClassSelect(cl)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <Link
                href={{
                  pathname: `/dashboard/develop/studies`,
                }}
              >
                <div className="backBtn">{t("newProject.goBackHome")}</div>
              </Link>
            </div>
          </>
        ) : (
          <div className="modal">
            <div className="formSections">
              {showTemplatePicker && (
                <div className="formSection">
                  <div className="title">
                    {t("newProject.selectTemplate", {}, {
                      default: "Select template",
                    })}
                  </div>
                  <div className="helpText">
                    {usingPublicFallback
                      ? t("newProject.selectTemplateHelpPublic", {}, {
                          default:
                            "No class templates are available. Choose a platform public template instead. The new board will not be connected to a teacher-assigned class template.",
                        })
                      : t("newProject.selectTemplateHelp", {}, {
                          default:
                            "Choose a project board template your teacher has made available to copy.",
                        })}
                  </div>
                  <TemplateOptionCards
                    options={templateOptions}
                    selectedKey={selectedOptionKey}
                    onSelect={handleTemplateSelect}
                    t={t}
                  />
                </div>
              )}

              {usingPublicFallback && selectedOption?.origin === "public" && (
                <Message warning>
                  <MessageHeader>
                    {t("newProject.publicTemplateWarningTitle", {}, {
                      default: "Not a class template",
                    })}
                  </MessageHeader>
                  <p>
                    {t("newProject.publicTemplateWarningBody", {}, {
                      default:
                        "This board is not connected to a teacher-assigned class template. You can still attach it to a class for collaborators and context, but it will not use your class's template settings.",
                    })}
                  </p>
                </Message>
              )}

              <div className="formSection">
                <div className="title">
                  {isProjectFlow
                    ? t("newProject.nameYourProject")
                    : t("newProject.nameYourStudy", {}, {
                        default: "Name your study",
                      })}
                </div>
                <div className="helpText">
                  {isProjectFlow
                    ? t("newProject.nameMessage")
                    : t("newProject.nameMessageStudy", {}, {
                        default:
                          "Give your study a name. This is what you want to call your work space.",
                      })}
                </div>
                <input
                  type="text"
                  name="projectName"
                  placeholder={
                    isProjectFlow
                      ? t("newProject.namePlaceholder")
                      : t("newProject.namePlaceholderStudy", {}, {
                          default: "The name of my study is ",
                        })
                  }
                  value={inputs.projectName}
                  onChange={handleChange}
                />
              </div>

              {classChipRow}

              <div className="formSection">
                <div className="title">{t("newProject.addCollaborators")}</div>
                <Collaborators
                  userClasses={userClasses}
                  collaborators={collaboratorIdsForUi}
                  handleChange={handleCollaboratorsChange}
                  selectedClass={inputs?.class}
                  isStudent={isStudent}
                  excludeUserId={ownerId}
                />
              </div>

              {dataProjects && dataProjects?.proposalBoards.length > 1 && (
                <Message warning>
                  <MessageHeader>
                    {isProjectFlow
                      ? t("newProject.alreadyAssociatedTitle")
                      : t("newProject.alreadyAssociatedTitleStudy", {}, {
                          default:
                            "You already have a study associated with this class",
                        })}
                  </MessageHeader>
                  <p>
                    {isProjectFlow
                      ? t("newProject.alreadyAssociatedWarning")
                      : t("newProject.alreadyAssociatedWarningStudy", {}, {
                          default:
                            "Do not proceed further unless you know what you are doing.",
                        })}
                  </p>
                </Message>
              )}
            </div>
            <div className="createAction">
              <Button
                variant="filled"
                onClick={saveNewProject}
                disabled={loading}
              >
                {isProjectFlow
                  ? t("newProject.createProject")
                  : t("newProject.createStudy", {}, {
                      default: "Create Study",
                    })}
              </Button>
            </div>
          </div>
        )}
      </div>
    </StyledBuilderArea>
  );
}
