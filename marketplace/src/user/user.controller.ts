import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiResponse } from '@nestjs/swagger';
import { OnlyAllowGroups } from 'src/auth/groups.decorator';
import { GroupsGuard } from 'src/auth/groups.guard';
import { JwtAuthGuard } from 'src/auth/jwt.authguard';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import {
  ActionLogActorType,
  ActionLogEntityType,
  ActionLogType,
  Group,
} from 'src/config/enum';
import { DetailedLogger } from 'src/logger/detailed.logger';
import { ActionLogRequest } from 'src/marketplace/dtos/marketplace.dto';
import { UserProfileImageRequest } from './dtos/user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  private readonly logger = new DetailedLogger('InventoryController', {
    timestamp: true,
  });

  constructor(private userService: UserService) {}

  @Post('/{uuid}/image')
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
    @Request() request: any,
  ) {
    // record user action
    const user = await this.userService.getUserByUUID(request.user.user);

    request.user.user;
    const actionLogRequest = new ActionLogRequest({
      actor_type: ActionLogActorType.CognitoUser,
      actor: user.uuid,
      entity_type: ActionLogEntityType.User,
      entity: user.id.toString(),
      type: ActionLogType.UpdateUserProfileImage,
      extra: JSON.stringify(inventoryRequest),
    });
    await this.userService.newActionLog(actionLogRequest);

    return userDetails;
  }
}
