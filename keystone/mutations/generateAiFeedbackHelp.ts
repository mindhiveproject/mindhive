import { randomUUID } from "crypto";

import { permissions } from "../access";

type AiFeedbackHelpInput = {
  proposalId: string;
  questionNumber: string;
  questionName?: string | null;
  currentTextContent?: string | null;
};

type AiFeedbackHelpButton = {
  text: string;
  action?: string | null;
};

type AiFeedbackHelpResult = {
  textDisplay: string;
  buttonsArray?: AiFeedbackHelpButton[] | null;
};

type AiFeedbackServiceResponse = {
  status?: string;
  result?: AiFeedbackHelpResult;
  metadata?: Record<string, unknown>;
};

function canGenerateAiFeedback(session: any) {
  return (
    permissions.canManageUsers({ session }) ||
    permissions.canAccessAdminUI({ session })
  );
}

function normalizeResult(result?: AiFeedbackHelpResult | null): AiFeedbackHelpResult {
  const buttons = result?.buttonsArray;
  return {
    textDisplay:
      typeof result?.textDisplay === "string" ? result.textDisplay : "",
    buttonsArray: Array.isArray(buttons)
      ? buttons
          .filter((button) => button && typeof button.text === "string")
          .map((button) => ({
            text: button.text,
            action:
              typeof button.action === "string" ? button.action : null,
          }))
      : [],
  };
}

async function updateThread(
  context: any,
  id: string,
  data: Record<string, unknown>
) {
  return context.db.AiThread.updateOne(
    {
      where: { id },
      data: {
        ...data,
        updatedAt: new Date().toISOString(),
      },
    },
    "id"
  );
}

export default async function generateAiFeedbackHelp(
  _root: unknown,
  { input }: { input: AiFeedbackHelpInput },
  context: any
) {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be logged in to generate AI feedback help.");
  }
  if (!canGenerateAiFeedback(session)) {
    throw new Error("You do not have permission to generate AI feedback help.");
  }

  const proposalId = input?.proposalId;
  const questionNumber = input?.questionNumber;
  if (!proposalId || !questionNumber) {
    throw new Error("proposalId and questionNumber are required.");
  }

  const proposal = await context.query.ProposalBoard.findOne({
    where: { id: proposalId },
    query: "id",
  });
  if (!proposal?.id) {
    throw new Error("Proposal not found.");
  }

  const threadId = randomUUID();
  const request = {
    proposalId,
    questionNumber,
    questionName: input.questionName || "",
    currentTextContent: input.currentTextContent || "",
  };

  const thread = await context.db.AiThread.createOne(
    {
      data: {
        threadId,
        assistantId: "feedback_helper",
        proposal: { connect: { id: proposalId } },
        questionNumber,
        questionName: input.questionName || "",
        status: "running",
        request,
        profile: { connect: { id: session.itemId } },
        updatedAt: new Date().toISOString(),
      },
    },
    "id threadId"
  );

  const serviceUrl = process.env.AI_FEEDBACK_SERVICE_URL;
  if (!serviceUrl) {
    const message = "AI_FEEDBACK_SERVICE_URL is not configured.";
    await updateThread(context, thread.id, {
      status: "error",
      error: message,
    });
    throw new Error(message);
  }

  try {
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (process.env.AI_FEEDBACK_SERVICE_TOKEN) {
      headers["x-ai-feedback-service-token"] =
        process.env.AI_FEEDBACK_SERVICE_TOKEN;
    }

    const response = await fetch(
      `${serviceUrl.replace(/\/$/, "")}/feedback/help`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          thread_id: threadId,
          proposal_id: proposalId,
          question_number: questionNumber,
          question_name: input.questionName || "",
          current_text_content: input.currentTextContent || "",
          requesting_profile_id: session.itemId,
        }),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `AI feedback service failed with ${response.status}: ${body}`
      );
    }

    const servicePayload =
      (await response.json()) as AiFeedbackServiceResponse;
    const status = servicePayload.status || "complete";
    const result = normalizeResult(servicePayload.result);

    await updateThread(context, thread.id, {
      status,
      result: {
        ...result,
        metadata: servicePayload.metadata || {},
      },
    });

    return {
      threadId,
      status,
      result,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown AI feedback error.";
    await updateThread(context, thread.id, {
      status: "error",
      error: message,
    });
    throw new Error(message);
  }
}
