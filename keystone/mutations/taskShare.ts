// Sharing a task, survey or block as an independent copy, within a class.
// The rules are in lib/taskShare.js; the copy is made by lib/taskCopy.ts when
// a recipient accepts. Reads and writes use sudo after the checks here.
import { copyTask } from "../lib/taskCopy";
import { isAdmin } from "../access";
const {
  checkShareRequest,
  decodeJson,
  inviteStateFor,
  isInviteRecipient,
  ownsTask,
  pickableMemberIds,
  sharedCopySettings,
  sharingRights,
} = require("../lib/taskShare");

const PERSON = "id username firstName lastName";
const CLASS_QUERY = `
  id
  title
  code
  settings
  creator { ${PERSON} }
  teachingTeam { ${PERSON} }
  mentors { ${PERSON} }
  students { ${PERSON} }
`;
const INVITE_QUERY = `
  id
  status
  wholeClass
  copies
  sender { ${PERSON} }
  task { id title taskType }
  class { ${CLASS_QUERY} }
  recipients { id }
  acceptedBy { id }
  declinedBy { id }
`;
const MAX_MESSAGE = 1000;

const TYPE_WORDS: Record<string, { word: string; area: string }> = {
  TASK: { word: "task", area: "tasks" },
  SURVEY: { word: "survey", area: "surveys" },
  BLOCK: { word: "block", area: "blocks" },
};

function signedInUser(context: any) {
  const me = context.session?.itemId;
  if (!me) throw new Error("You must be signed in to do this.");
  return String(me);
}

