import { Test, TestingModule } from '@nestjs/testing';
import {
  ActionLog,
  Item,
  Listing,
  Submission,
  User,
  Vaulting,
} from '../database/database.entity';
import { DatabaseService } from '../database/database.service';
import {
  ListingStatus,
  ListingStatusReadable,
  SubmissionStatus,
  SubmissionStatusReadable,
  VaultingStatus,
  VaultingStatusReadable,
  VaultingUpdateType,
} from '../config/enum';
import { MarketplaceService } from './marketplace.service';
import { AwsService } from '../aws/aws.service';
import { BravoService } from '../bravo/bravo.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetDBConnection } from '../database/database.module';
import {
  clearDB,
  newSubmissionRequest,
  newVaultingUpdateRequest,
} from '../util/testing';
import { ListingRequest } from './dtos/marketplace.dto';

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
        TypeOrmModule.forRoot(GetDBConnection()),
        TypeOrmModule.forFeature([
          Submission,
          Item,
          Vaulting,
          User,
          Listing,
          ActionLog,
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
    const submissionRequest = newSubmissionRequest(userUUID, 'sn1');
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
    const submissionRequest = newSubmissionRequest(userUUID, 'sn1');
    const submission = await service.submitItem(submissionRequest);

    // approve submission should fail
    await expect(
      service.updateSubmission(
        submission.submission_id,
        SubmissionStatus.Approved,
      ),
    ).rejects.toThrow(
      `Submission ${submission.submission_id} is not received yet. Cannot approve.`,
    );

    // first update submission to be received
    await service.updateSubmission(
      submission.submission_id,
      SubmissionStatus.Received,
    );

    // approve submission should succeed
    const submissionDetails = await service.updateSubmission(
      submission.submission_id,
      SubmissionStatus.Approved,
    );
    expect(submissionDetails.status).toBe(SubmissionStatus.Approved);
    expect(submissionDetails.approved_at).toBeDefined();
    expect(submissionDetails.id).toBe(submission.submission_id);
  });

  it('should create new vaulting and update existing ones', async () => {
    // create submission
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(userUUID, 'sn1');
    const submission = await service.submitItem(submissionRequest);
    await expect(
      service.updateSubmission(
        submission.submission_id,
        SubmissionStatus.Approved,
      ),
    ).rejects.toThrow(
      `Submission ${submission.submission_id} is not received yet. Cannot approve.`,
    );
    await service.updateSubmission(
      submission.submission_id,
      SubmissionStatus.Received,
    );
    await service.updateSubmission(
      submission.submission_id,
      SubmissionStatus.Approved,
    );
    await expect(
      service.updateSubmission(
        submission.submission_id,
        SubmissionStatus.Approved,
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
  });

  it('should create new listing', async () => {
    // create submission
    // create submission
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(userUUID, 'sn1');
    const submissionResponse = await service.submitItem(submissionRequest);
    const submission = await service.getSubmission(
      submissionResponse.submission_id,
    );
    await service.updateSubmission(submission.id, SubmissionStatus.Received);
    await service.updateSubmission(submission.id, SubmissionStatus.Approved);

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

    // vaulting object in minting status can not be listed
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
  });
});
