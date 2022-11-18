## Install

From the root of the repo directly:

```
make install
```

## Connect to Vaulting API

The following two envs are used to indicate the mint and burn endpoints of the Vaulting(Bravo) service. \
When an item is vaulted or withdrawn, the endpoints will be called to mint or burn item's NFT.

```
MARKETPLACE_{DEV}_BRAVO_MINT_URL={http://localhost:3000}/vaulting/mint
MARKETPLACE_{DEV}_BRAVO_BURN_URL={http://localhost:3000}/vaulting/burn
```

Replace the runtime name(DEV) & domain URL (http://localhost:3000) between {} to the actual value of your deployment.

## Setup envs:

```
MARKETPLACE_RUNTIME=dev
export MARKETPLACE_DEV_API_PORT=3300
export MARKETPLACE_DEV_AWS_ACCESS_KEY_ID=
export MARKETPLACE_DEV_AWS_DEFAULT_REGION=
export MARKETPLACE_DEV_AWS_PUBLIC_BUCKET_NAME=
export MARKETPLACE_DEV_AWS_SECRET_ACCESS_KEY=
export MARKETPLACE_DEV_BRAVO_MINT_COLLECTION=
export MARKETPLACE_DEV_BRAVO_MINT_URL=
export MARKETPLACE_DEV_BRAVO_BURN_COLLECTION=
export MARKETPLACE_DEV_BRAVO_BURN_URL=
export MARKETPLACE_DEV_BRAVO_SANITYCHECK_URL=
export MARKETPLACE_DEV_COGNITO_CLIENT_ID=
export MARKETPLACE_DEV_COGNITO_REGION=
export MARKETPLACE_DEV_COGNITO_USER_POOL_ID=
export MARKETPLACE_DEV_DB_HOST=
export MARKETPLACE_DEV_DB_NAME=
export MARKETPLACE_DEV_DB_PASSWORD=
export MARKETPLACE_DEV_DB_PORT=
export MARKETPLACE_DEV_DB_USERNAME=
```

## Run Service:

```
cd marketplace
npm run start:dev
```
