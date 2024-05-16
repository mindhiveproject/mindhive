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
    From: "info@mindhive.science",
    To: to,
    TemplateAlias: "password-reset",
    TemplateModel: {
      action_url: `${process.env.FRONTEND_URL}/login/reset?t=${resetToken}`,
      support_url: `${process.env.FRONTEND_URL}/docs/about`,
      product_name: "MindHive",
      company_name: "MindHive",
      company_addres: "New York",
    },
  })) as MailResponse;
}

export async function sendNotificationEmail(
  to: string,
  title: string,
  message: string,
  link: string
): Promise<void> {
  const info = (await client.sendEmailWithTemplate({
    From: "info@mindhive.science",
    To: to,
    TemplateAlias: "new-update",
    TemplateModel: {
      product_name: "MindHive",
      update_name: title,
      text: message,
      action_url: link,
      support_email: "info@mindhive.science",
      company_name: "MindHive",
      company_addres: "New York",
    },
  })) as MailResponse;
}
