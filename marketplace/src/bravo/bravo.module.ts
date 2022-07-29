import { Module } from '@nestjs/common';
import { BravoService } from './bravo.service';

@Module({
  providers: [BravoService],
})
export class BravoModule {}
