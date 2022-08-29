import { Injectable } from '@nestjs/common';
import { AwsService } from '../aws/aws.service';
import { User } from '../database/database.entity';
import { DatabaseService } from '../database/database.service';
import { DetailedLogger } from '../logger/detailed.logger';
import { newUserDetails } from '../util/format';
import { UserDetails, UserProfileImageRequest } from './dtos/user.dto';

@Injectable()
export class UserService {
  private readonly logger = new DetailedLogger('UserService', {
    timestamp: true,
  });
  constructor(
    private databaseService: DatabaseService,
    private awsService: AwsService,
  ) {}

  async updateUserProfileImage(
    userUUID: string,
    userProfileImageRequest: UserProfileImageRequest,
  ): Promise<UserDetails> {
    var user = await this.databaseService.getUserByUUID(userUUID);

    const image_buffer = Buffer.from(userProfileImageRequest.image, 'base64');
    const imagePath = await this.awsService.uploadImage(
      image_buffer,
      'user',
      userProfileImageRequest.image_format,
    );
    user.image = imagePath;

    user = await this.databaseService.updateUserProfileImage(user, imagePath);
    return newUserDetails(user);
  }

  async getUserByUUID(uuid: string): Promise<User> {
    return this.databaseService.getUserByUUID(uuid);
  }
}
