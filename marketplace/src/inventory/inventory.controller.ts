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
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiResponse } from '@nestjs/swagger';
import { ActionLogRequest } from '../marketplace/dtos/marketplace.dto';
import { OnlyAllowGroups } from '../auth/groups.decorator';
import { GroupsGuard } from '../auth/groups.guard';
import { JwtAuthGuard } from '../auth/jwt.authguard';
import {
  ActionLogActorType,
  ActionLogEntityType,
  ActionLogType,
  Group,
} from '../config/enum';
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
  @OnlyAllowGroups(Group.Admin)
  @UseGuards(JwtAuthGuard, GroupsGuard)
  @ApiOperation({
    summary: 'Create new inventory record for submitted item',
  })
  @ApiResponse({
    status: 200,
    description: 'Return created inventory record',
  })
  @ApiProduces('application/json')
  async newInventory(
    @Body() inventoryRequest: InventoryRequest,
    @Request() request: any,
  ) {
    const inventoryDetails = await this.inventoryService.newInventory(
      inventoryRequest,
    );

    // record user action
    const actionLogRequest = new ActionLogRequest({
      actor_type: ActionLogActorType.CognitoAdmin,
      actor: request.user,
      entity_type: ActionLogEntityType.Inventory,
      entity: inventoryDetails.id.toString(),
      type: ActionLogType.NewInventory,
      extra: JSON.stringify(inventoryRequest),
    });
    await this.inventoryService.newActionLog(actionLogRequest);

    return inventoryDetails;
  }

  @Get('/:inventory_id')
  @OnlyAllowGroups(Group.Admin)
  @UseGuards(JwtAuthGuard, GroupsGuard)
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
  @OnlyAllowGroups(Group.Admin)
  @UseGuards(JwtAuthGuard, GroupsGuard)
  @ApiOperation({
    summary: 'List inventory records',
  })
  @ApiResponse({
    status: 200,
    description: 'Return queried inventory records',
  })
  @ApiProduces('application/json')
  async listInventory(@Query() listInventoryRequest: ListInventoryRequest) {
    const inventoryDetails = await this.inventoryService.listInventory(
      listInventoryRequest,
    );
    return inventoryDetails;
  }

  @Put('/:inventory_id')
  @OnlyAllowGroups(Group.Admin)
  @UseGuards(JwtAuthGuard, GroupsGuard)
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
    @Request() request: any,
  ) {
    const inventoryDetails = await this.inventoryService.updateInventory(
      inventory_id,
      updateInventoryRequest,
    );

    // record user action
    const actionLogRequest = new ActionLogRequest({
      actor_type: ActionLogActorType.CognitoAdmin,
      actor: request.user,
      entity_type: ActionLogEntityType.Inventory,
      entity: inventoryDetails.id.toString(),
      type: ActionLogType.NewInventory,
      extra: JSON.stringify(UpdateInventoryRequest),
    });
    await this.inventoryService.newActionLog(actionLogRequest);

    return inventoryDetails;
  }
}
