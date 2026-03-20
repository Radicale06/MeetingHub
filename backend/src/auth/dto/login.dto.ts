import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;
}

export class RegisterDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;
}

export class OAuthCallbackDto {
  @ApiProperty()
  accessToken: string;

  @ApiPropertyOptional()
  refreshToken?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  refreshToken: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  newPassword: string;

  @ApiProperty()
  resetPasswordToken: string;
}

export class ResetPasswordReqDto {
  @ApiProperty()
  email: string;
}
