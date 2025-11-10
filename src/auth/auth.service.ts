import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../schemas/user.schema';
import { Otp, OtpDocument } from '../schemas/otp.schema';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_OTP_ATTEMPTS = 3;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async requestOtp(requestOtpDto: RequestOtpDto): Promise<{ message: string }> {
    const { phoneNumber } = requestOtpDto;

    // Generate 6-digit OTP
    // For production, integrate with SMS service (Twilio, AWS SNS, etc.)
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    // Invalidate previous OTPs for this phone number
    await this.otpModel.updateMany(
      { phoneNumber, isUsed: false },
      { isUsed: true },
    );

    // Save new OTP
    await this.otpModel.create({
      phoneNumber,
      code: generatedOtp,
      expiresAt,
      isUsed: false,
      attempts: 0,
    });

    // TODO: Send OTP via SMS service (Twilio, AWS SNS, etc.)
    console.log(`OTP for ${phoneNumber}: ${generatedOtp}`); // Remove in production

    return {
      message: 'OTP sent successfully',
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<any> {
    const { phoneNumber, otp, deviceType } = verifyOtpDto;

    // Find the most recent unused OTP
    const otpRecord = await this.otpModel.findOne({
      phoneNumber,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Check attempts
    if (otpRecord.attempts >= this.MAX_OTP_ATTEMPTS) {
      throw new UnauthorizedException('Maximum OTP attempts exceeded');
    }

    // Verify OTP
    if (otpRecord.code !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      throw new UnauthorizedException('Invalid OTP');
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Find or create user
    let user = await this.userModel.findOne({ phoneNumber });
    if (!user) {
      user = await this.userModel.create({
        phoneNumber,
        isVerified: true,
        isActive: true,
        lastLoginAt: new Date(),
      });
    } else {
      user.isVerified = true;
      user.lastLoginAt = new Date();
      await user.save();
    }

    // Generate tokens
    const payload = {
      sub: user._id.toString(),
      phoneNumber: user.phoneNumber,
    };

    // Return response based on device type
    if (deviceType === 'web') {
      // For web: Only generate access token with longer expiry
      const webToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
        expiresIn: this.configService.get<string>('JWT_WEB_EXPIRY') || '7d',
      });

      return {
        message: 'Login successful',
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          email: user.email,
        },
        // For web, token will be set as cookie
        accessToken: webToken,
      };
    } else {
      // For mobile: Generate access and refresh tokens
      const accessToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY') || '15m',
      });

      const refreshToken = this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret-key',
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d',
      });

      return {
        message: 'Login successful',
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          email: user.email,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret-key',
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const newPayload = {
        sub: user._id.toString(),
        phoneNumber: user.phoneNumber,
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY') || '15m',
      });

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId);
  }
}

