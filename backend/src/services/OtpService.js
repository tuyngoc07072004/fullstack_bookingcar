const Otp = require('../models/Otp.models');

class OtpService {
  // Generate 6-digit OTP
  static generateOtpCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create and save OTP
  static async createOtp(userId, phoneOrEmail, method = 'email') {
    try {
      // Delete any existing OTPs for this user
      await Otp.deleteMany({ userId, phoneOrEmail });

      const otpCode = this.generateOtpCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const otp = new Otp({
        userId,
        phoneOrEmail,
        otp: otpCode,
        method,
        verified: false,
        expiresAt
      });

      await otp.save();

      return {
        otpId: otp._id,
        expiresAt,
        otpCode // In production, don't return this!
      };
    } catch (error) {
      throw new Error(`Failed to create OTP: ${error.message}`);
    }
  }

  // Verify OTP
  static async verifyOtp(otpId, userEnteredOtp) {
    try {
      const otp = await Otp.findById(otpId);

      if (!otp) {
        return { valid: false, message: 'OTP không tồn tại' };
      }

      if (otp.verified) {
        return { valid: false, message: 'OTP đã được sử dụng' };
      }

      if (new Date() > otp.expiresAt) {
        return { valid: false, message: 'OTP đã hết hạn' };
      }

      if (otp.otp !== userEnteredOtp) {
        return { valid: false, message: 'OTP không chính xác' };
      }

      // Mark as verified
      otp.verified = true;
      await otp.save();

      return {
        valid: true,
        userId: otp.userId,
        phoneOrEmail: otp.phoneOrEmail,
        otpId: otp._id
      };
    } catch (error) {
      throw new Error(`Failed to verify OTP: ${error.message}`);
    }
  }

  // Generate verification token after OTP verification
  static async generateVerificationToken(otpId) {
    try {
      const otp = await Otp.findById(otpId);

      if (!otp || !otp.verified) {
        throw new Error('Không thể tạo token xác thực');
      }

      // Create a simple verification token (in production, use JWT)
      const verificationToken = Buffer.from(
        JSON.stringify({
          otpId: otp._id,
          userId: otp.userId,
          timestamp: Date.now()
        })
      ).toString('base64');

      return verificationToken;
    } catch (error) {
      throw new Error(`Failed to generate verification token: ${error.message}`);
    }
  }

  // Verify verification token
  static async verifyVerificationToken(verificationToken) {
    try {
      const decoded = JSON.parse(
        Buffer.from(verificationToken, 'base64').toString()
      );

      const otp = await Otp.findById(decoded.otpId);

      if (!otp || !otp.verified) {
        return { valid: false };
      }

      // Token valid for 10 minutes after OTP verification
      if (Date.now() - decoded.timestamp > 10 * 60 * 1000) {
        return { valid: false, message: 'Token xác thực hết hạn' };
      }

      return {
        valid: true,
        userId: decoded.userId
      };
    } catch (error) {
      return { valid: false, message: 'Token không hợp lệ' };
    }
  }

  // Clean up expired OTPs
  static async cleanupExpiredOtps() {
    try {
      const result = await Otp.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      console.log(`✅ Cleaned up ${result.deletedCount} expired OTPs`);
    } catch (error) {
      console.error('❌ Error cleaning up expired OTPs:', error);
    }
  }
}

module.exports = OtpService;
