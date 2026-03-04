const nodemailer = require('nodemailer');

console.log('📧 Email Service Configuration:');
console.log('  EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Email transporter verification failed:', error);
  } else {
    console.log('✅ Email transporter is ready to send messages');
  }
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Send OTP email for registration
const sendOTPEmail = async (email, otp) => {
  console.log('📧 Preparing to send registration email to:', email);
  console.log('  OTP:', otp);
  
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email credentials not configured in .env file');
    return false;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Email Verification - Dynamic Forms',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #3b82f6;">Dynamic Forms</h2>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #333;">Email Verification</h3>
          <p style="color: #666; line-height: 1.6;">Thank you for registering with Dynamic Forms. Please use the following OTP to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background-color: #3b82f6; color: white; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; letter-spacing: 5px;">
              ${otp}
            </div>
          </div>
          <p style="color: #666; line-height: 1.6;">This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">This is an automated message, please do not reply.</p>
        </div>
      </div>
    `
  };

  try {
    console.log('📧 Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Registration email sent successfully!');
    console.log('  Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    if (error.code === 'EAUTH') {
      console.error('  Authentication failed. For Gmail, use an App Password:');
      console.error('  https://support.google.com/accounts/answer/185833');
    }
    return false;
  }
};

// Send OTP email for password reset
const sendPasswordResetEmail = async (email, otp, firstName) => {
  console.log('📧 Preparing to send password reset email to:', email);
  console.log('  OTP:', otp);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email credentials not configured in .env file');
    return false;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset - Dynamic Forms',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #3b82f6;">Dynamic Forms</h2>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #333;">Password Reset Request</h3>
          <p style="color: #666; line-height: 1.6;">Hello ${firstName || 'User'},</p>
          <p style="color: #666; line-height: 1.6;">We received a request to reset your password. Please use the following OTP to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background-color: #3b82f6; color: white; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; letter-spacing: 5px;">
              ${otp}
            </div>
          </div>
          <p style="color: #666; line-height: 1.6;">This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">This is an automated message, please do not reply.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully!');
    return true;
  } catch (error) {
    console.error('❌ Password reset email error:', error);
    return false;
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendPasswordResetEmail
};