import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import configuration, { RUNTIME_ENV } from 'src/config/configuration';
import { Group } from 'src/config/enum';
import { GROUPS_KEY } from './groups.decorator';

@Injectable()
export class GroupsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const env = process.env[RUNTIME_ENV];
    const config = configuration()[env];
    const authEnabled = config['auth_enabled'];
    if (authEnabled) {
      const requiredGroups = this.reflector.getAllAndOverride<Group[]>(
        GROUPS_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (!requiredGroups) {
        return true;
      }
      const { user } = context.switchToHttp().getRequest();
      return requiredGroups.some((group) => user.groups?.includes(group));
    } else {
      return true;
    }
  }
}
