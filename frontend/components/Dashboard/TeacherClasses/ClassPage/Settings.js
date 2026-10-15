import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import { DELETE_CLASS, EDIT_CLASS } from "../../../Mutations/Classes";
import {
  ASSOCIATE_CLASS_WITH_PUBLIC_NETWORK,
  REMOVE_CLASS_FROM_NETWORK,
} from "../../../Mutations/ClassNetwork";
import { GET_CLASS, teacherClassesRefetch } from "../../../Queries/Classes";
import { GET_PUBLIC_CLASS_NETWORKS } from "../../../Queries/ClassNetwork";

import { Modal, Button as SemanticButton } from "semantic-ui-react";

import StyledModal from "../../../styles/StyledModal";

import { useRouter } from "next/router";

import Chip from "../../../DesignSystem/Chip";
import DesignSystemButton from "../../../DesignSystem/Button";
import ToggleSwitch from "../../../DesignSystem/ToggleSwitch";
import TipTapEditor from "../../../TipTap/Main";
import CurriculumTypeSelector from "./CurriculumTypeSelector";
import TeachingTeamSettings from "./TeachingTeamSettings";
import TaskVisibilitySettings from "./TaskVisibilitySettings";
import { isClassCreator } from "../../../../lib/classTeacherUtils";
import {
  CURRICULUM_TYPES,
  getClassCurriculumFallback,
  getClassCurriculumTypes,
} from "../../../../lib/curriculumTypes";
import { deriveRoles } from "../../Connect/useConnectRole";
import ProjectsTemplatePanel from "./Projects/ProjectsTemplatePanel";
import MessageCard from "../../../DesignSystem/MessageCard";
import ClassMentors from "./Mentors";
import SettingsSectionNav from "./SettingsSectionNav";

function getNotifyTeachersOfStudentPasswordReset(settings) {
  if (!settings || typeof settings !== "object") return true;
  return settings.notifyTeachersOfStudentPasswordReset !== false;
}

