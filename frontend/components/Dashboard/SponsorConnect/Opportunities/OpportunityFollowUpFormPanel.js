import { forwardRef } from "react";
import { useMutation } from "@apollo/client";
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
import {
  getProposalEntrySavedAt,
  upsertProposalEntry,
} from "../../../../lib/opportunityProposalData";

const Intro = styled.p`
  margin: 0 0 8px;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #5f6871;
`;

const SavedAt = styled.p`
  margin: 0 0 16px;
  font-family: "Inter", sans-serif;
  font-size: 13px;
  line-height: 1.4;
  color: var(--MH-Theme-Neutrals-Grey-2, #5f6871);
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

function formatSavedAt(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

const OpportunityFollowUpFormPanel = forwardRef(
  function OpportunityFollowUpFormPanel(
    { opportunity, formMeta, readOnly = false, hideSaveButton = true },
    ref,
  ) {
    const router = useRouter();
    const { t } = useTranslation("connect");
    const connectRole = useConnectRole();
    const viewerRoles = rolesForViewer(connectRole);

    const [updateOpportunity] = useMutation(UPDATE_OPPORTUNITY, {
      refetchQueries: [
        { query: MY_OPPORTUNITIES },
        ...(opportunity?.id
          ? [{ query: GET_OPPORTUNITY, variables: { id: opportunity.id } }]
          : []),
      ],
      awaitRefetchQueries: true,
    });

    if (!formMeta?.id || !opportunity?.id) {
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
          opportunity.proposalData,
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

      await updateOpportunity({
        variables: {
          id: opportunity.id,
          input: { proposalData },
        },
      });
    };

    const contextBits = [
      formMeta.networkTitle,
      formMeta.roundTitle,
    ].filter(Boolean);

    const savedAtRaw = getProposalEntrySavedAt(
      opportunity.proposalData,
      formMeta.id,
    );
    const savedAtLabel = formatSavedAt(savedAtRaw);

    return (
      <div>
        {contextBits.length > 0 && (
          <Intro>
            {t(
              "opportunityEditor.followUpIntro",
              {
                context: contextBits.join(" · "),
              },
              {
                default:
                  "Additional questions from {{context}}. Your answers are saved on this opportunity.",
              },
            )}
          </Intro>
        )}
        {savedAtLabel ? (
          <SavedAt>
            {t(
              "opportunityEditor.followUpLastSaved",
              { date: savedAtLabel },
              { default: "Last saved {{date}}" },
            )}
          </SavedAt>
        ) : null}
        <DefinitionForm
          ref={ref}
          definitionId={formMeta.id}
          proposalEntryFormDefinitionId={formMeta.id}
          entity={opportunity}
          scopeContext={{
            classNetworkId: formMeta.networkId || null,
          }}
          viewerRoles={viewerRoles.length ? viewerRoles : ["sponsor"]}
          locale={router.locale}
          onSubmit={handleSubmit}
          readOnly={readOnly}
          hideSaveButton={hideSaveButton}
          saveLabel={t("opportunityEditor.save", {}, {
            default: "Save changes",
          })}
        />
      </div>
    );
  },
);

export default OpportunityFollowUpFormPanel;
