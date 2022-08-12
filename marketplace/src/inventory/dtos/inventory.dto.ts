import { IsString, IsNumber, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
    required: true,
    example: 2,
    default: 0,
  })
  @IsNumber()
  shelf: number;

  @ApiProperty({
    description: 'Box number',
    required: true,
    example: 3,
    default: 0,
  })
  @IsNumber()
  box: number;

  @ApiProperty({
    description: 'Box row number',
    required: true,
    example: 4,
    default: 0,
  })
  @IsNumber()
  box_row: number;

  @ApiProperty({
    description: 'Gallery row number',
    required: true,
    example: 5,
    default: 0,
  })
  @IsNumber()
  gallery_row: number;

  @ApiProperty({
    description: 'Gallery position',
    required: true,
    example: 6,
    default: 0,
  })
  @IsNumber()
  gallery_position: number;
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
    description: 'Box number',
    required: true,
    example: 3,
    default: 0,
  })
  @IsNumber()
  box: number;

  @ApiProperty({
    description: 'Box row number',
    required: true,
    example: 4,
    default: 0,
  })
  @IsNumber()
  box_row: number;

  @ApiProperty({
    description: 'Gallery row number',
    required: true,
    example: 5,
    default: 0,
  })
  @IsNumber()
  gallery_row: number;

  @ApiProperty({
    description: 'Gallery position',
    required: true,
    example: 6,
    default: 0,
  })
  @IsNumber()
  gallery_position: number;

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
