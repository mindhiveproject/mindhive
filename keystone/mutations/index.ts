import { mergeSchemas } from "@graphql-tools/schema";

import sendEmail from "./sendEmail";
import copyProposalBoard from "./copyProposalBoard";
import deleteProposal from "./deleteProposal";
import archiveStudy from "./archiveStudy";
import googleSignup from "./googleSignup";
import googleLogin from "./googleLogin";
import signupWithTurnstile from "./signupWithTurnstile";
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
import generateAiFeedbackHelp from "./generateAiFeedbackHelp";
import resolveFormDefinition from "./resolveFormDefinition";
import seedOpportunityForm from "./seedOpportunityForm";
import seedProfileForms from "./seedProfileForms";
import seedReviewForms from "./seedReviewForms";
import seedMissingForms from "./seedMissingForms";
import duplicateFormDefinition from "./duplicateFormDefinition";
import publishFormDefinition from "./publishFormDefinition";
import seedMilestones from "./seedMilestones";
import seedMissingMilestones from "./seedMissingMilestones";
import backfillMilestoneStatus from "./backfillMilestoneStatus";
import resolveMilestonesForBoard from "./resolveMilestonesForBoard";
import createTemplateMilestone from "./createTemplateMilestone";
import updateTemplateMilestone from "./updateTemplateMilestone";
import backfillLinkActionCardsToMilestones from "./backfillLinkActionCardsToMilestones";
import backfillLowercaseKeys from "./backfillLowercaseKeys";
import backfillProjectBoardFormScope from "./backfillProjectBoardFormScope";
import backfillProposalBoardPublicIds from "./backfillProposalBoardPublicIds";
import syncClassTemplateBoards from "./syncClassTemplateBoards";
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
      input AiFeedbackHelpInput {
        proposalId: ID!
        questionNumber: String!
        questionName: String
        currentTextContent: String
      }
      type AiFeedbackHelpButton {
        text: String!
        action: String
      }
      type AiFeedbackHelpResult {
        textDisplay: String!
        buttonsArray: [AiFeedbackHelpButton!]!
      }
      type AiFeedbackHelpPayload {
        threadId: String!
        status: String!
        result: AiFeedbackHelpResult
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
        # Public signup. Gated by Cloudflare Turnstile + bot heuristics;
        # Profile.create is closed to anonymous callers so this is the only
        # way in from the signup form.
        signupWithTurnstile(
          username: String!
          email: String!
          password: String!
          role: String
          classCode: String
          info: JSON
          turnstileToken: String
        ): Profile
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
        syncClassTemplateBoards(classId: ID!): Class
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
        generateAiFeedbackHelp(
          input: AiFeedbackHelpInput!
        ): AiFeedbackHelpPayload!
        # One-off seeder for the global Opportunity FormDefinition.
        # Idempotent unless force=true (which deletes and recreates).
        seedOpportunityForm(force: Boolean): FormDefinition
        # One-off seeder for global Profile FormDefinitions (individual
        # variant in Phase 5; organization variant in Phase 5b).
        seedProfileForms(force: Boolean): [FormDefinition!]!
        # One-off seeder for global Review FormDefinitions (3 stages × 3
        # curricula). Idempotent unless force=true (which deletes and
        # recreates).
        seedReviewForms(force: Boolean): [FormDefinition!]!
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
        # One-off seeder for baseline Milestone inventory.
        # Idempotent unless force=true (which deletes and recreates).
        seedMilestones(force: Boolean): [Milestone!]!
        # Self-service seeder for the admin UI. Inserts only baseline
        # milestones that don't already exist — never clobbers edits.
        seedMissingMilestones: [Milestone!]!
        # Backfill ProposalBoard.milestoneStatus from legacy columns.
        backfillMilestoneStatus(limit: Int, dryRun: Boolean): Int!
        backfillLinkActionCardsToMilestones(limit: Int, dryRun: Boolean): Int!
        # One-shot: lowercase Milestone.key/reviewStage and any
        # FormDefinition.key that starts with review_*. Dry-run by
        # default; pass dryRun:false to apply. Returns a list of change
        # descriptions for the log.
        backfillLowercaseKeys(dryRun: Boolean): [String!]!
        # One-shot: relocate auto-provisioned FormDefinitions (created
        # by createTemplateMilestone before project_board scope existed)
        # from scope=global to scope=project_board with proposalBoard
        # set from the owning template milestone.
        backfillProjectBoardFormScope(dryRun: Boolean): [String!]!
        # One-shot: stamp publicId on ProposalSection and ProposalCard so
        # the propagation matcher can pair template↔clone rows by identity
        # instead of by position. Safe to run BEFORE the new propagation
        # code deploys — it aligns clones to templates at the current
        # positional snapshot, before any post-fix reorder is possible.
        # Dry-run by default. Returns a list of change descriptions.
        backfillProposalBoardPublicIds(limit: Int, dryRun: Boolean): [String!]!
        createTemplateMilestone(input: CreateTemplateMilestoneInput!): Milestone
        updateTemplateMilestone(input: UpdateTemplateMilestoneInput!): Milestone
      }
      input CreateTemplateMilestoneInput {
        templateBoardId: ID!
        title: String!
        description: String
        formDefinitionId: ID
        sourceFormDefinitionKey: String
        clonedFromMilestoneId: ID
        canReviewPermissionIds: [ID!]
        canReviewPermissionNames: [String!]
        showInFeedbackCenter: Boolean
        statusTarget: String
        sectionId: ID
      }
      input UpdateTemplateMilestoneInput {
        id: ID!
        title: String
        description: String
        formDefinitionId: ID
        canReviewPermissionIds: [ID!]
        showInFeedbackCenter: Boolean
        isActive: Boolean
        position: Int
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
        resolveMilestonesForBoard(boardId: ID!): [Milestone!]!
        # Resolve the most-specific published FormDefinition for the
        # current viewer's scope. Pass any subset of the scope IDs the
        # caller knows about; the resolver picks the winner as
        # project_board > class_network > organization > global.
        # Returns null when nothing is published at any scope.
        resolveFormDefinition(
          key: String!
          organizationId: ID
          classNetworkId: ID
          proposalBoardId: ID
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
        resolveMilestonesForBoard,
        networkInviteContext,
      },
      Mutation: {
        sendEmail,
        copyProposalBoard,
        deleteProposal,
        archiveStudy,
        googleSignup,
        googleLogin,
        signupWithTurnstile,
        linkAssignmentToTemplateCard,
        unlinkAssignmentFromTemplateCards,
        setAssignmentTemplateCards,
        setResourceTemplateCards,
        applyTemplateBoardChanges,
        syncClassTemplateBoards,
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
        generateAiFeedbackHelp,
        seedOpportunityForm,
        seedProfileForms,
        seedReviewForms,
        seedMissingForms,
        duplicateFormDefinition,
        publishFormDefinition,
        seedMilestones,
        seedMissingMilestones,
        backfillMilestoneStatus,
        backfillLinkActionCardsToMilestones,
        backfillLowercaseKeys,
        backfillProjectBoardFormScope,
        backfillProposalBoardPublicIds,
        createTemplateMilestone,
        updateTemplateMilestone,
      },
    },
  });
