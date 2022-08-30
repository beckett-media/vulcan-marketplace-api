import { CacheModule, MiddlewareConsumer, Module } from '@nestjs/common';
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
import { InventoryModule } from '../inventory/inventory.module';
import { UserModule } from '../user/user.module';

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
  imports: [
    DatabaseModule,
    AwsModule,
    BravoModule,
    AuthModule,
    InventoryModule,
    UserModule,
    CacheModule.register(),
  ],
})
export class MarketplaceModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
