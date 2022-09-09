import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiResponse } from '@nestjs/swagger';
import { OnlyAllowGroups } from '../auth/groups.decorator';
import { GroupsGuard } from '../auth/groups.guard';
import { JwtAuthGuard } from '../auth/jwt.authguard';

import {
  ActionLogActorType,
  ActionLogEntityType,
  ActionLogType,
  Group,
} from '../config/enum';
import { DetailedLogger } from '../logger/detailed.logger';
import { ActionLogRequest } from '../marketplace/dtos/marketplace.dto';
import { assertOwnerOrAdmin } from '../util/assert';
import { trimRequestWithImage } from '../util/format';
import {
  ListUsersRequest,
  UserDetails,
  UserProfileImageRequest,
} from './dtos/user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  private readonly logger = new DetailedLogger('InventoryController', {
    timestamp: true,
  });

  constructor(private userService: UserService) {}

  @Post('/:uuid/image')
  @OnlyAllowGroups(Group.Admin, Group.User)
  @UseGuards(JwtAuthGuard, GroupsGuard)
  @ApiOperation({
    summary: 'Upload new user profile image',
  })
  @ApiResponse({
    status: 200,
    description: 'Return s3 url for the new user profile image',
  })
  @ApiProduces('application/json')
  async newUserProfileImage(
    @Body() userProfileImageRequest: UserProfileImageRequest,
    @Param('uuid') userUUID: string,
    @Request() request: any,
  ) {
    assertOwnerOrAdmin(request.user, { user: userUUID }, this.logger);
    const imagePath = await this.userService.updateUserProfileImage(
      userUUID,
      userProfileImageRequest,
    );
    const userEntity = await this.userService.getUserByUUID(userUUID);

    // log user action
    const user = request.user.user;
    const actionLogRequest = new ActionLogRequest({
      actor_type: ActionLogActorType.CognitoUser,
      actor: user,
      entity_type: ActionLogEntityType.User,
      entity: userEntity.id.toString(),
      type: ActionLogType.UpdateUserProfileImage,
      extra: JSON.stringify(trimRequestWithImage(userProfileImageRequest)),
    });
    await this.userService.newActionLog(actionLogRequest);

    return { image_url: imagePath };
  }

  @Get('/list')
  @OnlyAllowGroups(Group.Admin)
  @UseGuards(JwtAuthGuard, GroupsGuard)
  @ApiOperation({
    summary: 'List users by filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Return a list of users by filters',
  })
  @ApiProduces('application/json')
  async newUser(
    @Query() listUsersRequest: ListUsersRequest,
  ): Promise<UserDetails[]> {
    const users = await this.userService.listUsers(listUsersRequest);
    return users;
  }
}
