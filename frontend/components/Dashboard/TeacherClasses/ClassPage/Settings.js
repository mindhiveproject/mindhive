import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import { DELETE_CLASS, EDIT_CLASS } from "../../../Mutations/Classes";
import {
  ASSOCIATE_CLASS_WITH_PUBLIC_NETWORK,
  REMOVE_CLASS_FROM_NETWORK,
} from "../../../Mutations/ClassNetwork";
import { GET_CLASSES, GET_CLASS } from "../../../Queries/Classes";
import { GET_PUBLIC_CLASS_NETWORKS } from "../../../Queries/ClassNetwork";

import { Modal, Button as SemanticButton } from "semantic-ui-react";

import StyledModal from "../../../styles/StyledModal";

import { useRouter } from "next/router";

import DesignSystemButton from "../../../DesignSystem/Button";
import TipTapEditor from "../../../TipTap/Main";
import CurriculumTypeSelector from "./CurriculumTypeSelector";
import {
  DEFAULT_CURRICULUM_TYPE,
  normalizeCurriculumType,
} from "../../../../lib/curriculumTypes";
import { deriveRoles } from "../../Connect/useConnectRole";

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

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
  const [assignableToStudents, setAssignableToStudents] = useState(
    myclass?.settings?.assignableToStudents ?? false
  );
  const [studentsCanAssignToCards, setStudentsCanAssignToCards] = useState(
    myclass?.settings?.studentsCanAssignToCards ?? false
  );
  const [curriculumType, setCurriculumType] = useState(
    normalizeCurriculumType(myclass?.settings?.curriculumType)
  );

  // Sync from server when myclass (e.g. after refetch) changes
  useEffect(() => {
    const value = myclass?.settings?.assignableToStudents;
    setAssignableToStudents(
      value === undefined || value === null ? false : !!value
    );
  }, [myclass?.settings?.assignableToStudents]);

  useEffect(() => {
    const value = myclass?.settings?.studentsCanAssignToCards;
    setStudentsCanAssignToCards(
      value === undefined || value === null ? false : !!value
    );
  }, [myclass?.settings?.studentsCanAssignToCards]);

  useEffect(() => {
    setCurriculumType(
      normalizeCurriculumType(myclass?.settings?.curriculumType)
    );
  }, [myclass?.settings?.curriculumType]);

  useEffect(() => {
    setClassDescription(myclass?.description || "");
  }, [myclass?.description]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const router = useRouter();
  const classNetworks = myclass?.networks || [];
  const schoolClassNetworks = classNetworks.filter(
    (network) => getClassNetworkType(network) === CLASS_NETWORK_TYPES.SCHOOL
  );
  const feedbackClassNetworks = classNetworks.filter(
    (network) => getClassNetworkType(network) === CLASS_NETWORK_TYPES.FEEDBACK
  );
  const { isAdmin, isClassNetworkAdmin } = deriveRoles(user);
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

  const updateAssignableToStudents = (value) => {
    setAssignableToStudents(value);
    const existingSettings =
      myclass?.settings && typeof myclass.settings === "object"
        ? myclass.settings
        : {};
    const newSettings = { ...existingSettings, assignableToStudents: value };
    // When enabling, default to students cannot assign (only teachers/mentors can)
    if (value) {
      newSettings.studentsCanAssignToCards = false;
      setStudentsCanAssignToCards(false);
    }
    updateClassSettings({
      variables: {
        settings: newSettings,
      },
    }).catch((err) =>
      alert(
        err?.message ||
          t("failedToUpdateSettings", {}, {
            default: "Failed to update settings",
          })
      )
    );
  };

  const updateStudentsCanAssignToCards = (value) => {
    setStudentsCanAssignToCards(value);
    const existingSettings =
      myclass?.settings && typeof myclass.settings === "object"
        ? myclass.settings
        : {};
    updateClassSettings({
      variables: {
        settings: { ...existingSettings, studentsCanAssignToCards: value },
      },
    }).catch((err) =>
      alert(
        err?.message ||
          t("failedToUpdateSettings", {}, {
            default: "Failed to update settings",
          })
      )
    );
  };

  const updateCurriculumType = (value) => {
    const normalized = normalizeCurriculumType(value);
    setCurriculumType(normalized);
    const existingSettings =
      myclass?.settings && typeof myclass.settings === "object"
        ? myclass.settings
        : {};
    updateClassSettings({
      variables: {
        settings: { ...existingSettings, curriculumType: normalized },
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
    refetchQueries: [
      {
        query: GET_CLASSES,
        variables: {
          input: {
            OR: [
              {
                creator: {
                  id: { equals: user?.id },
                },
              },
              {
                mentors: {
                  some: { id: { equals: user?.id } },
                },
              },
            ],
          },
        },
      },
    ],
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
        "classNetworkRemoveConfirm",
        { title },
        {
          default:
            "Remove {{title}} from this class? It will no longer appear in this class's network list.",
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

  const renderNetworkSection = ({
    title: sectionTitle,
    description,
    networks,
    emptyMessage,
    networkType,
    associateButtonLabel,
  }) => (
    <div className="networkTypeSection">
      <div className="networkTypeSectionHeader">
        <h4>{sectionTitle}</h4>
        <p>{description}</p>
      </div>
      {networks.length > 0 ? (
        <div className="networkCardGrid">
          {networks.map((network) => {
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
                      "classNetworkRemoveAria",
                      { title: networkTitle },
                      { default: "Remove {{title}} from this class" }
                    )}
                  >
                    {t("classNetworkRemoveFromClass", {}, {
                      default: "Remove from class",
                    })}
                  </DesignSystemButton>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="networkEmptyState">{emptyMessage}</p>
      )}
      <div className="networkTypeSectionActions">
        <DesignSystemButton
          variant="filled"
          type="button"
          onClick={() => handleOpenAssociateNetwork(networkType)}
        >
          {associateButtonLabel}
        </DesignSystemButton>
      </div>
    </div>
  );

  return (
    <div className="settings">
      <section className="settingsSection">
        <div className="settingsSectionHeader">
          <h3>
            {t("classNetworkSettingsTitle", {}, {
              default: "Network settings",
            })}
          </h3>
          <p>
            {t("classNetworksSettingsDescription", {}, {
              default:
                "Associate this class with public networks, or review the networks already connected to this class.",
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
        <div className="networkTypeSections">
          {renderNetworkSection({
            title: t("classNetworkSchoolSectionTitle", {}, {
              default: "Class networks",
            }),
            description: t("classNetworkSchoolSectionDescription", {}, {
              default:
                "A class network is meant to connect classes of the same high school or universities together with the goal of sharing project board templates, resources, and assignments.",
            }),
            networks: schoolClassNetworks,
            emptyMessage: t("classNetworkSchoolSectionEmpty", {}, {
              default: "This class is not associated with a class network yet.",
            }),
            networkType: CLASS_NETWORK_TYPES.SCHOOL,
            associateButtonLabel: t("classNetworkAssociateSchoolButton", {}, {
              default: "Associate class network",
            }),
          })}
          {renderNetworkSection({
            title: t("classNetworkFeedbackSectionTitle", {}, {
              default: "Feedback networks",
            }),
            description: t("classNetworkFeedbackSectionDescription", {}, {
              default:
                "A feedback network is a temporary link between classes of any institution to find reviewers, and opportunities.",
            }),
            networks: feedbackClassNetworks,
            emptyMessage: t("classNetworkFeedbackSectionEmpty", {}, {
              default:
                "This class is not associated with a feedback network yet.",
            }),
            networkType: CLASS_NETWORK_TYPES.FEEDBACK,
            associateButtonLabel: t("classNetworkAssociateFeedbackButton", {}, {
              default: "Associate feedback network",
            }),
          })}
        </div>
      </section>

      <section className="settingsSection">
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

      <section className="settingsSection">
        <div className="settingsSectionHeader">
          <h3>{t("boardSettings", {}, { default: "Board settings" })}</h3>
          <p>
            {t("boardSettingsDescription", {}, {
              default:
                "These settings will be applied to all project boards in this class.",
            })}
          </p>
        </div>
        <div className="informationBlock">
          <div className="block curriculumTypeBlock">
            <CurriculumTypeSelector
              curriculumType={curriculumType || DEFAULT_CURRICULUM_TYPE}
              disabled={updatingSettings}
              onChange={updateCurriculumType}
            />
          </div>
          <div className="block">
            <p className="settingsQuestion">
              {t("proposalCardsAssignableQuestion", {}, {
                default: "Should proposal cards be assignable to students?",
              })}
            </p>
            <div className="settingsChoiceGroup">
              <label className={assignableToStudents ? "active" : ""}>
                <input
                  type="radio"
                  checked={assignableToStudents}
                  disabled={updatingSettings}
                  onChange={(event) =>
                    updateAssignableToStudents(event.target.checked)
                  }
                />
                {t("cardAssignmentEnabled", {}, {
                  default: "Cards can be assigned to students",
                })}
              </label>
              <label className={!assignableToStudents ? "active" : ""}>
                <input
                  type="radio"
                  checked={!assignableToStudents}
                  disabled={updatingSettings}
                  onChange={(event) =>
                    updateAssignableToStudents(!event.target.checked)
                  }
                />
                {t("cardAssignmentDisabled", {}, {
                  default: "Cards cannot be assigned to students",
                })}
              </label>
            </div>
          </div>
          {assignableToStudents && (
            <div className="block">
              <p className="settingsQuestion">
                {t("whoCanAssignCards", {}, {
                  default: "Who can assign profiles to cards?",
                })}
              </p>
              <div className="settingsChoiceGroup">
                <label className={!studentsCanAssignToCards ? "active" : ""}>
                  <input
                    type="radio"
                    checked={!studentsCanAssignToCards}
                    disabled={updatingSettings}
                    onChange={(event) =>
                      updateStudentsCanAssignToCards(!event.target.checked)
                    }
                  />
                  {t("onlyTeachersMentorsAssignCards", {}, {
                    default: "Only teachers and mentors can assign cards",
                  })}
                </label>
                <label className={studentsCanAssignToCards ? "active" : ""}>
                  <input
                    type="radio"
                    checked={studentsCanAssignToCards}
                    disabled={updatingSettings}
                    onChange={(event) =>
                      updateStudentsCanAssignToCards(event.target.checked)
                    }
                  />
                  {t("studentsCanAssignCards", {}, {
                    default: "Students can assign cards",
                  })}
                </label>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="settingsSection settingsDangerSection">
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
    </div>
  );
}
