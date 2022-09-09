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
import {
  InventoryLocationType,
  InventoryStatus,
  ListUsersMatch,
} from '../../config/enum';
import { Type } from 'class-transformer';

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

export class ListUsersRequest {
  @ApiProperty({
    description: "User's username",
    required: false,
  })
  @IsOptional()
  @IsString()
  user_name: string;

  @ApiProperty({
    description: "User's first name",
    required: false,
  })
  @IsOptional()
  @IsString()
  first_name: string;

  @ApiProperty({
    description: "User's last name",
    required: false,
  })
  @IsOptional()
  @IsString()
  last_name: string;

  @ApiProperty({
    description: "User's email",
    required: false,
  })
  @IsOptional()
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Match type: exact match=1, prefix=2',
  })
  @Type(() => Number)
  @IsOptional()
  @IsEnum(ListUsersMatch)
  match: number;
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

  @ApiProperty({
    description: "User's username",
    required: false,
    example: 'username2000',
  })
  @IsString()
  user_name: string;

  @ApiProperty({
    description: "User's full name",
    required: false,
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "User's email",
    required: false,
    example: 'abc@gmail.com',
  })
  @IsString()
  email: string;

  constructor(partial: Partial<UserDetails>) {
    Object.assign(this, partial);
  }
}
