import { forwardRef } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";

import DefinitionForm from "../../../Forms/DefinitionForm";
import {
  GET_OPPORTUNITY,
  MY_OPPORTUNITIES,
} from "../../../Queries/Opportunity";
import { UPDATE_OPPORTUNITY } from "../../../Mutations/Opportunity";
import useConnectRole from "../../Connect/useConnectRole";
import { upsertProposalEntry } from "../../../../lib/opportunityProposalData";

const StatusText = styled.p`
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--MH-Theme-Neutrals-Dark, #5f6871);
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

const OpportunityFollowUpFormPanel = forwardRef(
  function OpportunityFollowUpFormPanel(
    {
      opportunity,
      formMeta,
      readOnly = false,
      hideSaveButton = true,
      readOnlyLayout = null,
      hideUnansweredFields = false,
    },
    ref,
  ) {
    const router = useRouter();
    const { t } = useTranslation("connect");
    const connectRole = useConnectRole();
    const viewerRoles = rolesForViewer(connectRole);
    const opportunityId = opportunity?.id;

    // Always load the latest opportunity so follow-up forms hydrate from the
    // sponsor's current proposalData, not a stale list/preview snapshot.
    const { data: liveData, loading: liveLoading } = useQuery(GET_OPPORTUNITY, {
      variables: { id: opportunityId },
      skip: !opportunityId,
      fetchPolicy: "network-only",
    });

    const liveOpportunity = liveData?.opportunity || opportunity;

    const [updateOpportunity] = useMutation(UPDATE_OPPORTUNITY, {
      refetchQueries: [
        { query: MY_OPPORTUNITIES },
        ...(opportunityId
          ? [{ query: GET_OPPORTUNITY, variables: { id: opportunityId } }]
          : []),
      ],
      awaitRefetchQueries: true,
    });

    if (!formMeta?.id || !opportunityId) {
      return null;
    }

    const handleSubmit = async (result) => {
      const self = result?.self || {};
      // DefinitionForm with proposalEntryFormDefinitionId already wraps
      // proposalData; keep a defensive upsert if a flat answer slips through.
      let proposalData = self.proposalData;
      if (
        proposalData &&
        !Array.isArray(proposalData) &&
        typeof proposalData === "object"
      ) {
        proposalData = upsertProposalEntry(
          liveOpportunity.proposalData,
          formMeta.id,
          proposalData,
        );
      }
      if (!proposalData) {
        throw new Error(
          t("opportunityEditor.followUpSaveMissing", {}, {
            default:
              "Could not build proposal data for this form. Please try again.",
          }),
        );
      }

      // Managed intro-video field writes Opportunity.videoFile alongside
      // questionnaire answers (multipart upload when a File is present).
      const input = { proposalData };
      if (Object.prototype.hasOwnProperty.call(self, "videoFile")) {
        input.videoFile = self.videoFile;
      }

      await updateOpportunity({
        variables: {
          id: opportunityId,
          input,
        },
      });
    };

    if (liveLoading && !liveData?.opportunity) {
      return (
        <StatusText>
          {t("opportunityEditor.loading", {}, {
            default: "Loading opportunity…",
          })}
        </StatusText>
      );
    }

    return (
      <DefinitionForm
        key={formMeta.id}
        ref={ref}
        definitionId={formMeta.id}
        proposalEntryFormDefinitionId={formMeta.id}
        entity={liveOpportunity}
        scopeContext={{
          classNetworkId: formMeta.networkId || null,
        }}
        viewerRoles={viewerRoles.length ? viewerRoles : ["sponsor"]}
        locale={router.locale}
        onSubmit={handleSubmit}
        readOnly={readOnly}
        readOnlyLayout={readOnly ? readOnlyLayout : null}
        hideSaveButton={hideSaveButton}
        hideUnansweredFields={hideUnansweredFields}
        quiet
        saveLabel={t("opportunityEditor.save", {}, {
          default: "Save changes",
        })}
      />
    );
  },
);

export default OpportunityFollowUpFormPanel;
