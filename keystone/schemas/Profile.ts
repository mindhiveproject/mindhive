// schemas/Profile.ts (or Profile.js with minor syntax changes)

import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  checkbox,
  json,
  calendarDay,
  multiselect,
} from "@keystone-6/core/fields";
import { permissions, rules, isSignedIn, isAdmin } from "../access";

import uniqid from "uniqid";
import {
  uniqueNamesGenerator,
  Config,
  adjectives as baseAdjectives,
  colors,
  animals,
} from "unique-names-generator";

const adjectives = baseAdjectives
  .filter((w) => !["booby", "tasty"].includes(w))
  .concat(["curious", "kind"]);

const customConfig: Config = {
  dictionaries: [adjectives, colors, animals],
  separator: "-",
  length: 3,
};

export const Profile = list({
  ui: {
    listView: {
      // Only admins can see the list; others search only their own/public
      defaultFieldMode: ({ session }) =>
        isAdmin({ session }) ? "read" : "hidden",
    },
    itemView: {
      // Admins can edit; users can edit only their own record
      defaultFieldMode: ({ session, item }) => {
        if (isAdmin({ session })) return "edit";
        if (session?.itemId === item.id) return "edit";
        return "read";
      },
    },
    createView: {
      // Profiles are normally created via signup flow, not via Admin UI
      defaultFieldMode: ({ session }) =>
        permissions.canManageUsers({ session }) ? "edit" : "hidden",
    },
  },

  access: {
    operation: {
      // Anyone can query, but filters below restrict which items they see
      query: isSignedIn,
      create: () => true,
      update: isSignedIn,
      delete: permissions.canManageUsers,
    },
    filter: {
      // What items a user can see in queries
      query: rules.canReadProfiles,
      // Who can update which profiles:
      // - Admins: all
      // - Others: only their own
      update: ({ session }) =>
        isAdmin({ session }) ? true : { id: { equals: session?.itemId } },
      // Who can delete:
      // - Admins via permission
      // - Optionally allow self-delete; here we keep delete as admin-only
      delete: ({ session }) =>
        permissions.canManageUsers({ session }) ? true : false,
    },
  },

  fields: {
    username: text({ validation: { isRequired: true } }),

    publicId: text({
      isIndexed: "unique",
      isFilterable: true,
      access: {
        read: () => true, // safe public identifier
        create: () => true,
        update: ({ session, item }) =>
          isAdmin({ session }) || session?.itemId === item.id,
      },
      hooks: {
        async resolveInput({ operation }) {
          if (operation === "create") {
            return uniqid();
          }
        },
      },
    }),

    publicReadableId: text({
      isIndexed: "unique",
      isFilterable: true,
      access: {
        read: () => true,
        create: () => true,
        update: ({ session, item }) =>
          isAdmin({ session }) || session?.itemId === item.id,
      },
      hooks: {
        async resolveInput({ operation }) {
          if (operation === "create") {
            return uniqueNamesGenerator(customConfig);
          }
        },
      },
    }),

    type: select({
      options: [{ label: "User", value: "USER" }],
      defaultValue: "USER",
    }),

    email: text({
      validation: { isRequired: false },
      isIndexed: "unique",
      isFilterable: true,
      access: {
        // Only self or admins can see/change email
        read: ({ session, item }) =>
          isAdmin({ session }) || session?.itemId === item.id,
        create: () => true,
        update: ({ session, item }) =>
          isAdmin({ session }) || session?.itemId === item.id,
      },
      hooks: {
        resolveInput: ({ resolvedData }) => {
          if (resolvedData.email && typeof resolvedData.email === "string") {
            return resolvedData.email.toLowerCase().trim();
          }
          return resolvedData.email;
        },
      },
    }),

    permissions: relationship({
      ref: "Permission.assignedTo",
      many: true,
      access: {
        // Only admins and the owner of the profile can read its permissions
        read: ({ session, item }) =>
          !!session &&
          (rules.canManageRoles({ session }) || session.itemId === item.id),
        create: () => true, // allow setting on Profile.create (signup)
        update: rules.canManageRoles,
      },
    }),

    info: json(),
    generalInfo: json(),
    studiesInfo: json(),
    consentsInfo: json(),
    tasksInfo: json(),

    isPublic: checkbox({ isFilterable: true }),

    password: password({
      validation: { isRequired: true },
      access: {
        read: () => false, // never expose password hash
        // allow unauthenticated creation so new users can sign up
        create: () => true,
        // only signed-in owner or admin can change password later
        update: ({ session, item }) =>
          isAdmin({ session }) || session?.itemId === item.id,
      },
    }),

    facebook: text(),
    twitter: text(),
    instagram: text(),
    publicMail: text(),
    website: text(),

    dateCreated: timestamp({
      defaultValue: { kind: "now" },
    }),

    language: select({
      options: [
        { label: "English (American)", value: "EN-US" },
        { label: "Español (ES)", value: "ES-ES" },
        { label: "Español (LA)", value: "ES-LA" },
        { label: "中文", value: "ZH-CN" },
        { label: "Français", value: "FR-FR" },
        { label: "العربية", value: "AR-AE" },
        { label: "हिन्दी", value: "HI-IN" },
        { label: "हिंदी मराठी", value: "HI-MA" },
        { label: "Русский", value: "RU-RU" },
        { label: "Nederlands", value: "NL-NL" },
        { label: "Português", value: "PT-BR" },
      ],
      defaultValue: "EN-US",
    }),

    participantIn: relationship({
      ref: "Study.participants",
      many: true,
    }),
    teacherIn: relationship({ ref: "Class.creator", many: true }),
    mentorIn: relationship({ ref: "Class.mentors", many: true }),
    studentIn: relationship({ ref: "Class.students", many: true }),
    classNetworksCreated: relationship({
      ref: "ClassNetwork.creator",
      many: true,
    }),
    journals: relationship({
      ref: "Journal.creator",
      many: true,
    }),
    posts: relationship({
      ref: "Post.author",
      many: true,
    }),
    authorOfTalk: relationship({
      ref: "Talk.author",
      many: true,
    }),
    memberOfTalk: relationship({
      ref: "Talk.members",
      many: true,
    }),
    authorOfWord: relationship({
      ref: "Word.author",
      many: true,
    }),
    templates: relationship({
      ref: "Template.author",
      many: true,
    }),
    collaboratorInTemplate: relationship({
      ref: "Template.collaborators",
      many: true,
    }),
    taskCreatorIn: relationship({
      ref: "Task.author",
      many: true,
    }),
    collaboratorInTask: relationship({
      ref: "Task.collaborators",
      many: true,
    }),
    favoriteTasks: relationship({
      ref: "Task.favoriteBy",
      many: true,
    }),
    researcherIn: relationship({
      ref: "Study.author",
      many: true,
    }),
    collaboratorInStudy: relationship({
      ref: "Study.collaborators",
      many: true,
    }),
    consentCreatorIn: relationship({
      ref: "Consent.author",
      many: true,
    }),
    collaboratorInConsent: relationship({
      ref: "Consent.collaborators",
      many: true,
    }),
    creatorOfProposal: relationship({
      ref: "ProposalBoard.creator",
      many: true,
    }),
    authorOfProposal: relationship({
      ref: "ProposalBoard.author",
      many: true,
    }),
    collaboratorInProposal: relationship({
      ref: "ProposalBoard.collaborators",
      many: true,
    }),
    reviews: relationship({
      ref: "Review.author",
      many: true,
    }),
    reviewsUpvoted: relationship({
      ref: "Review.upvotedBy",
      many: true,
    }),
    assignedToProposalCard: relationship({
      ref: "ProposalCard.assignedTo",
      many: true,
    }),
    editsProposalCard: relationship({
      ref: "ProposalCard.isEditedBy",
      many: true,
    }),
    updates: relationship({
      ref: "Update.user",
      many: true,
    }),
    authorOfLesson: relationship({
      ref: "Lesson.author",
      many: true,
    }),
    authorOfResource: relationship({
      ref: "Resource.author",
      many: true,
    }),
    authoredMediaAssets: relationship({
      ref: "MediaAsset.author",
      many: true,
    }),
    favoritedMediaAssets: relationship({
      ref: "MediaAsset.favoriteBy",
      many: true,
    }),
    collaboratorInLesson: relationship({
      ref: "Lesson.collaborators",
      many: true,
    }),
    collaboratorInResource: relationship({
      ref: "Resource.collaborators",
      many: true,
    }),
    authorOfCurriculum: relationship({
      ref: "Curriculum.author",
      many: true,
    }),
    collaboratorInCurriculum: relationship({
      ref: "Curriculum.collaborators",
      many: true,
    }),
    authorOfAssignment: relationship({
      ref: "Assignment.author",
      many: true,
    }),
    authorOfHomework: relationship({
      ref: "Homework.author",
      many: true,
    }),
    datasets: relationship({
      ref: "Dataset.profile",
      many: true,
    }),
    summaryResults: relationship({
      ref: "SummaryResult.user",
      many: true,
    }),
    authoredSpecs: relationship({
      ref: "Spec.author",
      many: true,
    }),
    authoredDatasources: relationship({
      ref: "Datasource.author",
      many: true,
    }),

    profileType: select({
      options: [
        { label: "Individual", value: "individual" },
        { label: "Organization", value: "organization" },
      ],
      defaultValue: "individual",
    }),

    image: relationship({
      ref: "ProfileImage.profile",
      ui: {
        displayMode: "cards",
        cardFields: ["image", "altText"],
        inlineCreate: { fields: ["image", "altText"] },
        inlineEdit: { fields: ["image", "altText"] },
      },
    }),

    firstName: text(),
    lastName: text(),
    pronouns: select({
      options: [
        { label: "she/her/hers", value: "she" },
        { label: "he/him/his", value: "he" },
        { label: "they/them/theirs", value: "they" },
      ],
    }),
    location: text(),
    organization: text(),
    tagline: text(),
    passion: text(),
    bio: text(),
    bioInformal: text(),
    occupation: text(),
    education: json(),
    languages: json(),
    introVideo: json(),
    involvement: json(),
    mentorPreferGrade: select({
      options: [
        { label: "Middle School", value: "middle" },
        { label: "9 - 10 Grade", value: "nine" },
        { label: "11 - 12 Grade", value: "eleven" },
        { label: "No Preference", value: "no" },
      ],
    }),
    mentorPreferGroup: select({
      options: [
        { label: "Individual", value: "individual" },
        { label: "Group", value: "group" },
        { label: "No Preference", value: "no" },
      ],
    }),
    mentorPreferClass: select({
      options: [
        { label: "Accelerated", value: "accelerated" },
        { label: "Non Accelerated", value: "nonAccelerated" },
        { label: "ELL", value: "ell" },
        { label: "No Preference", value: "no" },
      ],
    }),
    interests: relationship({
      ref: "Tag.profiles",
      many: true,
    }),
    availableStartDate: calendarDay(),
    availableEndDate: calendarDay(),
    availableStartTime: text(),
    availableEndTime: text(),
    availableDays: multiselect({
      options: [
        { label: "Monday", value: "mon" },
        { label: "Tuesday", value: "tue" },
        { label: "Wednesday", value: "wed" },
        { label: "Thursday", value: "thu" },
        { label: "Friday", value: "fri" },
      ],
    }),
    favoriteBy: relationship({
      ref: "Profile.favoritePeople",
      many: true,
    }),
    favoritePeople: relationship({
      ref: "Profile.favoriteBy",
      many: true,
    }),
    logs: relationship({
      ref: "Log.user",
      many: true,
    }),

    // YQ-related properties
    visuals: relationship({ ref: "Visual.author", many: true }),
    liked: relationship({ ref: "Visual.likes", many: true }),
    following: relationship({ ref: "Friendship.requester", many: true }),
    followers: relationship({ ref: "Friendship.recipient", many: true }),
    yqGenAI: relationship({ ref: "YQGenAI.author", many: true }),
  },
});
