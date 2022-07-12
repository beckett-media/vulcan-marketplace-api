import { UnauthorizedException } from '@nestjs/common';

const ADMIN_GROUP = 'admin';
const USER_GROUP = 'vaulting';

export function onlyAdmin(user: any) {
  // check if admin is in user groups
  if (!user.groups.includes(ADMIN_GROUP)) {
    throw new UnauthorizedException('You must be an admin to do that.');
  }
}

export function onlyUser(user: any) {
  // check if vaulting is in user groups
  if (!user.groups.includes(USER_GROUP)) {
    throw new UnauthorizedException(
      'You must be an registered user to do that.',
    );
  }
}

// both auth and params users should match
export function userShouldMatch(authUser: string, paramsUser: string) {
  if (authUser !== paramsUser) {
    throw new UnauthorizedException(
      'User parameter does not match auth header',
    );
  }
}
