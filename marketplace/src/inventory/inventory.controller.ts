import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiResponse } from '@nestjs/swagger';
import { DetailedLogger } from '../logger/detailed.logger';
import { InventoryRequest } from './dtos/inventory.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseInterceptors(ClassSerializerInterceptor)
export class InventoryController {
  private readonly logger = new DetailedLogger('InventoryController', {
    timestamp: true,
  });

  constructor(private inventoryService: InventoryService) {}

  @Post('')
  @ApiOperation({
    summary: 'Create new inventory record for submitted item',
  })
  @ApiResponse({
    status: 200,
    description: 'Return created inventory record',
  })
  @ApiProduces('application/json')
  async newInventory(@Body() inventoryRequest: InventoryRequest) {
    const inventoryDetails = await this.inventoryService.newInventory(
      inventoryRequest,
    );
    return inventoryDetails;
  }
}
