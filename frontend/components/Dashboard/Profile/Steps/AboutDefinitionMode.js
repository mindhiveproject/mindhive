// Definition-driven replacement for the legacy 2-AboutMe block. Renders
// the `profile_individual` FormDefinition and dispatches saves through
// UPDATE_PROFILE. The legacy About flow remains in place behind the env
// flag for fall-back / org-account use until Phase 5b ships the
// organization variant.
import { useRouter } from "next/router";
import { useMutation } from "@apollo/client";
import styled from "styled-components";

import DefinitionForm from "../../../Forms/DefinitionForm";
import { UPDATE_PROFILE } from "../../../Mutations/User";
import { GET_PROFILE } from "../../../Queries/User";
import { deriveRoles } from "../../Connect/useConnectRole";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 0;
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

export default function AboutDefinitionMode({ user }) {
  const router = useRouter();
  const [updateProfile, { loading, error }] = useMutation(UPDATE_PROFILE, {
    refetchQueries: [{ query: GET_PROFILE }],
    awaitRefetchQueries: true,
  });

  const handleSubmit = async (result) => {
    const input = result?.self || {};
    if (!user?.id) throw new Error("No profile to update.");
    await updateProfile({ variables: { id: user.id, input } });
    // Move to the interests step, matching legacy flow.
    router.push({ pathname: "/dashboard/profile/edit", query: { page: "interests" } });
  };

  if (!user?.id) {
    return <Shell>Loading profile…</Shell>;
  }

  return (
    <Shell>
      {error ? (
        <div style={{ color: "#871b16", fontSize: 14 }}>
          {error.message}
        </div>
      ) : null}
      <DefinitionForm
        definitionKey="profile_individual"
        entity={user}
        viewerRoles={rolesForViewer(user)}
        locale={router.locale}
        onSubmit={handleSubmit}
        saveLabel={loading ? "Saving…" : "Save & continue"}
      />
    </Shell>
  );
}
