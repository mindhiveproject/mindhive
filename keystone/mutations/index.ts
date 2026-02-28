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

// make a fake gql tagged template literal
const graphql = String.raw;

export const extendGraphqlSchema = (schema) =>
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
      }
    `,
    resolvers: {
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
      },
    },
  });
