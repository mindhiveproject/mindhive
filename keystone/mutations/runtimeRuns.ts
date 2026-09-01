import { createHash, randomBytes } from "crypto";

const {
  acceptSequence,
  assertRunClaimsMatchDataset,
  findTaskVersion,
  resolveRuntimeConfiguration,
  signRunClaims,
  validateRunMessage,
  verifyRunToken,
} = require("../lib/runtime/runtimeCore");

const RUN_QUERY = `
  id
  runtimeType
  parameters
  settings
  aggregateVariables
  author { id }
  template { id version author { id } }
  visual { id version privacy published author { id } }
  jsPsychExperiment {
    id
    version
    privacy
    published
    entryPoint
    manifest
    archive { filename url }
    author { id }
  }
`;

function tokenSecret() {
  const secret =
    process.env.RUNTIME_RUN_TOKEN_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("RUNTIME_RUN_TOKEN_SECRET or SESSION_SECRET is required");
  }
  return secret;
}

function connect(id?: string | null) {
  return id ? { connect: { id } } : undefined;
}

function messageFingerprint(message: {
  messageType: string;
  data?: any;
  aggregated?: any;
  error?: string | null;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        messageType: message.messageType,
        data: message.data ?? null,
        aggregated: message.aggregated ?? null,
        error: message.error ?? null,
      }),
    )
    .digest("base64url");
}

async function ensureSummaryResult(
  context: any,
  dataset: any,
  aggregated: any,
) {
  if (dataset.summaryResult?.id) return;
  await context.sudo().query.SummaryResult.createOne({
    data: {
      user: connect(dataset.profile?.id),
      guest: connect(dataset.guest?.id),
      type: dataset.profile?.id ? "USER" : "GUEST",
      study: connect(dataset.study?.id),
      template: connect(dataset.template?.id),
      task: connect(dataset.task?.id),
      testVersion: dataset.testVersion,
      metadataId: dataset.token,
      fullResult: connect(dataset.id),
      data: aggregated,
      runtimeType: dataset.runtimeType,
      runtimeAssetId: dataset.runtimeAssetId,
      runtimeAssetVersion: dataset.runtimeAssetVersion,
      assetAuthor: connect(dataset.assetAuthor?.id),
      taskAuthor: connect(dataset.taskAuthor?.id),
    },
  });
}

async function participantForRun(
  context: any,
  study: any,
  guestPublicId?: string | null,
) {
  if (guestPublicId) {
    const guest = await context.sudo().query.Guest.findOne({
      where: { publicId: guestPublicId },
      query: "id publicId participantIn { id }",
    });
    if (
      !guest ||
      !(guest.participantIn || []).some(
        (joinedStudy: any) => String(joinedStudy.id) === String(study.id),
      )
    ) {
      throw new Error("Guest is not associated with this study");
    }
    return {
      type: "GUEST",
      profileId: null,
      guestId: String(guest.id),
      publicId: guest.publicId,
    };
  }

  if (context.session?.itemId) {
    const id = String(context.session.itemId);
    const isParticipant = (study.participants || []).some(
      (profile: any) => String(profile.id) === id,
    );
    const isResearcher =
      String(study.author?.id) === id ||
      (study.collaborators || []).some(
        (profile: any) => String(profile.id) === id,
      );
    if (!isParticipant && !isResearcher) {
      throw new Error(
        "The signed-in profile is not associated with this study",
      );
    }
    const profile = [
      ...(study.participants || []),
      study.author,
      ...(study.collaborators || []),
    ].find((candidate: any) => String(candidate?.id) === id);
    return {
      type: "USER",
      profileId: id,
      guestId: null,
      publicId: profile?.publicId || null,
    };
  }

  throw new Error("Guest identity is required");
}