function displayName(person: any) {
  const name = [person?.firstName, person?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || person?.username || "Someone";
}

// One accept at a time per person and invite, so a double click makes one copy.
const accepting = new Set<string>();

async function notify(
  context: any,
  profileIds: string[],
  { sender, task }: { sender: any; task: any }
) {
  const kind = TYPE_WORDS[task?.taskType] || TYPE_WORDS.TASK;
  for (const profileId of profileIds) {
    try {
      await context.sudo().db.Update.createOne({
        data: {
          user: { connect: { id: profileId } },
          updateArea: "TASK_SHARE",
          link: `/dashboard/develop/${kind.area}?filter=shared`,
          content: {
            title: `A ${kind.word} was shared with you`,
            message: `${displayName(sender)} shared the ${kind.word} "${
              task?.title || ""
            }" with you. Add it to make your own copy.`,
            linkTitle: "See shared with me",
          },
        },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to notify ${profileId} of a shared task:`, error);
    }
  }
}

export async function shareTask(
  root: any,
  {
    taskId,
    classId,
    wholeClass,
    recipientIds,
    message,
  }: {
    taskId: string;
    classId: string;
    wholeClass?: boolean;
    recipientIds?: string[];
    message?: string;
  },
  context: any
) {
  const me = signedInUser(context);
  const sudo = context.sudo().query;
  const [task, klass, sender] = await Promise.all([
    sudo.Task.findOne({
      where: { id: String(taskId) },
      query: "id title taskType author { id } collaborators { id }",
    }),
    sudo.Class.findOne({ where: { id: String(classId) }, query: CLASS_QUERY }),
    sudo.Profile.findOne({ where: { id: me }, query: PERSON }),
  ]);
  const ids = wholeClass ? [] : [...new Set((recipientIds || []).map(String))];
  const problem = checkShareRequest({
    task,
    klass,
    userId: me,
    wholeClass: !!wholeClass,
    recipientIds: ids,
  });
  if (problem) throw new Error(problem);

  const invite = await context.sudo().db.TaskShareInvite.createOne({
    data: {
      sender: { connect: { id: me } },
      task: { connect: { id: task.id } },
      class: { connect: { id: klass.id } },
      wholeClass: !!wholeClass,
      ...(ids.length
        ? { recipients: { connect: ids.map((id) => ({ id })) } }
        : {}),
      message: String(message || "").trim().slice(0, MAX_MESSAGE),
      copies: {},
    },
  });

  const notified = wholeClass
    ? (klass.students || []).map((s: any) => String(s.id)).filter((id: string) => id !== me)
    : ids;
  await notify(context, notified, { sender, task });

  return context.db.TaskShareInvite.findOne({ where: { id: invite.id } });
}

export async function respondToTaskShare(
  root: any,
  { inviteId, accept }: { inviteId: string; accept: boolean },
  context: any
) {
  const me = signedInUser(context);
  const invite = await context.sudo().query.TaskShareInvite.findOne({
    where: { id: String(inviteId) },
    query: INVITE_QUERY,
  });
  if (!invite) throw new Error("This share could not be found.");

  const state = inviteStateFor(invite, me);
  if (state === "sent") throw new Error("You shared this yourself.");
  if (state === "accepted") {
    if (!accept) throw new Error("You already added your copy of this.");
    return context.db.TaskShareInvite.findOne({ where: { id: invite.id } });
  }
  if (state === "closed") {
    throw new Error("This share is no longer available.");
  }
  if (!isInviteRecipient(invite, invite.class, me)) {
    throw new Error("This share was not sent to you.");
  }

  if (!accept) {
    await context.sudo().db.TaskShareInvite.updateOne({
      where: { id: invite.id },
      data: { declinedBy: { connect: [{ id: me }] } },
    });
    return context.db.TaskShareInvite.findOne({ where: { id: invite.id } });
  }

  const key = `${invite.id}:${me}`;
  if (accepting.has(key)) {
    throw new Error("Your copy is already being made.");
  }
  accepting.add(key);
  try {
    // Shared copies never carry consent, and are not study copies.
    const copy = await copyTask(context, invite.task.id, {
      consent: "never",
      linkToOriginal: false,
      favoriteOf: me,
      settings: (sourceSettings: any) =>
        sharedCopySettings(sourceSettings, {
          taskId: invite.task.id,
          inviteId: invite.id,
          sharedById: invite.sender?.id,
        }),
    });
    const copies = { ...(decodeJson(invite.copies) || {}), [me]: copy.id };
    const wasDeclined = (invite.declinedBy || []).some(
      (p: any) => String(p.id) === me
    );
    await context.sudo().db.TaskShareInvite.updateOne({
      where: { id: invite.id },
      data: {
        acceptedBy: { connect: [{ id: me }] },
        ...(wasDeclined ? { declinedBy: { disconnect: [{ id: me }] } } : {}),
        copies,
      },
    });
  } finally {
    accepting.delete(key);
  }
  return context.db.TaskShareInvite.findOne({ where: { id: invite.id } });
}

export async function withdrawTaskShare(
  root: any,
  { inviteId }: { inviteId: string },
  context: any
) {
  const me = signedInUser(context);
  const invite = await context.sudo().query.TaskShareInvite.findOne({
    where: { id: String(inviteId) },
    query: "id sender { id }",
  });
  if (!invite) throw new Error("This share could not be found.");
  if (String(invite.sender?.id) !== me && !isAdmin({ session: context.session })) {
    throw new Error("Only the person who shared this can withdraw it.");
  }
  // Copies already made stay with the people who added them.
  await context.sudo().db.TaskShareInvite.updateOne({
    where: { id: invite.id },
    data: { status: "withdrawn" },
  });
  return context.db.TaskShareInvite.findOne({ where: { id: invite.id } });
}

// The classes the caller can share `taskId` in, with the people they can pick.
export async function taskShareTargets(
  root: any,
  { taskId }: { taskId: string },
  context: any
) {
  const me = signedInUser(context);
  const sudo = context.sudo().query;
  const task = await sudo.Task.findOne({
    where: { id: String(taskId) },
    query: "id author { id } collaborators { id }",
  });
  if (!ownsTask(task, me)) {
    throw new Error("You can only share tasks you created or collaborate on.");
  }
  const classes = await sudo.Class.findMany({
    where: {
      OR: [
        { creator: { id: { equals: me } } },
        { teachingTeam: { some: { id: { equals: me } } } },
        { mentors: { some: { id: { equals: me } } } },
        { students: { some: { id: { equals: me } } } },
      ],
    },
    orderBy: [{ title: "asc" }],
    query: CLASS_QUERY,
  });

  return classes.map((klass: any) => {
    const rights = sharingRights(klass, me);
    const roleOf = new Map<string, string>();
    (klass.students || []).forEach((p: any) => roleOf.set(String(p.id), "student"));
    (klass.mentors || []).forEach((p: any) => roleOf.set(String(p.id), "mentor"));
    (klass.teachingTeam || []).forEach((p: any) => roleOf.set(String(p.id), "teacher"));
    if (klass.creator?.id) roleOf.set(String(klass.creator.id), "teacher");
    const people = new Map<string, any>();
    [klass.creator, ...(klass.teachingTeam || []), ...(klass.mentors || []), ...(klass.students || [])]
      .filter(Boolean)
      .forEach((p: any) => people.set(String(p.id), p));
    const members = rights.canShare
      ? pickableMemberIds(klass, me).map((id: string) => ({
          id,
          name: displayName(people.get(id)),
          role: roleOf.get(id) || "student",
        }))
      : [];
    return {
      id: klass.id,
      title: klass.title,
      code: klass.code,
      role: rights.role,
      canShare: rights.canShare,
      canShareWithClass: rights.canShareWithClass,
      studentCount: (klass.students || []).filter(
        (p: any) => String(p.id) !== me
      ).length,
      members,
    };
  });
}

// How many other people's tasks run this template, for its author's warning.
export async function templateUsage(
  root: any,
  { templateId }: { templateId: string },
  context: any
) {
  const me = signedInUser(context);
  const sudo = context.sudo().query;
  const template = await sudo.Template.findOne({
    where: { id: String(templateId) },
    query: "id author { id } collaborators { id }",
  });
  if (!template) return null;
  if (!ownsTask(template, me) && !isAdmin({ session: context.session })) {
    return null;
  }
  const tasks = await sudo.Task.findMany({
    where: {
      template: { id: { equals: String(templateId) } },
      NOT: [{ author: { id: { equals: me } } }],
    },
    query: "id author { id }",
  });
  const people = new Set(
    tasks.map((t: any) => t.author?.id).filter(Boolean).map(String)
  );
  return { otherTasks: tasks.length, otherPeople: people.size };
}

// Step 1 of giving a task its own template: a new template, owned by the
// caller, with the same content. The frontend then copies the template's files
// to the new slug and calls switchTaskTemplate.
export async function forkTaskTemplate(
  root: any,
  { taskId }: { taskId: string },
  context: any
) {
  const me = signedInUser(context);
  const task = await context.sudo().query.Task.findOne({
    where: { id: String(taskId) },
    query: `
      id
      author { id }
      collaborators { id }
      template {
        id slug title i18nContent shortDescription description
        parameters docs style settings
      }
    `,
  });
  if (!ownsTask(task, me)) {
    throw new Error("You can only change tasks you created or collaborate on.");
  }
  const source = task.template;
  if (!source) throw new Error("This task has no template to copy.");

  const template = await context.db.Template.createOne({
    data: {
      title: source.title,
      i18nContent: source.i18nContent,
      shortDescription: source.shortDescription,
      description: source.description,
      parameters: source.parameters,
      docs: source.docs,
      style: source.style,
      settings: {
        ...(decodeJson(source.settings) || {}),
        forkedFrom: String(source.id),
      },
    },
  });
  return {
    templateId: template.id,
    slug: template.slug,
    sourceSlug: source.slug,
  };
}

// Step 2: point the task at its new template, once the files are copied.
export async function switchTaskTemplate(
  root: any,
  { taskId, templateId }: { taskId: string; templateId: string },
  context: any
) {
  const me = signedInUser(context);
  const sudo = context.sudo().query;
  const [task, template] = await Promise.all([
    sudo.Task.findOne({
      where: { id: String(taskId) },
      query: "id author { id } collaborators { id } template { id }",
    }),
    sudo.Template.findOne({
      where: { id: String(templateId) },
      query: "id slug settings author { id } collaborators { id }",
    }),
  ]);
  if (!ownsTask(task, me)) {
    throw new Error("You can only change tasks you created or collaborate on.");
  }
  if (!template || !ownsTask(template, me)) {
    throw new Error("This template could not be found.");
  }
  const forkedFrom = decodeJson(template.settings)?.forkedFrom;
  if (!task.template?.id || String(forkedFrom) !== String(task.template.id)) {
    throw new Error("This template is not a copy of the task's template.");
  }
  await context.sudo().db.Template.updateOne({
    where: { id: template.id },
    data: {
      scriptAddress: `/templates/${template.slug}/script.txt`,
      fileAddress: `/templates/${template.slug}/file.json`,
    },
  });
  await context.sudo().db.Task.updateOne({
    where: { id: task.id },
    data: { template: { connect: { id: template.id } } },
  });
  return context.db.Task.findOne({ where: { id: task.id } });
}
