import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { SubmissionStatus } from '../config/enum';
import { RUNTIME_ENV } from '../config/configuration';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  Item,
  Submission,
  Vaulting,
  User,
  Listing,
  ActionLog,
} from '../database/database.entity';
import { clearDB, newSubmissionRequest } from '../util/testing';

const DBConnection = {
  type: 'sqlite',
  database: 'beckett_marketplace_test.sqlite',
  entities: [Submission, Item, Vaulting, User, Listing, ActionLog],
  synchronize: true,
  keepConnectionAlive: true,
} as TypeOrmModuleOptions;

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(async () => {
    // set runtime env to test
    process.env[RUNTIME_ENV] = 'test';

    const module: TestingModule = await Test.createTestingModule({
      exports: [DatabaseService],
      providers: [DatabaseService],
      imports: [
        TypeOrmModule.forRoot(DBConnection),
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

    service = module.get<DatabaseService>(DatabaseService);

    // clear database
    await clearDB();
  });

  it('should not create same user twice', async () => {
    const user1 = await service.maybeCreateNewUser(
      '00000000-0000-0000-0000-000000000001',
      'cognito',
    );
    const user2 = await service.maybeCreateNewUser(
      '00000000-0000-0000-0000-000000000001',
      'cognito',
    );
    expect(user1.id).toBe(user2.id);
  });

  it('should create/list/update submissions', async () => {
    const s3url = 'fake s3url';
    // create array of submissions
    const submissions = [
      newSubmissionRequest('user1', 'sn1'),
      newSubmissionRequest('user2', 'sn2'),
      newSubmissionRequest('user3', 'sn3'),
      newSubmissionRequest('user1', 'sn4'),
    ];

    // loop through submissions and create them
    for (const submission of submissions) {
      const result = await service.createNewSubmission(submission, s3url);
      expect(result.status).toBe(SubmissionStatus.Submitted);
    }

    var status, offset, limit, order;
    // list submissions for user1
    const user1Submissions = await service.listSubmissions(
      'user1',
      status,
      offset,
      limit,
      order,
    );
    expect(user1Submissions.length).toBe(2);
    expect(user1Submissions[0].serial_number).toBe('sn1');
    expect(user1Submissions[0].status).toBe(SubmissionStatus.Submitted);
    expect(user1Submissions[0].user).toBe('user1');
    expect(user1Submissions[1].serial_number).toBe('sn4');
    expect(user1Submissions[1].status).toBe(SubmissionStatus.Submitted);
    expect(user1Submissions[1].user).toBe('user1');

    // get single submssion
    const submission = await service.getSubmission(user1Submissions[0].id);
    expect(submission.item_id).toBe(user1Submissions[0].item_id);
    expect(submission.status).toBe(SubmissionStatus.Submitted);

    // list submissions for user2
    const user2Submissions = await service.listSubmissions(
      'user2',
      status,
      offset,
      limit,
      order,
    );
    expect(user2Submissions.length).toBe(1);
    expect(user2Submissions[0].serial_number).toBe('sn2');
    expect(user2Submissions[0].status).toBe(SubmissionStatus.Submitted);
    expect(user2Submissions[0].user).toBe('user2');

    // list submissions for user3
    const user3Submissions = await service.listSubmissions(
      'user3',
      status,
      offset,
      limit,
      order,
    );
    expect(user3Submissions.length).toBe(1);
    expect(user3Submissions[0].serial_number).toBe('sn3');
    expect(user3Submissions[0].status).toBe(SubmissionStatus.Submitted);
    expect(user3Submissions[0].user).toBe('user3');

    // set limit and offset to get only one submission
    limit = 1;
    offset = 1;
    // list submissions for user1
    const user1Submissions2 = await service.listSubmissions(
      'user1',
      status,
      offset,
      limit,
      order,
    );
    expect(user1Submissions2.length).toBe(1);
    expect(user1Submissions2[0].serial_number).toBe('sn4');
    expect(user1Submissions2[0].status).toBe(SubmissionStatus.Submitted);
    expect(user1Submissions2[0].user).toBe('user1');

    // set order to be desc
    order = 'DESC';
    offset = undefined;
    limit = undefined;
    // list submissions for user1
    const user1Submissions3 = await service.listSubmissions(
      'user1',
      status,
      offset,
      limit,
      order,
    );
    expect(user1Submissions3.length).toBe(2);
    expect(user1Submissions3[0].serial_number).toBe('sn4');
    expect(user1Submissions3[0].status).toBe(SubmissionStatus.Submitted);
    expect(user1Submissions3[0].user).toBe('user1');
    expect(user1Submissions3[1].serial_number).toBe('sn1');
    expect(user1Submissions3[1].status).toBe(SubmissionStatus.Submitted);
    expect(user1Submissions3[1].user).toBe('user1');

    // list one item
    const item = await service.getItem(user1Submissions3[0].item_id);
    expect(item.serial_number).toBe('sn4');

    // list multiple items
    const items = await service.listItems([
      user1Submissions3[0].item_id,
      user1Submissions3[1].item_id,
    ]);
    const user1 = await service.getUserByUUID('user1');
    expect(items.length).toBe(2);
    expect(items[0].serial_number).toBe('sn1');
    expect(items[0].user).toBe(user1.id);
    expect(items[1].serial_number).toBe('sn4');
    expect(items[1].user).toBe(user1.id);

    // list user
    const user = await service.getUser(user1.id);
    expect(user.id).toBe(user1.id);

    // update submission
    const submissionID = user1Submissions3[0].id;
    const submissionBefore = await service.getSubmission(submissionID);
    await service.updateSubmission(submissionID, SubmissionStatus.Received);
    const submissionAfter = await service.getSubmission(submissionID);
    expect(submissionBefore.status).toBe(SubmissionStatus.Submitted);
    expect(submissionAfter.status).toBe(SubmissionStatus.Received);
    expect(submissionBefore.received_at).not.toEqual(
      submissionAfter.received_at,
    );
  });
});
