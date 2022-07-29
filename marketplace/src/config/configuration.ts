export default () => ({
  prod: {
    api_port: process.env.MARKETPLACE_PROD_API_PORT || 5300,
    auth_enabled: true,
    aws: {
      AWS_PUBLIC_BUCKET_NAME:
        process.env.MARKETPLACE_PROD_AWS_PUBLIC_BUCKET_NAME,
      AWS_ACCESS_KEY_ID: process.env.MARKETPLACE_PROD_AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.MARKETPLACE_PROD_AWS_SECRET_ACCESS_KEY,
      AWS_DEFAULT_REGION: process.env.MARKETPLACE_PROD_AWS_DEFAULT_REGION,
    },
    bravo: {
      mint: {
        collection: process.env.MARKETPLACE_PROD_BRAVO_MINT_COLLECTION,
        url: process.env.MARKETPLACE_PROD_BRAVO_MINT_URL,
        headers: { 'Content-Type': 'application/json' },
      },
      burn: {
        collection: process.env.MARKETPLACE_PROD_BRAVO_BURN_COLLECTION,
        url: process.env.MARKETPLACE_PROD_BRAVO_BURN_URL,
        headers: { 'Content-Type': 'application/json' },
      },
    },
    cognito: {
      COGNITO_USER_POOL_ID: process.env.MARKETPLACE_PROD_COGNITO_USER_POOL_ID,
      COGNITO_CLIENT_ID: process.env.MARKETPLACE_PROD_COGNITO_CLIENT_ID,
      COGNITO_REGION: process.env.MARKETPLACE_PROD_COGNITO_REGION,
    },
    db: {
      name: process.env.MARKETPLACE_PROD_DB_NAME,
      sync: false,
      host: process.env.MARKETPLACE_PROD_DB_HOST,
      port: process.env.MARKETPLACE_PROD_DB_PORT,
      username: process.env.MARKETPLACE_PROD_DB_USERNAME,
      password: process.env.MARKETPLACE_PROD_DB_PASSWORD,
      isolation: 'REPEATABLE READ',
    },
  },
  stage: {
    api_port: process.env.MARKETPLACE_STAGE_API_PORT || 4300,
    auth_enabled: true,
    aws: {
      AWS_PUBLIC_BUCKET_NAME:
        process.env.MARKETPLACE_STAGE_AWS_PUBLIC_BUCKET_NAME,
      AWS_ACCESS_KEY_ID: process.env.MARKETPLACE_STAGE_AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY:
        process.env.MARKETPLACE_STAGE_AWS_SECRET_ACCESS_KEY,
      AWS_DEFAULT_REGION: process.env.MARKETPLACE_STAGE_AWS_DEFAULT_REGION,
    },
    bravo: {
      mint: {
        collection: process.env.MARKETPLACE_STAGE_BRAVO_MINT_COLLECTION,
        url: process.env.MARKETPLACE_STAGE_BRAVO_MINT_URL,
        headers: { 'Content-Type': 'application/json' },
      },
      burn: {
        collection: process.env.MARKETPLACE_STAGE_BRAVO_BURN_COLLECTION,
        url: process.env.MARKETPLACE_STAGE_BRAVO_BURN_URL,
        headers: { 'Content-Type': 'application/json' },
      },
    },
    cognito: {
      COGNITO_USER_POOL_ID: process.env.MARKETPLACE_STAGE_COGNITO_USER_POOL_ID,
      COGNITO_CLIENT_ID: process.env.MARKETPLACE_STAGE_COGNITO_CLIENT_ID,
      COGNITO_REGION: process.env.MARKETPLACE_STAGE_COGNITO_REGION,
    },
    db: {
      name: process.env.MARKETPLACE_STAGE_DB_NAME,
      sync: false,
      host: process.env.MARKETPLACE_STAGE_DB_HOST,
      port: process.env.MARKETPLACE_STAGE_DB_PORT,
      username: process.env.MARKETPLACE_STAGE_DB_USERNAME,
      password: process.env.MARKETPLACE_STAGE_DB_PASSWORD,
      isolation: 'REPEATABLE READ',
    },
  },
  awsdev: {
    api_port: process.env.MARKETPLACE_AWSDEV_API_PORT || 3300,
    auth_enabled: false,
    aws: {
      AWS_PUBLIC_BUCKET_NAME:
        process.env.MARKETPLACE_AWSDEV_AWS_PUBLIC_BUCKET_NAME ||
        'beckett-marketplace-dev',
      AWS_ACCESS_KEY_ID: process.env.MARKETPLACE_AWSDEV_AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY:
        process.env.MARKETPLACE_AWSDEV_AWS_SECRET_ACCESS_KEY,
      AWS_DEFAULT_REGION:
        process.env.MARKETPLACE_AWSDEV_AWS_DEFAULT_REGION || 'us-west-1',
    },
    bravo: {
      mint: {
        collection:
          process.env.MARKETPLACE_AWSDEV_BRAVO_MINT_COLLECTION ||
          '0x599b70873851c5ef6d52A613c574D6F688A53524',
        url:
          process.env.MARKETPLACE_AWSDEV_BRAVO_MINT_URL ||
          'https://dev.beckett.com:3000/vaulting/mint',
        headers: { 'Content-Type': 'application/json' },
      },
      burn: {
        collection:
          process.env.MARKETPLACE_AWSDEV_BRAVO_BURN_COLLECTION ||
          '0x599b70873851c5ef6d52A613c574D6F688A53524',
        url:
          process.env.MARKETPLACE_AWSDEV_BRAVO_BURN_URL ||
          'https://dev.beckett.com:3000/vaulting/burn',
        headers: { 'Content-Type': 'application/json' },
      },
    },
    cognito: {
      COGNITO_USER_POOL_ID:
        process.env.MARKETPLACE_AWSDEV_COGNITO_USER_POOL_ID ||
        'us-west-1_rrW6uRNXW',
      COGNITO_CLIENT_ID:
        process.env.MARKETPLACE_AWSDEV_COGNITO_CLIENT_ID ||
        '2cq0oolf1nuqjtk0snc29reeh5',
      COGNITO_REGION:
        process.env.MARKETPLACE_AWSDEV_COGNITO_REGION || 'us-west-1',
    },
    db: {
      name: process.env.MARKETPLACE_AWSDEV_DB_NAME || 'beckett_marketplace_dev',
      sync: true,
      host:
        process.env.MARKETPLACE_AWSDEV_DB_HOST ||
        'vaulting-api-dev-stage.cluster-cgq6lc7ttzjk.us-west-1.rds.amazonaws.com',
      port: process.env.MARKETPLACE_AWSDEV_DB_PORT || 3306,
      username: process.env.MARKETPLACE_AWSDEV_DB_USERNAME,
      password: process.env.MARKETPLACE_AWSDEV_DB_PASSWORD,
      isolation: 'REPEATABLE READ',
    },
  },
  dev: {
    api_port: process.env.MARKETPLACE_DEV_API_PORT || 3300,
    auth_enabled: false,
    aws: {
      AWS_PUBLIC_BUCKET_NAME:
        process.env.MARKETPLACE_DEV_AWS_PUBLIC_BUCKET_NAME,
      AWS_ACCESS_KEY_ID: process.env.MARKETPLACE_DEV_AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.MARKETPLACE_DEV_AWS_SECRET_ACCESS_KEY,
      AWS_DEFAULT_REGION: process.env.MARKETPLACE_DEV_AWS_DEFAULT_REGION,
    },
    bravo: {
      mint: {
        collection: process.env.MARKETPLACE_DEV_BRAVO_MINT_COLLECTION,
        url: process.env.MARKETPLACE_DEV_BRAVO_MINT_URL,
        headers: { 'Content-Type': 'application/json' },
      },
      burn: {
        collection: process.env.MARKETPLACE_DEV_BRAVO_BURN_COLLECTION,
        url: process.env.MARKETPLACE_DEV_BRAVO_BURN_URL,
        headers: { 'Content-Type': 'application/json' },
      },
    },
    cognito: {
      COGNITO_USER_POOL_ID: process.env.MARKETPLACE_DEV_COGNITO_USER_POOL_ID,
      COGNITO_CLIENT_ID: process.env.MARKETPLACE_DEV_COGNITO_CLIENT_ID,
      COGNITO_REGION: process.env.MARKETPLACE_DEV_COGNITO_REGION,
    },
    db: {
      name: process.env.MARKETPLACE_DEV_DB_NAME,
      sync: true,
      isolation: 'SERIALIZABLE',
    },
  },
  test: {
    api_port: 3300,
    auth_enabled: false,
    aws: {
      AWS_PUBLIC_BUCKET_NAME: 'NOTUSED',
      AWS_ACCESS_KEY_ID: 'NOTUSED',
      AWS_SECRET_ACCESS_KEY: 'NOTUSED',
      AWS_DEFAULT_REGION: 'NOTUSED',
    },
    bravo: {
      mint: {
        collection: '0x599b70873851c5ef6d52A613c574D6F688A53524',
        url: 'https://dev.beckett.com:3000/vaulting/mint',
        headers: { 'Content-Type': 'application/json' },
      },
      burn: {
        collection: '0x599b70873851c5ef6d52A613c574D6F688A53524',
        url: 'https://dev.beckett.com:3000/vaulting/burn',
        headers: { 'Content-Type': 'application/json' },
      },
    },
    cognito: {
      COGNITO_USER_POOL_ID: 'us-west-1_rrW6uRNXW',
      COGNITO_CLIENT_ID: '2cq0oolf1nuqjtk0snc29reeh5',
      COGNITO_REGION: 'us-west-1',
    },
    db: {
      name: 'beckett_marketplace_db_test.sqlite',
      sync: true,
      host: 'NOTUSED',
      port: 3306,
      username: 'NOTUSED',
      password: 'NOTUSED',
      isolation: 'SERIALIZABLE',
    },
  },
});

export const RUNTIME_ENV = 'MARKETPLACE_RUNTIME';
