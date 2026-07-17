import { mergeSchemas } from "@graphql-tools/schema";

import sendEmail from "./sendEmail";
import copyProposalBoard from "./copyProposalBoard";
import deleteProposal from "./deleteProposal";
import archiveStudy from "./archiveStudy";
import googleSignup from "./googleSignup";
import googleLogin from "./googleLogin";
import linkAssignmentToTemplateCard from "./linkAssignmentToTemplateCard";
import unlinkAssignmentFromTemplateCards from "./unlinkAssignmentFromTemplateCards";
import setAssignmentTemplateCards from "./setAssignmentTemplateCards";
import setResourceTemplateCards from "./setResourceTemplateCards";
import applyTemplateBoardChanges from "./applyTemplateBoardChanges";
import backfillMediaAssetOrigins from "./backfillMediaAssetOrigins";
import backfillOpportunityProposalData from "./backfillOpportunityProposalData";
import backfillOpportunityMultiselectFields from "./backfillOpportunityMultiselectFields";
import backfillClassNetworkAdmins from "./backfillClassNetworkAdmins";
import {
  addClassNetworkAdmin,
  addClassNetworkMemberProfile,
  associateClassWithPublicNetwork,
  removeClassFromNetwork,
  removeClassNetworkAdmin,
  removeClassNetworkMemberOrganization,
  removeClassNetworkMemberProfile,
} from "./classNetworkAdmins";
import {
  acceptNetworkInvite,
  approveNetworkInvite,
  cancelNetworkInvite,
  declineNetworkInvite,
  inviteProfileToClassNetwork,
  joinOpenClassNetwork,
  leaveClassNetwork,
  networkInviteContext,
  rejectNetworkInvite,
  requestClassNetworkMembership,
} from "./networkInvites";
import { opportunityMultiselectResolvers } from "../lib/opportunityMultiselectResolvers";
import followUser from "./followUser";
import unfollowUser from "./unfollowUser";
import resolveFormDefinition from "./resolveFormDefinition";
import seedOpportunityForm from "./seedOpportunityForm";
import seedProfileForms from "./seedProfileForms";
import seedMissingForms from "./seedMissingForms";
import duplicateFormDefinition from "./duplicateFormDefinition";
import publishFormDefinition from "./publishFormDefinition";
import { GraphQLSchema } from "graphql";

// make a fake gql tagged template literal
const graphql = String.raw;

