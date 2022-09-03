import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import got from 'got/dist/source';
import { v4 as uuid } from 'uuid';
import configuration, { RUNTIME_ENV } from '../config/configuration';

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
    try {
      await s3.listBuckets().promise();
      return [
        true,
        {
          region: config['aws']['AWS_DEFAULT_REGION'],
          bucket: config['aws']['AWS_PUBLIC_BUCKET_NAME'],
          access_key:
            config['aws']['AWS_ACCESS_KEY_ID'].substr(0, 6) + '**************',
        },
      ];
    } catch (error) {
      return [false, error];
    }
  }
}