function getPhysiologicalDataEnabled(settings) {
  return settings?.physiologicalDataEnabled === true;
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

// Help center support ticket form; teachers request network membership there.
const SUPPORT_TICKET_URL =
  "https://mindhive.notion.site/153d80abf4c48093b13cc8d50807c7b8?pvs=105";

const CLASS_NETWORK_TYPES = {
  SCHOOL: "school_network",
  FEEDBACK: "feedback_network",
};

function getClassNetworkType(network) {
  return network?.settings?.type === CLASS_NETWORK_TYPES.SCHOOL
    ? CLASS_NETWORK_TYPES.SCHOOL
    : CLASS_NETWORK_TYPES.FEEDBACK;
}

export default function Settings({ myclass, user }) {
  const { t } = useTranslation("classes");
  const [inputValue, setInputValue] = useState({});
  const [open, setOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [associateNetworkOpen, setAssociateNetworkOpen] = useState(false);
  const [associateNetworkType, setAssociateNetworkType] = useState(null);
  const [associationFeedback, setAssociationFeedback] = useState(null);
  const [classDescription, setClassDescription] = useState(
    myclass?.description || ""
  );
  const [curriculumTypes, setCurriculumTypes] = useState(() =>
    getClassCurriculumTypes(myclass?.settings)
  );
  const [notifyTeachersOfStudentPasswordReset, setNotifyTeachersOfStudentPasswordReset] =
    useState(() => getNotifyTeachersOfStudentPasswordReset(myclass?.settings));
  const [physiologicalDataEnabled, setPhysiologicalDataEnabled] = useState(() =>
    getPhysiologicalDataEnabled(myclass?.settings)
  );

  // Sync from server when myclass (e.g. after refetch) changes
  useEffect(() => {
    setCurriculumTypes(getClassCurriculumTypes(myclass?.settings));
  }, [myclass?.settings?.curriculumType, myclass?.settings?.curriculumTypes]);

  useEffect(() => {
    setNotifyTeachersOfStudentPasswordReset(
      getNotifyTeachersOfStudentPasswordReset(myclass?.settings)
    );
  }, [myclass?.settings?.notifyTeachersOfStudentPasswordReset]);

  useEffect(() => {
    setPhysiologicalDataEnabled(
      getPhysiologicalDataEnabled(myclass?.settings)
    );
  }, [myclass?.settings?.physiologicalDataEnabled]);

  useEffect(() => {
    setClassDescription(myclass?.description || "");
  }, [myclass?.description]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const router = useRouter();
  const classNetworks = myclass?.networks || [];
  const { isAdmin, isClassNetworkAdmin } = deriveRoles(user);
  const canConfigurePhysiologicalData =
    isAdmin || user?.permissions?.some((permission) => permission?.name === "TESTER");
  const canAccessNetworkManagement = isAdmin || isClassNetworkAdmin;
  const linkedNetworkIds = new Set(
    classNetworks.map((network) => network?.id).filter(Boolean)
  );

  const [updateClassSettings, { loading: updatingSettings }] = useMutation(
    EDIT_CLASS,
    {
      variables: { id: myclass?.id },
      refetchQueries: [{ query: GET_CLASS, variables: { code: myclass?.code } }],
    }
  );
  const classRefetch = [
    { query: GET_CLASS, variables: { code: myclass?.code } },
  ];
  const {
    data: publicNetworksData,
    loading: publicNetworksLoading,
    error: publicNetworksError,
  } = useQuery(GET_PUBLIC_CLASS_NETWORKS, {
    skip: !associateNetworkOpen,
  });
  const [associateClassWithNetwork, { loading: associatingNetwork }] =
    useMutation(ASSOCIATE_CLASS_WITH_PUBLIC_NETWORK, {
      refetchQueries: classRefetch,
      awaitRefetchQueries: true,
    });
  const [removeClassFromNetwork, { loading: removingNetwork }] = useMutation(
    REMOVE_CLASS_FROM_NETWORK,
    {
      refetchQueries: classRefetch,
      awaitRefetchQueries: true,
    }
  );
  const publicNetworks = publicNetworksData?.classNetworks || [];
  const availablePublicNetworks = publicNetworks.filter(
    (network) =>
      !linkedNetworkIds.has(network?.id) &&
      (!associateNetworkType ||
        getClassNetworkType(network) === associateNetworkType)
  );

  useEffect(() => {
    if (selectedNetwork?.id) {
      const freshSelectedNetwork = classNetworks.find(
        (n) => n?.id === selectedNetwork.id
      );
      if (freshSelectedNetwork && freshSelectedNetwork !== selectedNetwork) {
        setSelectedNetwork(freshSelectedNetwork);
      }
    }
  }, [classNetworks, selectedNetwork]);

  const updateCurriculumTypes = async (values) => {
    const normalized = getClassCurriculumTypes({ curriculumTypes: values });
    setCurriculumTypes(normalized);
    const existingSettings =
      myclass?.settings && typeof myclass.settings === "object"
        ? myclass.settings
        : {};
    updateClassSettings({
      variables: {
        settings: {
          ...existingSettings,
          curriculumTypes: normalized,
          curriculumType: getClassCurriculumFallback(normalized),
        },
      },
    }).catch((err) =>
      alert(
        err?.message ||
          t("curriculumTypeUpdateError", {}, {
            default: "Failed to update curriculum type",
          })
      )
    );
  };

  const updateNotifyTeachersOfStudentPasswordReset = (enabled) => {
    const previousValue = notifyTeachersOfStudentPasswordReset;
    setNotifyTeachersOfStudentPasswordReset(enabled);
    const existingSettings =
      myclass?.settings && typeof myclass.settings === "object"
        ? myclass.settings
        : {};
    updateClassSettings({
      variables: {
        settings: {
          ...existingSettings,
          notifyTeachersOfStudentPasswordReset: enabled,
        },
      },
    }).catch((err) => {
      setNotifyTeachersOfStudentPasswordReset(previousValue);
      alert(
        err?.message ||
          t("passwordResetEmailUpdateError", {}, {
            default: "Failed to update password reset email setting",
          })
      );
    });
  };

  const updatePhysiologicalDataEnabled = (enabled) => {
    const previousValue = physiologicalDataEnabled;
    setPhysiologicalDataEnabled(enabled);
    const existingSettings =
      myclass?.settings && typeof myclass.settings === "object"
        ? myclass.settings
        : {};
    updateClassSettings({
      variables: {
        settings: {
          ...existingSettings,
          physiologicalDataEnabled: enabled,
        },
      },
    }).catch((err) => {
      setPhysiologicalDataEnabled(previousValue);
      alert(
        err?.message ||
          t("physiologicalDataUpdateError", {}, {
            default: "Failed to update physiological data setting",
          })
      );
    });
  };

  const updateClassDescription = () => {
    if (!myclass?.id || classDescription === (myclass?.description || "")) {
      return;
    }

    updateClassSettings({
      variables: {
        description: classDescription,
      },
    }).catch((err) =>
      alert(
        err?.message ||
          t("classDescriptionUpdateError", {}, {
            default: "Failed to update class description",
          })
      )
    );
  };

  const [deleteClass, { loading }] = useMutation(DELETE_CLASS, {
    variables: { id: myclass?.id },
    refetchQueries: [teacherClassesRefetch(user?.id)],
  });

  const formatNetworkClassCount = (count) =>
    count === 1
      ? t("classNetworkClassCountSingle", { count }, {
          default: "{{count}} linked class",
        })
      : t("classNetworkClassCountPlural", { count }, {
          default: "{{count}} linked classes",
        });

  const formatNetworkOrganizationCount = (count) =>
    count === 1
      ? t("classNetworkOrganizationCountSingle", { count }, {
          default: "{{count}} organization",
        })
      : t("classNetworkOrganizationCountPlural", { count }, {
          default: "{{count}} organizations",
        });

  const formatNetworkOpportunityCount = (count) =>
    count === 1
      ? t("classNetworkOpportunityCountSingle", { count }, {
          default: "{{count}} opportunity",
        })
      : t("classNetworkOpportunityCountPlural", { count }, {
          default: "{{count}} opportunities",
        });

  const handleSelectNetwork = (network) => {
    setSelectedNetwork(network);
  };

  const handleCloseNetworkDetails = () => {
    setSelectedNetwork(null);
  };

  const handleOpenAssociateNetwork = (networkType) => {
    setAssociateNetworkType(networkType);
    setAssociationFeedback(null);
    setAssociateNetworkOpen(true);
  };

  const handleCloseAssociateNetwork = () => {
    setAssociateNetworkOpen(false);
    setAssociateNetworkType(null);
    setAssociationFeedback(null);
  };

  const handleAssociateNetwork = async (networkId) => {
    if (!myclass?.id || !networkId) return;

    try {
      await associateClassWithNetwork({
        variables: { classId: myclass.id, networkId },
      });
      setAssociationFeedback({
        kind: "ok",
        text: t("classNetworkAssociationSuccess", {}, {
          default: "Class network associated with this class.",
        }),
      });
    } catch (err) {
      setAssociationFeedback({
        kind: "error",
        text:
          err?.message ||
          t("classNetworkAssociationError", {}, {
            default: "Failed to associate this class network.",
          }),
      });
    }
  };

  const handleRemoveNetwork = async (network) => {
    if (!myclass?.id || !network?.id) return;
    const title =
      network?.title ||
      t("classNetworkUntitled", {}, { default: "Untitled network" });
    const confirmed = window.confirm(
      t(
        "classNetworkLeaveConfirm",
        { title },
        {
          default:
            "Take this class out of {{title}}? To rejoin later, you\'ll need to contact the MindHive team.",
        }
      )
    );
    if (!confirmed) return;

    try {
      await removeClassFromNetwork({
        variables: { classId: myclass.id, networkId: network.id },
      });
    } catch (err) {
      alert(
        err?.message ||
          t("classNetworkRemoveError", {}, {
            default: "Failed to remove this class from the network.",
          })
      );
    }
  };

  const handleOpenNetworkManagement = () => {
    router.push("/dashboard/connect/networks?mode=manage");
  };

  const associationModalTitle =
    associateNetworkType === CLASS_NETWORK_TYPES.SCHOOL
      ? t("classNetworkAssociateSchoolModalTitle", {}, {
          default: "Associate class network",
        })
      : associateNetworkType === CLASS_NETWORK_TYPES.FEEDBACK
      ? t("classNetworkAssociateFeedbackModalTitle", {}, {
          default: "Associate feedback network",
        })
      : t("classNetworkAssociateModalTitle", {}, {
          default: "Associate class with network",
        });

  const associationModalDescription =
    associateNetworkType === CLASS_NETWORK_TYPES.SCHOOL
      ? t("classNetworkAssociateSchoolModalDescription", {}, {
          default:
            "Choose a public class network to associate with this class.",
        })
      : associateNetworkType === CLASS_NETWORK_TYPES.FEEDBACK
      ? t("classNetworkAssociateFeedbackModalDescription", {}, {
          default:
            "Choose a public feedback network to associate with this class.",
        })
      : t("classNetworkAssociateModalDescription", {}, {
          default: "Choose a public class network to associate with this class.",
        });

  const associationEmptyMessage =
    associateNetworkType === CLASS_NETWORK_TYPES.SCHOOL
      ? t("classNetworkAssociationSchoolEmpty", {}, {
          default:
            "There are no public class networks available to associate.",
        })
      : associateNetworkType === CLASS_NETWORK_TYPES.FEEDBACK
      ? t("classNetworkAssociationFeedbackEmpty", {}, {
          default:
            "There are no public feedback networks available to associate.",
        })
      : t("classNetworkAssociationEmpty", {}, {
          default: "There are no public networks available to associate.",
        });

  const networkCards = (
    <div className="networkCardGrid">
      {classNetworks.map((network) => {
        const networkClasses = network?.classes || [];
        const networkOrganizations = network?.memberOrganizations || [];
        const networkTitle =
          network?.title ||
          t("classNetworkUntitled", {}, { default: "Untitled network" });

        return (
          <div className="networkCard" key={network?.id || networkTitle}>
            <div className="networkCardHeader">
              <h4 className="networkCardTitle">{networkTitle}</h4>
            </div>
            {network?.description ? (
              <p className="networkCardDescription">{network.description}</p>
            ) : null}
            <div className="networkCardMeta">
              <span>{formatNetworkClassCount(networkClasses.length)}</span>
              {networkOrganizations.length > 0 ? (
                <>
                  <span aria-hidden>•</span>
                  <span>
                    {formatNetworkOrganizationCount(
                      networkOrganizations.length
                    )}
                  </span>
                </>
              ) : null}
            </div>
            <div className="networkCardActions">
              <DesignSystemButton
                variant="outline"
                type="button"
                className="networkCardAction"
                onClick={() => handleSelectNetwork(network)}
                aria-label={t(
                  "classNetworkOpenDetailsAria",
                  { title: networkTitle },
                  { default: "Open details for {{title}}" }
                )}
              >
                {t("classNetworkViewDetails", {}, {
                  default: "View details",
                })}
              </DesignSystemButton>
              <DesignSystemButton
                variant="text"
                type="button"
                className="networkCardAction"
                disabled={removingNetwork}
                onClick={() => handleRemoveNetwork(network)}
                aria-label={t(
                  "classNetworkLeaveAria",
                  { title: networkTitle },
                  { default: "Take this class out of {{title}}" }
                )}
              >
                {t("classNetworkLeave", {}, {
                  default: "Leave network",
                })}
              </DesignSystemButton>
            </div>
          </div>
        );
      })}
    </div>
  );

  const isCreator = isClassCreator(myclass, user?.id);
  // Order matches the page; labels reuse each section's own heading.
  const navSections = [
    {
      id: "project-boards",
      label: t("projects.templateManagement", {}, { default: "Project board" }),
    },
    {
      id: "mentors",
      label: t("navigation.mentors", {}, { default: "Mentors" }),
    },
    {
      id: "settings-network",
      label: t("classNetworkSettingsTitle", {}, { default: "Network settings" }),
    },
    {
      id: "settings-description",
      label: t("classDescriptionSettingsTitle", {}, {
        default: "Class description",
      }),
    },
    {
      id: "settings-curriculum",
      label: t("classCurriculum", {}, { default: "Class Curriculum" }),
    },
    {
      id: "settings-tasks",
      label: t("taskVisibility.title", {}, { default: "Tasks & surveys" }),
    },
    {
      id: "settings-password-reset",
      label: t("passwordResetEmailSettingsTitle", {}, {
        default: "Student password reset emails",
      }),
    },
    canConfigurePhysiologicalData && {
      id: "settings-physiological",
      label: t("physiologicalDataSettingsTitle", {}, {
        default: "Physiological data",
      }),
    },
    {
      id: "settings-teaching-team",
      label: t("teachingTeam.title", {}, { default: "Teaching team" }),
    },
    isCreator && { id: "settings-delete-class", label: t("deleteYourClass") },
  ].filter(Boolean);

  return (
    <div className="settingsLayout">
      <div className="settings">
        <div className="classTabPage" id="project-boards">
          <ProjectsTemplatePanel myclass={myclass} user={user} />
        </div>

        <ClassMentors myclass={myclass} user={user} />

        <section className="settingsSection" id="settings-network">
          <div className="settingsSectionHeader">
            <h3>
              {t("classNetworkSettingsTitle", {}, {
                default: "Network settings",
              })}
            </h3>
            <p>
              {t("classNetworksSettingsDescription", {}, {
                default: "The networks this class belongs to.",
              })}
            </p>
            {classNetworks.length > 0 && canAccessNetworkManagement ? (
              <div className="networkSectionActions">
                <DesignSystemButton
                  variant="outline"
                  type="button"
                  onClick={handleOpenNetworkManagement}
                >
                  {t("classNetworkManageNetwork", {}, {
                    default: "Manage network",
                  })}
                </DesignSystemButton>
              </div>
            ) : null}
          </div>
          {classNetworks.length > 0 ? (
            networkCards
          ) : (
            <p className="networkEmptyState">
              {t("classNetworkNoneYet", {}, {
                default: "This class isn't part of a network yet.",
              })}
            </p>
          )}
          <MessageCard
            variant="information"
            message={t("classNetworkRequestAccess", {}, {
              default:
                "Want this class to join a network? Contact the MindHive team and we'll add it for you.",
            })}
            action={
              <DesignSystemButton
                variant="text"
                type="button"
                onClick={() =>
                  window.open(SUPPORT_TICKET_URL, "_blank", "noopener,noreferrer")
                }
              >
                {t("classNetworkContactTeam", {}, {
                  default: "Contact the MindHive team",
                })}
              </DesignSystemButton>
            }
          />
          {isAdmin ? (
            <div className="networkSectionActions">
              <DesignSystemButton
                variant="text"
                type="button"
                onClick={() => handleOpenAssociateNetwork(null)}
              >
                {t("classNetworkAssociateAdmin", {}, {
                  default: "Associate network (admin)",
                })}
              </DesignSystemButton>
            </div>
          ) : null}
        </section>

        <section className="settingsSection" id="settings-description">
          <div className="settingsSectionHeader">
            <h3>
              {t("classDescriptionSettingsTitle", {}, {
                default: "Class description",
              })}
            </h3>
            <p>
              {t("classDescriptionSettingsDescription", {}, {
                default:
                  "Add the description students and mentors will see in the class header.",
              })}
            </p>
          </div>
          <TipTapEditor
            content={classDescription}
            onUpdate={(content) => setClassDescription(content || "")}
            onBlur={updateClassDescription}
            isEditable={!updatingSettings && Boolean(myclass?.id)}
            toolbarVisible={true}
            limitedToolbar={true}
          />
          {!stripHtml(classDescription) ? (
            <p className="classDescriptionSettingsHint">
              {t("classDescriptionSettingsEmptyHint", {}, {
                default:
                  "Leave this blank to hide the description from the class header.",
              })}
            </p>
          ) : null}
        </section>

        <Modal
          open={!!selectedNetwork}
          onClose={handleCloseNetworkDetails}
          size="small"
        >
          <Modal.Header>
            {t("classNetworkDetailsTitle", {}, {
              default: "Class network details",
            })}
          </Modal.Header>
          <Modal.Content scrolling>
            <Modal.Description>
              <StyledModal>
                <div className="classNetworkDetail">
                  <h3 className="classNetworkDetailTitle">
                    {selectedNetwork?.title ||
                      t("classNetworkUntitled", {}, {
                        default: "Untitled network",
                      })}
                  </h3>
                  {selectedNetwork?.description ? (
                    <p className="classNetworkDetailDescription">
                      {selectedNetwork.description}
                    </p>
                  ) : null}
                  <div className="classNetworkDetailSummary">
                    <div className="classNetworkDetailRow">
                      <span className="classNetworkDetailLabel">
                        {t("classNetworkLinkedClasses", {}, {
                          default: "Linked classes",
                        })}
                      </span>
                      <strong className="classNetworkDetailValue">
                        {formatNetworkClassCount(
                          selectedNetwork?.classes?.length || 0
                        )}
                      </strong>
                    </div>
                    {selectedNetwork?.memberOrganizations?.length > 0 ? (
                      <div className="classNetworkDetailRow">
                        <span className="classNetworkDetailLabel">
                          {t("classNetworkMemberOrganizations", {}, {
                            default: "Member organizations",
                          })}
                        </span>
                        <strong className="classNetworkDetailValue">
                          {formatNetworkOrganizationCount(
                            selectedNetwork.memberOrganizations.length
                          )}
                        </strong>
                        <ul className="classNetworkDetailNames">
                          {selectedNetwork.memberOrganizations.map((org) => (
                            <li key={org?.id || org?.name}>{org?.name}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="classNetworkDetailRow">
                      <span className="classNetworkDetailLabel">
                        {t("classNetworkOpportunities", {}, {
                          default: "Opportunities",
                        })}
                      </span>
                      <strong className="classNetworkDetailValue">
                        {formatNetworkOpportunityCount(
                          selectedNetwork?.opportunities?.length || 0
                        )}
                      </strong>
                    </div>
                    <div className="classNetworkDetailRow">
                      <span className="classNetworkDetailLabel">
                        {t("classNetworkCreationDate", {}, {
                          default: "Creation date",
                        })}
                      </span>
                      <strong className="classNetworkDetailValue">
                        {moment(selectedNetwork?.createdAt).format(
                          "MMMM D, YYYY"
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              </StyledModal>
            </Modal.Description>
          </Modal.Content>
          <Modal.Actions>
            <DesignSystemButton variant="text" onClick={handleCloseNetworkDetails}>
              {t("close", {}, { default: "Close" })}
            </DesignSystemButton>
          </Modal.Actions>
        </Modal>

        <Modal
          open={associateNetworkOpen}
          onClose={handleCloseAssociateNetwork}
          size="small"
        >
          <Modal.Header>{associationModalTitle}</Modal.Header>
          <Modal.Content scrolling>
            <Modal.Description>
              <StyledModal>
                <div className="classNetworkDetail">
                  <p className="classNetworkDetailDescription">
                    {associationModalDescription}
                  </p>
                  {publicNetworksLoading ? (
                    <p className="classNetworkAdminEmpty">
                      {t("classNetworkAssociationLoading", {}, {
                        default: "Loading public networks...",
                      })}
                    </p>
                  ) : publicNetworksError ? (
                    <p className="classNetworkAdminFeedback error" role="alert">
                      {t("classNetworkAssociationLoadError", {}, {
                        default: "Unable to load public networks.",
                      })}
                    </p>
                  ) : availablePublicNetworks.length > 0 ? (
                    <ul className="classNetworkAdminList">
                      {availablePublicNetworks.map((network) => (
                        <li key={network.id} className="classNetworkAdminRow">
                          <div>
                            <strong>
                              {network?.title ||
                                t("classNetworkUntitled", {}, {
                                  default: "Untitled network",
                                })}
                            </strong>
                            {network?.description ? (
                              <span>{network.description}</span>
                            ) : null}
                          </div>
                          <DesignSystemButton
                            variant="outline"
                            type="button"
                            disabled={associatingNetwork}
                            onClick={() => handleAssociateNetwork(network.id)}
                          >
                            {t("classNetworkAssociate", {}, {
                              default: "Associate",
                            })}
                          </DesignSystemButton>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="classNetworkAdminEmpty">
                      {associationEmptyMessage}
                    </p>
                  )}

                  {associationFeedback ? (
                    <p
                      className={
                        associationFeedback.kind === "error"
                          ? "classNetworkAdminFeedback error"
                          : "classNetworkAdminFeedback"
                      }
                    >
                      {associationFeedback.text}
                    </p>
                  ) : null}
                </div>
              </StyledModal>
            </Modal.Description>
          </Modal.Content>
          <Modal.Actions>
            <DesignSystemButton
              variant="text"
              onClick={handleCloseAssociateNetwork}
            >
              {t("close", {}, { default: "Close" })}
            </DesignSystemButton>
          </Modal.Actions>
        </Modal>

        <section className="settingsSection" id="settings-curriculum">
          <div className="settingsSectionHeader">
            <h3>
              {t("classCurriculum", {}, { default: "Class Curriculum" })}
            </h3>
            <p>
              {t("classCurriculumReadOnlyDescription", {}, {
                default: "The curricula this class follows.",
              })}
            </p>
          </div>
          {isAdmin ? (
            <div className="block curriculumTypeBlock">
              <CurriculumTypeSelector
                multiple
                curriculumType={curriculumTypes}
                disabled={updatingSettings}
                onChange={updateCurriculumTypes}
                questionKey="classCurriculumTypeQuestion"
                questionDefault="Which curriculum types apply to this class?"
              />
            </div>
          ) : (
            <div className="curriculumTypeChips">
              {CURRICULUM_TYPES.filter((type) =>
                curriculumTypes.includes(type.value)
              ).map((type) => (
                <Chip
                  key={type.value}
                  variant="static"
                  tone="neutral"
                  label={t(type.labelKey, {}, { default: type.defaultLabel })}
                />
              ))}
            </div>
          )}
          <MessageCard
            variant="information"
            message={t("classCurriculumRequest", {}, {
              default:
                "Need a different curriculum for this class? Contact the MindHive team and we'll add it for you.",
            })}
            action={
              <DesignSystemButton
                variant="text"
                type="button"
                onClick={() =>
                  window.open(SUPPORT_TICKET_URL, "_blank", "noopener,noreferrer")
                }
              >
                {t("classNetworkContactTeam", {}, {
                  default: "Contact the MindHive team",
                })}
              </DesignSystemButton>
            }
          />
        </section>

        <div id="settings-tasks">
          <TaskVisibilitySettings myclass={myclass} />
        </div>

        <section className="settingsSection" id="settings-password-reset">
          <div className="settingsSectionHeader">
            <h3>
              {t("passwordResetEmailSettingsTitle", {}, {
                default: "Student password reset emails",
              })}
            </h3>
            <p>
              {t("passwordResetEmailSettingsDescription", {}, {
                default:
                  "When enabled, this class’s teacher receives student password-reset emails (student CC’d). Turn off to stop notifying this class’s teacher; the student only gets the link directly when every class they belong to has this setting off.",
              })}
            </p>
          </div>
          <div className="informationBlock">
            <div className="block curriculumTypeBlock">
              <ToggleSwitch
                checked={notifyTeachersOfStudentPasswordReset}
                loading={updatingSettings}
                onChange={updateNotifyTeachersOfStudentPasswordReset}
                label={
                  notifyTeachersOfStudentPasswordReset
                    ? t("passwordResetEmailSettingsEnabledLabel", {}, {
                        default: "Notify teacher of student password resets",
                      })
                    : t("passwordResetEmailSettingsDisabledLabel", {}, {
                        default:
                          "Teacher is not notified of student password resets",
                      })
                }
                aria-label={
                  notifyTeachersOfStudentPasswordReset
                    ? t("passwordResetEmailSettingsEnabledLabel", {}, {
                        default: "Notify teacher of student password resets",
                      })
                    : t("passwordResetEmailSettingsDisabledLabel", {}, {
                        default:
                          "Teacher is not notified of student password resets",
                      })
                }
              />
              <p className="classDescriptionSettingsHint">
                {t("passwordResetEmailSettingsHint", {}, {
                  default:
                    "When toggled off, this class’s teacher will not receive the reset link. Only when all of a student’s classes turn this off does the student receive the link alone. It is not recommended to deactivate this option when your students are under an account restriction that may prevent them from resetting their password in full autonomy.",
                })}
              </p>
            </div>
          </div>
        </section>

        {canConfigurePhysiologicalData && (
          <section className="settingsSection" id="settings-physiological">
            <div className="settingsSectionHeader">
              <h3>
                {t("physiologicalDataSettingsTitle", {}, {
                  default: "Physiological data",
                })}
              </h3>
            </div>
            <div className="informationBlock">
              <div className="block curriculumTypeBlock">
                <ToggleSwitch
                  checked={physiologicalDataEnabled}
                  loading={updatingSettings}
                  onChange={updatePhysiologicalDataEnabled}
                  label={
                    physiologicalDataEnabled
                      ? t("physiologicalDataEnabledLabel", {}, {
                          default: "Physiological data collection enabled",
                        })
                      : t("physiologicalDataDisabledLabel", {}, {
                          default: "Physiological data collection disabled",
                        })
                  }
                />
                <p className="classDescriptionSettingsHint">
                  {t("physiologicalDataSettingLabel", {}, {
                    default:
                      "Enable physiological data collection and recording for this class within the study builder",
                  })}
                </p>
              </div>
            </div>
          </section>
        )}

        <div id="settings-teaching-team">
          <TeachingTeamSettings myclass={myclass} user={user} />
        </div>

        {isCreator ? (
        <section
          className="settingsSection settingsDangerSection"
          id="settings-delete-class"
        >
          <div className="settingsSectionHeader">
            <h3>{t("deleteYourClass")}</h3>
            <p>{t("deleteClassWarning")}</p>
          </div>

          <div className="informationBlock">
            <div className="block">
              <p className="settingsQuestion">{t("noAccessTo")}</p>
              <ul>
                <li>{t("yourClass")}</li>
                <li>{t("anyStudiesOrResults")}</li>
              </ul>
            </div>

            <div className="block">
              <p className="settingsQuestion">{t("studentsWillHaveAccessTo")}</p>
              <ul>
                <li>{t("theirWorkspaceAndStudies")}</li>
                <li>{t("noteNewStudents")}</li>
              </ul>
            </div>
          </div>

          <Modal
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            open={open}
            size="small"
            trigger={
              <button className="settingsDeleteButton" disabled={loading}>
                {t("deleteClass")}
              </button>
            }
          >
            <Modal.Content>
              <Modal.Description>
                <StyledModal>
                  <h3>
                    {t("areYouSureDeleteClass")}
                  </h3>
                  <p>
                    {t("deleteClassWarning")}
                  </p>
                  <div>
                    <p>
                      <strong>{t("typeDeleteToConfirm")}</strong>
                    </p>
                    <input type="text" onChange={handleChange} />
                  </div>
                </StyledModal>
              </Modal.Description>
            </Modal.Content>
            <Modal.Actions>
              <SemanticButton
                style={{ background: "#D53533", color: "#FFFFFF" }}
                content={t("delete")}
                onClick={() => {
                  if (inputValue === "DELETE") {
                    deleteClass().catch((err) => alert(err.message));
                    router.push({
                      pathname: "/dashboard/myclasses",
                    });
                  } else {
                    return alert(t("pleaseTypeDelete"));
                  }
                  setOpen(false);
                }}
              />
              <SemanticButton content={t("cancel")} onClick={() => setOpen(false)} />
            </Modal.Actions>
          </Modal>
        </section>
        ) : null}
      </div>
      <SettingsSectionNav
        sections={navSections}
        ariaLabel={t("settingsSectionNavLabel", {}, {
          default: "Settings sections",
        })}
      />
    </div>
  );
}
