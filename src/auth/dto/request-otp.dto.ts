import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in valid format (e.g., +1234567890)',
  })
  phoneNumber: string;
}

