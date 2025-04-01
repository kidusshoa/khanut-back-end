import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://khanut.onrender.com"
    : "http://localhost:4000";

export const sendVerificationEmail = async (email: string, token: string) => {
  const link = `${BASE_URL}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: "team@mail.khanut.online",
    to: email,
    subject: "Verify your email",
    html: `<p>Click to verify your email: <a href="${link}">${link}</a></p>`,
  });
};
