import { CacheModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AwsService } from '../aws/aws.service';
import { BravoService } from '../bravo/bravo.service';
import { SubmissionStatus } from '../config/enum';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { clearDB, newSubmissionRequest } from '../util/testing';
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
  const submissionUpdateReceived = new SubmissionUpdate({
    status: SubmissionStatus.Received,
  });
  await marketplaceService.updateSubmission(
    submission.submission_id,
    submissionUpdateReceived,
  );
  await marketplaceService.updateSubmission(
    submission.submission_id,
    submissionUpdateApproved,
  );

  const submissionDetails = await marketplaceService.getSubmission(submission.submission_id);

  return submissionDetails;
}

describe('InventoryService', () => {
  let service: InventoryService;
  let marketplaceService: MarketplaceService;

  const fakeAwsService: Partial<AwsService> = {
    uploadItemImage: (
      dataBuffer: Buffer,
      prefix: string,
      image_format: string,
    ) => {
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

  it('should create new inventory', async () => {
    const userUUID = '00000000-0000-0000-0000-000000000001';
    var submissionRequest1 = newSubmissionRequest(
      userUUID,
      'sn1',
      true,
      '',
      true,
    );
    var submission1 = await mockSubmission(submissionRequest1, marketplaceService);

    var submissionRequest2 = newSubmissionRequest(
      userUUID,
      'sn2',
      true,
      '',
      true,
    );
    var submission2 = await mockSubmission(submissionRequest2, marketplaceService);

    var submissionRequest3 = newSubmissionRequest(
      userUUID,
      'sn3',
      true,
      '',
      true,
    );
    var submission3 = await mockSubmission(submissionRequest3, marketplaceService);

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
    expect(inventories[1].item_id).toBe(submission3.item_id);
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
    expect(inventory.updated_at).toBe(0);
    expect(inventory.note).toBe(inventoryRequest.note);

    var updateInventoryRequest = new UpdateInventoryRequest({
      shelf: ' 99',
      slot: '100 ',
    });
    var updatedInventory = await service.updateInventory(
      inventory.id,
      updateInventoryRequest,
    );
    expect(updatedInventory.label).toBe(
      '[vault]:dallas-[zone]:cabinet 1-[shelf]:99-[row]:2-[box]:1-[slot]:100',
    );
    expect(updatedInventory.updated_at).toBeGreaterThan(0);
    expect(updatedInventory.note).toBe(inventoryRequest.note);

    // second inventory, we allow two items with the same label
    submissionRequest = newSubmissionRequest(userUUID, 'sn1', true, '', true);
    const vaulting2 = await mockSubmission(submissionRequest, marketplaceService);
    expect(vaulting2.item_id).not.toBe(vaulting.item_id);
    inventoryRequest = {
      item_id: vaulting2.item_id,
      vault: 'dallas',
      zone: 'cabinet 1',
      box: '1',
      row: '2',
      slot: '3',
      note: 'this is a note',
    };
    const inventory2 = await service.newInventory(
      new InventoryRequest(inventoryRequest),
    );
    updateInventoryRequest = new UpdateInventoryRequest({
      shelf: '99',
      slot: '100',
    });
    // expect error
    const updatedInventory2 = await service.updateInventory(
      inventory2.id,
      updateInventoryRequest,
    );
    // same label, different item_id
    expect(updatedInventory2.label).toBe(updatedInventory.label);
    expect(updatedInventory2.item_id).not.toEqual(inventory.item_id);
  });

  it('should fail inventory creation', async () => {
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
    var inventory = await service.newInventory(
      new InventoryRequest(inventoryRequest),
    );

    // duplicated inventory not allowed
    var inventoryRequest = {
      item_id: vaulting.item_id,
      vault: 'dallas',
      zone: 'cabinet',
      box: '11',
      row: '2',
      slot: '3',
    };
    await expect(
      service.newInventory(new InventoryRequest(inventoryRequest)),
    ).rejects.toThrow(
      `Item ${vaulting.item_id} is already in inventory: [vault]:dallas-[zone]:cabinet-[shelf]:*-[row]:2-[box]:1-[slot]:3`,
    );

    // double occupacy inventory not allowed
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
    await expect(
      service.newInventory(new InventoryRequest(inventoryRequest)),
    ).rejects.toThrow(
      'Inventory slot [vault]:dallas-[zone]:cabinet-[shelf]:*-[row]:2-[box]:1-[slot]:3 is already occupied',
    );
  });
});
