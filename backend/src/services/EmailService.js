const nodemailer = require('nodemailer');

class EmailService {
  static transporter = null;
  static isInitialized = false;

  static async initializeTransporter() {
    if (this.isInitialized && this.transporter) return this.transporter;

    // Configure based on environment
    if (process.env.EMAIL_SERVICE === 'gmail') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASSWORD
        }
      });
      console.log('✅ Gmail transporter initialized');
    } else if (process.env.EMAIL_SERVICE === 'brevo') {
      this.transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        auth: {
          user: process.env.BREVO_EMAIL,
          pass: process.env.BREVO_PASSWORD
        }
      });
      console.log('✅ Brevo transporter initialized');
    } else {
      // Default: use development mode with Ethereal (test email)
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log('✅ Ethereal test account transporter initialized');
        console.log('📧 Ethereal user:', testAccount.user);
        console.log('📧 View emails at: https://ethereal.email');
      } catch (err) {
        console.error('❌ Failed to create test account:', err);
        throw err;
      }
    }

    this.isInitialized = true;
    return this.transporter;
  }

  static async sendOtpEmail(email, otp, recipientName = '') {
    try {
      const transporter = await this.initializeTransporter();

      const mailOptions = {
        from: process.env.SENDER_EMAIL || 'noreply@carbooking.com',
        to: email,
        subject: 'Mã xác thực OTP - Car Booking System',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Xác Thực Tài Khoản</h2>
            <p>Xin chào${recipientName ? ', ' + recipientName : ''},</p>
            <p>Bạn vừa yêu cầu thay đổi mật khẩu. Vui lòng sử dụng mã OTP dưới đây để xác thực:</p>

            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #10b981; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>

            <p><strong>Lưu ý:</strong></p>
            <ul>
              <li>Mã OTP này sẽ hết hạn sau 5 phút</li>
              <li>Không chia sẻ mã này với bất kỳ ai</li>
              <li>Nếu bạn không yêu cầu, vui lòng bỏ qua email này</li>
            </ul>

            <p>Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi.</p>
            <p>Trân trọng,<br>Car Booking System Team</p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ OTP email sent:', info.messageId);

      if (process.env.NODE_ENV !== 'production' && info.response) {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending OTP email:', error);
      throw error;
    }
  }

  static async sendOtpSms(phone, otp) {
    try {
      // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
      // For development, log and simulate success
      console.log(`📱 [DEV MODE] SMS would be sent to ${phone}`);
      console.log(`📱 [DEV MODE] OTP Code: ${otp}`);
      console.log(`📱 [DEV MODE] Replace with real SMS service in production`);

      // In production, you should integrate with Twilio, AWS SNS, Nexmo, etc.
      // Example with Twilio:
      // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // await client.messages.create({
      //   body: `Your OTP code: ${otp}`,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: phone
      // });

      return {
        success: true,
        message: 'SMS sent successfully (dev mode)',
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      };
    } catch (error) {
      console.error('❌ Error sending OTP SMS:', error);
      throw error;
    }
  }
}

module.exports = EmailService;