export async function startRun(
  _root: unknown,
  {
    taskId,
    studyId,
    requestedTestVersion,
    guestPublicId,
  }: {
    taskId: string;
    studyId: string;
    requestedTestVersion?: string | null;
    guestPublicId?: string | null;
  },
  context: any,
) {
  const [task, study] = await Promise.all([
    context.sudo().query.Task.findOne({
      where: { id: taskId },
      query: RUN_QUERY,
    }),
    context.sudo().query.Study.findOne({
      where: { id: studyId },
      query:
        `id flow currentVersion status author { id publicId }
         collaborators { id publicId } participants { id publicId }`,
    }),
  ]);
  if (!task || !study) throw new Error("Task or study was not found");

  const participant = await participantForRun(context, study, guestPublicId);
  const runtime = resolveRuntimeConfiguration(task);
  const testVersion = findTaskVersion(
    study.flow,
    task.id,
    requestedTestVersion,
  );
  const datasetToken = randomBytes(18).toString("base64url");
  const assetAuthorId = runtime.asset.author?.id || null;
  const taskAuthorId = task.author?.id || null;
  if (!assetAuthorId || !taskAuthorId) {
    throw new Error("Runtime asset and Task authorship must be configured");
  }

  const dataset = await context.sudo().query.Dataset.createOne({
    data: {
      token: datasetToken,
      date: new Date().toISOString().slice(0, 10),
      profile: connect(participant.profileId),
      guest: connect(participant.guestId),
      type: participant.type,
      template:
        runtime.runtimeType === "LABJS" ? connect(runtime.asset.id) : undefined,
      task: connect(task.id),
      study: connect(study.id),
      testVersion,
      studyStatus: study.status,
      studyVersion: study.currentVersion,
      runtimeType: runtime.runtimeType,
      runtimeAssetId: runtime.asset.id,
      runtimeAssetVersion: runtime.assetVersion,
      assetAuthor: connect(assetAuthorId),
      taskAuthor: connect(taskAuthorId),
      isCompleted: false,
      lastSequence: 0,
      messageLog: [],
      runtimeData: [],
      info: {
        failure: null,
      },
    },
    query: "id token",
  });

  const runToken = signRunClaims(
    {
      datasetId: dataset.id,
      datasetToken,
      participantType: participant.type,
      profileId: participant.profileId,
      guestId: participant.guestId,
      studyId: String(study.id),
      taskId: String(task.id),
      runtimeType: runtime.runtimeType,
      runtimeAssetId: String(runtime.asset.id),
    },
    tokenSecret(),
  );
  return {
    runToken,
    datasetToken,
    runtimeType: runtime.runtimeType,
    testVersion,
    studyVersion: study.currentVersion,
    assetId: runtime.asset.id,
    assetVersion: runtime.assetVersion,
    participantType: participant.type,
    participantPublicId: participant.publicId,
    studyId: study.id,
    taskId: task.id,
    templateId:
      runtime.runtimeType === "LABJS" ? runtime.asset.id : null,
  };
}

