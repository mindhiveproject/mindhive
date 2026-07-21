// Definition-driven Opportunity editor — the cutover sibling to the
// hardcoded Editor.js. Loads the opportunity, renders <DefinitionForm>,
// and routes the form's update input straight to CREATE/UPDATE mutations.
//
// The legacy Editor.js stays in place for now and handles complex types
// (media, rich text, custom application questions). EditorSwitch picks
// which one renders based on the NEXT_PUBLIC_USE_CUSTOMIZABLE_FORMS
// env flag.
import { useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import { UserContext } from "../../../Global/Authorized";
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
  isNewOpportunityId,
} from "../../../../lib/opportunityClassNetworks";

const BACK_CHEVRON = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"
      fill="currentColor"
    />
  </svg>
);

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px clamp(16px, 6vw, 64px);
  padding-top: 0px;
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
  scroll-padding-top: 126px;
`;

const TopBar = styled.header.attrs({ className: "Editor__TopBar" })`
  position: sticky;
  top: 70px;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin: -8px calc(-1 * clamp(16px, 6vw, 64px)) 8px;
  padding: 10px clamp(16px, 6vw, 64px);
  background: rgba(247, 249, 248, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(211, 218, 224, 0.85);
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1 1 220px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  min-width: 0;
  flex: 1 1 auto;

  h1 {
    margin: 0;
    min-width: 0;
    max-width: 100%;
    font-family: "Lato", sans-serif;
    font-size: clamp(20px, 2.8vw, 26px);
    font-weight: 600;
    color: #171717;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 8px;
  color: #336f8a;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(51, 111, 138, 0.08);
  }

  &:focus-visible {
    outline: 2px solid #336f8a;
    outline-offset: 2px;
  }
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
  const { t } = useTranslation("connect");
  const user = useContext(UserContext);
  const isNew = isNewOpportunityId(opportunityId);
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
      const createInput = {
        ...input,
        ...(user?.id ? { mentor: { connect: { id: user.id } } } : {}),
        ...(myOrgId ? { organization: { connect: { id: myOrgId } } } : {}),
      };
      const res = await createOpportunity({ variables: { input: createInput } });
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
    return (
      <Shell>
        {t("opportunityEditor.loading", {}, {
          default: "Loading opportunity…",
        })}
      </Shell>
    );
  }

  const entityTitle = (opportunity?.title || "").trim();
  const pageTitle = entityTitle
    ? entityTitle
    : isNew
    ? t("opportunityEditor.pageTitleNew", {}, {
        default: "New opportunity",
      })
    : t("opportunityEditor.pageTitleEdit", {}, {
        default: "Edit opportunity",
      });
  const backLabel = t("opportunityEditor.backLink", {}, {
    default: "Back to opportunities",
  });

  return (
    <Shell>
      <TopBar>
        <TopBarLeft>
          <BackLink
            type="button"
            onClick={() =>
              router.push({ pathname: "/dashboard/connect/opportunities" })
            }
            aria-label={backLabel}
            title={backLabel}
          >
            {BACK_CHEVRON}
          </BackLink>
          <TitleRow>
            <h1 title={pageTitle}>{pageTitle}</h1>
          </TitleRow>
        </TopBarLeft>
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
        saveLabel={
          isNew
            ? t("opportunityEditor.create", {}, {
                default: "Create opportunity",
              })
            : t("opportunityEditor.save", {}, { default: "Save changes" })
        }
      />
    </Shell>
  );
}
