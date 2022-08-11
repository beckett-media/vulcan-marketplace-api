import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { DatabaseService } from '../database/database.service';
import { DetailedLogger } from '../logger/detailed.logger';
import { InventoryDetails, InventoryRequest } from './dtos/inventory.dto';

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
}
