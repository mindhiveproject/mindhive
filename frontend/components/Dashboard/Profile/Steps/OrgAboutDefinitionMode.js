// Definition-driven org-account About page. Dual-writes:
//   - Personal fields (storageEntity="self")          → UPDATE_PROFILE
//   - Organization fields (storageEntity="organization") → UPDATE_ORGANIZATION
//   - If no organization is linked yet, CREATE_ORGANIZATION on first save,
//     attaching the current user as the first member.
//
// members_panel is a special card that mounts the legacy Members.js
// component so member-management UI stays consistent with the rest of
// the org-management flow.
import { useMemo } from "react";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";

import DefinitionForm from "../../../Forms/DefinitionForm";
import Members from "./Blocks/Members";
import { UPDATE_PROFILE } from "../../../Mutations/User";
import {
  CREATE_ORGANIZATION,
  UPDATE_ORGANIZATION,
} from "../../../Mutations/Organization";
import { GET_PROFILE } from "../../../Queries/User";
import { resolveLinkedOrganization } from "../../../../lib/profileEditNavigation";
import { deriveRoles } from "../../Connect/useConnectRole";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 0;
`;

const ModeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 100px;
  background: #eef5f9;
  color: #336f8a;
  font-size: 12px;
  font-weight: 600;
  align-self: flex-start;
`;

function rolesForViewer(user) {
  const roles = deriveRoles(user);
  const out = [];
  if (roles.isAdmin) out.push("admin");
  if (roles.isTeacher) out.push("teacher");
  if (roles.isScientist) out.push("scientist");
  if (roles.isMentor) out.push("mentor");
  if (roles.isStudent) out.push("student");
  if (roles.isSponsor) out.push("sponsor");
  return out;
}

export default function OrgAboutDefinitionMode({ user }) {
  const router = useRouter();
  const organization = useMemo(() => resolveLinkedOrganization(user), [user]);

  const refetchProfile = [{ query: GET_PROFILE }];
  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    refetchQueries: refetchProfile,
    awaitRefetchQueries: true,
  });
  const [updateOrganization] = useMutation(UPDATE_ORGANIZATION, {
    refetchQueries: refetchProfile,
    awaitRefetchQueries: true,
  });
  const [createOrganization] = useMutation(CREATE_ORGANIZATION, {
    refetchQueries: refetchProfile,
    awaitRefetchQueries: true,
  });

  const specialCardComponents = useMemo(
    () => ({
      members_panel: () => (
        <Members user={user} organization={organization} />
      ),
    }),
    [user, organization]
  );

  const handleSubmit = async (result) => {
    const profileInput = result?.self || {};
    const orgInput = result?.organization || {};

    // Organization write — create on first save if none exists yet.
    if (Object.keys(orgInput).length > 0) {
      if (organization?.id) {
        await updateOrganization({
          variables: { id: organization.id, input: orgInput },
        });
      } else {
        if (!orgInput.name) {
          throw new Error(
            "Organization name is required to create your organization."
          );
        }
        await createOrganization({
          variables: {
            input: {
              ...orgInput,
              members: { connect: [{ id: user.id }] },
              createdBy: { connect: { id: user.id } },
            },
          },
        });
      }
    }

    // Personal-profile write — only if there's something to update.
    if (Object.keys(profileInput).length > 0 && user?.id) {
      await updateProfile({ variables: { id: user.id, input: profileInput } });
    }

    router.push({
      pathname: "/dashboard/profile/edit",
      query: { page: "interests" },
    });
  };

  if (!user?.id) {
    return <Shell>Loading profile…</Shell>;
  }

  return (
    <Shell>
      <ModeBadge>Definition-driven form</ModeBadge>
      <DefinitionForm
        definitionKey="profile_organization"
        entity={user}
        related={{ organization }}
        viewerRoles={rolesForViewer(user)}
        locale={router.locale}
        onSubmit={handleSubmit}
        saveLabel="Save & continue"
        specialCardComponents={specialCardComponents}
      />
    </Shell>
  );
}
