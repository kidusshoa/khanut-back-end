import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, token: string) => {
  const link = `http://localhost:4000/api/auth/verify-email?token=${token}`;
  await resend.emails.send({
    from: "Khanut <noreply@khanut.com>",
    to: email,
    subject: "Verify your email",
    html: `<p>Click to verify: <a href="${link}">${link}</a></p>`,
  });
};
