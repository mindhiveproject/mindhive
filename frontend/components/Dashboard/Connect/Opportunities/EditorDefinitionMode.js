// Definition-driven Opportunity editor — the cutover sibling to the
// hardcoded Editor.js. Loads the opportunity, renders <DefinitionForm>,
// and routes the form's update input straight to CREATE/UPDATE mutations.
//
// The legacy Editor.js stays in place for now and handles complex types
// (media, rich text, custom application questions). EditorSwitch picks
// which one renders based on the NEXT_PUBLIC_USE_CUSTOMIZABLE_FORMS
// env flag.
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";

import DefinitionForm from "../../../Forms/DefinitionForm";
import OpportunityClassNetworksField from "./OpportunityClassNetworksField";
import {
  GET_OPPORTUNITY,
  MY_OPPORTUNITIES,
  OPPORTUNITY_EDITOR_CLASS_NETWORKS,
} from "../../../Queries/Opportunity";
import { GET_MY_ORGANIZATION } from "../../../Queries/Organization";
import {
  CREATE_OPPORTUNITY,
  UPDATE_OPPORTUNITY,
} from "../../../Mutations/Opportunity";
import useConnectRole from "../useConnectRole";
import {
  buildClassNetworksMutationInput,
  collectMemberClassNetworks,
} from "../../../../lib/opportunityClassNetworks";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px clamp(16px, 6vw, 64px);
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 600;
    color: #171717;
  }
`;

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #336f8a;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
`;

function rolesForViewer(connectRole) {
  const roles = [];
  if (connectRole.isAdmin) roles.push("admin");
  if (connectRole.isTeacher) roles.push("teacher");
  if (connectRole.isScientist) roles.push("scientist");
  if (connectRole.isMentor) roles.push("mentor");
  if (connectRole.isStudent) roles.push("student");
  if (connectRole.isSponsor) roles.push("sponsor");
  return roles;
}

export default function EditorDefinitionMode({ opportunityId }) {
  const router = useRouter();
  const isNew = !opportunityId;
  const connectRole = useConnectRole();
  const viewerRoles = rolesForViewer(connectRole);

  const { data: oppData, loading: oppLoading } = useQuery(GET_OPPORTUNITY, {
    variables: { id: opportunityId },
    skip: isNew,
    fetchPolicy: "cache-and-network",
  });
  const opportunity = oppData?.opportunity;

  const { data: editorNetworksData } = useQuery(
    OPPORTUNITY_EDITOR_CLASS_NETWORKS,
  );
  const availableNetworks = useMemo(
    () =>
      collectMemberClassNetworks(editorNetworksData?.authenticatedItem),
    [editorNetworksData],
  );

  const [selectedNetworks, setSelectedNetworks] = useState([]);

  useEffect(() => {
    setSelectedNetworks(
      (opportunity?.classNetworks || []).map((network) => network.id),
    );
  }, [opportunity?.id]);

  // Resolve the viewer's organization so per-org definition variants
  // can be picked up when they exist.
  const { data: orgData } = useQuery(GET_MY_ORGANIZATION, {
    fetchPolicy: "cache-and-network",
  });
  const myOrgId = orgData?.authenticatedItem?.organizations?.[0]?.id || null;

  const [createOpportunity] = useMutation(CREATE_OPPORTUNITY, {
    refetchQueries: [{ query: MY_OPPORTUNITIES }],
    awaitRefetchQueries: true,
  });
  const [updateOpportunity] = useMutation(UPDATE_OPPORTUNITY, {
    refetchQueries: [
      { query: MY_OPPORTUNITIES },
      { query: GET_OPPORTUNITY, variables: { id: opportunityId } },
    ],
    awaitRefetchQueries: true,
  });

  const [flash, setFlash] = useState(null);

  const handleSubmit = async (result) => {
    const baseInput = result?.self || {};
    const classNetworks = buildClassNetworksMutationInput(
      selectedNetworks,
      isNew,
    );
    const input = {
      ...baseInput,
      ...(classNetworks ? { classNetworks } : {}),
    };

    setFlash(null);
    if (isNew) {
      const res = await createOpportunity({ variables: { input } });
      const newId = res?.data?.createOpportunity?.id;
      if (newId) {
        router.replace(
          { pathname: "/dashboard/connect/opportunities", query: { op: newId } },
          undefined,
          { shallow: false }
        );
      }
    } else {
      await updateOpportunity({
        variables: { id: opportunityId, input },
      });
      setFlash("Saved.");
    }
  };

  if (!isNew && oppLoading && !opportunity) {
    return <Shell>Loading opportunity…</Shell>;
  }

  return (
    <Shell>
      <TopBar>
        <BackLink
          type="button"
          onClick={() =>
            router.push({ pathname: "/dashboard/connect/opportunities" })
          }
        >
          ← Back
        </BackLink>
        <h1>{isNew ? "New opportunity" : opportunity?.title || "Opportunity"}</h1>
      </TopBar>
      {flash ? (
        <div style={{ color: "#1d6b3a", fontSize: 14 }}>{flash}</div>
      ) : null}
      <OpportunityClassNetworksField
        availableNetworks={availableNetworks}
        selectedNetworks={selectedNetworks}
        onChange={setSelectedNetworks}
      />
      <DefinitionForm
        definitionKey="opportunity"
        entity={opportunity || null}
        scopeContext={{ organizationId: myOrgId }}
        viewerRoles={viewerRoles}
        locale={router.locale}
        onSubmit={handleSubmit}
        saveLabel={isNew ? "Create opportunity" : "Save changes"}
      />
    </Shell>
  );
}
