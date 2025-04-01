import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const send2FACode = async (email: string, code: string) => {
  await resend.emails.send({
    from: "team@mail.khanut.online",
    to: email,
    subject: "Your 2FA Code",
    html: `<p>Your 2FA code is <strong>${code}</strong>. It expires in 5 minutes.</p>`,
  });
};
