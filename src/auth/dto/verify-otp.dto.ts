import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in valid format (e.g., +1234567890)',
  })
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;

  @IsNotEmpty()
  @IsString()
  deviceType: 'web' | 'mobile';
}

