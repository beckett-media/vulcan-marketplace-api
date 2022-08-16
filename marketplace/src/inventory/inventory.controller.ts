import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Get,
  UseInterceptors,
  Param,
  Query,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiResponse } from '@nestjs/swagger';
import { DetailedLogger } from '../logger/detailed.logger';
import {
  InventoryRequest,
  ListInventoryRequest,
  UpdateInventoryRequest,
} from './dtos/inventory.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseInterceptors(ClassSerializerInterceptor)
export class InventoryController {
  private readonly logger = new DetailedLogger('InventoryController', {
    timestamp: true,
  });

  constructor(private inventoryService: InventoryService) {}

  @Post('/')
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

  @Get('/:inventory_id')
  @ApiOperation({
    summary: 'Get inventory record by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Return specified inventory record',
  })
  @ApiProduces('application/json')
  async getInventory(@Param('inventory_id') inventory_id: number) {
    const inventoryDetails = await this.inventoryService.getInventory(
      inventory_id,
    );
    return inventoryDetails;
  }

  @Get('/')
  @ApiOperation({
    summary: 'List inventory records',
  })
  @ApiResponse({
    status: 200,
    description: 'Return queried inventory records',
  })
  @ApiProduces('application/json')
  async listInventory(@Body() request: ListInventoryRequest) {
    const inventoryDetails = await this.inventoryService.listInventory(request);
    return inventoryDetails;
  }

  @Put('/:inventory_id')
  @ApiOperation({
    summary: 'Update inventory record by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Return specified inventory record',
  })
  @ApiProduces('application/json')
  async updateInventory(
    @Param('inventory_id') inventory_id: number,
    @Body() updateInventoryRequest: UpdateInventoryRequest,
  ) {
    const inventoryDetails = await this.inventoryService.updateInventory(
      inventory_id,
      updateInventoryRequest,
    );
    return inventoryDetails;
  }
}
