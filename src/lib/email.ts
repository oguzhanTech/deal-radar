import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface ReminderEmailParams {
  to: string;
  dealTitle: string;
  dealId: string;
  timeLeft: string;
  dealUrl: string;
}

export async function sendReminderEmail({ to, dealTitle, timeLeft, dealUrl }: ReminderEmailParams) {
  try {
    await resend.emails.send({
      from: "Topla <bildirim@topla.app>",
      to,
      subject: `Topla: "${dealTitle}" ${timeLeft} sonra bitiyor!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; background: #f4f4f5;">
          <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 20px;">Topla</h1>
            </div>
            <div style="padding: 24px;">
              <p style="color: #ef4444; font-weight: 600; font-size: 14px; margin: 0 0 8px;">${timeLeft} sonra bitiyor!</p>
              <h2 style="margin: 0 0 16px; font-size: 18px; color: #09090b;">${dealTitle}</h2>
              <a href="${dealUrl}" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">Fırsata Git</a>
            </div>
            <div style="padding: 16px 24px; border-top: 1px solid #e4e4e7; text-align: center;">
              <p style="color: #71717a; font-size: 12px; margin: 0;">Bu e-postayı Topla'da bu fırsatı kaydettiğin için aldın.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send reminder email:", error);
    return false;
  }
}
