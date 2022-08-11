import { Test, TestingModule } from '@nestjs/testing';
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
import { DatabaseService } from '../database/database.service';
import {
  ListingStatus,
  ListingStatusReadable,
  SubmissionOrderStatus,
  SubmissionStatus,
  SubmissionStatusReadable,
  SubmissionUpdateType,
  VaultingStatus,
  VaultingStatusReadable,
  VaultingUpdateType,
} from '../config/enum';
import { MarketplaceService } from './marketplace.service';
import { AwsService } from '../aws/aws.service';
import { BravoService } from '../bravo/bravo.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule, GetDBConnection } from '../database/database.module';
import {
  clearDB,
  imageBaseball,
  imageBlackBox,
  newSubmissionRequest,
  newVaultingUpdateRequest,
} from '../util/testing';
import {
  ListingRequest,
  ListingUpdate,
  SubmissionOrderUpdate,
  SubmissionUpdate,
} from './dtos/marketplace.dto';
import { CacheModule } from '@nestjs/common';

describe('MarketplaceService', () => {
  let service: MarketplaceService;

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

    service = module.get<MarketplaceService>(MarketplaceService);

    // clear database
    await clearDB();
  });

  it('should create new submission', async () => {
    // create submission
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(userUUID, 'sn1', true, '');
    const submission = await service.submitItem(submissionRequest);
    expect(submission).toBeDefined();
    expect(submission.user).toBe(userUUID);
    expect(submission.status).toBe(SubmissionStatus.Submitted);

    // list submission
    var status, limit, offset, order;
    const submissions = await service.listSubmissions(
      userUUID,
      status,
      offset,
      limit,
      order,
    );
    expect(submissions.length).toBe(1);
    expect(submissions[0].id).toBe(submission.submission_id);
    expect(submissions[0].status).toBe(SubmissionStatus.Submitted);
    expect(submissions[0].user).toBe(userUUID);
    expect(submissions[0].grading_company).toBe('fake grading_company');
    expect(submissions[0].image_url).toBe('fake_url');
  });

  it('should not approve if submission not received', async () => {
    // create submission
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(userUUID, 'sn1', true, '');
    const submission = await service.submitItem(submissionRequest);
    const submissionUpdateApproved = new SubmissionUpdate({
      type: SubmissionUpdateType.Status,
      status: SubmissionStatus.Approved,
    });

    // approve submission should fail
    await expect(
      service.updateSubmission(
        submission.submission_id,
        submissionUpdateApproved,
      ),
    ).rejects.toThrow(
      `Submission ${submission.submission_id} is not received yet. Cannot approve.`,
    );

    const submissionUpdateReceived = new SubmissionUpdate({
      type: SubmissionUpdateType.Status,
      status: SubmissionStatus.Received,
    });
    // first update submission to be received
    await service.updateSubmission(
      submission.submission_id,
      submissionUpdateReceived,
    );

    // approve submission should succeed
    const submissionDetails = await service.updateSubmission(
      submission.submission_id,
      submissionUpdateApproved,
    );
    expect(submissionDetails.status).toBe(SubmissionStatus.Approved);
    expect(submissionDetails.approved_at).toBeDefined();
    expect(submissionDetails.id).toBe(submission.submission_id);
  });

  it('should update submission order status', async () => {
    // create submission
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(userUUID, 'sn1', false, '');
    const submission = await service.submitItem(submissionRequest);

    // update submission order status
    const submissionOrderDetails = await service.updateSubmissionOrder(
      submission.order_id,
      SubmissionOrderStatus.Processed,
    );

    // get updated submission order
    const submissionOrder = await service.getSubmissionOrder(
      submission.order_id,
    );
    expect(submissionOrder.status).toBe(SubmissionOrderStatus.Processed);
  });

  it('should update submission image', async () => {
    // create submission
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(userUUID, 'sn1', false, '');
    const submission = await service.submitItem(submissionRequest);
    const submissionDetailsBefore = await service.getSubmission(
      submission.submission_id,
    );
    expect(submissionDetailsBefore.image_url).toBe('');
    expect(submissionDetailsBefore.image_rev_url).toBe('');

    // update submission image
    const submissionUpdate = new SubmissionUpdate({
      type: SubmissionUpdateType.Image,
      image_base64: imageBaseball,
      image_format: 'jpg',
    });

    // update submission image
    const submissionDetails = await service.updateSubmission(
      submission.submission_id,
      submissionUpdate,
    );
    expect(submissionDetails.image_url).toBe('fake_url');
    expect(submissionDetails.image_rev_url).toBe('');

    const submissionUpdateRev = new SubmissionUpdate({
      type: SubmissionUpdateType.Image,
      image_rev_base64: imageBlackBox,
      image_rev_format: 'jpg',
    });

    // update submission image
    const submissionDetailsRev = await service.updateSubmission(
      submission.submission_id,
      submissionUpdateRev,
    );
    expect(submissionDetailsRev.image_url).toBe('fake_url');
    expect(submissionDetailsRev.image_rev_url).toBe('fake_url');
  });

  it('should create new vaulting and update existing ones', async () => {
    // create submission
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(userUUID, 'sn1', true, '');
    const submission = await service.submitItem(submissionRequest);
    const submissionUpdateApproved = new SubmissionUpdate({
      type: SubmissionUpdateType.Status,
      status: SubmissionStatus.Approved,
    });
    const submissionUpdateReceived = new SubmissionUpdate({
      type: SubmissionUpdateType.Status,
      status: SubmissionStatus.Received,
    });
    await expect(
      service.updateSubmission(
        submission.submission_id,
        submissionUpdateApproved,
      ),
    ).rejects.toThrow(
      `Submission ${submission.submission_id} is not received yet. Cannot approve.`,
    );
    await service.updateSubmission(
      submission.submission_id,
      submissionUpdateReceived,
    );
    await service.updateSubmission(
      submission.submission_id,
      submissionUpdateApproved,
    );
    await expect(
      service.updateSubmission(
        submission.submission_id,
        submissionUpdateApproved,
      ),
    ).rejects.toThrow(
      `Submission ${submission.submission_id} already has status ${
        SubmissionStatusReadable[SubmissionStatus.Approved]
      }`,
    );

    // create vaulting
    const vaultingRequest = {
      item_id: submission.item_id,
      user: userUUID,
      submission_id: submission.submission_id,
      image_base64: 'fake_base64',
      image_format: 'fake_format',
    };
    const vaulting = await service.newVaulting(vaultingRequest);
    expect(vaulting).toBeDefined();
    expect(vaulting.item_id).toBe(submission.item_id);
    expect(vaulting.user).toBe(userUUID);
    expect(vaulting.status).toBe(1);
    expect(vaulting.status_desc).toBe('Minting');

    // list vaultings
    var status, limit, offset, order;
    const vaultings = await service.listVaultings(
      userUUID,
      offset,
      limit,
      order,
    );
    expect(vaultings.length).toBe(1);
    expect(vaultings[0].id).toBe(vaulting.id);
    expect(vaultings[0].item_id).toBe(submission.item_id);
    expect(vaultings[0].user).toBe(userUUID);

    // before callback, the blockchain related data should be empty
    expect(vaultings[0].collection).toBe('');
    expect(vaultings[0].token_id).toBe(0);

    // generate vaulting update for minting
    const vaultingUpdate = newVaultingUpdateRequest(
      VaultingUpdateType.Minted,
      vaultings[0].item_uuid,
    );
    await service.updateVaulting(vaultingUpdate);

    // list a single vaulting
    const vaultingDetails = await service.getVaulting(vaulting.id);
    expect(vaultingDetails.id).toBe(vaulting.id);
    expect(vaultingDetails.collection).toBe(vaultingUpdate.collection);
    expect(vaultingDetails.token_id).toBe(1234);
    expect(vaultingDetails.mint_tx_hash).toBe(vaultingUpdate.mint_tx_hash);
    expect(vaultingDetails.minted_at).toBeDefined();
    expect(vaultingDetails.status).toBe(VaultingStatus.Minted);
    expect(vaultingDetails.status_desc).toBe(
      VaultingStatusReadable[VaultingStatus.Minted],
    );

    //  burn tx hash should still be empty
    expect(vaultingDetails.burn_tx_hash).toBe('');
    expect(vaultingDetails.burned_at).toBe(0);

    // generate vaulting update for burning
    const burningVaultingUpdate = newVaultingUpdateRequest(
      VaultingUpdateType.Burned,
      vaultings[0].item_uuid,
    );
    await service.updateVaulting(burningVaultingUpdate);

    // list a single vaulting
    const vaultingDetails2 = await service.getVaulting(vaulting.id);
    expect(vaultingDetails2.id).toBe(vaulting.id);
    expect(vaultingDetails2.collection).toBe(vaultingUpdate.collection);
    expect(vaultingDetails2.token_id).toBe(1234);
    expect(vaultingDetails2.burn_tx_hash).toBe(vaultingUpdate.burn_tx_hash);
    expect(vaultingDetails2.burned_at).toBeDefined();
    expect(vaultingDetails2.status).toBe(VaultingStatus.Withdrawn);
    expect(vaultingDetails2.status_desc).toBe(
      VaultingStatusReadable[VaultingStatus.Withdrawn],
    );
  });

  it('should create new listing', async () => {
    // create submission
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(userUUID, 'sn1', true, '');
    const submissionResponse = await service.submitItem(submissionRequest);
    const submission = await service.getSubmission(
      submissionResponse.submission_id,
    );
    const submissionUpdateApproved = new SubmissionUpdate({
      type: SubmissionUpdateType.Status,
      status: SubmissionStatus.Approved,
    });
    const submissionUpdateReceived = new SubmissionUpdate({
      type: SubmissionUpdateType.Status,
      status: SubmissionStatus.Received,
    });
    await service.updateSubmission(submission.id, submissionUpdateReceived);
    await service.updateSubmission(submission.id, submissionUpdateApproved);

    // create vaulting
    const vaultingRequest = {
      item_id: submission.item_id,
      user: userUUID,
      submission_id: submission.id,
      image_base64: 'fake_base64',
      image_format: 'fake_format',
    };
    const vaulting = await service.newVaulting(vaultingRequest);
    expect(vaulting).toBeDefined();
    expect(vaulting.item_id).toBe(submission.item_id);
    expect(vaulting.item_id).toBeDefined();
    expect(vaulting.item_uuid).toBe(submission.item_uuid);
    expect(vaulting.item_uuid).toBeDefined();
    expect(vaulting.user).toBe(userUUID);
    expect(vaulting.status).toBe(1);
    expect(vaulting.status_desc).toBe('Minting');

    // create new listing
    const listingRequest = new ListingRequest({
      vaulting_id: vaulting.id,
      user: userUUID,
      price: 12345,
    });

    // vaulting object need to be of minted status before listing
    await expect(service.newListing(listingRequest)).rejects.toThrow(
      `Vaulting not found for ${vaulting.id} (either not minted or withdrawn already)`,
    );

    // update vaulting to be minted
    const vaultingUpdate = newVaultingUpdateRequest(
      VaultingUpdateType.Minted,
      vaulting.item_uuid,
    );
    await service.updateVaulting(vaultingUpdate);

    // list the vaulting again
    const listing = await service.newListing(listingRequest);
    expect(listing).toBeDefined();
    expect(listing.vaulting_id).toBe(vaulting.id);
    expect(listing.user).toBe(userUUID);
    expect(listing.price).toBe(12345);
    expect(listing.status).toBe(ListingStatus.Listed);
    expect(listing.status_desc).toBe(
      ListingStatusReadable[ListingStatus.Listed],
    );

    // can not withdraw the vaulting if listing is active
    await expect(service.withdrawVaulting(vaulting.id)).rejects.toThrow(
      `Vaulting ${vaulting.id} has an active listing ${listing.id}. No withdrawal allowed.`,
    );
  });

  it('should update listing price', async () => {
    // create submission
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(userUUID, 'sn1', true, '');
    const submissionResponse = await service.submitItem(submissionRequest);
    const submission = await service.getSubmission(
      submissionResponse.submission_id,
    );
    const submissionUpdateApproved = new SubmissionUpdate({
      type: SubmissionUpdateType.Status,
      status: SubmissionStatus.Approved,
    });
    const submissionUpdateReceived = new SubmissionUpdate({
      type: SubmissionUpdateType.Status,
      status: SubmissionStatus.Received,
    });
    await service.updateSubmission(submission.id, submissionUpdateReceived);
    await service.updateSubmission(submission.id, submissionUpdateApproved);

    // create vaulting
    const vaultingRequest = {
      item_id: submission.item_id,
      user: userUUID,
      submission_id: submission.id,
      image_base64: 'fake_base64',
      image_format: 'fake_format',
    };
    const vaulting = await service.newVaulting(vaultingRequest);
    expect(vaulting).toBeDefined();
    expect(vaulting.item_id).toBe(submission.item_id);
    expect(vaulting.item_id).toBeDefined();
    expect(vaulting.item_uuid).toBe(submission.item_uuid);
    expect(vaulting.item_uuid).toBeDefined();
    expect(vaulting.user).toBe(userUUID);
    expect(vaulting.status).toBe(1);
    expect(vaulting.status_desc).toBe('Minting');

    // create new listing
    const listingRequest = new ListingRequest({
      vaulting_id: vaulting.id,
      user: userUUID,
      price: 12345,
    });

    // vaulting object need to be of minted status before listing
    await expect(service.newListing(listingRequest)).rejects.toThrow(
      `Vaulting not found for ${vaulting.id} (either not minted or withdrawn already)`,
    );

    // update vaulting to be minted
    const vaultingUpdate = newVaultingUpdateRequest(
      VaultingUpdateType.Minted,
      vaulting.item_uuid,
    );
    await service.updateVaulting(vaultingUpdate);

    // list the vaulting again
    const listing = await service.newListing(listingRequest);
    expect(listing).toBeDefined();
    expect(listing.vaulting_id).toBe(vaulting.id);
    expect(listing.user).toBe(userUUID);
    expect(listing.price).toBe(12345);
    expect(listing.status).toBe(ListingStatus.Listed);
    expect(listing.status_desc).toBe(
      ListingStatusReadable[ListingStatus.Listed],
    );

    // update listing price
    const newPrice = 123456;
    const listingUpdate = new ListingUpdate({ price: newPrice });
    const updatedListing = await service.updateListing(
      listing.id,
      listingUpdate,
    );
    expect(updatedListing).toBeDefined();
    expect(updatedListing.id).toBe(listing.id);
    expect(updatedListing.price).toBe(newPrice);
    expect(updatedListing.status).toBe(ListingStatus.Listed);
    expect(updatedListing.created_at).toBeDefined();
    expect(updatedListing.updated_at).toBeDefined();
  });
});
