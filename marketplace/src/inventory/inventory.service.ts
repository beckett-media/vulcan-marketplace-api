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
    // get all the items for the inventories
    const itemIDs = inventories.map((inventory) => inventory.item_id);
    const items = await this.databaseService.listItems(itemIDs);
    // get all the users for the items
    const userIDs = items.map((item) => item.user);
    const users = await this.databaseService.listUsers(userIDs);
    // get all the vaultings for the items
    const vaultings = await this.databaseService.getVaultingsByItemIDs(itemIDs);

    // build map from item id to item
    const itemMap = items.reduce((map, item) => {
      map[item.id] = item;
      return map;
    }, {});
    // build map from user id to user
    const userMap = users.reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {});
    // build map from item id to vaulting
    const vaultMap = vaultings.reduce((map, vaulting) => {
      map[vaulting.item_id] = vaulting;
      return map;
    }, {});

    return inventories.map((inventory) => {
      const item = itemMap[inventory.item_id];
      const user = userMap[item.user];
      const vault = vaultMap[inventory.item_id];
      return newInventoryDetails(inventory, item, user, vault);
    });
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
    const newInventory = await this.databaseService.updateInventory(
      inventory_id,
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
