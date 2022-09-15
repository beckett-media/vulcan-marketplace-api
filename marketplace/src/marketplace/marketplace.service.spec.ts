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
  closeDB,
  imageBaseball,
  imageBlackBox,
  newSubmissionRequest,
  newVaultingUpdateRequest,
} from '../util/testing';
import {
  ListingRequest,
  ListingUpdate,
  SubmissionUpdate,
} from './dtos/marketplace.dto';
import { CacheModule, InternalServerErrorException } from '@nestjs/common';

describe('MarketplaceService', () => {
  let service: MarketplaceService;

  const fakeAwsService: Partial<AwsService> = {
    uploadImage: (dataBuffer: Buffer, prefix: string, image_format: string) => {
      return Promise.resolve('fake_url');
    },
    readImage: (s3url: string) => {
      return Promise.resolve(Buffer.from('fake_image'));
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

  afterEach(async () => {
    // close database
    await closeDB();
  });

  it('should create new submission', async () => {
    // create submission
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(
      userUUID,
      'sn1',
      true,
      '',
      true,
    );
    const submission = await service.submitItem(submissionRequest);
    expect(submission).toBeDefined();
    expect(submission.user).toBe(userUUID);
    expect(submission.status).toBe(SubmissionStatus.Submitted);

    // list submission
    var status, limit, offset, order;
    const submissions = await service.listSubmissions(
      userUUID,
      undefined,
      undefined,
      undefined,
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

  it('should list multiple submissions', async () => {
    // create submission 1
    const userUUID1 = '00000000-0000-0000-0000-000000000001';
    const orderUUID1 = '00000000-0000-0000-0000-000000000001';
    const submissionRequest1 = newSubmissionRequest(
      userUUID1,
      'sn1',
      true,
      orderUUID1,
      true,
    );
    const submission1 = await service.submitItem(submissionRequest1);

    // create submission 2
    const submissionRequest2 = newSubmissionRequest(
      userUUID1,
      'sn2',
      true,
      orderUUID1,
      true,
    );
    const submission2 = await service.submitItem(submissionRequest2);

    // create submission 3
    const userUUID2 = '00000000-0000-0000-0000-000000000002';
    const orderUUID2 = '00000000-0000-0000-0000-000000000002';
    const submissionRequest3 = newSubmissionRequest(
      userUUID2,
      'sn3',
      true,
      orderUUID2,
      true,
    );
    const submission3 = await service.submitItem(submissionRequest3);

    // list submissions by all order ids
    const submissions = await service.listSubmissions(
      undefined,
      undefined,
      undefined,
      [submission1.order_id, submission3.order_id],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(submissions.length).toBe(3);
    expect(submissions[0].id).toBe(submission1.submission_id);
    expect(submissions[1].id).toBe(submission2.submission_id);
    expect(submissions[2].id).toBe(submission3.submission_id);

    // list submissions by first order id
    const submissions2 = await service.listSubmissions(
      undefined,
      undefined,
      undefined,
      [submission1.order_id],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(submissions2.length).toBe(2);
    expect(submissions2[0].id).toBe(submission1.submission_id);
    expect(submissions2[1].id).toBe(submission2.submission_id);

    // list submissions by user id 1
    const submissions3 = await service.listSubmissions(
      userUUID1,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(submissions3.length).toBe(2);
    expect(submissions3[0].user).toBe(userUUID1);
    expect(submissions3[1].user).toBe(userUUID1);
    const submissions3s = await service.listSubmissions(
      undefined,
      [userUUID1],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(submissions3s.length).toBe(2);
    expect(submissions3s[0].user).toBe(userUUID1);
    expect(submissions3s[1].user).toBe(userUUID1);
    // list submissions by user id 2
    const submissions4 = await service.listSubmissions(
      userUUID2,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(submissions4.length).toBe(1);
    expect(submissions4[0].user).toBe(userUUID2);
    const submissions4s = await service.listSubmissions(
      undefined,
      [userUUID2],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(submissions4s.length).toBe(1);
    expect(submissions4s[0].user).toBe(userUUID2);
    // list submissions by both user id 1 & 2
    const submissions5 = await service.listSubmissions(
      undefined,
      [userUUID1, userUUID2],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(submissions5.length).toBe(3);
    expect(submissions5[0].user).toBe(userUUID1);
    expect(submissions5[1].user).toBe(userUUID1);
    expect(submissions5[2].user).toBe(userUUID2);

    // combine user id 1 & 2 with order id 1
    const submissions6 = await service.listSubmissions(
      undefined,
      [userUUID1, userUUID2],
      undefined,
      [submission1.order_id],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(submissions6.length).toBe(2);
    const submissions7 = await service.listSubmissions(
      undefined,
      [userUUID1, userUUID2],
      undefined,
      [submission3.order_id],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(submissions7.length).toBe(1);
    // mismatch user id and order id, should return empty
    const submissions8 = await service.listSubmissions(
      undefined,
      [userUUID1],
      undefined,
      [submission3.order_id],
      undefined,
      undefined,
      undefined,
      undefined,
    );
    var user = await service.getUserByUUID(userUUID1);
    expect(submissions8.length).toBe(0);
  });

  it('should not approve if submission not received', async () => {
    // create submission
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(
      userUUID,
      'sn1',
      true,
      '',
      true,
    );
    const submission = await service.submitItem(submissionRequest);
    const submissionUpdateApproved = new SubmissionUpdate({
      status: SubmissionStatus.Approved,
    });

    // approve submission should fail
    await expect(
      service.updateSubmission(
        submission.submission_id,
        submissionUpdateApproved,
      ),
    ).rejects.toThrow(`Cannot update status from Submitted to Approved`);

    const submissionUpdateReceived = new SubmissionUpdate({
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
    const submissionRequest = newSubmissionRequest(
      userUUID,
      'sn1',
      false,
      '',
      true,
    );
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

  it('should preserve atomicity for submission orders', async () => {
    // 3 test cases: x - failed, o - success
    // 1. XOO
    // 2. OXO
    // 3. OOX

    // 1. XOO
    const userUUID = '00000000-0000-0000-0000-000000000001';
    // 1st request
    var submissionRequest = newSubmissionRequest(
      userUUID,
      'sn1',
      true,
      '',
      false,
    );
    await expect(service.submitItem(submissionRequest)).rejects.toEqual(
      new InternalServerErrorException('Image format not specified'),
    );
    // 2nd request
    submissionRequest = newSubmissionRequest(userUUID, 'sn2', true, '', true);
    await expect(service.submitItem(submissionRequest)).rejects.toEqual(
      new InternalServerErrorException(
        'Submission order has been discarded due to previous failure',
      ),
    );

    // 2. OXO
    // 1st request
    var uuid = '00000000-0000-0000-0000-000000000099';
    var submissionRequest = newSubmissionRequest(
      userUUID,
      'sn11',
      true,
      uuid,
      true,
    );
    var submissionResponse = await service.submitItem(submissionRequest);
    expect(submissionResponse.order_id).toBeDefined();
    var submission11 = await service.getSubmission(
      submissionResponse.submission_id,
    );
    expect(submission11).toBeDefined();
    var submissionOrder = await service.getSubmissionOrder(
      submissionResponse.order_id,
    );
    expect(submissionOrder).toBeDefined();
    expect(submission11.status == SubmissionStatus.Submitted).toBe(true);
    expect(submissionOrder.status == SubmissionOrderStatus.Created).toBe(true);

    // 2nd request
    submissionRequest = newSubmissionRequest(
      userUUID,
      'sn22',
      true,
      uuid,
      false,
    );
    await expect(service.submitItem(submissionRequest)).rejects.toEqual(
      new InternalServerErrorException('Image format not specified'),
    );
    // 3rd request
    submissionRequest = newSubmissionRequest(
      userUUID,
      'sn33',
      true,
      uuid,
      true,
    );
    await expect(service.submitItem(submissionRequest)).rejects.toEqual(
      new InternalServerErrorException(
        'Submission order has been discarded due to previous failure',
      ),
    );

    // verify submission order is discarded
    await expect(
      service.getSubmissionOrder(submissionOrder.id),
    ).rejects.toEqual(
      new InternalServerErrorException(
        `Submission order ${submissionOrder.id} not found`,
      ),
    );
    // verify submission is marked as failed
    submission11 = await service.getSubmission(submission11.id);
    expect(submission11.status == SubmissionStatus.Failed).toBe(true);

    // 3. OOX
    // 1st request
    uuid = '00000000-0000-0000-0000-000000000088';
    submissionRequest = newSubmissionRequest(
      userUUID,
      'sn111',
      true,
      uuid,
      true,
    );
    var submissionResponse = await service.submitItem(submissionRequest);
    expect(submissionResponse.order_id).toBeDefined();
    var submission111 = await service.getSubmission(
      submissionResponse.submission_id,
    );
    expect(submission111).toBeDefined();
    var submissionOrder = await service.getSubmissionOrder(
      submissionResponse.order_id,
    );
    expect(submissionOrder).toBeDefined();
    expect(submission111.status == SubmissionStatus.Submitted).toBe(true);
    expect(submissionOrder.status == SubmissionOrderStatus.Created).toBe(true);

    // 2nd request
    submissionRequest = newSubmissionRequest(
      userUUID,
      'sn222',
      true,
      uuid,
      true,
    );
    submissionResponse = await service.submitItem(submissionRequest);
    expect(submissionResponse.order_id).toBeDefined();
    var submission222 = await service.getSubmission(
      submissionResponse.submission_id,
    );
    expect(submission222).toBeDefined();
    submissionOrder = await service.getSubmissionOrder(
      submissionResponse.order_id,
    );
    expect(submissionOrder).toBeDefined();
    expect(submission222.status == SubmissionStatus.Submitted).toBe(true);
    expect(submissionOrder.status == SubmissionOrderStatus.Created).toBe(true);

    // check listSubmissions
    var submissions = await service.listSubmissions(
      userUUID,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(submissions.length).toBe(2);

    // 3rd request
    submissionRequest = newSubmissionRequest(
      userUUID,
      'sn22',
      true,
      uuid,
      false,
    );
    await expect(service.submitItem(submissionRequest)).rejects.toEqual(
      new InternalServerErrorException('Image format not specified'),
    );

    // verify submission order is discarded
    await expect(
      service.getSubmissionOrder(submissionOrder.id),
    ).rejects.toEqual(
      new InternalServerErrorException(
        `Submission order ${submissionOrder.id} not found`,
      ),
    );
    // veify submissions are marked as failed
    submission111 = await service.getSubmission(submission111.id);
    expect(submission111.status == SubmissionStatus.Failed).toBe(true);
    submission222 = await service.getSubmission(submission222.id);
    expect(submission222.status == SubmissionStatus.Failed).toBe(true);

    // check listSubmissions
    var submissions = await service.listSubmissions(
      userUUID,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(submissions.length).toBe(0);
  });

  it('should update various submission fields', async () => {
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(
      userUUID,
      'sn1',
      true,
      '',
      true,
    );
    const submissionResponse = await service.submitItem(submissionRequest);
    expect(submissionResponse.order_id).toBeDefined();
    const submission = await service.getSubmission(
      submissionResponse.submission_id,
    );
    expect(submission).toBeDefined();
    expect(submission.status == SubmissionStatus.Submitted).toBe(true);

    // update item attributes
    const submissionUpdate = new SubmissionUpdate({
      year: 2020,
      issue: '#2020-12',
    });
    const submissionUpdateResponse = await service.updateSubmission(
      submission.id,
      submissionUpdate,
    );
    expect(submissionUpdateResponse.id).toBe(submission.id);
    expect(submissionUpdateResponse.year).toBe(2020);
    expect(submissionUpdateResponse.issue).toBe('#2020-12');

    // update item attributes and status
    const submissionUpdate2 = new SubmissionUpdate({
      year: 2022,
      issue: '#2022-12',
      status: SubmissionStatus.Received,
    });
    const submissionUpdateResponse2 = await service.updateSubmission(
      submission.id,
      submissionUpdate2,
    );
    expect(submissionUpdateResponse2.id).toBe(submission.id);
    expect(submissionUpdateResponse2.year).toBe(2022);
    expect(submissionUpdateResponse2.issue).toBe('#2022-12');
    expect(submissionUpdateResponse2.status).toBe(SubmissionStatus.Received);

    // update invalid status transfer
    const submissionUpdate3 = new SubmissionUpdate({
      status: SubmissionStatus.Received,
    });
    await expect(
      service.updateSubmission(submission.id, submissionUpdate3),
    ).rejects.toEqual(
      new InternalServerErrorException(
        'Cannot update status from Received to Received',
      ),
    );

    // update invalid status transfer
    const submissionUpdate4 = new SubmissionUpdate({
      status: SubmissionStatus.Vaulted,
    });
    await expect(
      service.updateSubmission(submission.id, submissionUpdate4),
    ).rejects.toEqual(
      new InternalServerErrorException(
        'Cannot update status from Received to Vaulted',
      ),
    );
  });

  it('should update submission image', async () => {
    // create submission
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(
      userUUID,
      'sn1',
      false,
      '',
      true,
    );
    const submission = await service.submitItem(submissionRequest);
    const submissionDetailsBefore = await service.getSubmission(
      submission.submission_id,
    );
    expect(submissionDetailsBefore.image_url).toBe('');
    expect(submissionDetailsBefore.image_rev_url).toBe('');

    // update submission image
    const submissionUpdate = new SubmissionUpdate({
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

  it('should fail if submission image is not set', async () => {
    // create submission
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(
      userUUID,
      'sn1',
      false,
      '',
      true,
    );
    const submission = await service.submitItem(submissionRequest);
    const submissionUpdateApproved = new SubmissionUpdate({
      status: SubmissionStatus.Approved,
    });
    const submissionUpdateVerified = new SubmissionUpdate({
      status: SubmissionStatus.Verified,
    });
    const submissionUpdateReceived = new SubmissionUpdate({
      status: SubmissionStatus.Received,
    });
    await service.updateSubmission(
      submission.submission_id,
      submissionUpdateReceived,
    );
    await service.updateSubmission(
      submission.submission_id,
      submissionUpdateVerified,
    );
    await service.updateSubmission(
      submission.submission_id,
      submissionUpdateApproved,
    );
    // create vaulting
    const fake_format = 'fake_format';
    const vaultingRequest = {
      item_id: submission.item_id,
      user: userUUID,
      submission_id: submission.submission_id,
      image_base64: 'fake_base64',
      image_format: fake_format,
    };
    await expect(service.newVaulting(vaultingRequest)).rejects.toEqual(
      new InternalServerErrorException(
        `Submission ${submission.submission_id} has no image`,
      ),
    );
  });

  it('should create new vaulting and update existing submission', async () => {
    // create submission
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(
      userUUID,
      'sn1',
      true,
      '',
      true,
    );
    const submission = await service.submitItem(submissionRequest);
    const submissionDetails = await service.getSubmission(
      submission.submission_id,
    );
    const submissionUpdateApproved = new SubmissionUpdate({
      status: SubmissionStatus.Approved,
    });
    const submissionUpdateVerified = new SubmissionUpdate({
      status: SubmissionStatus.Verified,
    });
    const submissionUpdateReceived = new SubmissionUpdate({
      status: SubmissionStatus.Received,
    });
    await expect(
      service.updateSubmission(
        submission.submission_id,
        submissionUpdateApproved,
      ),
    ).rejects.toThrow(`Cannot update status from Submitted to Approved`);
    await service.updateSubmission(
      submission.submission_id,
      submissionUpdateReceived,
    );
    await service.updateSubmission(
      submission.submission_id,
      submissionUpdateVerified,
    );
    await service.updateSubmission(
      submission.submission_id,
      submissionUpdateApproved,
    );
    const submission1 = await service.getSubmission(submission.submission_id);
    await expect(
      service.updateSubmission(
        submission.submission_id,
        submissionUpdateApproved,
      ),
    ).rejects.toThrow(`Cannot update status from Approved to Approved`);

    // create vaulting
    const vaultingRequest = {
      item_id: submission.item_id,
      user: userUUID,
      submission_id: submission.submission_id,
      image_base64: 'fake_base64',
      image_format: 'fakeformat',
    };
    const vaulting = await service.newVaulting(vaultingRequest);
    expect(vaulting).toBeDefined();
    expect(vaulting.item_id).toBe(submission.item_id);
    expect(vaulting.user).toBe(userUUID);
    expect(vaulting.status).toBe(1);
    expect(vaulting.status_desc).toBe('Minting');

    // submission stay approved, not vaulted
    var submissionVaulted = await service.getSubmission(
      submission.submission_id,
    );
    expect(submissionVaulted.status).toBe(SubmissionStatus.Approved);

    // list vaultings
    var status, limit, offset, order, item;
    var vaultings = await service.listVaultings(
      userUUID,
      item,
      offset,
      limit,
      order,
    );
    expect(vaultings.length).toBe(1);
    expect(vaultings[0].id).toBe(vaulting.id);
    expect(vaultings[0].item_id).toBe(submission.item_id);
    expect(vaultings[0].user).toBe(userUUID);

    vaultings = await service.listVaultings(
      undefined,
      submission.item_id,
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
    expect(vaultingDetails.image_url).toBe(submissionDetails.image_url);
    expect(vaultingDetails.image_rev_url).toBe(submissionDetails.image_rev_url);
    expect(vaultingDetails.nft_image_url).toBeDefined();

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

    // submission should be vaulted
    submissionVaulted = await service.getSubmission(submission.submission_id);
    expect(submissionVaulted.status).toBe(SubmissionStatus.Vaulted);
  });

  it('should withdrawal vaulting', async () => {
    // create submission
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(
      userUUID,
      'sn1',
      true,
      '',
      true,
    );
    const submission = await service.submitItem(submissionRequest);
    const submissionUpdateReceived = new SubmissionUpdate({
      status: SubmissionStatus.Received,
    });
    const submissionUpdateApproved = new SubmissionUpdate({
      status: SubmissionStatus.Approved,
    });
    await service.updateSubmission(
      submission.submission_id,
      submissionUpdateReceived,
    );
    await service.updateSubmission(
      submission.submission_id,
      submissionUpdateApproved,
    );
    // create vaulting
    const vaultingRequest = {
      item_id: submission.item_id,
      user: userUUID,
      submission_id: submission.submission_id,
      image_base64: 'fake_base64',
      image_format: 'fakeformat',
    };
    const vaulting = await service.newVaulting(vaultingRequest);

    // update vaulting to be minted
    const vaultingUpdate = newVaultingUpdateRequest(
      VaultingUpdateType.Minted,
      vaulting.item_uuid,
    );
    await service.updateVaulting(vaultingUpdate);

    // withdrawal vaulting
    const vaultingDetails = await service.withdrawVaulting(vaulting.id);
    expect(vaultingDetails.id).toBe(vaulting.id);
    expect(vaultingDetails.status).toBe(VaultingStatus.Withdrawing);
    expect(vaultingDetails.status_desc).toBe(
      VaultingStatusReadable[VaultingStatus.Withdrawing],
    );
  });

  it('should create new listing', async () => {
    // create submission
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const submissionRequest = newSubmissionRequest(
      userUUID,
      'sn1',
      true,
      '',
      true,
    );
    const submissionResponse = await service.submitItem(submissionRequest);
    const submission = await service.getSubmission(
      submissionResponse.submission_id,
    );
    const submissionUpdateApproved = new SubmissionUpdate({
      status: SubmissionStatus.Approved,
    });
    const submissionUpdateVerified = new SubmissionUpdate({
      status: SubmissionStatus.Verified,
    });
    const submissionUpdateReceived = new SubmissionUpdate({
      status: SubmissionStatus.Received,
    });
    await service.updateSubmission(submission.id, submissionUpdateReceived);
    await service.updateSubmission(submission.id, submissionUpdateVerified);
    await service.updateSubmission(submission.id, submissionUpdateApproved);

    // create vaulting
    const vaultingRequest = {
      item_id: submission.item_id,
      user: userUUID,
      submission_id: submission.id,
      image_base64: 'fake_base64',
      image_format: 'fakeformat',
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
    const submissionRequest = newSubmissionRequest(
      userUUID,
      'sn1',
      true,
      '',
      true,
    );
    const submissionResponse = await service.submitItem(submissionRequest);
    const submission = await service.getSubmission(
      submissionResponse.submission_id,
    );
    const submissionUpdateApproved = new SubmissionUpdate({
      status: SubmissionStatus.Approved,
    });
    const submissionUpdateVerified = new SubmissionUpdate({
      status: SubmissionStatus.Verified,
    });
    const submissionUpdateReceived = new SubmissionUpdate({
      status: SubmissionStatus.Received,
    });
    await service.updateSubmission(submission.id, submissionUpdateReceived);
    await service.updateSubmission(submission.id, submissionUpdateVerified);
    await service.updateSubmission(submission.id, submissionUpdateApproved);

    // create vaulting
    const vaultingRequest = {
      item_id: submission.item_id,
      user: userUUID,
      submission_id: submission.id,
      image_base64: 'fake_base64',
      image_format: 'fakeformat',
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
