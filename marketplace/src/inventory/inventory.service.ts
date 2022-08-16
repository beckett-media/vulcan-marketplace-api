import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { newInventoryDetails } from '../util/format';
import { DatabaseService } from '../database/database.service';
import { DetailedLogger } from '../logger/detailed.logger';
import {
  InventoryDetails,
  InventoryRequest,
  ListInventoryRequest,
  UpdateInventoryRequest,
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
    const vault = await this.databaseService.getVaultingByItemID(
      inventoryRequest.item_id,
    );
    const inventory = await this.databaseService.createNewInventory(
      inventoryRequest,
    );
    const item = await this.databaseService.getItem(inventory.item_id);
    const user = await this.databaseService.getUser(item.user);
    return newInventoryDetails(inventory, item, user, vault);
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

  async updateInventory(
    inventory_id: number,
    updateInventoryRequest: UpdateInventoryRequest,
  ): Promise<InventoryDetails> {
    const inventory = await this.databaseService.getInventory(inventory_id);
    if (inventory.item_id !== updateInventoryRequest.item_id) {
      throw new InternalServerErrorException('item_id does not match');
    }

    const newInventory = await this.databaseService.updateInventory(
      updateInventoryRequest,
    );
    const item = await this.databaseService.getItem(newInventory.item_id);
    const user = await this.databaseService.getUser(item.user);
    const vault = await this.databaseService.getVaultingByItemID(
      newInventory.item_id,
    );
    return newInventoryDetails(newInventory, item, user, vault);
  }
}
