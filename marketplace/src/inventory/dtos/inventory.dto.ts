import { IsString, IsNumber, MinLength } from 'class-validator';
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

  constructor(partial: Partial<InventoryDetails>) {
    Object.assign(this, partial);
  }
}
