const nodemailer = require('nodemailer');

class EmailService {
  static transporter = null;

  static initializeTransporter() {
    if (this.transporter) return this.transporter;

    // Configure based on environment
    if (process.env.EMAIL_SERVICE === 'gmail') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASSWORD
        }
      });
    } else if (process.env.EMAIL_SERVICE === 'brevo') {
      this.transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        auth: {
          user: process.env.BREVO_EMAIL,
          pass: process.env.BREVO_PASSWORD
        }
      });
    } else {
      // Default: use development mode
      this.transporter = nodemailer.createTestAccount().then(testAccount => {
        return nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      });
    }

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
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending OTP email:', error);
      return { success: false, message: error.message };
    }
  }

  static async sendOtpSms(phone, otp) {
    try {
      // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
      // For now, just log it
      console.log(`📱 SMS would be sent to ${phone} with OTP: ${otp}`);
      return { success: true, message: 'SMS sent successfully' };
    } catch (error) {
      console.error('❌ Error sending OTP SMS:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = EmailService;
