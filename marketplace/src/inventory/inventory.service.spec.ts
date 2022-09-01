import { CacheModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AwsService } from '../aws/aws.service';
import { BravoService } from '../bravo/bravo.service';
import {
  InventoryStatus,
  InventoryStatusReadable,
  SubmissionStatus,
} from '../config/enum';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { clearDB, closeDB, newSubmissionRequest } from '../util/testing';
import {
  ActionLog,
  Inventory,
  Item,
  Listing,
  Submission,
  SubmissionOrder,
  User,
  Vaulting,
} from '../database/database.entity';
import { DatabaseModule, GetDBConnection } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { InventoryService } from './inventory.service';
import {
  SubmissionDetails,
  SubmissionRequest,
  SubmissionUpdate,
  VaultingRequest,
  VaultingResponse,
} from '../marketplace/dtos/marketplace.dto';
import {
  InventoryRequest,
  ListInventoryRequest,
  UpdateInventoryRequest,
} from './dtos/inventory.dto';

async function mockSubmission(
  submissionRequest: SubmissionRequest,
  marketplaceService: MarketplaceService,
): Promise<SubmissionDetails> {
  // create submission
  var submission = await marketplaceService.submitItem(submissionRequest);
  const submissionUpdateApproved = new SubmissionUpdate({
    status: SubmissionStatus.Approved,
  });
  const submissionUpdateVerified = new SubmissionUpdate({
    status: SubmissionStatus.Verified,
  });
  const submissionUpdateReceived = new SubmissionUpdate({
    status: SubmissionStatus.Received,
  });
  await marketplaceService.updateSubmission(
    submission.submission_id,
    submissionUpdateReceived,
  );
  await marketplaceService.updateSubmission(
    submission.submission_id,
    submissionUpdateVerified,
  );
  await marketplaceService.updateSubmission(
    submission.submission_id,
    submissionUpdateApproved,
  );

  const submissionDetails = await marketplaceService.getSubmission(
    submission.submission_id,
  );

  return submissionDetails;
}

