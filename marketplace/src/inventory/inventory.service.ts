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
import {
  ActionLogDetails,
  ActionLogRequest,
} from '../marketplace/dtos/marketplace.dto';
import {
  ActionLogActorType,
  ActionLogActorTypeReadable,
  ActionLogEntityType,
  ActionLogEntityTypeReadable,
  ActionLogType,
  ActionLogTypeReadable,
} from '../config/enum';
import { Inventory } from '../database/database.entity';
import { DeleteQueryBuilder } from 'typeorm';

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
    const submission = await this.databaseService.getSubmissionByItem(
      inventoryRequest.item_id,
    );
    const inventory = await this.databaseService.createNewInventory(
      inventoryRequest,
    );

    const item = await this.databaseService.getItem(inventory.item_id);
    const user = await this.databaseService.getUser(item.user);
    return newInventoryDetails(inventory, item, user, submission);
  }

  async deleteInventory(inventory_id: number) {
    await this.databaseService.deleteInventory(inventory_id);
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
    const submissions = await this.databaseService.listSubmissionsByItemIds(
      itemIDs,
    );

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
    // build map from item id to submission
    const submissionMap = submissions.reduce((map, submission) => {
      map[submission.item_id] = submission;
      return map;
    }, {});

    return inventories.map((inventory) => {
      const item = itemMap[inventory.item_id];
      const user = userMap[item.user];
      const submission = submissionMap[inventory.item_id];
      return newInventoryDetails(inventory, item, user, submission);
    });
  }

  async getInventory(inventory_id: number): Promise<InventoryDetails> {
    const inventory = await this.databaseService.getInventory(inventory_id);
    const item = await this.databaseService.getItem(inventory.item_id);
    const user = await this.databaseService.getUser(item.user);
    const submission = await this.databaseService.getSubmissionByItem(
      inventory.item_id,
    );

    return newInventoryDetails(inventory, item, user, submission);
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
    const submission = await this.databaseService.getSubmissionByItem(
      newInventory.item_id,
    );
    return newInventoryDetails(newInventory, item, user, submission);
  }

  // create new action log
  async newActionLog(request: ActionLogRequest): Promise<ActionLogDetails> {
    // create new action log
    const actionLog = await this.databaseService.createNewActionLog(request);
    // return new action log details
    return new ActionLogDetails({
      id: actionLog.id,
      type: actionLog.type,
      type_desc: ActionLogTypeReadable[actionLog.type],
      actor: actionLog.actor,
      actor_type_desc: ActionLogActorTypeReadable[actionLog.actor_type],
      entity: actionLog.entity,
      entity_type_desc: ActionLogEntityTypeReadable[actionLog.entity_type],
      created_at: actionLog.created_at,
      extra: actionLog.extra,
    });
  }
}
