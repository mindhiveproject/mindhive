import { list } from "@keystone-6/core";
import {
  relationship,
  timestamp,
  json,
} from "@keystone-6/core/fields";
import { rules, isSignedIn } from "../access";

export const QuestionAnswer = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: rules.connectAnswerVisible,
      update: rules.connectAnswerVisible,
      delete: rules.connectAnswerVisible,
    },
  },
  fields: {
    question: relationship({
      ref: "ConnectQuestion.answers",
    }),

    respondent: relationship({
      ref: "Profile.questionAnswers",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create" && !inputData.respondent) {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.respondent;
        },
      },
    }),

    round: relationship({
      ref: "ConnectRound.questionAnswers",
    }),
    opportunity: relationship({
      ref: "Opportunity.questionAnswers",
    }),

    answer: json(),

    answeredAt: timestamp({
      defaultValue: { kind: "now" },
    }),
  },
});
