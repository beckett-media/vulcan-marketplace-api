export enum SubmissionStatus {
  Failed = 0,
  Submitted = 1,
  Received = 2,
  Rejected = 3,
  Approved = 4,
  Vaulted = 5,
  Verified = 6,
}

export const SubmissionStatusReadable = {
  0: 'Failed',
  1: 'Submitted',
  2: 'Received',
  3: 'Rejected',
  4: 'Approved',
  5: 'Vaulted',
  6: 'Verified',
};

export enum InventoryLocationType {
  Vault = 0,
  Display = 1,
}

export const InventoryLocationTypeReadable = {
  0: 'Vault',
  1: 'Display',
};

export enum ItemType {
  card = 1,
  comic = 2,
}

export const ItemTypeReadable = {
  1: 'Card',
  2: 'Comic',
};

export enum ItemStatus {
  Submitted = 1,
  Received = 2,
  Vaulted = 3,
}

export enum SubmissionUpdateType {
  Status = 1,
  Image = 2,
}

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
  Minted = 1,
  ToBurn = 2,
  Burned = 3,
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
  SubmissionUpdate = 2,
  Vaulting = 3,
  VaultingUpdate = 4,
  Listing = 5,
  ListingUpdate = 6,
  Withdrawal = 7,
  Pricing = 8,
  Sale = 9,
  NewInventory = 10,
  UpdateInventory = 11,
  DeleteInventory = 12,
  UpdateUserProfileImage = 13,
}

export const ActionLogTypeReadable = {
  1: 'New Submission',
  2: 'Submission Update',
  3: 'New Vaulting',
  4: 'Vaulting Update',
  5: 'New Listing',
  6: 'Listing Update',
  7: 'Withdrawal Vaulting',
  8: 'Set Price',
  9: 'Listing Sale',
  10: 'New Inventory',
  11: 'Update Inventory',
  12: 'Delete Inventory',
  13: 'Update User Profile Image',
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
  Sales = 4,
  Inventory = 5,
  User = 6,
}

export const ActionLogEntityTypeReadable = {
  1: 'Submission',
  2: 'Vaulting',
  3: 'Listing',
  4: 'Sales',
  5: 'Inventory',
  6: 'User',
};

export enum ListActionLogType {
  Actor = 0,
  Entity = 1,
  ActorAndEntity = 2,
}

export enum InventoryStatus {
  NotCurrent = 0,
  IsCurrent = 1,
  Deprecated = 2,
}

export const InventoryStatusReadable = {
  0: 'Not current inventory location',
  1: 'Current inventory location',
  2: 'Inventory location deprecated',
};

export enum SubmissionOrderStatus {
  Discarded = 0,
  Created = 1,
  Processed = 2,
}

export const SubmissionOrderStatusReadable = {
  0: 'Discarded',
  1: 'Created',
  2: 'Processed',
};
