import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AwsModule } from '../aws/aws.module';
import { AwsService } from '../aws/aws.service';
import { DatabaseModule } from '../database/database.module';
import { ResponseInterceptor } from '../interceptors/response';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    AwsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  imports: [DatabaseModule, AwsModule],
})
export class UserModule {}
