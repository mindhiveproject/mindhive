// Welcome to some authentication for Keystone
//
// This is using @keystone-6/auth to add the following
// - A sign-in page for your Admin UI
// - A cookie-based stateless session strategy
//    - Using a User email as the identifier
//    - 30 day cookie expiration
//
// This file does not configure what Users can do, and the default for this starter
// project is to allow anyone - logged-in or not - to do anything.
//
// If you want to prevent random people on the internet from accessing your data,
// you can find out how by reading https://keystonejs.com/docs/guides/auth-and-access-control
//
// If you want to learn more about how our out-of-the-box authentication works, please
// read https://keystonejs.com/docs/apis/auth#authentication-api

import { randomBytes } from "crypto";
import { createAuth } from "@keystone-6/auth";

import { sendPasswordResetEmail } from "./lib/mail";
import { permissionsList } from "./schemas/fields";

// see https://keystonejs.com/docs/apis/session for the session docs
import { statelessSessions } from "@keystone-6/core/session";

// Helper function to find teacher emails for a student
async function findTeacherEmailsForStudent(
  studentEmail: string,
  context?: any
): Promise<string[]> {
  // Normalize email to lowercase
  const normalizedEmail = studentEmail?.toLowerCase().trim();
  console.log(`[Password Reset] Checking student status for a user.`);

  if (!context || !context.query) {
    console.log(`[Password Reset] WARNING: No context available. Cannot check student status.`);
    return [];
  }

  try {
    // Find the student profile using context.query (for reading data)
    const profile = await context.query.Profile.findOne({
      where: { email: normalizedEmail },
      query: `
        id
        permissions {
          name
        }
        studentIn {
          id
          creator {
            id
            email
          }
        }
      `,
    });

    // Check if user exists and has STUDENT permission
    if (!profile) {
      console.log(`[Password Reset] User not found in database.`);
      return [];
    }

    console.log(`[Password Reset] Found user profile.`);

    const isStudent = profile.permissions?.some(
      (permission: { name: string }) => permission.name === "STUDENT"
    );

    if (!isStudent) {
      console.log(`[Password Reset] User does NOT have STUDENT permission. Proceeding with normal reset.`);
      return [];
    }

    console.log(`[Password Reset] User HAS STUDENT permission.`);

    if (!profile.studentIn || profile.studentIn.length === 0) {
      console.log(`[Password Reset] Student is not enrolled in any classes. Proceeding with normal reset.`);
      return [];
    }

    console.log(`[Password Reset] Student is enrolled in ${profile.studentIn.length} class(es).`);

    // Collect all unique teacher emails from the student's classes
    const teacherEmails = new Set<string>();
    for (const classItem of profile.studentIn) {
      if (classItem.creator?.email) {
        teacherEmails.add(classItem.creator.email);
        console.log(`[Password Reset] Found a teacher for class ${classItem.id}.`);
      } else {
        console.log(`[Password Reset] WARNING: Class ${classItem.id} has no creator email.`);
      }
    }

    const teacherEmailsArray = Array.from(teacherEmails);
    console.log(`[Password Reset] Total unique teachers found: ${teacherEmailsArray.length}`);

    return teacherEmailsArray;
  } catch (error) {
    console.error(`[Password Reset] Error finding teacher emails for user:`, error instanceof Error ? error.message : "Unknown error");
    return [];
  }
}

// for a stateless session, a SESSION_SECRET should always be provided
//   especially in production (statelessSessions will throw if SESSION_SECRET is undefined)
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV !== "production") {
  sessionSecret = randomBytes(32).toString("hex");
}

// withAuth is a function we can use to wrap our base configuration
const { withAuth } = createAuth({
  listKey: "Profile",
  identityField: "email",

  // this is a GraphQL query fragment for fetching what data will be attached to a context.session
  //   this can be helpful for when you are writing your access control functions
  //   you can find out more at https://keystonejs.com/docs/guides/auth-and-access-control

  // Adding ID to session data
  sessionData: `id username permissions { name ${permissionsList.join(" ")} }`,
  secretField: "password",

  // WARNING: remove initFirstItem functionality in production
  //   see https://keystonejs.com/docs/config/auth#init-first-item for more
  initFirstItem: {
    // if there are no items in the database, by configuring this field
    //   you are asking the Keystone AdminUI to create a new user
    //   providing inputs for these fields
    fields: ["username", "email", "password"],

    // it uses context.sudo() to do this, which bypasses any access control you might have
    //   you shouldn't use this in production
  },
  passwordResetLink: {
    async sendToken(args: any) {
      const { token, identity } = args;
      // Normalize email to lowercase for consistency
      const userEmail = identity?.toLowerCase().trim();

      console.log(`[Password Reset] Password reset requested.`);

      const context = (args as any).context;
      console.log(`[Password Reset] Context available: ${!!context}`);

      // Check if the user is a student and find their teachers
      const teacherEmails = await findTeacherEmailsForStudent(
        userEmail,
        context
      );

      if (teacherEmails.length > 0) {
        // User is a student — redirect reset email to teachers, CC the student
        console.log(`[Password Reset] Redirecting to ${teacherEmails.length} teacher(s) with student CC'd.`);
        for (const teacherEmail of teacherEmails) {
          await sendPasswordResetEmail(token, teacherEmail, userEmail);
        }
        console.log(`[Password Reset] Reset email(s) sent.`);
      } else {
        // Normal flow — send directly to the requesting user
        console.log(`[Password Reset] Normal flow: sending to requesting user.`);
        await sendPasswordResetEmail(token, userEmail);
        console.log(`[Password Reset] Reset email sent.`);
      }
    },
  },
});

// statelessSessions uses cookies for session tracking
//   these cookies have an expiry, in seconds
//   we use an expiry of 30 days for this starter
const sessionMaxAge = 60 * 60 * 24 * 30;

// you can find out more at https://keystonejs.com/docs/apis/session#session-api
const session = statelessSessions({
  maxAge: sessionMaxAge,
  secret: sessionSecret!,
  // Issue #16: explicit cookie security flags.
  // secure: true ensures the cookie is only sent over HTTPS.
  // sameSite: 'strict' prevents the cookie from being sent in cross-site requests.
  // httpOnly is enforced by Keystone's iron-session by default, confirmed here.
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
});

export { withAuth, session };
