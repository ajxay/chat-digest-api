import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return this.authService.requestOtp(requestOtpDto);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(verifyOtpDto);

    // If web, set access token as cookie
    if (verifyOtpDto.deviceType === 'web') {
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Set JWT token as HTTP-only cookie (7 days expiry)
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Remove token from response body for web
      delete result.accessToken;
    }

    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Refresh endpoint is only for mobile (uses refresh token from body)
    // Web uses long-lived JWT token, no refresh needed
    const refreshToken = refreshTokenDto.refreshToken;

    if (!refreshToken) {
      throw new Error('Refresh token not provided');
    }

    const result = await this.authService.refreshToken(refreshToken);

    // Return token in response for mobile
    return result;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    // Clear access token cookie (for web)
    res.clearCookie('accessToken');
    return { message: 'Logged out successfully' };
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return req.user;
  }
}

