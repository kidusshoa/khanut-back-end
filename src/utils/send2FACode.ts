import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const send2FACode = async (email: string, code: string) => {
  return resend.emails.send({
    from: "no-reply@khanut.com",
    to: email,
    subject: "Your 2FA Code",
    html: `<p>Your 2FA code is: <strong>${code}</strong></p><p>This code expires in 5 minutes.</p>`,
  });
};
