import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { SubmissionOrderStatus, SubmissionStatus } from '../config/enum';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  Item,
  Submission,
  Vaulting,
  User,
  Listing,
  ActionLog,
  Inventory,
  SubmissionOrder,
} from '../database/database.entity';
import { clearDB, closeDB, newSubmissionRequest } from '../util/testing';
import { GetDBConnection } from './database.module';

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      exports: [DatabaseService],
      providers: [DatabaseService],
      imports: [
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

    service = module.get<DatabaseService>(DatabaseService);

    // clear database
    await clearDB();
  });

  afterEach(async () => {
    // close database
    await closeDB();
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

  it('should create multiple orders', async () => {
    const user1 = await service.maybeCreateNewUser('user1', 'cognito');

    // create array of submissions
    const submissions1 = [
      newSubmissionRequest(
        'user1',
        'sn1',
        true,
        '00000000-0000-0000-0000-000000000001',
        true,
      ),
      newSubmissionRequest(
        'user1',
        'sn2',
        true,
        '00000000-0000-0000-0000-000000000001',
        true,
      ),
      newSubmissionRequest(
        'user1',
        'sn3',
        false,
        '00000000-0000-0000-0000-000000000001',
        true,
      ),
    ];

    const submissions2 = [
      newSubmissionRequest(
        'user1',
        'sn4',
        true,
        '00000000-0000-0000-0000-000000000002',
        true,
      ),
      newSubmissionRequest(
        'user1',
        'sn5',
        true,
        '00000000-0000-0000-0000-000000000002',
        true,
      ),
      newSubmissionRequest(
        'user1',
        'sn6',
        true,
        '00000000-0000-0000-0000-000000000002',
        true,
      ),
    ];

    const submissions3 = [
      newSubmissionRequest(
        'user1',
        'sn7',
        true,
        '00000000-0000-0000-0000-000000000003',
        true,
      ),
      newSubmissionRequest(
        'user1',
        'sn8',
        true,
        '00000000-0000-0000-0000-000000000003',
        true,
      ),
      newSubmissionRequest(
        'user1',
        'sn9',
        false,
        '00000000-0000-0000-0000-000000000003',
        true,
      ),
    ];

    var order_id: number;
    // loop through submissions and create them
    for (const submission of submissions1) {
      const submissionOrder = await service.maybeCreateSubmissionOrder(
        user1.id,
        submission.order_uuid,
      );
      const result = await service.createNewSubmission(
        submission,
        user1,
        submissionOrder,
        ['', ''],
      );
      order_id = result.order_id;
      expect(result.status).toBe(SubmissionStatus.Submitted);
    }
    for (const submission of submissions2) {
      const submissionOrder = await service.maybeCreateSubmissionOrder(
        user1.id,
        submission.order_uuid,
      );
      const result = await service.createNewSubmission(
        submission,
        user1,
        submissionOrder,
        ['', ''],
      );
      order_id = result.order_id;
      expect(result.status).toBe(SubmissionStatus.Submitted);
    }
    for (const submission of submissions3) {
      const submissionOrder = await service.maybeCreateSubmissionOrder(
        user1.id,
        submission.order_uuid,
      );
      const result = await service.createNewSubmission(
        submission,
        user1,
        submissionOrder,
        ['', ''],
      );
      order_id = result.order_id;
      expect(result.status).toBe(SubmissionStatus.Submitted);
    }

    // list all submissions
    const submissions = await service.listSubmissions(
      user1.uuid,
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(submissions.length).toBe(9);

    // list submission orders
    var orders = await service.listSubmissionOrders(
      user1.uuid,
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(orders.length).toBe(3);

    for (const order of orders) {
      expect(order.submissions.length).toBe(3);
      expect(order.status).toBe(SubmissionOrderStatus.Created);
    }

    // add one more submission to order group 1
    var submission = newSubmissionRequest(
      'user1',
      'sn3',
      false,
      '00000000-0000-0000-0000-000000000001',
      true,
    );
    const submissionOrder = await service.maybeCreateSubmissionOrder(
      user1.id,
      submission.order_uuid,
    );
    const result = await service.createNewSubmission(
      submission,
      user1,
      submissionOrder,
      ['', ''],
    );
    orders = await service.listSubmissionOrders(
      'user1',
      undefined,
      undefined,
      undefined,
      undefined,
    );
    expect(orders[0].submissions.length).toBe(4);

    // specify limit and offset
    const limit = 2;
    const offset = 1;
    orders = await service.listSubmissionOrders(
      'user1',
      undefined,
      offset,
      limit,
      'DESC',
    );
    // expect only 2 orders
    expect(orders.length).toBe(2);
    expect(orders[0].submissions.length).toBe(3);
    expect(orders[1].submissions.length).toBe(4);
  });

  it('should create/list/update submissions', async () => {
    const s3url = 'fake s3url';
    // create array of submissions
    const submissions = [
      newSubmissionRequest('user1', 'sn1', true, '', true),
      newSubmissionRequest('user2', 'sn2', true, '', true),
      newSubmissionRequest('user3', 'sn3', false, '', true),
      newSubmissionRequest('user1', 'sn4', false, '', true),
    ];

    var order_id: number;
    // loop through submissions and create them
    for (const submission of submissions) {
      const user = await service.maybeCreateNewUser(submission.user, 'cognito');
      const submissionOrder = await service.maybeCreateSubmissionOrder(
        user.id,
        submission.order_uuid,
      );
      const result = await service.createNewSubmission(
        submission,
        user,
        submissionOrder,
        [s3url, s3url],
      );
      order_id = result.order_id;
      expect(result.status).toBe(SubmissionStatus.Submitted);
    }

    // list submission order
    const submissionsCreated = await service.listSubmissionsForOrder(order_id);
    expect(submissionsCreated.length).toBe(submissions.length);
    // for all submissions, check that their order id is the same as the one we created
    for (const submission of submissionsCreated) {
      expect(submission.order_id).toBe(order_id);
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
    var submissionBefore = await service.getSubmission(submissionID);
    expect(submissionBefore.status).toBe(SubmissionStatus.Submitted);
    expect(submissionBefore.received_at).toEqual(0);
    submissionBefore.status = SubmissionStatus.Received;
    await service.updateSubmission(submissionBefore, null);
    const submissionAfter = await service.getSubmission(submissionID);
    expect(submissionAfter.status).toBe(SubmissionStatus.Received);
  });
});
