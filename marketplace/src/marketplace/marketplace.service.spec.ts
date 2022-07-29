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
import { SubmissionStatus } from '../config/enum';
import { MarketplaceService } from './marketplace.service';
import { AwsService } from '../aws/aws.service';
import { BravoService } from '../bravo/bravo.service';
import { RUNTIME_ENV } from '../config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetDBConnection } from '../database/database.module';
import { clearDB, newSubmissionRequest } from '../util/testing';

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

  beforeEach(async () => {
    // set runtime env to test
    process.env[RUNTIME_ENV] = 'test';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AwsService,
          useValue: fakeAwsService,
        },
        BravoService,
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
});
