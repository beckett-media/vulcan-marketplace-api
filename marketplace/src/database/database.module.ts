import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import configuration, { RUNTIME_ENV } from '../config/configuration';
import {
  Submission,
  Item,
  Vaulting,
  User,
  Listing,
  ActionLog,
  Inventory,
  SubmissionOrder,
} from './database.entity';
import { DatabaseService } from './database.service';

export function GetDBConnection(): TypeOrmModuleOptions {
  let env = process.env[RUNTIME_ENV];
  let config = configuration()[env];

  switch (env) {
    case 'test':
      return {
        type: 'sqlite',
        database: config['db']['name'],
        entities: [
          Submission,
          SubmissionOrder,
          Item,
          Vaulting,
          User,
          Listing,
          ActionLog,
          Inventory,
          SubmissionOrder,
        ],
        synchronize: config['db']['sync'],
        keepConnectionAlive: true,
      };
    case 'dev':
      return {
        type: 'sqlite',
        database: config['db']['name'],
        entities: [
          Submission,
          SubmissionOrder,
          Item,
          Vaulting,
          User,
          Listing,
          ActionLog,
          Inventory,
          SubmissionOrder,
        ],
        synchronize: config['db']['sync'],
        keepConnectionAlive: true,
      };
    case 'awsdev':
      return {
        type: 'mysql',
        database: config['db']['name'],
        entities: [
          Submission,
          SubmissionOrder,
          Item,
          Vaulting,
          User,
          Listing,
          ActionLog,
          Inventory,
          SubmissionOrder,
        ],
        synchronize: config['db']['sync'],
        keepConnectionAlive: true,
        host: config['db']['host'],
        port: config['db']['port'],
        username: config['db']['username'],
        password: config['db']['password'],
      };
    case 'stage':
      return {
        type: 'mysql',
        database: config['db']['name'],
        entities: [
          Submission,
          SubmissionOrder,
          Item,
          Vaulting,
          User,
          Listing,
          ActionLog,
          Inventory,
          SubmissionOrder,
        ],
        synchronize: config['db']['sync'],
        keepConnectionAlive: true,
        host: config['db']['host'],
        port: config['db']['port'],
        username: config['db']['username'],
        password: config['db']['password'],
      };
    case 'prod':
      return {
        type: 'mysql',
        database: config['db']['name'],
        entities: [
          Submission,
          SubmissionOrder,
          Item,
          Vaulting,
          User,
          Listing,
          ActionLog,
          Inventory,
          SubmissionOrder,
        ],
        synchronize: config['db']['sync'],
        keepConnectionAlive: true,
        host: config['db']['host'],
        port: config['db']['port'],
        username: config['db']['username'],
        password: config['db']['password'],
      };
    default:
      throw new Error(`Unknown environment ${env}`);
  }
}

@Module({
  providers: [DatabaseService],
  imports: [
    TypeOrmModule.forRoot(GetDBConnection()),
    TypeOrmModule.forFeature([
      Submission,
      Item,
      Vaulting,
      User,
      Listing,
      ActionLog,
      Inventory,
      SubmissionOrder,
    ]),
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
