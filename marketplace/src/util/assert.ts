import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Group } from '../config/enum';

export function assertOwnerOrAdmin(user: any, entity: any) {
  // if user is admin, allow access
  if (!!user.groups && user.groups.includes(Group.Admin)) {
    return;
  }

  // if user name match, allow access
  if (user.user == entity.user) {
    return;
  }

  this.logger.error(
    `Unauthorized access: request.user: ${user.user}, entity.user: ${entity.user}`,
  );
  // anything else is not allowed
  throw new ForbiddenException();
}