describe('InventoryService', () => {
  let service: InventoryService;
  let marketplaceService: MarketplaceService;

  const fakeAwsService: Partial<AwsService> = {
    uploadImage: (dataBuffer: Buffer, prefix: string, image_format: string) => {
      return Promise.resolve('fake_url');
    },
  };

  const fakeBravoService: Partial<BravoService> = {
    mintNFT: (
      owner: string,
      itemUUID: string,
      title: string,
      description: string,
      imageFormat: string,
      imagebase64: string,
      attributes: { [key: string]: any },
    ) => {
      return Promise.resolve(1);
    },
    burnNFT: (itemUUID: string, collection: string, tokenId: number) => {
      return Promise.resolve(10);
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AwsService,
          useValue: fakeAwsService,
        },
        {
          provide: BravoService,
          useValue: fakeBravoService,
        },
        InventoryService,
        DatabaseService,
        MarketplaceService,
      ],
      imports: [
        DatabaseModule,
        CacheModule.register(),
        TypeOrmModule.forRoot(GetDBConnection()),
        TypeOrmModule.forFeature([
          Submission,
          Item,
          Vaulting,
          User,
          Listing,
          ActionLog,
          Inventory,
          SubmissionOrder,
        ]),
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    marketplaceService = module.get<MarketplaceService>(MarketplaceService);

    // clear database
    await clearDB();
  });

  afterEach(async () => {
    // close database
    await closeDB();
  });

  it('should create new inventory', async () => {
    const userUUID = '00000000-0000-0000-0000-000000000001';
    var submissionRequest1 = newSubmissionRequest(
      userUUID,
      'sn1',
      true,
      '',
      true,
    );
    var submission1 = await mockSubmission(
      submissionRequest1,
      marketplaceService,
    );

    var submissionRequest2 = newSubmissionRequest(
      userUUID,
      'sn2',
      true,
      '',
      true,
    );
    var submission2 = await mockSubmission(
      submissionRequest2,
      marketplaceService,
    );

    var submissionRequest3 = newSubmissionRequest(
      userUUID,
      'sn3',
      true,
      '',
      true,
    );
    var submission3 = await mockSubmission(
      submissionRequest3,
      marketplaceService,
    );

    var inventoryRequest1 = {
      item_id: submission1.item_id,
      vault: 'dallas',
      zone: 'cabinet',
      row: '1',
      box: '2',
    };
    var inventory1 = await service.newInventory(
      new InventoryRequest(inventoryRequest1),
    );
    expect(inventory1.label).toBe(
      '[vault]:dallas-[zone]:cabinet-[shelf]:*-[row]:1-[box]:2-[slot]:*',
    );
    expect(inventory1.user).toBe(userUUID);

    var inventoryRequest2 = {
      item_id: submission2.item_id,
      vault: 'dallas',
      zone: 'cabinet',
      shelf: '1',
      row: '2',
      slot: '3',
    };
    var inventory2 = await service.newInventory(
      new InventoryRequest(inventoryRequest2),
    );
    expect(inventory2.label).toBe(
      '[vault]:dallas-[zone]:cabinet-[shelf]:1-[row]:2-[box]:*-[slot]:3',
    );

    var inventoryRequest3 = {
      item_id: submission3.item_id,
      vault: 'dallas',
      zone: 'cabinet',
      box: '1',
      row: '2',
      slot: '3',
    };
    var inventory3 = await service.newInventory(
      new InventoryRequest(inventoryRequest3),
    );
    expect(inventory3.label).toBe(
      '[vault]:dallas-[zone]:cabinet-[shelf]:*-[row]:2-[box]:1-[slot]:3',
    );

    var listInventoryRequest = new ListInventoryRequest({
      vault: 'dallas',
      order: 'ASC',
    });
    var inventories = await service.listInventory(listInventoryRequest);
    expect(inventories.length).toBe(3);
    expect(inventories[0].item_id).toBe(submission1.item_id);
    expect(inventories[1].item_id).toBe(submission2.item_id);
    expect(inventories[2].item_id).toBe(submission3.item_id);
    expect(inventories[0].user).toBe(userUUID);
    expect(inventories[1].user).toBe(userUUID);
    expect(inventories[2].user).toBe(userUUID);
    expect(inventories[0].status).toBe(InventoryStatus.IsCurrent);
    expect(inventories[1].status).toBe(InventoryStatus.IsCurrent);
    expect(inventories[2].status).toBe(InventoryStatus.IsCurrent);

    listInventoryRequest = new ListInventoryRequest({
      box: '1',
    });
    inventories = await service.listInventory(listInventoryRequest);
    expect(inventories.length).toBe(1);
    listInventoryRequest = new ListInventoryRequest({
      slot: '3',
    });
    inventories = await service.listInventory(listInventoryRequest);
    expect(inventories.length).toBe(2);

    listInventoryRequest = new ListInventoryRequest({
      item_ids: submission2.item_id + ',' + submission3.item_id,
    });
    inventories = await service.listInventory(listInventoryRequest);
    expect(inventories.length).toBe(2);
    expect(inventories[0].item_id).toBe(submission2.item_id);
    expect(inventories[0].status).toBe(InventoryStatus.IsCurrent);
    expect(inventories[1].item_id).toBe(submission3.item_id);
    expect(inventories[1].status).toBe(InventoryStatus.IsCurrent);
  });

  it('should update inventory', async () => {
    const userUUID = '00000000-0000-0000-0000-000000000001';
    var submissionRequest = newSubmissionRequest(
      userUUID,
      'sn1',
      true,
      '',
      true,
    );
    var vaulting = await mockSubmission(submissionRequest, marketplaceService);
    var inventoryRequest = {
      item_id: vaulting.item_id,
      vault: 'dallas',
      zone: 'cabinet 1',
      box: '1 ',
      row: ' 2',
      slot: ' 3 ',
      note: 'this is a note',
    };
    var inventory = await service.newInventory(
      new InventoryRequest(inventoryRequest),
    );
    expect(inventory.label).toBe(
      '[vault]:dallas-[zone]:cabinet 1-[shelf]:*-[row]:2-[box]:1-[slot]:3',
    );
    expect(inventory.status).toBe(InventoryStatus.IsCurrent);
    expect(inventory.updated_at).toBe(0);
    expect(inventory.note).toBe(inventoryRequest.note);

    var updateInventoryRequest = new UpdateInventoryRequest({
      status: InventoryStatus.IsCurrent,
    });
    var updatedInventory = await service.updateInventory(
      inventory.id,
      updateInventoryRequest,
    );
    // label does not change
    expect(updatedInventory.label).toBe(
      '[vault]:dallas-[zone]:cabinet 1-[shelf]:*-[row]:2-[box]:1-[slot]:3',
    );
    expect(updatedInventory.updated_at).toBeGreaterThan(0);
    expect(updatedInventory.note).toBe(inventoryRequest.note);
    expect(updatedInventory.status).toBe(InventoryStatus.IsCurrent);

    // second inventory
    inventoryRequest = {
      item_id: vaulting.item_id,
      vault: 'dallas',
      zone: 'cabinet 1',
      box: '11',
      row: '2',
      slot: '3',
      note: 'this is a note',
    };
    const inventory2 = await service.newInventory(
      new InventoryRequest(inventoryRequest),
    );
    // different label, same item_id
    expect(inventory2.label).not.toBe(updatedInventory.label);
    expect(inventory2.item_id).toEqual(inventory.item_id);
    expect(inventory2.status).toBe(InventoryStatus.IsCurrent);

    // the first inventory is not current anymore
    inventory = await service.getInventory(inventory.id);
    expect(inventory.status).toBe(InventoryStatus.NotCurrent);
    expect(inventory.item_id).toBe(inventory2.item_id);

    // list the inventories for the item
    const listInventoryRequest = new ListInventoryRequest({
      item_ids: `${inventory.item_id}`,
    });
    var inventories = await service.listInventory(listInventoryRequest);
    expect(inventories.length).toBe(2);
    expect(inventories[0].item_id).toBe(inventories[1].item_id);
    expect(inventories[0].status).toBe(InventoryStatus.NotCurrent);
    expect(inventories[1].status).toBe(InventoryStatus.IsCurrent);

    // move the item back to the first inventory
    updateInventoryRequest = new UpdateInventoryRequest({
      status: InventoryStatus.IsCurrent,
    });
    await service.updateInventory(inventory.id, updateInventoryRequest);
    inventories = await service.listInventory(listInventoryRequest);
    expect(inventories.length).toBe(2);
    expect(inventories[0].item_id).toBe(inventories[1].item_id);
    expect(inventories[0].status).toBe(InventoryStatus.IsCurrent);
    expect(inventories[1].status).toBe(InventoryStatus.NotCurrent);
  });

  it('should allow double occupancy for the same location or item', async () => {
    const userUUID = '00000000-0000-0000-0000-000000000001';
    var submissionRequest = newSubmissionRequest(
      userUUID,
      'sn1',
      true,
      '',
      true,
    );
    var vaulting = await mockSubmission(submissionRequest, marketplaceService);
    var inventoryRequest = {
      item_id: vaulting.item_id,
      vault: 'dallas',
      zone: 'cabinet',
      box: '1',
      row: '2',
      slot: '3',
    };
    var inventory1 = await service.newInventory(
      new InventoryRequest(inventoryRequest),
    );

    // one item can have multiple inventories
    var inventoryRequest = {
      item_id: vaulting.item_id,
      vault: 'dallas',
      zone: 'cabinet',
      box: '11',
      row: '2',
      slot: '3',
    };
    var inventory2 = await service.newInventory(
      new InventoryRequest(inventoryRequest),
    );
    expect(inventory2.label).not.toBe(inventory1.label);
    expect(inventory2.item_id).toBe(inventory1.item_id);

    // one inventory location can have multiple items
    submissionRequest = newSubmissionRequest(userUUID, 'sn2', true, '', true);
    var vaulting = await mockSubmission(submissionRequest, marketplaceService);
    var inventoryRequest = {
      item_id: vaulting.item_id,
      vault: 'dallas',
      zone: 'cabinet',
      box: '1',
      row: '2',
      slot: '3',
    };
    var inventory3 = await service.newInventory(
      new InventoryRequest(inventoryRequest),
    );
    expect(inventory3.label).toBe(inventory1.label);
    expect(inventory3.item_id).not.toBe(inventory1.item_id);
  });

  it('should delete inventory and not shown again', async () => {
    // create new inventory
    const userUUID = '00000000-0000-0000-0000-000000000001';
    var submissionRequest = newSubmissionRequest(
      userUUID,
      'sn1',
      true,
      '',
      true,
    );
    var vaulting = await mockSubmission(submissionRequest, marketplaceService);
    var inventoryRequest = {
      item_id: vaulting.item_id,
      vault: 'dallas',
      zone: 'cabinet 1',
      box: '1',
      row: '2',
      slot: '3',
    };
    var inventory1 = await service.newInventory(
      new InventoryRequest(inventoryRequest),
    );
    var inventoryRequest2 = {
      item_id: vaulting.item_id,
      vault: 'dallas',
      zone: 'cabinet 2',
      box: '11',
      row: '22',
      slot: '33',
    };
    var inventory2 = await service.newInventory(
      new InventoryRequest(inventoryRequest2),
    );

    // update inventory 2 to be current
    var updateInventoryRequest = new UpdateInventoryRequest({
      status: InventoryStatus.IsCurrent,
    });
    var updatedInventory = await service.updateInventory(
      inventory2.id,
      updateInventoryRequest,
    );

    // list the inventories for the item
    const listInventoryRequest = new ListInventoryRequest({
      item_ids: `${inventory1.item_id}`,
    });
    var inventories = await service.listInventory(listInventoryRequest);
    expect(inventories.length).toBe(2);
    expect(inventories[0].item_id).toBe(inventories[1].item_id);
    expect(inventories[0].status).toBe(InventoryStatus.NotCurrent);
    expect(inventories[1].status).toBe(InventoryStatus.IsCurrent);

    // delete inventory 1
    await service.deleteInventory(inventory1.id);

    // list the inventories for the item again
    var inventories = await service.listInventory(listInventoryRequest);
    expect(inventories.length).toBe(2);
    expect(inventories[0].id).toBe(inventory1.id);
    expect(inventories[0].status).toBe(InventoryStatus.Deprecated);
    expect(inventories[1].id).toBe(inventory2.id);
    expect(inventories[1].status).toBe(InventoryStatus.IsCurrent);

    // query inventory 1 should fail
    await expect(service.getInventory(inventory1.id)).rejects.toThrow(
      `Inventory with id ${inventory1.id} not found`,
    );

    // query inventory 2 should succeed
    inventory2 = await service.getInventory(inventory2.id);

    // delete inventory 2 should fail
    await expect(service.deleteInventory(inventory2.id)).rejects.toThrow(
      `Inventory with id ${inventory2.id} is currently in use`,
    );
  });
});
