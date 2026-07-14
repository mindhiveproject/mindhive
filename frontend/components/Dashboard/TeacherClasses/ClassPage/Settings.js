import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import { DELETE_CLASS, EDIT_CLASS } from "../../../Mutations/Classes";
import {
  ADD_CLASS_NETWORK_ADMIN,
  REMOVE_CLASS_NETWORK_ADMIN,
} from "../../../Mutations/ClassNetwork";
import { GET_CLASSES, GET_CLASS } from "../../../Queries/Classes";

import { Modal, Button as SemanticButton } from "semantic-ui-react";

import StyledModal from "../../../styles/StyledModal";

import { useRouter } from "next/router";

import DesignSystemButton from "../../../DesignSystem/Button";
import CurriculumTypeSelector from "./CurriculumTypeSelector";
import {
  DEFAULT_CURRICULUM_TYPE,
  normalizeCurriculumType,
} from "../../../../lib/curriculumTypes";
import { deriveRoles } from "../../Connect/useConnectRole";

function displayProfileName(profile) {
  return (
    `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() ||
    profile?.username ||
    profile?.email ||
    ""
  );
}

export default function Settings({ myclass, user }) {
  const { t } = useTranslation("classes");
  const [inputValue, setInputValue] = useState({});
  const [open, setOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [adminNetwork, setAdminNetwork] = useState(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFeedback, setAdminFeedback] = useState(null);
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

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const router = useRouter();
  const classNetworks = myclass?.networks || [];
  const { canManageClassNetwork } = deriveRoles(user);

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
  const [addNetworkAdmin, { loading: addingNetworkAdmin }] = useMutation(
    ADD_CLASS_NETWORK_ADMIN,
    { refetchQueries: classRefetch, awaitRefetchQueries: true }
  );
  const [removeNetworkAdmin, { loading: removingNetworkAdmin }] = useMutation(
    REMOVE_CLASS_NETWORK_ADMIN,
    { refetchQueries: classRefetch, awaitRefetchQueries: true }
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

    if (adminNetwork?.id) {
      const freshAdminNetwork = classNetworks.find(
        (n) => n?.id === adminNetwork.id
      );
      if (freshAdminNetwork && freshAdminNetwork !== adminNetwork) {
        setAdminNetwork(freshAdminNetwork);
      }
    }
  }, [adminNetwork, classNetworks, selectedNetwork]);

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

  const handleOpenAdminModal = (network) => {
    setAdminNetwork(network);
    setAdminEmail("");
    setAdminFeedback(null);
  };

  const handleCloseAdminModal = () => {
    setAdminNetwork(null);
    setAdminEmail("");
    setAdminFeedback(null);
  };

  const handleAddNetworkAdmin = async () => {
    const email = adminEmail.trim().toLowerCase();
    if (!adminNetwork?.id || !email) {
      setAdminFeedback({
        kind: "error",
        text: t("classNetworkAdminEmailRequired", {}, {
          default: "Enter an email address first.",
        }),
      });
      return;
    }

    if (
      (adminNetwork.admins || []).some(
        (admin) => admin?.email?.toLowerCase() === email
      )
    ) {
      setAdminFeedback({
        kind: "error",
        text: t("classNetworkAdminAlreadyAdded", {}, {
          default: "That person is already an admin for this network.",
        }),
      });
      return;
    }

    try {
      await addNetworkAdmin({
        variables: { networkId: adminNetwork.id, email },
      });
      setAdminEmail("");
      setAdminFeedback({
        kind: "ok",
        text: t("classNetworkAdminAdded", {}, {
          default: "Class-network admin added.",
        }),
      });
    } catch (err) {
      setAdminFeedback({
        kind: "error",
        text:
          err?.message ||
          t("classNetworkAdminAddError", {}, {
            default: "Failed to add class-network admin.",
          }),
      });
    }
  };

  const handleRemoveNetworkAdmin = async (profileId) => {
    if (!adminNetwork?.id || !profileId) return;
    const confirmed = window.confirm(
      t("classNetworkAdminRemoveConfirm", {}, {
        default:
          "Remove this class-network admin? They will lose network management access.",
      })
    );
    if (!confirmed) return;

    try {
      await removeNetworkAdmin({
        variables: { networkId: adminNetwork.id, profileId },
      });
      setAdminFeedback({
        kind: "ok",
        text: t("classNetworkAdminRemoved", {}, {
          default: "Class-network admin removed.",
        }),
      });
    } catch (err) {
      setAdminFeedback({
        kind: "error",
        text:
          err?.message ||
          t("classNetworkAdminRemoveError", {}, {
            default: "Failed to remove class-network admin.",
          }),
      });
    }
  };

  const adminNetworkAdmins = adminNetwork?.admins || [];
  const canManageSelectedNetwork =
    !!selectedNetwork?.id && canManageClassNetwork(selectedNetwork.id);
  const canManageAdminNetwork =
    !!adminNetwork?.id && canManageClassNetwork(adminNetwork.id);
  const adminMutationLoading = addingNetworkAdmin || removingNetworkAdmin;

  return (
    <div className="settings">
      {classNetworks.length > 0 && (
        <section className="settingsSection">
          <div className="settingsSectionHeader">
            <h3>{t("classNetworks")}</h3>
          </div>
          <div className="networkCardGrid">
            {classNetworks.map((network) => {
              const networkClasses = network?.classes || [];
              const networkOrganizations = network?.memberOrganizations || [];
              const title =
                network?.title ||
                t("classNetworkUntitled", {}, { default: "Untitled network" });

              return (
                <div
                  className="networkCard"
                  key={network?.id || network?.title}
                >
                  <div className="networkCardHeader">
                    <h4 className="networkCardTitle">{title}</h4>
                  </div>
                  {network?.description ? (
                    <p className="networkCardDescription">
                      {network.description}
                    </p>
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
                        { title },
                        { default: "Open details for {{title}}" }
                      )}
                    >
                      {t("classNetworkViewDetails", {}, {
                        default: "View details",
                      })}
                    </DesignSystemButton>
                    {canManageClassNetwork(network?.id) ? (
                      <DesignSystemButton
                        variant="outline"
                        type="button"
                        className="networkCardAction"
                        onClick={() => handleOpenAdminModal(network)}
                        aria-label={t(
                          "classNetworkManageAdminsAria",
                          { title },
                          { default: "Manage admins for {{title}}" }
                        )}
                      >
                        {t("classNetworkManageAdmins", {}, {
                          default: "Manage admins",
                        })}
                      </DesignSystemButton>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
          <DesignSystemButton
            variant="text"
            onClick={handleCloseNetworkDetails}
          >
            {t("close", {}, { default: "Close" })}
          </DesignSystemButton>
          {canManageSelectedNetwork ? (
            <DesignSystemButton
              variant="filled"
              type="button"
              onClick={() => {
                handleOpenAdminModal(selectedNetwork);
                handleCloseNetworkDetails();
              }}
            >
              {t("classNetworkManageAdmins", {}, {
                default: "Manage admins",
              })}
            </DesignSystemButton>
          ) : null}
        </Modal.Actions>
      </Modal>

      <Modal
        open={!!adminNetwork}
        onClose={handleCloseAdminModal}
        size="small"
      >
        <Modal.Header>
          {t("classNetworkAdminsModalTitle", {}, {
            default: "Manage network admins",
          })}
        </Modal.Header>
        <Modal.Content scrolling>
          <Modal.Description>
            <StyledModal>
              <div className="classNetworkDetail">
                <h3 className="classNetworkDetailTitle">
                  {adminNetwork?.title ||
                    t("classNetworkUntitled", {}, {
                      default: "Untitled network",
                    })}
                </h3>
                <div className="classNetworkAdmins">
                  <div className="classNetworkAdminsHeader">
                    <h4>
                      {t("classNetworkAdminsTitle", {}, {
                        default: "Network admins",
                      })}
                    </h4>
                    <p>
                      {t("classNetworkAdminsDescription", {}, {
                        default:
                          "Admins can manage this class network and related Connect workflows.",
                      })}
                    </p>
                  </div>

                  {adminNetworkAdmins.length > 0 ? (
                    <ul className="classNetworkAdminList">
                      {adminNetworkAdmins.map((admin) => (
                        <li key={admin.id} className="classNetworkAdminRow">
                          <div>
                            <strong>{displayProfileName(admin)}</strong>
                            {admin.email ? <span>{admin.email}</span> : null}
                          </div>
                          {canManageAdminNetwork ? (
                            <DesignSystemButton
                              variant="outline"
                              type="button"
                              disabled={adminMutationLoading}
                              onClick={() => handleRemoveNetworkAdmin(admin.id)}
                            >
                              {t("classNetworkAdminRemove", {}, {
                                default: "Remove",
                              })}
                            </DesignSystemButton>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="classNetworkAdminEmpty">
                      {t("classNetworkAdminsEmpty", {}, {
                        default: "No admins have been assigned yet.",
                      })}
                    </p>
                  )}

                  {canManageAdminNetwork ? (
                    <div className="classNetworkAdminForm">
                      <label htmlFor="classNetworkAdminEmail">
                        {t("classNetworkAdminEmailLabel", {}, {
                          default: "Add admin by email",
                        })}
                      </label>
                      <div className="classNetworkAdminFormRow">
                        <input
                          id="classNetworkAdminEmail"
                          type="email"
                          value={adminEmail}
                          placeholder={t(
                            "classNetworkAdminEmailPlaceholder",
                            {},
                            { default: "teacher@example.com" }
                          )}
                          onChange={(event) =>
                            setAdminEmail(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleAddNetworkAdmin();
                            }
                          }}
                        />
                        <DesignSystemButton
                          variant="filled"
                          type="button"
                          disabled={adminMutationLoading}
                          onClick={handleAddNetworkAdmin}
                        >
                          {adminMutationLoading
                            ? t("classNetworkAdminAdding", {}, {
                                default: "Adding...",
                              })
                            : t("classNetworkAdminAdd", {}, {
                                default: "Add admin",
                              })}
                        </DesignSystemButton>
                      </div>
                    </div>
                  ) : null}

                  {adminFeedback ? (
                    <p
                      className={
                        adminFeedback.kind === "error"
                          ? "classNetworkAdminFeedback error"
                          : "classNetworkAdminFeedback"
                      }
                    >
                      {adminFeedback.text}
                    </p>
                  ) : null}
                </div>
              </div>
            </StyledModal>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <DesignSystemButton
            variant="text"
            onClick={handleCloseAdminModal}
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
