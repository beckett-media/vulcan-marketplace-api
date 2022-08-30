import {
  Body,
  Controller,
  Param,
  Post,
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
import { UserProfileImageRequest } from './dtos/user.dto';
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
    summary: 'Create new inventory record for submitted item',
  })
  @ApiResponse({
    status: 200,
    description: 'Return created inventory record',
  })
  @ApiProduces('application/json')
  async newInventory(
    @Body() userProfileImageRequest: UserProfileImageRequest,
    @Param('uuid') userUUID: string,
    @Request() request: any,
  ) {
    assertOwnerOrAdmin(request.user, { user: userUUID }, this.logger);
    const userDetails = await this.userService.updateUserProfileImage(
      userUUID,
      userProfileImageRequest,
    );
    const userEntity = await this.userService.getUserByUUID(userUUID);

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

    return userDetails;
  }
}
