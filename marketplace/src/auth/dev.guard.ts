import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RUNTIME_ENV } from '../config/configuration';

export class DevGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (
      process.env[RUNTIME_ENV] === 'dev' ||
      process.env[RUNTIME_ENV] === 'awsdev'
    ) {
      return true;
    }
    return false;
  }
}
