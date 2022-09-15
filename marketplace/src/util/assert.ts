import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import configuration, { RUNTIME_ENV } from '../config/configuration';
import { Group } from '../config/enum';

export class UserEntity {
  user: string;
}

export function isUserOnly(jwt: any) {
  return jwt.groups.includes(Group.User) && !jwt.groups.includes(Group.Admin);
}

export function assertOwnerOrAdmin(jwt: any, entity: UserEntity, logger: any) {
  // if auth check is off
  let env = process.env[RUNTIME_ENV];
  let config = configuration()[env];
  if (!config['auth_enabled']) {
    return;
  }

  // if client is not logged in
  if (!!!jwt || !!!jwt.groups || !!!jwt.user) {
    throw new ForbiddenException('No login admin/user found');
  }

  // if user is admin, allow all access
  if (jwt.groups.includes(Group.Admin)) {
    return;
  }

  // if regular user, jwt user and entity user should match
  if (jwt.groups.includes(Group.User)) {
    if ((jwt.user as string) == entity.user) {
      return;
    }
  }

  logger.error(
    `Unauthorized access: request.user: ${jwt.user}, entity.user: ${entity.user}`,
  );
  // anything else is not allowed
  throw new ForbiddenException('Access not allowed.');
}

export function onlyLetters(str: string) {
  return /^[a-zA-Z]+$/.test(str);
}
