import { sendNotificationEmail } from "../lib/mail";

async function sendEmail(
  root: any,
  {
    receiverId,
    title,
    message,
    link,
  }: {
    receiverId: string;
    title: string;
    message: string;
    link: string;
  },
  context: KeystoneContext
): Promise<ReportCreateInput> {
  // query the current user
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  // get the email of the receiver
  const user = await context.query.Profile.findOne({
    where: { id: receiverId },
    query: "email",
  });

  const email = user?.email || "produkt5@yandex.ru";

  await sendNotificationEmail(email, title, message, link);

  return { message: "Email was sent" };
}

export default sendEmail;
