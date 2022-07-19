export enum SubmissionStatus {
  Failed = 0,
  Submitted = 1,
  Received = 2,
  Rejected = 3,
  Approved = 4,
  Vaulted = 5,
}

export const SubmissionStatusReadable = {
  0: 'Failed',
  1: 'Submitted',
  2: 'Received',
  3: 'Rejected',
  4: 'Approved',
  5: 'Vaulted',
};

export const VaultingStatusReadable = {
  0: 'NotMinted',
  1: 'Minting',
  2: 'Minted',
  3: 'Locking',
  4: 'Locked',
  5: 'Withdrawing',
  6: 'Withdrawn',
};

export enum VaultingStatus {
  NotMinted = 0,
  Minting = 1,
  Minted = 2,
  Locking = 3,
  Locked = 4,
  Withdrawing = 5,
  Withdrawn = 6,
}

export enum VaultingUpdateType {
  ToMint = 0,
  Mint = 1,
  ToBurn = 2,
  Burn = 3,
}

export enum ListingStatus {
  NotListed = 0,
  Listed = 1,
  Sold = 2,
  Ended = 3,
}

export const ListingStatusReadable = {
  0: 'NotListed',
  1: 'Listed',
};

export enum Group {
  User = 'vaulting',
  Admin = 'admin',
  Superman = 'superman',
}

export enum QueryOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum ActionLogType {
  Submission = 1,
  Vaulting = 2,
  Listing = 3,
  Withdrawal = 4,
  Pricing = 5,
  Sale = 6,
  Purchase = 7,
}

export const ActionLogTypeReadable = {
  1: 'Submission',
  2: 'Vaulting',
  3: 'Listing',
  4: 'Withdrawal',
  5: 'Pricing',
  6: 'Sale',
  7: 'Purchase',
};

export enum ActionLogActorType {
  CognitoUser = 1,
  CognitoAdmin = 2,
  API = 3,
}

export const ActionLogActorTypeReadable = {
  1: 'Cognito User',
  2: 'Cognito Admin',
  3: 'API',
};

export enum ActionLogEntityType {
  Submission = 1,
  Vaulting = 2,
  Listing = 3,
  Purchase = 4,
}

export const ActionLogEntityTypeReadable = {
  1: 'Submission',
  2: 'Vaulting',
  3: 'Listing',
  4: 'Purchase',
};

export enum ListActionLogType {
  Actor = 0,
  Entity = 1,
  ActorAndEntity = 2,
}
