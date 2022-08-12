import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { newInventoryDetails } from '../util/format';
import { DatabaseService } from '../database/database.service';
import { DetailedLogger } from '../logger/detailed.logger';
import {
  InventoryDetails,
  InventoryRequest,
  ListInventoryRequest,
} from './dtos/inventory.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new DetailedLogger('InventoryService', {
    timestamp: true,
  });

  constructor(
    private databaseService: DatabaseService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async newInventory(
    inventoryRequest: InventoryRequest,
  ): Promise<InventoryDetails> {
    const inventory = await this.databaseService.createNewInventory(
      inventoryRequest,
    );
    return new InventoryDetails({});
  }

  async listInventory(
    ListInventoryRequest: ListInventoryRequest,
  ): Promise<InventoryDetails[]> {
    const inventories = await this.databaseService.listInventory(
      ListInventoryRequest,
    );
    return [];
  }

  async getInventory(inventory_id: number): Promise<InventoryDetails> {
    const inventory = await this.databaseService.getInventory(inventory_id);
    const item = await this.databaseService.getItem(inventory.item_id);
    const user = await this.databaseService.getUser(item.user);
    const vault = await this.databaseService.getVaultingByItemID(
      inventory.item_id,
    );

    return newInventoryDetails(inventory, item, user, vault);
  }
}
