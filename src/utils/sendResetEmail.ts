import { Resend } from "resend";
import dotenv from "dotenv";
import { emailLogger } from "./logger";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a password reset email to the user
 * @param email User's email address
 * @param token Reset token
 * @param userId User's ID
 */
export const sendResetEmail = async (
  email: string,
  token: string,
  userId: string
): Promise<void> => {
  try {
    // Get the frontend URL from environment or use a default
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/reset-password?token=${token}&id=${userId}`;

    // Create a well-formatted HTML email
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Reset Your Password</title>
          <style type="text/css">
            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; }
            a { color: #ff6b00; }
            .button { background-color: #ff6b00; border-radius: 4px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: bold; line-height: 50px; text-align: center; text-decoration: none; width: 200px; }
            .button:hover { background-color: #e86000; }
            .container { background-color: #ffffff; margin: 0 auto; max-width: 600px; padding: 20px; }
            .header { border-bottom: 1px solid #eeeeee; padding-bottom: 20px; text-align: center; }
            .footer { border-top: 1px solid #eeeeee; color: #999999; font-size: 12px; margin-top: 30px; padding-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #333333; margin: 0;">Khanut</h1>
            </div>
            <div style="padding: 30px 0;">
              <h2 style="color: #333333; margin-top: 0;">Reset Your Password</h2>
              <p>You are receiving this email because you (or someone else) has requested to reset the password for your account.</p>
              <p>Please click the button below to reset your password. This link will expire in 1 hour.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button" style="background-color: #ff6b00; border-radius: 4px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: bold; line-height: 50px; text-align: center; text-decoration: none; width: 200px;">Reset Password</a>
              </div>
              <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
              <p style="background-color: #f5f5f5; border-radius: 4px; padding: 10px; word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
              <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
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
      subject: "Reset Your Password",
      html: html,
      text: `Reset Your Password

You are receiving this email because you (or someone else) has requested to reset the password for your account.

Please visit the following link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

© ${new Date().getFullYear()} Khanut. All rights reserved.
This email was sent to ${email}.`,
    });

    if (error) {
      emailLogger.error("Failed to send password reset email", {
        error,
        email,
      });
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }

    emailLogger.info("Password reset email sent successfully", {
      messageId: data?.id,
      email,
      userId,
    });

    console.log("Password reset email sent:", data?.id);
  } catch (error) {
    emailLogger.error("Error sending password reset email", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      email,
    });
    throw new Error("Failed to send password reset email");
  }
};
