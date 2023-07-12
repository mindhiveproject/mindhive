import { ServerClient } from "postmark";

const client = new ServerClient(process.env.MAIL_TOKEN);

function makeEmail(text: string): string {
  return `
        <div style="
            border: 1px solid black;
            padding: 20px;
            font-family: sans-serif;
            line-height: 2;
            font-size: 20px;
        ">
            <div>
                ${text}
            </div>
        </div>
    `;
}

interface MailResponse {
  message: string;
}

export async function sendPasswordResetEmail(
  resetToken: string,
  to: string
): Promise<void> {
  // email user a token
  const info = (await client.sendEmailWithTemplate({
    From: "no-reply@prettyspecial.one",
    To: to,
    TemplateAlias: "password-reset",
    TemplateModel: {
      product_name: "PrettySpecial",
      subject: "Your password reset token for MindHive",
      company_name: "MindHive",
      company_address: "New York",
      support_url: `${process.env.FRONTEND_URL}/menu/docs/about`,
      action_url: `${process.env.FRONTEND_URL}/menu/reset?token=${resetToken}`,
    },
    MessageStream: "ps-stream",
  })) as MailResponse;
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  text: string
): Promise<void> {
  const info = (await client.sendEmailWithTemplate({
    From: "no-reply@prettyspecial.one",
    To: to,
    TemplateAlias: "general",
    TemplateModel: {
      product_name: "MindHive",
      subject: subject,
      company_name: "MindHive",
      company_address: "New York",
      support_url: `${process.env.FRONTEND_URL}/menu/docs/about`,
      text: text,
    },
    MessageStream: "ps-stream",
  })) as MailResponse;
}
