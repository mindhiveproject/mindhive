import { useState } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import DesignSystemButton from "../../../DesignSystem/Button";
import CopyButton from "../../../DesignSystem/CopyButton";
import {
  CREATE_ORG_INVITE,
  REVOKE_ORG_INVITE,
  UPDATE_ORGANIZATION,
} from "../../../Mutations/Organization";
import {
  EXPLORE_ORGANIZATION_DETAIL,
  FIND_PROFILE_BY_EMAIL,
  PENDING_INVITES_FOR_ORG,
} from "../../../Queries/Organization";
import ConnectProfileCard from "../ConnectProfileCard";
import {
  buildOrganizationInviteLink,
  displayProfileName,
  formatDateLabel,
} from "./utils";

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    color: #171717;
  }

  .helper {
    color: #5f6871;
    font-size: 14px;
  }
`;

const AdminForm = styled.div`
  display: grid;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eef1f2;

  label {
    color: #171717;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    font-weight: 700;
    line-height: 22px;
  }
`;

const DangerCard = styled(Card)`
  border: 1px solid #f2d2d1;
  background: linear-gradient(180deg, #fffefe 0%, #fff8f7 100%);
  box-shadow: 0 10px 30px rgba(23, 23, 23, 0.06);

  ${AdminForm} {
    border-bottom-color: #f3dfdd;
  }
`;

const AdminFormRow = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) auto;

  input {
    height: 42px;
    padding: 0 12px;
    border: 1px solid #cccccc;
    border-radius: 4px;
    font-family: "Inter", sans-serif;
    font-size: 14px;

    &:focus {
      outline: 0;
      border-color: var(--MH-Theme-Primary-Dark, #336f8a);
    }
  }
`;

const AdminFeedback = styled.p`
  margin: 0;
  color: ${(props) => (props.$error ? "#871b16" : "#1d6b3a")};
  font-family: "Inter", sans-serif;
  font-size: 13px;
  line-height: 20px;
`;

const InviteLinkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const PendingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PendingRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #eef1f2;
  border-radius: 8px;

  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .email {
    font-family: "Inter", sans-serif;
    font-weight: 600;
    font-size: 14px;
    color: #171717;
  }

  .meta {
    font-family: "Inter", sans-serif;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    color: #5f6871;
  }
`;

const ProfileList = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export default function OrganizationAdminPanels({
  organization,
  organizationId,
  canManage,
  user,
}) {
  const { t } = useTranslation("connect");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFeedback, setInviteFeedback] = useState(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFeedback, setAdminFeedback] = useState(null);

  const detailQuery = {
    query: EXPLORE_ORGANIZATION_DETAIL,
    variables: { id: organizationId },
  };

  const members = organization?.members || [];
  const orgAdmins = organization?.admins || [];
  const showMembersCard = canManage || members.length > 0;

  const { data: invitesData } = useQuery(PENDING_INVITES_FOR_ORG, {
    variables: { organizationId },
    skip: !organizationId || !canManage,
    fetchPolicy: "cache-and-network",
  });
  const pendingInvites = invitesData?.organizationInvites || [];

  const [findProfile, { loading: lookingUp }] = useLazyQuery(
    FIND_PROFILE_BY_EMAIL,
    { fetchPolicy: "network-only" }
  );

  const inviteRefetchQueries = [
    detailQuery,
    {
      query: PENDING_INVITES_FOR_ORG,
      variables: { organizationId },
    },
  ];

  const [updateOrganization, { loading: updating }] = useMutation(
    UPDATE_ORGANIZATION,
    { refetchQueries: [detailQuery], awaitRefetchQueries: true }
  );

  const [createInvite, { loading: inviting }] = useMutation(CREATE_ORG_INVITE, {
    refetchQueries: inviteRefetchQueries,
    awaitRefetchQueries: true,
  });

  const [revokeInvite, { loading: revoking }] = useMutation(REVOKE_ORG_INVITE, {
    refetchQueries: inviteRefetchQueries,
    awaitRefetchQueries: true,
  });

  const memberMutationLoading = lookingUp || updating || inviting;
  const adminMutationLoading = lookingUp || updating;

  const unknownLabel = t("organizationsDetail.unknownMember", {}, {
    default: "Unknown",
  });

  const handleInviteMember = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!organization?.id || !email) {
      setInviteFeedback({
        kind: "error",
        text: t("organizationsDetail.invites.emailRequired", {}, {
          default: "Enter an email address first.",
        }),
      });
      return;
    }

    if (members.some((m) => m?.email?.toLowerCase() === email)) {
      setInviteFeedback({
        kind: "error",
        text: t("organizationsDetail.invites.alreadyMember", {}, {
          default: "That person is already a member of this organization.",
        }),
      });
      return;
    }

    if (pendingInvites.some((inv) => inv.email === email)) {
      setInviteFeedback({
        kind: "error",
        text: t(
          "organizationsDetail.invites.alreadyPending",
          { email },
          { default: "An invite to {{email}} is already pending." }
        ),
      });
      return;
    }

    try {
      const { data: lookup } = await findProfile({ variables: { email } });
      const found = lookup?.profiles?.[0];

      if (found) {
        if (members.some((m) => m.id === found.id)) {
          setInviteFeedback({
            kind: "error",
            text: t("organizationsDetail.invites.alreadyMember", {}, {
              default: "That person is already a member of this organization.",
            }),
          });
          return;
        }
        await updateOrganization({
          variables: {
            id: organization.id,
            input: { members: { connect: [{ id: found.id }] } },
          },
        });
        setInviteEmail("");
        setInviteFeedback({
          kind: "ok",
          text: t(
            "organizationsDetail.invites.memberAdded",
            { name: displayProfileName(found, unknownLabel) },
            { default: "Added {{name}} to the organization." }
          ),
        });
        return;
      }

      const result = await createInvite({
        variables: {
          input: {
            email,
            organization: { connect: { id: organization.id } },
          },
        },
      });
      const created = result?.data?.createOrganizationInvite;
      setInviteEmail("");
      setInviteFeedback({
        kind: "ok",
        text: t(
          "organizationsDetail.invites.inviteSent",
          { email },
          { default: "Invite sent to {{email}}." }
        ),
        manualLink: buildOrganizationInviteLink(created?.token) || null,
      });
    } catch (err) {
      setInviteFeedback({
        kind: "error",
        text:
          err?.message ||
          t("organizationsDetail.invites.inviteError", {}, {
            default: "Failed to invite member.",
          }),
      });
    }
  };

  const handleRevokeInvite = async (inviteId, email) => {
    if (!inviteId) return;
    const confirmed = window.confirm(
      t(
        "organizationsDetail.invites.cancelConfirm",
        { email },
        { default: "Cancel the pending invite to {{email}}?" }
      )
    );
    if (!confirmed) return;
    try {
      await revokeInvite({ variables: { id: inviteId } });
      setInviteFeedback(null);
    } catch (err) {
      setInviteFeedback({
        kind: "error",
        text:
          err?.message ||
          t("organizationsDetail.invites.inviteError", {}, {
            default: "Failed to invite member.",
          }),
      });
    }
  };

  const handleAddAdmin = async () => {
    const email = adminEmail.trim().toLowerCase();
    if (!organization?.id || !email) {
      setAdminFeedback({
        kind: "error",
        text: t("organizationsDetail.admins.emailRequired", {}, {
          default: "Enter an email address first.",
        }),
      });
      return;
    }

    if (orgAdmins.some((admin) => admin?.email?.toLowerCase() === email)) {
      setAdminFeedback({
        kind: "error",
        text: t("organizationsDetail.admins.alreadyAdmin", {}, {
          default: "That person is already an admin for this organization.",
        }),
      });
      return;
    }

    try {
      const { data: lookup } = await findProfile({ variables: { email } });
      const found = lookup?.profiles?.[0];
      if (!found) {
        setAdminFeedback({
          kind: "error",
          text: t(
            "organizationsDetail.admins.noAccount",
            { email },
            {
              default:
                "No MindHive account found for {{email}}. Invite them as a member first; after they sign up you can make them an admin.",
            }
          ),
        });
        return;
      }

      if (orgAdmins.some((admin) => admin.id === found.id)) {
        setAdminFeedback({
          kind: "error",
          text: t("organizationsDetail.admins.alreadyAdmin", {}, {
            default: "That person is already an admin for this organization.",
          }),
        });
        return;
      }

      const input = { admins: { connect: [{ id: found.id }] } };
      if (!members.some((m) => m.id === found.id)) {
        input.members = { connect: [{ id: found.id }] };
      }

      await updateOrganization({
        variables: { id: organization.id, input },
      });
      setAdminEmail("");
      setAdminFeedback({
        kind: "ok",
        text: t("organizationsDetail.admins.added", {}, {
          default: "Organization admin added.",
        }),
      });
    } catch (err) {
      setAdminFeedback({
        kind: "error",
        text:
          err?.message ||
          t("organizationsDetail.admins.addError", {}, {
            default: "Failed to add organization admin.",
          }),
      });
    }
  };

  const handleRemoveAdmin = async (profileId) => {
    if (!organization?.id || !profileId) return;
    if (orgAdmins.length <= 1) {
      setAdminFeedback({
        kind: "error",
        text: t("organizationsDetail.admins.lastAdminBlocked", {}, {
          default: "You cannot remove the last admin of this organization.",
        }),
      });
      return;
    }
    const confirmed = window.confirm(
      t("organizationsDetail.admins.removeConfirm", {}, {
        default:
          "Remove this organization admin? They will lose management access but remain a member.",
      })
    );
    if (!confirmed) return;

    try {
      await updateOrganization({
        variables: {
          id: organization.id,
          input: { admins: { disconnect: [{ id: profileId }] } },
        },
      });
      setAdminFeedback({
        kind: "ok",
        text: t("organizationsDetail.admins.removed", {}, {
          default: "Organization admin removed.",
        }),
      });
    } catch (err) {
      setAdminFeedback({
        kind: "error",
        text:
          err?.message ||
          t("organizationsDetail.admins.removeError", {}, {
            default: "Failed to remove organization admin.",
          }),
      });
    }
  };

  const handleRemoveMember = async (profileId) => {
    if (!organization?.id || !profileId) return;

    const isAdmin = orgAdmins.some((admin) => admin.id === profileId);
    if (isAdmin && orgAdmins.length <= 1) {
      setInviteFeedback({
        kind: "error",
        text: t("organizationsDetail.admins.lastAdminBlocked", {}, {
          default: "You cannot remove the last admin of this organization.",
        }),
      });
      return;
    }

    const confirmed = window.confirm(
      t("organizationsDetail.removeMemberConfirm", {}, {
        default: "Remove this member from the organization?",
      })
    );
    if (!confirmed) return;

    const input = { members: { disconnect: [{ id: profileId }] } };
    if (isAdmin) {
      input.admins = { disconnect: [{ id: profileId }] };
    }

    try {
      await updateOrganization({
        variables: { id: organization.id, input },
      });
      setInviteFeedback({
        kind: "ok",
        text: t("organizationsDetail.removeMemberSuccess", {}, {
          default: "Member removed from the organization.",
        }),
      });
    } catch (err) {
      setInviteFeedback({
        kind: "error",
        text:
          err?.message ||
          t("organizationsDetail.removeMemberError", {}, {
            default: "Failed to remove member.",
          }),
      });
    }
  };

  if (!showMembersCard && !canManage) {
    return null;
  }

  return (
    <>
      {showMembersCard && (
        <Card>
          <h2>
            {t("organizationsDetail.members", {}, { default: "Members" })}
          </h2>
          <p className="helper">
            {t("organizationsDetail.membersHelper", { name: organization.name }, {
              default:
                "People at {{name}} who manage this organization on MindHive.",
            })}
          </p>

          {canManage && (
            <AdminForm>
              <label htmlFor="connectOrgInviteEmail">
                {t("organizationsDetail.invites.emailLabel", {}, {
                  default: "Invite member by email",
                })}
              </label>
              <AdminFormRow>
                <input
                  id="connectOrgInviteEmail"
                  type="email"
                  value={inviteEmail}
                  placeholder={t(
                    "organizationsDetail.invites.emailPlaceholder",
                    {},
                    { default: "teammate@example.com" }
                  )}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleInviteMember();
                    }
                  }}
                />
                <DesignSystemButton
                  variant="filled"
                  type="button"
                  disabled={memberMutationLoading}
                  onClick={handleInviteMember}
                >
                  {inviting
                    ? t("organizationsDetail.invites.inviting", {}, {
                        default: "Inviting…",
                      })
                    : t("organizationsDetail.invites.invite", {}, {
                        default: "Invite member",
                      })}
                </DesignSystemButton>
              </AdminFormRow>
              {inviteFeedback ? (
                <>
                  <AdminFeedback $error={inviteFeedback.kind === "error"}>
                    {inviteFeedback.text}
                  </AdminFeedback>
                  {inviteFeedback.manualLink ? (
                    <InviteLinkRow>
                      <CopyButton
                        value={inviteFeedback.manualLink}
                        style={{ fontWeight: 500 }}
                        ariaLabel={t(
                          "organizationsDetail.invites.copyInviteLinkAria",
                          {},
                          { default: "Copy invite signup link to clipboard" }
                        )}
                      >
                        {t("organizationsDetail.invites.copyInviteLink", {}, {
                          default: "Copy invite link",
                        })}
                      </CopyButton>
                    </InviteLinkRow>
                  ) : null}
                </>
              ) : null}
            </AdminForm>
          )}

          {canManage && pendingInvites.length > 0 && (
            <div>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontFamily: "Lato, sans-serif",
                  fontSize: 14,
                  color: "#171717",
                }}
              >
                {t("organizationsDetail.invites.pendingTitle", {}, {
                  default: "Pending invites",
                })}
              </h3>
              <PendingList>
                {pendingInvites.map((inv) => {
                  const link = buildOrganizationInviteLink(inv.token);
                  const dateLabel = formatDateLabel(inv.createdAt);
                  return (
                    <PendingRow key={inv.id}>
                      <div className="info">
                        <span className="email">{inv.email}</span>
                        <span className="meta">
                          {t(
                            "organizationsDetail.invites.waitingSignup",
                            { date: dateLabel },
                            {
                              default: "Invited {{date}} · waiting for signup",
                            }
                          )}
                        </span>
                      </div>
                      {link ? (
                        <CopyButton
                          value={link}
                          style={{ fontWeight: 500 }}
                          ariaLabel={t(
                            "organizationsDetail.invites.copyInviteLinkAria",
                            {},
                            {
                              default: "Copy invite signup link to clipboard",
                            }
                          )}
                        >
                          {t("organizationsDetail.invites.copyInviteLink", {}, {
                            default: "Copy invite link",
                          })}
                        </CopyButton>
                      ) : null}
                      <DesignSystemButton
                        variant="text"
                        style={{ color: "#871b16" }}
                        type="button"
                        disabled={revoking}
                        onClick={() => handleRevokeInvite(inv.id, inv.email)}
                      >
                        {t("organizationsDetail.invites.cancel", {}, {
                          default: "Cancel invite",
                        })}
                      </DesignSystemButton>
                    </PendingRow>
                  );
                })}
              </PendingList>
            </div>
          )}

          {members.length > 0 ? (
            <ProfileList>
              {members.map((member) => (
                <ConnectProfileCard
                  key={member.id}
                  user={user}
                  profile={member}
                  actions={
                    canManage ? (
                      <DesignSystemButton
                        variant="text"
                        style={{ color: "#871b16" }}
                        type="button"
                        disabled={updating}
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        {t("organizationsDetail.removeMember", {}, {
                          default: "Remove",
                        })}
                      </DesignSystemButton>
                    ) : null
                  }
                />
              ))}
            </ProfileList>
          ) : null}
        </Card>
      )}

      {canManage && (
        <DangerCard>
          <h2>
            {t("organizationsDetail.admins.title", {}, { default: "Admins" })}
          </h2>
          <p className="helper">
            {t("organizationsDetail.admins.helper", {}, {
              default:
                "Admins can manage members, invites, and organization settings.",
            })}
          </p>

          <AdminForm>
            <label htmlFor="connectOrgAdminEmail">
              {t("organizationsDetail.admins.emailLabel", {}, {
                default: "Add admin by email",
              })}
            </label>
            <AdminFormRow>
              <input
                id="connectOrgAdminEmail"
                type="email"
                value={adminEmail}
                placeholder={t(
                  "organizationsDetail.admins.emailPlaceholder",
                  {},
                  { default: "teammate@example.com" }
                )}
                onChange={(event) => setAdminEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddAdmin();
                  }
                }}
              />
              <DesignSystemButton
                variant="filled"
                type="button"
                disabled={adminMutationLoading}
                onClick={handleAddAdmin}
              >
                {updating
                  ? t("organizationsDetail.admins.adding", {}, {
                      default: "Adding…",
                    })
                  : t("organizationsDetail.admins.add", {}, {
                      default: "Add admin",
                    })}
              </DesignSystemButton>
            </AdminFormRow>
            {adminFeedback ? (
              <AdminFeedback $error={adminFeedback.kind === "error"}>
                {adminFeedback.text}
              </AdminFeedback>
            ) : null}
          </AdminForm>

          {orgAdmins.length > 0 ? (
            <ProfileList>
              {orgAdmins.map((admin) => (
                <ConnectProfileCard
                  key={admin.id}
                  user={user}
                  profile={admin}
                  actions={
                    <DesignSystemButton
                      variant="text"
                      style={{ color: "#871b16" }}
                      type="button"
                      disabled={updating || orgAdmins.length <= 1}
                      onClick={() => handleRemoveAdmin(admin.id)}
                    >
                      {t("organizationsDetail.admins.remove", {}, {
                        default: "Remove",
                      })}
                    </DesignSystemButton>
                  }
                />
              ))}
            </ProfileList>
          ) : (
            <p className="helper">
              {t("organizationsDetail.admins.empty", {}, {
                default: "No admins have been assigned yet.",
              })}
            </p>
          )}
        </DangerCard>
      )}
    </>
  );
}
