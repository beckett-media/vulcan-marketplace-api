import { BadRequestException, Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import aws from 'aws-sdk';
import got from 'got/dist/source';
import { v4 as uuid } from 'uuid';
import configuration, { RUNTIME_ENV } from '../config/configuration';
import { ListUsersMatch } from '../config/enum';

@Injectable()
export class AwsService {
  constructor() {}

  async uploadImage(
    dataBuffer: Buffer,
    prefix: string,
    image_format: string,
  ): Promise<string> {
    const env = process.env[RUNTIME_ENV];
    const config = configuration()[env];
    const s3Config = {
      accessKeyId: config['aws']['AWS_ACCESS_KEY_ID'],
      secretAccessKey: config['aws']['AWS_SECRET_ACCESS_KEY'],
      region: config['aws']['AWS_DEFAULT_REGION'],
    };
    const s3 = new S3(s3Config);
    const uploadResult = await s3
      .upload({
        Bucket: config['aws']['AWS_PUBLIC_BUCKET_NAME'],
        Body: dataBuffer,
        Key: `${prefix}/${uuid()}.${image_format}`,
        ACL: 'public-read',
        ContentType: 'mimetype',
      })
      .promise();
    return uploadResult.Location;
  }

  async readImage(s3url: string): Promise<Buffer> {
    const buffer = await got.get(s3url).buffer();
    return buffer;
  }

  async listUsers(
    userName: string,
    email: string,
    firstName: string,
    lastName: string,
    match: number,
  ): Promise<any[]> {
    const env = process.env[RUNTIME_ENV];
    const config = configuration()[env];
    var filter = {
      UserPoolId: config['cognito']['COGNITO_USER_POOL_ID'],
      AttributesToGet: ['email', 'sub', 'given_name', 'family_name'],
    };
    if (match == ListUsersMatch.ExactMatch) {
      if (!!userName) {
        filter['Filter'] = `username = \"${userName}\"`;
      }
      if (!!email) {
        filter['Filter'] = `email = \"${email}\"`;
      }
      if (!!firstName) {
        filter['Filter'] = `given_name = \"${firstName}\"`;
      }
      if (!!lastName) {
        filter['Filter'] = `family_name = \"${lastName}\"`;
      }
    } else {
      if (!!userName) {
        filter['Filter'] = `username ^= \"${userName}\"`;
      }
      if (!!email) {
        filter['Filter'] = `email ^= \"${email}\"`;
      }
      if (!!firstName) {
        filter['Filter'] = `given_name ^= \"${firstName}\"`;
      }
      if (!!lastName) {
        filter['Filter'] = `family_name ^= \"${lastName}\"`;
      }
    }

    // if no filter is set, return error
    if (!!!filter['Filter']) {
      throw new BadRequestException('No filter criteria provided');
    }

    // auth
    aws.config.update({
      accessKeyId: 'AKIAX7KA2GYFM4RPGEY5',
      secretAccessKey: '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',
    });

    // init client
    var CognitoIdentityServiceProvider = aws.CognitoIdentityServiceProvider;
    var client = new CognitoIdentityServiceProvider({
      apiVersion: '2016-04-19',
      region: config['aws']['AWS_DEFAULT_REGION'],
    });
    var users = await client.listUsers(filter).promise();

    if (users['Users'].length != 0) {
      return users['Users'];
    } else {
      return [];
    }
  }

  async sanityCheck(): Promise<[boolean, any]> {
    const env = process.env[RUNTIME_ENV];
    const config = configuration()[env];
    const s3Config = {
      accessKeyId: config['aws']['AWS_ACCESS_KEY_ID'],
      secretAccessKey: config['aws']['AWS_SECRET_ACCESS_KEY'],
      region: config['aws']['AWS_DEFAULT_REGION'],
    };
    const s3 = new S3(s3Config);
    // check s3 connection
    const settings = {
      region: config['aws']['AWS_DEFAULT_REGION'],
      bucket: config['aws']['AWS_PUBLIC_BUCKET_NAME'],
      access_key:
        config['aws']['AWS_ACCESS_KEY_ID'].substr(0, 6) + '**************',
      cognito:
        config['cognito']['COGNITO_USER_POOL_ID'].substr(0, 16) + '******',
    };
    try {
      await s3
        .listObjects({ Bucket: settings['bucket'], MaxKeys: 1 })
        .promise();
      return [true, settings];
    } catch (error) {
      return [false, { error: error, settings: settings }];
    }
  }
}
