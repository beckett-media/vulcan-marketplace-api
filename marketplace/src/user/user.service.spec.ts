import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { clearDB, closeDB, imageBaseball } from '../util/testing';
import { AwsService } from '../aws/aws.service';
import { UserService } from './user.service';
import { UserProfileImageRequest } from './dtos/user.dto';

describe('UserService', () => {
  let service: UserService;

  const fakeAwsService: Partial<AwsService> = {
    uploadImage: (dataBuffer: Buffer, prefix: string, image_format: string) => {
      return Promise.resolve('fake_url');
    },
    readImage: (s3url: string) => {
      return Promise.resolve(Buffer.from('fake_image'));
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AwsService,
          useValue: fakeAwsService,
        },
        DatabaseService,
        UserService,
      ],
      imports: [
        DatabaseModule,
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

    service = module.get<UserService>(UserService);

    // clear database
    await clearDB();
  });

  afterEach(async () => {
    // close database
    await closeDB();
  });

  it('should create new user record when upload image', async () => {
    const userUUID = '00000000-0000-0000-0000-000000000001';
    const userProfileImageRequest: UserProfileImageRequest = {
      image_base64: imageBaseball,
      image_format: 'fake_format',
    };
    await service.updateUserProfileImage(userUUID, userProfileImageRequest);
    const user = await service.getUserByUUID(userUUID);
    expect(user).toBeDefined();
    expect(user.uuid).toBe(userUUID);
  });
});