export const extendGraphqlSchema = (schema: GraphQLSchema) =>
  mergeSchemas({
    schemas: [schema],
    typeDefs: graphql`
      type ApplyTemplateBoardChangesResult {
        id: ID!
        updatedCloneCount: Int!
        errors: [String!]!
      }
      type Mutation {
        sendEmail(
          receiverId: ID!
          title: String
          message: String
          link: String
        ): Report
        copyProposalBoard(
          id: ID!
          study: ID
          title: String
          classIdTemplate: ID
          classIdUsed: ID
          collaborators: [ID]
          isTemplate: Boolean
        ): ProposalBoard
        deleteProposal(id: ID!): ProposalBoard
        archiveStudy(study: ID!, isArchived: Boolean!): Profile
        googleSignup(token: String!, role: String, classCode: String): Profile
        googleLogin(token: String!): Profile
        linkAssignmentToTemplateCard(
          assignmentId: ID!
          templateCardId: ID!
          classId: ID!
        ): Assignment
        unlinkAssignmentFromTemplateCards(
          assignmentId: ID!
          classId: ID!
        ): Assignment
        setAssignmentTemplateCards(
          assignmentId: ID!
          templateCardIds: [ID!]!
          classId: ID!
        ): Assignment
        setResourceTemplateCards(
          resourceId: ID!
          templateCardIds: [ID!]!
          classId: ID!
        ): Resource
        applyTemplateBoardChanges(
          templateBoardId: ID!
          cardIdsWithContentUpdate: [ID!]
        ): ApplyTemplateBoardChangesResult
        backfillMediaAssetOrigins(limit: Int): Int!
        backfillOpportunityProposalData(limit: Int, dryRun: Boolean): Int!
        backfillOpportunityMultiselectFields(limit: Int, dryRun: Boolean): Int!
        backfillClassNetworkAdmins(limit: Int, dryRun: Boolean): Int!
        addClassNetworkAdmin(
          networkId: ID!
          profileId: ID
          email: String
        ): ClassNetwork
        addClassNetworkMemberProfile(
          networkId: ID!
          profileId: ID
          email: String
        ): ClassNetwork
        removeClassNetworkAdmin(
          networkId: ID!
          profileId: ID!
        ): ClassNetwork
        removeClassNetworkMemberProfile(
          networkId: ID!
          profileId: ID!
        ): ClassNetwork
        removeClassNetworkMemberOrganization(
          networkId: ID!
          organizationId: ID!
        ): ClassNetwork
        associateClassWithPublicNetwork(
          classId: ID!
          networkId: ID!
        ): Class
        removeClassFromNetwork(
          classId: ID!
          networkId: ID!
        ): Class
        requestClassNetworkMembership(networkId: ID!): NetworkInvite
        joinOpenClassNetwork(networkId: ID!): ClassNetwork
        leaveClassNetwork(networkId: ID!): ClassNetwork
        inviteProfileToClassNetwork(
          networkId: ID!
          profileId: ID
          email: String
        ): NetworkInvite
        approveNetworkInvite(inviteId: ID!): NetworkInvite
        rejectNetworkInvite(inviteId: ID!): NetworkInvite
        acceptNetworkInvite(inviteId: ID, token: String): NetworkInvite
        declineNetworkInvite(inviteId: ID, token: String): NetworkInvite
        cancelNetworkInvite(inviteId: ID!): NetworkInvite
        followUser(userId: ID!): Friendship
        unfollowUser(userId: ID!): Boolean
        # One-off seeder for the global Opportunity FormDefinition.
        # Idempotent unless force=true (which deletes and recreates).
        seedOpportunityForm(force: Boolean): FormDefinition
        # One-off seeder for global Profile FormDefinitions (individual
        # variant in Phase 5; organization variant in Phase 5b).
        seedProfileForms(force: Boolean): [FormDefinition!]!
        # Self-service seeder for the admin UI. Inserts only baseline
        # definitions that don't already exist — never clobbers
        # admin-edited definitions. Returns the list of inserted rows
        # (empty if nothing was missing).
        seedMissingForms: [FormDefinition!]!
        # Clone a FormDefinition + its cards + fields as a new draft.
        duplicateFormDefinition(id: ID!): FormDefinition
        # Atomic publish — promotes this row to status=published and
        # archives any other published row sharing the same (key, scope,
        # organization, classNetwork) tuple. Optionally records a
        # changelog entry on the published row.
        publishFormDefinition(id: ID!, changelog: String): FormDefinition
      }
      type NetworkInviteContextNetwork {
        id: ID!
        title: String
        description: String
        isPublic: Boolean
        settings: JSON
      }
      type NetworkInviteContext {
        id: ID!
        status: String!
        email: String
        classNetwork: NetworkInviteContextNetwork
      }
      extend type Query {
        # Resolve the most-specific published FormDefinition for the
        # current viewer's scope. Pass organizationId / classNetworkId
        # when known to allow per-org or per-network overrides; otherwise
        # the global definition is returned. Returns null when nothing
        # is published at any scope.
        resolveFormDefinition(
          key: String!
          organizationId: ID
          classNetworkId: ID
        ): FormDefinition
        # Public-safe invite context for login/signup. Returns only
        # non-sensitive display fields for a tokenized NetworkInvite.
        networkInviteContext(token: String!): NetworkInviteContext
      }
    `,
    resolvers: {
      Opportunity: opportunityMultiselectResolvers,
      Query: {
        resolveFormDefinition,
        networkInviteContext,
      },
      Mutation: {
        sendEmail,
        copyProposalBoard,
        deleteProposal,
        archiveStudy,
        googleSignup,
        googleLogin,
        linkAssignmentToTemplateCard,
        unlinkAssignmentFromTemplateCards,
        setAssignmentTemplateCards,
        setResourceTemplateCards,
        applyTemplateBoardChanges,
        backfillMediaAssetOrigins,
        backfillOpportunityProposalData,
        backfillOpportunityMultiselectFields,
        backfillClassNetworkAdmins,
        addClassNetworkAdmin,
        addClassNetworkMemberProfile,
        associateClassWithPublicNetwork,
        removeClassFromNetwork,
        removeClassNetworkAdmin,
        removeClassNetworkMemberProfile,
        removeClassNetworkMemberOrganization,
        requestClassNetworkMembership,
        joinOpenClassNetwork,
        leaveClassNetwork,
        inviteProfileToClassNetwork,
        approveNetworkInvite,
        rejectNetworkInvite,
        acceptNetworkInvite,
        declineNetworkInvite,
        cancelNetworkInvite,
        followUser,
        unfollowUser,
        seedOpportunityForm,
        seedProfileForms,
        seedMissingForms,
        duplicateFormDefinition,
        publishFormDefinition,
      },
    },
  });
