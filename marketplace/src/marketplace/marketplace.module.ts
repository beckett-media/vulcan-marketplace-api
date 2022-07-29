import { MiddlewareConsumer, Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { ResponseInterceptor } from '../interceptors/response';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from '../database/database.module';
import { AwsModule } from '../aws/aws.module';
import { AuthModule } from '../auth/auth.module';
import { AwsService } from '../aws/aws.service';
import { BravoModule } from '../bravo/bravo.module';
import { BravoService } from '../bravo/bravo.service';
import { RequestLoggerMiddleware } from '../middleware/logger';

@Module({
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService,
    AwsService,
    BravoService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  imports: [DatabaseModule, AwsModule, BravoModule, AuthModule],
})
export class MarketplaceModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
