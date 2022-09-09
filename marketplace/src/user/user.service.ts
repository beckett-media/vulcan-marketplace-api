import { Injectable } from '@nestjs/common';
import {
  ActionLogActorType,
  ActionLogActorTypeReadable,
  ActionLogEntityTypeReadable,
  ActionLogTypeReadable,
} from '../config/enum';
import {
  ActionLogDetails,
  ActionLogRequest,
} from '../marketplace/dtos/marketplace.dto';
import { AwsService } from '../aws/aws.service';
import { User } from '../database/database.entity';
import { DatabaseService } from '../database/database.service';
import { DetailedLogger } from '../logger/detailed.logger';
import { getUserAttribute, newUserDetails } from '../util/format';
import {
  ListUsersRequest,
  UserDetails,
  UserProfileImageRequest,
} from './dtos/user.dto';

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
  ): Promise<string> {
    var user = await this.databaseService.getUserByUUID(userUUID);

    const image_buffer = Buffer.from(
      userProfileImageRequest.image_base64,
      'base64',
    );
    const imagePath = await this.awsService.uploadImage(
      image_buffer,
      'user/profile_image',
      userProfileImageRequest.image_format,
    );
    await this.databaseService.updateUserProfileImage(user, imagePath);
    return imagePath;
  }

  async getUserByUUID(uuid: string): Promise<User> {
    return this.databaseService.getUserByUUID(uuid);
  }

  // create new action log
  async newActionLog(request: ActionLogRequest): Promise<ActionLogDetails> {
    // create new action log
    const actionLog = await this.databaseService.createNewActionLog(request);
    // return new action log details
    return new ActionLogDetails({
      id: actionLog.id,
      type: actionLog.type,
      type_desc: ActionLogTypeReadable[actionLog.type],
      actor: actionLog.actor,
      actor_type_desc: ActionLogActorTypeReadable[actionLog.actor_type],
      entity: actionLog.entity,
      entity_type_desc: ActionLogEntityTypeReadable[actionLog.entity_type],
      created_at: actionLog.created_at,
      extra: actionLog.extra,
    });
  }

  async listUsers(request: ListUsersRequest): Promise<UserDetails[]> {
    const cognitoUsers = await this.awsService.listUsers(
      request.user_name,
      request.email,
      request.first_name,
      request.last_name,
      request.match,
    );
    // build map from user sub to cognito users
    const cognitoUsersMap = new Map();
    for (const cognitoUser of cognitoUsers) {
      const sub = getUserAttribute(cognitoUser, 'sub');
      cognitoUsersMap.set(sub, cognitoUser);
    }

    const userUUIDs = cognitoUsers.map((user) => getUserAttribute(user, 'sub'));
    const users = await this.databaseService.listUsersByUUID(userUUIDs);
    return users.map((user) =>
      newUserDetails(user, cognitoUsersMap.get(user.uuid)),
    );
  }
}
