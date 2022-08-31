import {
  IsString,
  IsNumber,
  MinLength,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InventoryLocationType, InventoryStatus } from '../../config/enum';

export class UserProfileImageRequest {
  @ApiProperty({
    description: 'Image content in base64',
    required: true,
    example: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/...',
  })
  @IsString()
  image_base64: string;

  @ApiProperty({
    description: 'Image format, e.g. png',
    required: true,
    example: 'png',
  })
  @IsString()
  image_format: string;
}

export class UserDetails {
  @ApiProperty({
    description: "User's uuid",
    required: true,
    example: '00000000-0000-0000-0000-000000000001',
  })
  @IsString()
  uuid: string;

  @ApiProperty({
    description: 'Where is the user from',
    required: true,
    example: 'cognito',
  })
  @IsString()
  source: string;

  // source id
  @ApiProperty({
    description: 'Id from the source',
    required: true,
    example: 'us-west1_1y2z3a4b5',
  })
  @IsString()
  source_id: string;

  constructor(partial: Partial<UserDetails>) {
    Object.assign(this, partial);
  }
}
