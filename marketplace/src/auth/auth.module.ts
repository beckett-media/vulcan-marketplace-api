import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { DevGuard } from './dev.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [
    AuthService,
    JwtStrategy,
    /*{
      provide: APP_GUARD,
      useClass: DevGuard,
    },*/
  ],
  controllers: [AuthController],
})
export class AuthModule {}
