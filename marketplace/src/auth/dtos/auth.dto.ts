import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthenticationRequest {
  @ApiProperty({
    description: 'User email',
    required: true,
    example: 'headless@beckett.com',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    description: 'User password',
    required: true,
    example: 'Beckett123!',
  })
  @IsString()
  password: string;
}
