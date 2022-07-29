import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  ActionLogEntityType,
  ActionLogEntityTypeReadable,
  ActionLogActorType,
  ActionLogActorTypeReadable,
  ActionLogType,
  ActionLogTypeReadable,
} from '../../config/enum';

export class SubmissionRequest {
  @ApiProperty({
    description: 'The uuid of the user who submitted the item',
    required: true,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsString()
  @MinLength(1)
  user: string;

  @ApiProperty({
    description: 'The grading company of the submitted the item',
    required: true,
    example: 'foo company',
  })
  @IsString()
  grading_company: string;

  @ApiProperty({
    description: 'The serial number of the submitted the item',
    required: true,
    example: 'SN12345678',
  })
  @IsString()
  serial_number: string;

  @ApiProperty({
    description: 'The title of the submitted the item',
    required: true,
    example: 'Foo Title',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'The description of the submitted the item',
    required: true,
    example: 'Foo description',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'The genre of the submitted the item',
    required: true,
    example: 'Foo genre',
  })
  @IsString()
  genre: string;

  @ApiProperty({
    description: 'The manufacturer of the submitted the item',
    required: true,
    example: 'Foo manufacturer',
  })
  @IsString()
  @MinLength(0)
  manufacturer: string;

  @ApiProperty({
    description: 'The year of the submitted the item',
    required: true,
    example: 1999,
  })
  @IsNumber()
  year: number;

  @ApiProperty({
    description: 'The overall grade of the submitted the item',
    required: true,
    example: 'AAA',
  })
  @IsString()
  overall_grade: string;

  @ApiProperty({
    description: 'The sub grades of the submitted the item',
    required: true,
    example: 'BBB',
  })
  @IsString()
  sub_grades: string;

  @ApiProperty({
    description: 'The autograph of the submitted the item',
    required: true,
    example: 'Foo autograph',
  })
  @IsString()
  @IsOptional()
  @MinLength(0)
  autograph: string;

  @ApiProperty({
    description: 'The subject of the submitted item',
    required: true,
    example: 'Foo subject',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'The estimated value of the submitted item in cents',
    required: true,
    example: 10000,
  })
  @IsNumber()
  est_value: number;

  @ApiProperty({
    description: "The base64 encoding of the submitted item's image ",
    required: true,
    example: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/...',
  })
  @IsString()
  image_base64: string;

  @ApiProperty({
    description: 'The image format of the submitted item',
    required: true,
    example: 'jpg',
  })
  @IsString()
  image_format: string;

  @ApiProperty({
    description:
      'The image path (static asset of the site) of the submitted item',
    required: false,
    example: 'path/to/image.jpg',
  })
  @IsString()
  @IsOptional()
  image_path: string;

  @ApiProperty({
    description: "The base64 encoding of the submitted item's back image ",
    required: true,
    example: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/...',
  })
  @IsString()
  image_rev_base64: string;

  @ApiProperty({
    description: 'The back image format of the submitted item',
    required: true,
    example: 'jpg',
  })
  @IsString()
  image_rev_format: string;

  @ApiProperty({
    description:
      'The back image path (static asset of the site) of the submitted item',
    required: false,
    example: 'path/to/image.jpg',
  })
  @IsString()
  @IsOptional()
  image_rev_path: string;

  constructor(partial: Partial<SubmissionRequest>) {
    Object.assign(this, partial);
  }
}

export class SubmissionResponse {
  @ApiProperty({
    description: 'The uuid of the user who submitted the item',
    required: true,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsNumber()
  user: string;

  @ApiProperty({
    description: 'The id of the submitted item',
    required: true,
    example: 1,
  })
  @IsNumber()
  submission_id: number;

  @ApiProperty({
    description: 'The id of the submission',
    required: true,
    example: 1,
  })
  @IsNumber()
  item_id: number;

  @ApiProperty({
    description: 'The uuid of the submission',
    required: true,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsString()
  item_uuid: string;

  @ApiProperty({
    description: 'The status of the submitted item',
    required: true,
    example: '1',
  })
  @IsNumber()
  status: number;

  @ApiProperty({
    description: 'The description of the status of the submitted item',
    required: true,
    example: 'Submitted',
  })
  @IsString()
  status_desc: string;

  constructor(partial: Partial<SubmissionResponse>) {
    Object.assign(this, partial);
  }
}

export class ListSubmissionsQuery {
  @ApiProperty({
    description: 'The id of the user',
    required: false,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsString()
  @IsOptional()
  user: string;

  @ApiProperty({
    description: 'The status enum of the submission',
    required: false,
    example: 1,
  })
  @IsNumberString()
  @IsOptional()
  status: number;

  @ApiProperty({
    description: 'The offset of the query',
    required: false,
    example: 5,
  })
  @IsNumberString()
  @IsOptional()
  offset: number;

  @ApiProperty({
    description: 'The limit of the query',
    required: false,
    example: 10,
  })
  @IsNumberString()
  @IsOptional()
  limit: number;

  @ApiProperty({
    description: 'The order of the query',
    required: false,
    example: 'ASC or DESC',
  })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  order: string;
}

export class SubmissionDetails {
  @ApiProperty({
    description: 'The id of the submission',
    required: true,
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'The uuid of the user who submitted the item',
    required: true,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsNumber()
  user: string;

  @ApiProperty({
    description: 'The timestamp of the creation of the submission',
    required: true,
    example: 1657074424,
  })
  @IsNumber()
  created_at: number;

  @ApiProperty({
    description: 'The timestamp of the receipt of the item',
    required: true,
    example: 1657074424,
  })
  @IsNumber()
  received_at: number;

  @ApiProperty({
    description: 'The timestamp of the approval of the submitted item',
    required: true,
    example: 1657074424,
  })
  @IsNumber()
  approved_at: number;

  @ApiProperty({
    description: 'The timestamp of the rejection of the submitted item',
    required: true,
    example: 1657074424,
  })
  @IsNumber()
  rejected_at: number;

  @ApiProperty({
    description: 'The current status of the submitted item',
    required: true,
    example: 1,
  })
  @IsNumber()
  status: number;

  @ApiProperty({
    description: 'The description of current status of the submitted item',
    required: true,
    example: 'Submitted',
  })
  @IsString()
  @MinLength(1)
  status_desc: string;

  @ApiProperty({
    description: 'The id of the submitted item',
    required: true,
    example: 1,
  })
  @IsNumber()
  item_id: number;

  @ApiProperty({
    description: 'The uuid of the submitted item',
    required: true,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsString()
  item_uuid: string;

  @ApiProperty({
    description: 'The grading company of the submitted item',
    required: true,
    example: 'Foo grading company',
  })
  @IsString()
  @MinLength(1)
  grading_company: string;

  @ApiProperty({
    description: 'The serial number of the submitted item',
    required: true,
    example: 'SN12345678',
  })
  @IsString()
  @MinLength(1)
  serial_number: string;

  @ApiProperty({
    description: 'The title of the submitted item',
    required: true,
    example: 'Foo title',
  })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({
    description: 'The description of the submitted item',
    required: true,
    example: 'Foo description',
  })
  @IsString()
  @MinLength(1)
  description: string;

  @ApiProperty({
    description: 'The genre of the submitted item',
    required: true,
    example: 'Foo genre',
  })
  @IsString()
  @MinLength(1)
  genre: string;

  @ApiProperty({
    description: 'The manufacturer of the submitted item',
    required: true,
    example: 'Foo manufacturer',
  })
  @IsString()
  @MinLength(1)
  manufacturer: string;

  @ApiProperty({
    description: 'The year of the submitted item',
    required: true,
    example: 1999,
  })
  @IsNumber()
  year: number;

  @ApiProperty({
    description: 'The overall grade of the submitted item',
    required: true,
    example: 'AAA',
  })
  @IsString()
  overall_grade: string;

  @ApiProperty({
    description: 'The sub grades of the submitted item',
    required: true,
    example: 'BBB',
  })
  @IsString()
  sub_grades: string;

  @ApiProperty({
    description: 'The autograph of the submitted item',
    required: true,
    example: 'Foo autograph',
  })
  @IsString()
  @IsOptional()
  autograph: string;

  @ApiProperty({
    description: 'The subject of the submitted item',
    required: true,
    example: 'Foo subject',
  })
  @IsString()
  @IsOptional()
  subject: string;

  @ApiProperty({
    description: 'The estimated value of the submitted item in cents',
    required: true,
    example: 10000,
  })
  @IsNumber()
  est_value: number;

  @ApiProperty({
    description: 'The image url of the submitted item',
    required: true,
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  image_url: string;

  @ApiProperty({
    description: 'The back image url of the submitted item',
    required: true,
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  image_rev_url: string;

  constructor(partial: Partial<SubmissionDetails>) {
    Object.assign(this, partial);
  }
}

export class SubmissionStatusUpdate {
  @ApiProperty({
    description: 'The status enum number',
    required: true,
    example: 1,
  })
  @IsNumber()
  status: number;

  constructor(partial: Partial<SubmissionStatusUpdate>) {
    Object.assign(this, partial);
  }
}

export class VaultingRequest {
  @ApiProperty({
    description: 'The id of the item to vault',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  item_id: number;

  @ApiProperty({
    description: 'The uuid of the user who vaulted the item',
    example: '12345678-0000-0000-0000-000000000000',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  user: string;

  @ApiProperty({
    description: 'The id of the submission',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  submission_id: number;

  @ApiProperty({
    description: 'The base64 encoding of the vaulting image',
    example: '/9j/4AAQSkZJRgABAQAAAQABAAD/4Q......',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  image_base64: string;

  @ApiProperty({
    description: 'The format of the vaulting image',
    example: 'jpg',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  image_format: string;

  constructor(partial: Partial<VaultingRequest>) {
    Object.assign(this, partial);
  }
}

export class VaultingResponse {
  @ApiProperty({
    description: 'The id of the vaulting',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'The id of the item to vault',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  item_id: number;

  @ApiProperty({
    description: 'The uuid of the item to vault',
    example: '12345678-0000-0000-0000-000000000000',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  item_uuid: string;

  @ApiProperty({
    description: 'The uuid of the user who vaulted the item',
    example: '12345678-0000-0000-0000-000000000000',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  user: string;

  @ApiProperty({
    description: 'The status of the vaulted item',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  status: number;

  @ApiProperty({
    description: 'The description of the status of the vaulted item',
    example: 'Vaulted',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  status_desc: number;

  constructor(partial: Partial<VaultingResponse>) {
    Object.assign(this, partial);
  }
}

export class ListVaultingsQuery {
  @ApiProperty({
    description: 'The id of the user',
    required: false,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsString()
  @IsOptional()
  user: string;

  @ApiProperty({
    description: 'The offset of the query',
    required: false,
    example: 5,
  })
  @IsNumberString()
  @IsOptional()
  offset: number;

  @ApiProperty({
    description: 'The limit of the query',
    required: false,
    example: 10,
  })
  @IsNumberString()
  @IsOptional()
  limit: number;

  @ApiProperty({
    description: 'The order of the query',
    required: false,
    example: 'ASC or DESC',
  })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  order: string;
}

export class VaultingDetails {
  @ApiProperty({
    description: 'The id of the vaulting',
    example: 1,
    required: true,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'The collection of the minted NFT token',
    example: '0x0000000000000000000000000000000000000000',
    required: true,
  })
  @IsString()
  @MinLength(1)
  collection: string;

  @ApiProperty({
    description: 'The id of the minted NFT token',
    example: 1,
    required: true,
  })
  @IsNumber()
  token_id: number;

  @ApiProperty({
    description: 'The id of the submission',
    example: 1,
    required: true,
  })
  @IsNumber()
  submission_id: number;

  @ApiProperty({
    description: 'The uuid of the user who vaulted the item',
    required: true,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsString()
  user: string;

  @ApiProperty({
    description: 'The id of the blockchain that the token is on',
    example: 99,
    required: true,
  })
  @IsNumber()
  chain_id: number;

  @ApiProperty({
    description: 'The hash of the transaction that mints the NFT token',
    required: true,
    example: '0x0000000000000000000000000000000000000000',
  })
  @IsString()
  mint_tx_hash: string;

  @ApiProperty({
    description: 'The hash of the transaction that burns the NFT token',
    required: true,
    example: '0x0000000000000000000000000000000000000000',
  })
  @IsString()
  burn_tx_hash: string;

  @ApiProperty({
    description: 'The timestamp when the token is minted',
    required: true,
    example: 1657074424,
  })
  @IsNumber()
  minted_at: number;

  @ApiProperty({
    description: 'The timestamp when the token is burned',
    required: true,
    example: 1657074424,
  })
  @IsNumber()
  burned_at: number;

  @ApiProperty({
    description: 'The status enum of the vaulted item',
    example: 1,
    required: true,
  })
  @IsNumber()
  status: number;

  @ApiProperty({
    description: 'The description of the status of the vaulted item',
    example: 'Vaulted',
    required: true,
  })
  @IsString()
  @MinLength(1)
  status_desc: string;

  @ApiProperty({
    description: 'The id of the vaulted item',
    required: true,
    example: 1,
  })
  @IsNumber()
  item_id: number;

  @ApiProperty({
    description: 'The uuid of the vaulted item',
    required: true,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsString()
  item_uuid: string;

  @ApiProperty({
    description: 'The grading company of the vaulted item',
    required: true,
    example: 'foo company',
  })
  @IsString()
  @MinLength(1)
  grading_company: string;

  @ApiProperty({
    description: 'The serial number of the vaulted item',
    required: true,
    example: 'SN12345678',
  })
  @IsString()
  @MinLength(1)
  serial_number: string;

  @ApiProperty({
    description: 'The title of the vaulted item',
    required: true,
    example: 'Foo Title',
  })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({
    description: 'The description of the vaulted item',
    required: true,
    example: 'Foo description',
  })
  @IsString()
  @MinLength(1)
  description: string;

  @ApiProperty({
    description: 'The genre of the vaulted item',
    required: true,
    example: 'Foo genre',
  })
  @IsString()
  @MinLength(1)
  genre: string;

  @ApiProperty({
    description: 'The manufacturer of the vaulted item',
    required: true,
    example: 'Foo manufacturer',
  })
  @IsString()
  @MinLength(1)
  manufacturer: string;

  @ApiProperty({
    description: 'The year of the vaulted item',
    required: true,
    example: 1999,
  })
  @IsNumber()
  year: number;

  @ApiProperty({
    description: 'The overall grade of the vaulted item',
    required: true,
    example: 'AAA',
  })
  @IsString()
  overall_grade: string;

  @ApiProperty({
    description: 'The sub grades of the vaulted item',
    required: true,
    example: 'BBB',
  })
  @IsString()
  sub_grades: string;

  @ApiProperty({
    description: 'The autograph of the vaulted item',
    required: true,
    example: 'Foo autograph',
  })
  @IsString()
  @IsOptional()
  autograph: string;

  @ApiProperty({
    description: 'The subject of the vaulted item',
    required: true,
    example: 'Foo subject',
  })
  @IsString()
  @IsOptional()
  subject: string;

  @ApiProperty({
    description: 'The estimated value of the vaulted item in cents',
    required: true,
  })
  @IsNumber()
  est_value: number;

  @ApiProperty({
    description: 'The image url of the vaulted item',
    required: true,
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  @IsOptional()
  image_url: string;

  constructor(partial: Partial<VaultingDetails>) {
    Object.assign(this, partial);
  }
}

export class VaultingUpdate {
  @ApiProperty({
    description: 'The type of the vaulting update',
    required: true,
    example: 1,
  })
  @IsNumber()
  type: number;

  @ApiProperty({
    description: 'The id of the blockchain that the token is on',
    example: 99,
    required: true,
  })
  @IsNumber()
  chain_id: number;

  @ApiProperty({
    description: 'The uuid of the vaulted item',
    required: true,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsString()
  item_uuid: string;

  @ApiProperty({
    description: 'The id of the job that burns the NFT token',
    required: true,
    example: 1,
  })
  @IsNumber()
  burn_job_id: number;

  @ApiProperty({
    description: 'The hash of the transaction that mints the NFT token',
    required: true,
    example: '0x0000000000000000000000000000000000000000',
  })
  @IsString()
  mint_tx_hash: string;

  @ApiProperty({
    description: 'The hash of the transaction that burns the NFT token',
    required: true,
    example: '0x0000000000000000000000000000000000000000',
  })
  @IsString()
  burn_tx_hash: string;

  @ApiProperty({
    description: 'The collection of the minted NFT token',
    example: '0x0000000000000000000000000000000000000000',
    required: true,
  })
  @IsString()
  collection: string;

  @ApiProperty({
    description: 'The id of the minted NFT token',
    example: 1,
    required: true,
  })
  @IsNumber()
  token_id: number;

  @ApiProperty({
    description: 'The status to be updated to for the vaulted item',
    required: true,
    example: 1,
  })
  @IsNumber()
  status: number;

  constructor(partial: Partial<VaultingUpdate>) {
    Object.assign(this, partial);
  }
}

export class ListingRequest {
  @ApiProperty({
    description: 'The id of the vaulting to be listed',
    required: true,
    example: 1,
  })
  @IsNumber()
  vaulting_id: number;

  @ApiProperty({
    description: 'The uuid of the user who listed the item',
    required: true,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsString()
  user: string;

  @ApiProperty({
    description: 'The price of the listed item in cents',
    required: true,
    example: 10000,
  })
  @IsNumber()
  price: number;

  constructor(partial: Partial<ListingRequest>) {
    Object.assign(this, partial);
  }
}

export class ListingResponse {
  @ApiProperty({
    description: 'The id of the listing',
    required: true,
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'The id of the related vaulting',
    required: true,
    example: 1657074424,
  })
  @IsNumber()
  vaulting_id: number;

  @ApiProperty({
    description: 'The uuid of the user who listed the item',
    required: true,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsString()
  user: string;

  @ApiProperty({
    description: 'The price of the listed item in cents',
    required: true,
    example: 10000,
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'The status of the listing',
    required: true,
    example: 1,
  })
  @IsNumber()
  status: number;

  @ApiProperty({
    description: 'The description of the status of the listing',
    required: true,
    example: 'Listed',
  })
  @IsString()
  status_desc: string;

  constructor(partial: Partial<ListingResponse>) {
    Object.assign(this, partial);
  }
}

export class ListListingsQuery {
  @ApiProperty({
    description: 'The id of the user',
    required: false,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsString()
  @IsOptional()
  user: string;

  @ApiProperty({
    description: 'The offset of the query',
    required: false,
    example: 5,
  })
  @IsNumberString()
  @IsOptional()
  offset: number;

  @ApiProperty({
    description: 'The limit of the query',
    required: false,
    example: 10,
  })
  @IsNumberString()
  @IsOptional()
  limit: number;

  @ApiProperty({
    description: 'The order of the query',
    required: false,
    example: 'ASC or DESC',
  })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  order: string;
}

export class ListingDetails {
  @ApiProperty({
    description: 'The id of the listing',
    required: true,
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'The price of the listed item in cents',
    required: true,
    example: 10000,
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'The uuid of the user who listed the item',
    required: true,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsString()
  user: string;

  @ApiProperty({
    description: 'The status of the listing',
    required: true,
    example: 1,
  })
  @IsNumber()
  status: number;

  @ApiProperty({
    description: 'The description of the status of the listing',
    required: true,
    example: 'Listed',
  })
  @IsString()
  @MinLength(1)
  status_desc: string;

  @ApiProperty({
    description: 'The timestamp of the creation of the listing',
    required: true,
    example: 1657074424,
  })
  @IsNumber()
  created_at: number;

  @ApiProperty({
    description: 'The timestamp of the update of the listing',
    required: true,
    example: 1657074424,
  })
  @IsNumber()
  updated_at: number;

  @ApiProperty({
    description: 'The id of the listed item',
    required: true,
  })
  @IsNumber()
  item_id: number;

  @ApiProperty({
    description: 'The uuid of the listed item',
    required: true,
  })
  @IsString()
  item_uuid: string;

  @ApiProperty({
    description: 'The grading company of the listed item',
    required: true,
    example: 'foo company',
  })
  @IsString()
  @MinLength(1)
  grading_company: string;

  @ApiProperty({
    description: 'The serial number of the listed item',
    required: true,
    example: 'SN12345678',
  })
  @IsString()
  @MinLength(1)
  serial_number: string;

  @ApiProperty({
    description: 'The title of the listed item',
    required: true,
    example: 'Foo Title',
  })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({
    description: 'The description of the listed item',
    required: true,
    example: 'Foo description',
  })
  @IsString()
  @MinLength(1)
  description: string;

  @ApiProperty({
    description: 'The genre of the listed item',
    required: true,
    example: 'Foo genre',
  })
  @IsString()
  @MinLength(1)
  genre: string;

  @ApiProperty({
    description: 'The manufacturer of the listed item',
    required: true,
    example: 'Foo manufacturer',
  })
  @IsString()
  @MinLength(1)
  manufacturer: string;

  @ApiProperty({
    description: 'The year of the listed item',
    required: true,
    example: 1999,
  })
  @IsNumber()
  year: number;

  @ApiProperty({
    description: 'The overall grade of the lsited item',
    required: true,
    example: 'AAA',
  })
  @IsString()
  overall_grade: string;

  @ApiProperty({
    description: 'The sub grades of the listed item',
    required: true,
    example: 'BBB',
  })
  @IsString()
  sub_grades: string;

  @ApiProperty({
    description: 'The autograph of the listed item',
    required: true,
    example: 'Foo autograph',
  })
  @IsString()
  @IsOptional()
  autograph: string;

  @ApiProperty({
    description: 'The subject of the listed item',
    required: true,
    example: 'Foo subject',
  })
  @IsString()
  @IsOptional()
  subject: string;

  @ApiProperty({
    description: 'The image url of the listed item',
    required: true,
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  @IsOptional()
  image_url: string;

  constructor(partial: Partial<ListingDetails>) {
    Object.assign(this, partial);
  }
}

export class ListingUpdate {
  @ApiProperty({
    description: 'The price of the listed item in cents',
    required: true,
    example: 10000,
  })
  @IsNumber()
  price: number;

  constructor(partial: Partial<ListingUpdate>) {
    Object.assign(this, partial);
  }
}

export class ActionLogRequest {
  @ApiProperty({
    description: 'The type of the action',
    required: true,
    example: ActionLogType.Submission,
  })
  @IsEnum(ActionLogType)
  type: number;

  @ApiProperty({
    description: 'The actor type of the action',
    required: true,
    example: ActionLogActorType.CognitoUser,
  })
  @IsEnum(ActionLogActorType)
  actor_type: number;

  @ApiProperty({
    description: 'The actor id of the action',
    required: true,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsString()
  actor: string;

  @ApiProperty({
    description: 'The entity type of the action',
    required: true,
    example: ActionLogEntityType.Submission,
  })
  @IsString()
  entity_type: number;

  @ApiProperty({
    description: 'The entity id of the action',
    required: true,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsString()
  entity: string;

  @ApiProperty({
    description: 'The extra information of the action',
    required: false,
    example: '{}',
  })
  @IsString()
  extra: string;

  constructor(partial: Partial<ActionLogRequest>) {
    Object.assign(this, partial);
  }
}

export class ActionLogDetails {
  @ApiProperty({
    description: 'The id of the action',
    required: true,
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'The enum of the action type',
    required: true,
    example: ActionLogType.Pricing,
  })
  @IsEnum(ActionLogType)
  type: ActionLogType;

  @ApiProperty({
    description: 'The description of the action type',
    required: true,
    example: ActionLogTypeReadable[ActionLogType.Pricing],
  })
  @IsString()
  type_desc: string;

  @ApiProperty({
    description: "The enum of the action's actor type",
    required: true,
    example: ActionLogActorType.CognitoUser,
  })
  @IsEnum(ActionLogActorType)
  actor_type: ActionLogActorType;

  @ApiProperty({
    description: "The description of the action's actor type",
    required: true,
    example: ActionLogActorTypeReadable[ActionLogActorType.CognitoUser],
  })
  @IsString()
  actor_type_desc: string;

  @ApiProperty({
    description: "The id of the action's actor",
    required: true,
    example: '12345678-0000-0000-0000-000000000000',
  })
  @IsString()
  actor: string;

  @ApiProperty({
    description: "The enum of the action's entity type",
    required: true,
    example: ActionLogEntityType.Listing,
  })
  @IsEnum(ActionLogEntityType)
  entity_type: ActionLogEntityType;

  @ApiProperty({
    description: "The description of the action's entity type",
    required: true,
    example: ActionLogEntityTypeReadable[ActionLogEntityType.Listing],
  })
  @IsString()
  entity_type_desc: string;

  @ApiProperty({
    description: "The id of the action's entity",
    required: true,
    example: '1',
  })
  @IsString()
  entity: string;

  @ApiProperty({
    description: 'The timestamp of the action',
    required: true,
    example: 123456789,
  })
  @IsNumber()
  created_at: number;

  @ApiProperty({
    description: 'The extra information related to the action in JSON format',
    required: false,
    example: "{'price': 10000}",
  })
  @IsString()
  extra: string;

  constructor(partial: Partial<ActionLogDetails>) {
    Object.assign(this, partial);
  }
}

export class ListActionLogsQuery {
  @ApiProperty({
    description: 'The offset of the query',
    required: false,
    example: 5,
  })
  @IsNumberString()
  @IsOptional()
  offset: number;

  @ApiProperty({
    description: 'The limit of the query',
    required: false,
    example: 10,
  })
  @IsNumberString()
  @IsOptional()
  limit: number;

  @ApiProperty({
    description: 'The order of the query',
    required: false,
    example: 'ASC or DESC',
  })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  order: string;
}
