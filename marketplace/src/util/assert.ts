import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import configuration, { RUNTIME_ENV } from '../config/configuration';
import { Group } from '../config/enum';

export function assertOwnerOrAdmin(user: any, entity: any, logger: any) {
  // if auth check is off
  let env = process.env[RUNTIME_ENV];
  let config = configuration()[env];
  if (!config['auth_enabled']) {
    return;
  }

  // if user is admin, allow access
  if (!!user.groups && user.groups.includes(Group.Admin)) {
    return;
  }

  // if user name match, allow access
  if (user.user == entity.user) {
    return;
  }

  logger.error(
    `Unauthorized access: request.user: ${user.user}, entity.user: ${entity.user}`,
  );
  // anything else is not allowed
  throw new ForbiddenException();
}

export function onlyLetters(str: string) {
  return /^[a-zA-Z]+$/.test(str);
}
