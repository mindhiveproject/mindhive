import { sendNotificationEmail } from "../lib/mail";

async function sendEmail(
  root: any,
  {
    receiverId,
    header,
    body,
  }: {
    receiverId: string;
    header: string;
    body: string;
  },
  context: KeystoneContext
): Promise<ReportCreateInput> {
  // query the current user
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  // get the email of the receiver
  const user = await context.lists.User.findOne({
    where: { id: receiverId },
    resolveFields: "email",
  });

  const email = user?.email || "produkt5@yandex.ru";

  await sendNotificationEmail(email, header, body);

  return { message: "Email was sent" };
}

export default sendEmail;
