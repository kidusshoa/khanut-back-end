import nodemailer from 'nodemailer';

/**
 * Send a password reset email to the user
 * @param email User's email address
 * @param token Reset token
 * @param userId User's ID
 */
export const sendResetEmail = async (email: string, token: string, userId: string): Promise<void> => {
  try {
    // Create a test account if no SMTP settings are provided
    let testAccount;
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      testAccount = await nodemailer.createTestAccount();
    }

    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || testAccount?.user,
        pass: process.env.SMTP_PASS || testAccount?.pass,
      },
    });

    // Get the frontend URL from environment or use a default
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}&id=${userId}`;

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Khanut Support" <support@khanut.com>',
      to: email,
      subject: 'Password Reset Request',
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste it into your browser to complete the process:\n\n
        ${resetUrl}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
          <p>Please click on the following button, or paste the link into your browser to complete the process:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" style="background-color: #ff6b00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link: <a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          <p style="color: #777; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
        </div>
      `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent: %s', info.messageId);
    
    // Log preview URL for development
    if (testAccount) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};
