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

export class InventoryRequest {
  @ApiProperty({
    description: 'Item ID',
    required: true,
    example: 1,
  })
  @IsNumber()
  item_id: number;

  @ApiProperty({
    description: 'If the location is current',
    required: true,
    example: 1,
    default: false,
  })
  @IsBoolean()
  is_current: boolean;

  @ApiProperty({
    description: 'Location type',
    required: false,
    example: InventoryLocationType.Vault,
  })
  @IsEnum(InventoryLocationType)
  @IsOptional()
  location_type: number;

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
    example: '2',
  })
  @IsString()
  @IsOptional()
  shelf: string;

  @ApiProperty({
    description: 'Row number',
    required: false,
    example: '3',
  })
  @IsString()
  @IsOptional()
  row: string;

  @ApiProperty({
    description: 'Box number',
    required: false,
    example: '4',
  })
  @IsString()
  @IsOptional()
  box: string;

  @ApiProperty({
    description: 'Slot number',
    required: false,
    example: '5',
  })
  @IsString()
  @IsOptional()
  slot: string;

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
  shelf: string;

  @IsNumber()
  row: string;

  @IsNumber()
  box: string;

  @IsNumber()
  slot: string;

  constructor(partial: Partial<InventoryLocation>) {
    Object.assign(this, partial);
  }
}

export class UpdateInventoryRequest {
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
    example: '2',
  })
  @IsString()
  shelf: string;

  @ApiProperty({
    description: 'Row number',
    required: true,
    example: '3',
  })
  @IsString()
  row: string;

  @ApiProperty({
    description: 'Box number',
    required: true,
    example: '4',
  })
  @IsString()
  box: string;

  @ApiProperty({
    description: 'Slot number',
    required: true,
    example: '5',
    default: 0,
  })
  @IsString()
  slot: string;

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
    description: 'Item IDs',
    required: false,
    example: '1,2,3',
  })
  @IsString()
  @IsOptional()
  item_ids: string;

  @ApiProperty({
    description: 'Vault name',
    required: false,
  })
  @IsString()
  @IsOptional()
  vault: string;

  @ApiProperty({
    description: 'Zone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  zone: string;

  @ApiProperty({
    description: 'Shelf number',
    required: false,
  })
  @IsString()
  @IsOptional()
  shelf: string;

  @ApiProperty({
    description: 'Row number',
    required: false,
  })
  @IsString()
  @IsOptional()
  row: string;

  @ApiProperty({
    description: 'Box number',
    required: false,
  })
  @IsString()
  @IsOptional()
  box: string;

  @ApiProperty({
    description: 'Slot number',
    required: false,
  })
  @IsString()
  @IsOptional()
  slot: string;

  @ApiProperty({
    description: 'The offset of the query',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  offset: number;

  @ApiProperty({
    description: 'The limit of the query',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  limit: number;

  @ApiProperty({
    description: 'The order of the result by inventory id',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order: string;

  constructor(partial: Partial<ListInventoryRequest>) {
    Object.assign(this, partial);
  }
}
