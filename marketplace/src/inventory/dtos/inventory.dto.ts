import {
  IsString,
  IsNumber,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InventoryStatus } from 'src/config/enum';

export class InventoryRequest {
  @ApiProperty({
    description: 'Item ID',
    required: true,
    example: 1,
  })
  @IsNumber()
  item_id: number;

  @ApiProperty({
    description: 'Vault name',
    required: true,
    example: 'Dallas',
  })
  @IsString()
  vault: string;

  @ApiProperty({
    description: 'Zone name',
    required: true,
    example: 'Cabinet',
  })
  @IsString()
  zone: string;

  @ApiProperty({
    description: 'Shelf number',
    required: false,
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  shelf: number;

  @ApiProperty({
    description: 'Row number',
    required: false,
    example: 3,
  })
  @IsNumber()
  @IsOptional()
  row: number;

  @ApiProperty({
    description: 'Box number',
    required: false,
    example: 4,
  })
  @IsNumber()
  @IsOptional()
  box: number;

  @ApiProperty({
    description: 'Slot number',
    required: false,
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  slot: number;

  @ApiProperty({
    description: 'Any note for this inventory',
    required: false,
    example: 'Item is fragile',
  })
  @IsString()
  @IsOptional()
  note: string;

  constructor(partial: Partial<InventoryRequest>) {
    Object.assign(this, partial);
  }
}

export class InventoryLocation {
  @IsString()
  vault: string;

  @IsString()
  zone: string;

  @IsNumber()
  shelf: number;

  @IsNumber()
  row: number;

  @IsNumber()
  box: number;

  @IsNumber()
  slot: number;

  constructor(partial: Partial<InventoryLocation>) {
    Object.assign(this, partial);
  }
}

export class UpdateInventoryRequest {
  @ApiProperty({
    description: 'Item ID',
    required: true,
    example: 1,
  })
  @IsNumber()
  item_id: number;

  @ApiProperty({
    description: 'Vault name',
    required: false,
    example: 'Dallas',
  })
  @IsString()
  @IsOptional()
  vault: string;

  @ApiProperty({
    description: 'Zone name',
    required: false,
    example: 'Cabinet',
  })
  @IsString()
  @IsOptional()
  zone: string;

  @ApiProperty({
    description: 'Shelf number',
    required: false,
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  shelf: number;

  @ApiProperty({
    description: 'Row number',
    required: false,
    example: 3,
  })
  @IsNumber()
  @IsOptional()
  row: number;

  @ApiProperty({
    description: 'Box number',
    required: false,
    example: 4,
  })
  @IsNumber()
  @IsOptional()
  box: number;

  @ApiProperty({
    description: 'Slot number',
    required: false,
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  slot: number;

  @ApiProperty({
    description: 'Any note for this inventory',
    required: false,
    example: 'Item is fragile',
  })
  @IsString()
  @IsOptional()
  note: string;

  @ApiProperty({
    description: 'inventory status',
    required: false,
    example: 0,
  })
  @IsEnum(InventoryStatus)
  @IsOptional()
  status: number;

  constructor(partial: Partial<UpdateInventoryRequest>) {
    Object.assign(this, partial);
  }
}

export class InventoryDetails {
  @ApiProperty({
    description: 'Inventory ID',
    required: true,
    example: 1,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Item ID',
    required: true,
    example: 123,
  })
  @IsNumber()
  item_id: number;

  @ApiProperty({
    description: 'User UUID of the owner of the item',
    required: true,
    example: '00000000-0000-0000-0000-000000000000',
  })
  @IsString()
  user: string;

  @ApiProperty({
    description: 'Title of the item',
    required: true,
    example: 'Item Title',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Image of the item',
    required: true,
    example: 'http://example.com/image.png',
  })
  @IsString()
  image_url: string;

  @ApiProperty({
    description: 'Vault name',
    required: true,
    example: 'Dallas',
  })
  @IsString()
  vault: string;

  @ApiProperty({
    description: 'Zone name',
    required: true,
    example: 'Cabinet',
  })
  @IsString()
  zone: string;

  @ApiProperty({
    description: 'Shelf number',
    required: true,
    example: 2,
    default: 0,
  })
  @IsNumber()
  shelf: number;

  @ApiProperty({
    description: 'Row number',
    required: true,
    example: 3,
    default: 0,
  })
  @IsNumber()
  row: number;

  @ApiProperty({
    description: 'Box number',
    required: true,
    example: 4,
    default: 0,
  })
  @IsNumber()
  box: number;

  @ApiProperty({
    description: 'Slot number',
    required: true,
    example: 5,
    default: 0,
  })
  @IsNumber()
  slot: number;

  @ApiProperty({
    description: 'label generated from all location fields',
    required: true,
    example: 'Dallas-Cabinet-2-3-4-5-6',
    default: '',
  })
  @IsString()
  label: string;

  @ApiProperty({
    description: 'Any note for this inventory',
    required: true,
    example: 'Item is fragile',
    default: '',
  })
  @IsString()
  note: string;

  @ApiProperty({
    description: 'Enum of the inventory status of the item',
    required: true,
    example: 0,
    default: 0,
  })
  @IsNumber()
  status: number;

  @ApiProperty({
    description: 'Description of inventory status of the item',
    required: true,
    example: 0,
    default: 0,
  })
  @IsNumber()
  status_desc: number;

  @ApiProperty({
    description: 'Timestamp of inventory creation',
    required: true,
    example: 123456789,
    default: 0,
  })
  @IsNumber()
  created_at: number;

  @ApiProperty({
    description: 'Timestamp of inventory update',
    required: true,
    example: 123456789,
    default: 0,
  })
  @IsNumber()
  updated_at: number;

  constructor(partial: Partial<InventoryDetails>) {
    Object.assign(this, partial);
  }
}

export class ListInventoryRequest {
  @ApiProperty({
    description: 'Item ID',
    required: false,
    example: 1,
  })
  @IsNumber()
  item_id?: number;

  @ApiProperty({
    description: 'User UUID',
    required: false,
    example: '12345678-1234-1234-1234-1234567890ab',
  })
  @IsString()
  user_uuid?: string;

  @ApiProperty({
    description: 'The status enum of the inventory record',
    required: false,
    example: 1,
  })
  @IsNumber()
  status: number;

  @ApiProperty({
    description: 'The offset of the query',
    required: false,
    example: 0,
  })
  @IsNumber()
  offset: number;

  @ApiProperty({
    description: 'The limit of the query',
    required: false,
    example: 10,
  })
  @IsNumber()
  limit: number;

  @ApiProperty({
    description: 'The order of the query',
    required: false,
    example: 'ASC or DESC',
  })
  @IsEnum(['ASC', 'DESC'])
  order: string;
}