export async function ingestRunMessage(
  _root: unknown,
  {
    runToken,
    sequence,
    messageType,
    data,
    aggregated,
    error,
  }: {
    runToken: string;
    sequence: number;
    messageType: "BATCH" | "FINAL" | "COMPLETE" | "FAILURE";
    data?: any;
    aggregated?: any;
    error?: string | null;
  },
  context: any,
) {
  validateRunMessage({ messageType, data, aggregated, error });
  const claims = verifyRunToken(runToken, tokenSecret());
  const dataset = await context.sudo().query.Dataset.findOne({
    where: { id: claims.datasetId },
    query: `
      id token type lastSequence messageLog runtimeData isCompleted info
      profile { id } guest { id } study { id } template { id } task { id }
      testVersion runtimeType runtimeAssetId runtimeAssetVersion
      assetAuthor { id } taskAuthor { id } summaryResult { id }
    `,
  });
  if (!dataset) {
    throw new Error("Run token does not match a Dataset");
  }
  assertRunClaimsMatchDataset(claims, dataset);

  const decision = acceptSequence(dataset.lastSequence || 0, sequence);
  if (!decision.accepted) {
    const previousMessage = (Array.isArray(dataset.messageLog)
      ? dataset.messageLog
      : []
    ).find((message: any) => message.sequence === sequence);
    const fingerprint = messageFingerprint({
      messageType,
      data,
      aggregated,
      error,
    });
    if (
      !previousMessage ||
      previousMessage.type !== messageType ||
      previousMessage.fingerprint !== fingerprint
    ) {
      throw new Error("Sequence was already used for a different message");
    }
    if (messageType === "FINAL" && !dataset.summaryResult?.id) {
      await ensureSummaryResult(context, dataset, aggregated);
    }
    return {
      accepted: false,
      duplicate: true,
      sequence: dataset.lastSequence,
      datasetToken: dataset.token,
      completed: !!dataset.isCompleted,
    };
  }
  if (dataset.isCompleted) {
    throw new Error("The run is already complete");
  }
  const hasFinal = (Array.isArray(dataset.messageLog)
    ? dataset.messageLog
    : []
  ).some((message: any) => message.type === "FINAL");
  if (messageType === "FINAL" && hasFinal) {
    throw new Error("The run already has a final result");
  }
  if (messageType === "COMPLETE" && !hasFinal) {
    throw new Error("The run must store a final result before completion");
  }
  if (messageType === "BATCH" && hasFinal) {
    throw new Error("Result batches cannot follow the final result");
  }

  const locked = await context.prisma.dataset.updateMany({
    where: { id: dataset.id, lastSequence: dataset.lastSequence || 0 },
    data: { lastSequence: sequence },
  });
  if (locked.count !== 1) {
    const current = await context.prisma.dataset.findUnique({
      where: { id: dataset.id },
      select: { lastSequence: true, isCompleted: true, messageLog: true },
    });
    const competingMessage = (
      Array.isArray(current?.messageLog) ? current.messageLog : []
    ).find((message: any) => message.sequence === sequence);
    if (
      !competingMessage ||
      competingMessage.type !== messageType ||
      competingMessage.fingerprint !==
        messageFingerprint({ messageType, data, aggregated, error })
    ) {
      throw new Error("The run advanced while this message was being stored");
    }
    return {
      accepted: false,
      duplicate: true,
      sequence: current?.lastSequence || sequence,
      datasetToken: dataset.token,
      completed: !!current?.isCompleted,
    };
  }

  const currentRows = Array.isArray(dataset.runtimeData)
    ? dataset.runtimeData
    : [];
  const rows = Array.isArray(data) ? data : data == null ? [] : [data];
  const fingerprint = messageFingerprint({
    messageType,
    data,
    aggregated,
    error,
  });
  const messageLog = [
    ...(Array.isArray(dataset.messageLog) ? dataset.messageLog : []),
    {
      sequence,
      type: messageType,
      fingerprint,
      receivedAt: new Date().toISOString(),
    },
  ];
  const completed = messageType === "COMPLETE";
  const info = {
    ...(dataset.info || {}),
    failure:
      messageType === "FAILURE"
        ? { message: error || "Runtime failure", sequence }
        : dataset.info?.failure || null,
  };

  try {
    await context.sudo().query.Dataset.updateOne({
      where: { id: dataset.id },
      data: {
        runtimeData: messageType === "FINAL" ? rows : currentRows.concat(rows),
        messageLog,
        info,
        isCompleted: completed ? true : dataset.isCompleted,
        completedAt: completed ? new Date().toISOString() : undefined,
      },
    });
  } catch (error) {
    await context.prisma.dataset.updateMany({
      where: { id: dataset.id, lastSequence: sequence },
      data: { lastSequence: dataset.lastSequence || 0 },
    });
    throw error;
  }

  if (messageType === "FINAL") {
    await ensureSummaryResult(context, dataset, aggregated);
  }

  return {
    accepted: true,
    duplicate: false,
    sequence,
    datasetToken: dataset.token,
    completed,
  };
}

export async function updateRunDataPolicy(
  _root: unknown,
  { runToken, dataPolicy }: { runToken: string; dataPolicy: string },
  context: any,
) {
  const claims = verifyRunToken(runToken, tokenSecret());
  const dataset = await context.sudo().query.Dataset.findOne({
    where: { id: claims.datasetId },
    query:
      "id token type profile { id } guest { id } study { id } task { id } runtimeType runtimeAssetId",
  });
  if (!dataset) {
    throw new Error("Run token does not match a Dataset");
  }
  assertRunClaimsMatchDataset(claims, dataset);
  await context.sudo().query.Dataset.updateOne({
    where: { id: dataset.id },
    data: { dataPolicy },
  });
  return true;
}

export async function runtimeRunContext(
  _root: unknown,
  { runToken }: { runToken: string },
  context: any,
) {
  const claims = verifyRunToken(runToken, tokenSecret());
  const dataset = await context.sudo().query.Dataset.findOne({
    where: { id: claims.datasetId },
    query:
      `id token type runtimeType testVersion studyVersion runtimeAssetId
       runtimeAssetVersion profile { id publicId } guest { id publicId }
       study { id } task { id } template { id }`,
  });
  if (!dataset) {
    throw new Error("Run token does not match a Dataset");
  }
  assertRunClaimsMatchDataset(claims, dataset);
  return {
    runToken,
    datasetToken: dataset.token,
    runtimeType: dataset.runtimeType,
    testVersion: dataset.testVersion,
    studyVersion: dataset.studyVersion,
    assetId: dataset.runtimeAssetId,
    assetVersion: dataset.runtimeAssetVersion || "1",
    participantType: dataset.type,
    participantPublicId:
      dataset.profile?.publicId || dataset.guest?.publicId || null,
    studyId: dataset.study?.id,
    taskId: dataset.task?.id,
    templateId: dataset.template?.id || null,
  };
}
