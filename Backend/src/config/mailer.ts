import { Resend } from "resend";

interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: string;
  }[];
}

const resend = new Resend(process.env.RESEND_API_KEY!);

export const sendMail = async ({
  to,
  subject,
  html,
  attachments,
}: MailOptions): Promise<void> => {
  try {
    await resend.emails.send({
      from: "Sonic Industries <support@thesonicindustries.com>",
      to,
      subject,
      html,
      ...(attachments && { attachments }),
    });
  } catch (error) {
    console.error("❌ Error sending email via Resend:", error);
    throw error;
  }
};

// import { Resend } from "resend";

// interface MailOptions {
//   to: string | string[];
//   subject: string;
//   html: string;
//   attachments?: {
//     filename: string;
//     content: string;
//   }[];
// }

// // Resend is optional for local development
// const resend = process.env.RESEND_API_KEY
//   ? new Resend(process.env.RESEND_API_KEY)
//   : null;

// export const sendMail = async ({
//   to,
//   subject,
//   html,
//   attachments,
// }: MailOptions): Promise<void> => {
//   // Skip email if Resend is not configured
//   if (!resend) {
//     console.log("Resend is disabled - email skipped");
//     return;
//   }

//   try {
//     await resend.emails.send({
//       from: "Sonic Industries <support@thesonicindustries.com>",
//       to,
//       subject,
//       html,
//       ...(attachments && { attachments }),
//     });
//   } catch (error) {
//     console.error("Error sending email:", error);
//   }
// };