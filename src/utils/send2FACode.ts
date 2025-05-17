import { Resend } from "resend";
import dotenv from "dotenv";
import { emailLogger } from "./logger";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const send2FACode = async (email: string, code: string) => {
  try {
    // Create a well-formatted HTML email with the verification code
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Your Verification Code</title>
          <style type="text/css">
            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; }
            a { color: #ff6b00; }
            .container { background-color: #ffffff; margin: 0 auto; max-width: 600px; padding: 20px; }
            .header { border-bottom: 1px solid #eeeeee; padding-bottom: 20px; text-align: center; }
            .footer { border-top: 1px solid #eeeeee; color: #999999; font-size: 12px; margin-top: 30px; padding-top: 20px; text-align: center; }
            .code { background-color: #f5f5f5; border-radius: 4px; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 30px 0; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #333333; margin: 0;">Khanut</h1>
            </div>
            <div style="padding: 30px 0;">
              <h2 style="color: #333333; margin-top: 0;">Your Verification Code</h2>
              <p>Please use the following code to verify your account:</p>
              <div class="code">${code}</div>
              <p>This code will expire in 5 minutes.</p>
              <p>If you did not request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Khanut. All rights reserved.</p>
              <p>This email was sent to ${email}.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME || "Khanut Support"} <${process.env.RESEND_FROM_EMAIL || "team@mail.khanut.online"}>`,
      to: email,
      subject: "Your Verification Code",
      html: html,
      text: `Your Verification Code

Please use the following code to verify your account:

${code}

This code will expire in 5 minutes.

If you did not request this code, please ignore this email.

© ${new Date().getFullYear()} Khanut. All rights reserved.
This email was sent to ${email}.`,
    });

    if (error) {
      emailLogger.error("Failed to send 2FA code", { error, email });
      throw new Error(`Failed to send 2FA code: ${error.message}`);
    }

    emailLogger.info("2FA code sent successfully", {
      messageId: data?.id,
      email,
    });

    console.log("2FA code sent:", data?.id);
  } catch (error) {
    emailLogger.error("Error sending 2FA code", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      email,
    });
    throw new Error("Failed to send 2FA code");
  }
};
