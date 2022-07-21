import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AwsService } from 'src/aws/aws.service';
import { BravoService } from 'src/bravo/bravo.service';
import {
  ActionLogActorType,
  ActionLogType,
  ActionLogEntityType,
  ActionLogEntityTypeReadable,
  ActionLogActorTypeReadable,
  ActionLogTypeReadable,
  ListingStatus,
  ListingStatusReadable,
  SubmissionStatus,
  SubmissionStatusReadable,
  VaultingStatus,
  VaultingStatusReadable,
  VaultingUpdateType,
} from 'src/config/enum';
import { User } from 'src/database/database.entity';
import { DatabaseService } from 'src/database/database.service';
import { DetailedLogger } from 'src/logger/detailed.logger';
import {
  getAttributes,
  newActionLogDetails,
  newListingDetails,
  newSubmissionDetails,
  newVaultingDetails,
  trimRequestWithImage,
} from 'src/util/format';
import {
  ActionLogDetails,
  ActionLogRequest,
  ListingDetails,
  ListingRequest,
  ListingResponse,
  ListingUpdate,
  SubmissionDetails,
  SubmissionRequest,
  SubmissionResponse,
  VaultingDetails,
  VaultingRequest,
  VaultingResponse,
  VaultingUpdate,
} from './dtos/marketplace.dto';

const MARKETPLACE_API_ACTOR = 'Marketplace API';
const VAULTING_API_ACTOR = 'Vaulting API';

@Injectable()
export class MarketplaceService {
  private readonly logger = new DetailedLogger('MarketplaceService', {
    timestamp: true,
  });

  constructor(
    private databaseService: DatabaseService,
    private awsService: AwsService,
    private bravoService: BravoService,
  ) {}

  async getUserByUUID(userUUID: string): Promise<User> {
    const user = await this.databaseService.getUserByUUID(userUUID);
    return user;
  }

  async submitItem(request: SubmissionRequest): Promise<SubmissionResponse> {
    // convert request.image_base64 to buffer
    const image_buffer = Buffer.from(request.image_base64, 'base64');
    const s3URL = await this.awsService.uploadItemImage(
      image_buffer,
      'submission',
      request.image_format,
    );

    if (!s3URL) {
      throw new InternalServerErrorException('Image upload failed');
    }
    const result = await this.databaseService.createNewSubmission(
      request,
      s3URL,
    );

    // record user action
    const trimmedRequest = trimRequestWithImage(request);
    const user = await this.databaseService.getUserByUUID(request.user);
    const actionLogRequest = new ActionLogRequest({
      actor_type: ActionLogActorType.CognitoUser,
      actor: user.id.toString(),
      entity_type: ActionLogEntityType.Submission,
      entity: result.submission_id.toString(),
      type: ActionLogType.Submission,
      extra: JSON.stringify(trimmedRequest),
    });
    await this.newActionLog(actionLogRequest);

    return new SubmissionResponse({
      user: request.user,
      submission_id: result.submission_id,
      item_id: result.item_id,
      status: result.status,
      status_desc: SubmissionStatusReadable[result.status],
    });
  }

  async listSubmissions(
    user: string,
    status: number,
    offset: number,
    limit: number,
    order: string,
  ): Promise<SubmissionDetails[]> {
    const submissionDetails = await this.databaseService.listSubmissions(
      user,
      status,
      offset,
      limit,
      order,
    );
    return submissionDetails;
  }

  async updateSubmission(
    submission_id: number,
    status: number,
  ): Promise<SubmissionDetails> {
    const submission = await this.databaseService.updateSubmission(
      submission_id,
      status,
    );

    // record user action
    // TODO: actor should be the admin user id
    const actionLogRequest = new ActionLogRequest({
      actor_type: ActionLogActorType.CognitoAdmin,
      actor: submission.user.toString(),
      entity_type: ActionLogEntityType.Submission,
      entity: submission.id.toString(),
      type: ActionLogType.SubmissionUpdate,
      extra: JSON.stringify({ status: status }),
    });
    await this.newActionLog(actionLogRequest);

    if (!submission) {
      throw new InternalServerErrorException('Submission not found');
    } else {
      const item = await this.databaseService.getItem(submission.item_id);
      const user = await this.databaseService.getUser(submission.user);
      return newSubmissionDetails(submission, item, user);
    }
  }

  async getSubmission(submission_id: number): Promise<SubmissionDetails> {
    const submission = await this.databaseService.getSubmission(submission_id);
    if (!submission) {
      throw new InternalServerErrorException('Submission not found');
    } else {
      const item = await this.databaseService.getItem(submission.item_id);
      const user = await this.databaseService.getUser(submission.user);
      return newSubmissionDetails(submission, item, user);
    }
  }

  async listVaultings(
    userUUID: string,
    offset: number,
    limit: number,
    order: string,
  ): Promise<VaultingDetails[]> {
    const vaultings = await this.databaseService.listVaultings(
      userUUID,
      offset,
      limit,
      order,
    );
    // get item ids from vaultings
    const item_ids = vaultings.map((vaulting) => vaulting.item_id);
    // get user ids from vaultings
    const user_ids = vaultings.map((vaulting) => vaulting.user);
    // get item details from database
    const item_details = await this.databaseService.listItems(item_ids);
    // get user details from database
    const user_details = await this.databaseService.listUsers(user_ids);
    // create new vaulting details from vaultings and item details
    const vaultingDetails = vaultings.map((vaulting) => {
      const item = item_details.find((item) => item.id === vaulting.item_id);
      const user = user_details.find((user) => user.id === vaulting.user);
      return newVaultingDetails(vaulting, item, user);
    });
    return vaultingDetails;
  }

  // call by admin
  async newVaulting(request: VaultingRequest): Promise<VaultingResponse> {
    // TODO: don't allow multiple vaultings for the same item

    // check submission status
    const submission = await this.databaseService.getSubmission(
      request.submission_id,
    );
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    if (submission.status !== SubmissionStatus.Approved) {
      throw new InternalServerErrorException('Submission not approved');
    }
    if (submission.item_id != request.item_id) {
      throw new InternalServerErrorException(
        `Mismatched item_id for submission ${request.submission_id}, item: ${request.item_id}`,
      );
    }

    // check if item is already vaulted
    try {
      const existingVaulting = await this.databaseService.getVaultingByItemID(
        request.item_id,
      );
      if (!!existingVaulting) {
        throw new InternalServerErrorException(
          `Vaulting ${existingVaulting.id} already exists for item ${request.item_id}`,
        );
      }
    } catch (e) {}

    // convert request.image_base64 to buffer
    const image_buffer = Buffer.from(request.image_base64, 'base64');
    const s3URL = await this.awsService.uploadItemImage(
      image_buffer,
      'vaulting',
      request.image_format,
    );

    // get user by uuid
    const user = await this.databaseService.getUserByUUID(request.user);
    // get item by id
    const item = await this.databaseService.getItem(request.item_id);

    const attributes = getAttributes(item);
    const mint_job_id = await this.bravoService.mintNFT(
      request.user,
      item.uuid,
      item.title,
      item.description,
      request.image_format,
      request.image_base64,
      attributes,
    );

    const vaulting = await this.databaseService.createNewVaulting(
      user.id,
      request.item_id,
      mint_job_id,
      s3URL,
    );

    // record user action
    const trimmedRequest = trimRequestWithImage(request);
    var actionLogRequest = new ActionLogRequest({
      actor_type: ActionLogActorType.CognitoUser,
      actor: user.id.toString(),
      entity_type: ActionLogEntityType.Vaulting,
      entity: vaulting.id.toString(),
      type: ActionLogType.Vaulting,
      extra: JSON.stringify(trimmedRequest),
    });
    await this.newActionLog(actionLogRequest);

    // update submission status
    await this.databaseService.updateSubmission(
      request.submission_id,
      SubmissionStatus.Vaulted,
    );

    // record user action
    actionLogRequest = new ActionLogRequest({
      actor_type: ActionLogActorType.CognitoUser,
      actor: user.id.toString(),
      entity_type: ActionLogEntityType.Submission,
      entity: request.submission_id.toString(),
      type: ActionLogType.SubmissionUpdate,
      extra: JSON.stringify({ status: SubmissionStatus.Vaulted }),
    });
    await this.newActionLog(actionLogRequest);

    return new VaultingResponse({
      id: vaulting.id,
      user: user.uuid,
      item_id: vaulting.item_id,
      status: vaulting.status,
      status_desc: VaultingStatusReadable[vaulting.status],
    });
  }

  async withdrawVaulting(vaulting_id: number): Promise<VaultingDetails> {
    //TODO: update submission to be withdrawn

    var vaultingDetails = await this.getVaulting(vaulting_id);

    // No withdrawal if not minted or already withdrawn
    if (vaultingDetails.status != VaultingStatus.Minted) {
      throw new InternalServerErrorException(
        `Vaulting ${vaulting_id} not minted or already withdrawn`,
      );
    }

    // No withdrawal if item is listed
    const listing = await this.databaseService.getListingByVaultingID(
      vaulting_id,
    );
    if (!!listing && listing.status != ListingStatus.NotListed) {
      throw new InternalServerErrorException(
        `Vaulting ${vaulting_id} has an active listing ` +
          `${listing.id}. No withdrawal allowed.`,
      );
    }

    const item = await this.databaseService.getItem(vaultingDetails.item_id);

    const burn_job_id = await this.bravoService.burnNFT(
      item.uuid,
      vaultingDetails.collection,
      vaultingDetails.token_id,
    );

    const vaultingUpdate = new VaultingUpdate({
      type: VaultingUpdateType.ToBurn,
      item_uuid: item.uuid,
      burn_job_id: burn_job_id,
    });
    vaultingDetails = await this.updateVaulting(vaultingUpdate);

    return vaultingDetails;
  }

  async getVaulting(vaulting_id: number): Promise<VaultingDetails> {
    const vaulting = await this.databaseService.getVaulting(vaulting_id);
    const item = await this.databaseService.getItem(vaulting.item_id);
    const user = await this.databaseService.getUser(vaulting.user);
    return newVaultingDetails(vaulting, item, user);
  }

  async getVaultingBySubmissionID(
    submission_id: number,
  ): Promise<VaultingDetails> {
    const vaulting = await this.databaseService.getVaultingBySubmissionID(
      submission_id,
    );
    // if no vaulting found, return null
    if (!vaulting) {
      return null;
    }
    const item = await this.databaseService.getItem(vaulting.item_id);
    const user = await this.databaseService.getUser(vaulting.user);
    return newVaultingDetails(vaulting, item, user);
  }

  async updateVaulting(
    vaultingUpdate: VaultingUpdate,
  ): Promise<VaultingDetails> {
    const vaulting = await this.databaseService.updateVaulting(vaultingUpdate);
    const item = await this.databaseService.getItem(vaulting.item_id);
    const user = await this.databaseService.getUser(vaulting.user);

    // record user action
    var actionLogType: number;
    var actor_type: number;
    var actor: string;
    switch (vaultingUpdate.type) {
      case VaultingUpdateType.Minted:
        actionLogType = ActionLogType.VaultingUpdate;
        actor_type = ActionLogActorType.API;
        actor = VAULTING_API_ACTOR;
        break;
      case VaultingUpdateType.Burned:
        actionLogType = ActionLogType.Withdrawal;
        actor_type = ActionLogActorType.API;
        actor = VAULTING_API_ACTOR;
        break;
      case VaultingUpdateType.ToBurn:
        actionLogType = ActionLogType.Withdrawal;
        actor_type = ActionLogActorType.CognitoUser;
        actor = vaulting.user.toString();
        break;
    }
    var actionLogRequest = new ActionLogRequest({
      actor_type: actor_type,
      actor: actor,
      entity_type: ActionLogEntityType.Vaulting,
      entity: vaulting.id.toString(),
      type: actionLogType,
      extra: JSON.stringify(vaultingUpdate),
    });
    await this.newActionLog(actionLogRequest);

    return newVaultingDetails(vaulting, item, user);
  }

  // create new listing
  async newListing(request: ListingRequest): Promise<ListingResponse> {
    // get user by uuid
    const user = await this.databaseService.getUserByUUID(request.user);
    // get vaulting by id
    const vaulting = await this.databaseService.getVaulting(
      request.vaulting_id,
    );
    const existingListing = await this.databaseService.getListingByVaultingID(
      request.vaulting_id,
    );

    // check if vaulting is already listed
    if (!!existingListing) {
      throw new InternalServerErrorException(
        `Vaulting ${request.vaulting_id} already has a listing ${existingListing.id}`,
      );
    }

    // make sure user and vaulting exist
    if (!user) {
      throw new NotFoundException(`User not found for ${request.user}`);
    }
    if (!vaulting || vaulting.status != VaultingStatus.Minted) {
      throw new NotFoundException(
        `Vaulting not found for ${request.vaulting_id} (either not minted or withdrawn already)`,
      );
    }

    // create new listing
    const listing = await this.databaseService.createNewListing(
      user.id,
      request.vaulting_id,
      request.price,
    );

    // record user action
    const actionLogRequest = new ActionLogRequest({
      actor_type: ActionLogActorType.CognitoUser,
      actor: user.id.toString(),
      entity_type: ActionLogEntityType.Listing,
      entity: listing.id.toString(),
      type: ActionLogType.Listing,
      extra: JSON.stringify(request),
    });
    await this.newActionLog(actionLogRequest);

    // return new listing details
    return new ListingResponse({
      id: listing.id,
      user: request.user,
      vaulting_id: listing.vaulting_id,
      price: listing.price,
      status: listing.status,
      status_desc: ListingStatusReadable[listing.status],
    });
  }

  // update price for listing
  async updateListing(
    listing_id: number,
    listingUpdate: ListingUpdate,
  ): Promise<ListingDetails> {
    const listing = await this.databaseService.updateListing(
      listing_id,
      listingUpdate.price,
    );

    // record user action
    const actionLogRequest = new ActionLogRequest({
      actor_type: ActionLogActorType.CognitoUser,
      actor: listing.user.toString(),
      entity_type: ActionLogEntityType.Listing,
      entity: listing.id.toString(),
      type: ActionLogType.ListingUpdate,
      extra: JSON.stringify(listingUpdate),
    });
    await this.newActionLog(actionLogRequest);

    const vaulting = await this.databaseService.getVaulting(
      listing.vaulting_id,
    );
    const item = await this.databaseService.getItem(vaulting.item_id);
    const user = await this.databaseService.getUser(listing.user);
    return newListingDetails(listing, item, user, vaulting);
  }

  // get listing by id
  async getListing(listing_id: number): Promise<ListingDetails> {
    const listing = await this.databaseService.getListing(listing_id);
    const vaulting = await this.databaseService.getVaulting(
      listing.vaulting_id,
    );
    const item = await this.databaseService.getItem(vaulting.item_id);
    const user = await this.databaseService.getUser(listing.user);
    return newListingDetails(listing, item, user, vaulting);
  }

  // list all listings by user
  async listListings(
    userUUID: string,
    offset: number,
    limit: number,
    order: string,
  ): Promise<ListingDetails[]> {
    // get all listings for user
    const listingDetails = await this.databaseService.listListings(
      userUUID,
      offset,
      limit,
      order,
    );
    return listingDetails;
  }

  // create new action log
  async newActionLog(request: ActionLogRequest): Promise<ActionLogDetails> {
    // create new action log
    const actionLog = await this.databaseService.createNewActionLog(request);
    // return new action log details
    return new ActionLogDetails({
      id: actionLog.id,
      type: actionLog.type,
      type_desc: ActionLogTypeReadable[actionLog.type],
      actor: actionLog.actor,
      actor_type_desc: ActionLogActorTypeReadable[actionLog.actor_type],
      entity: actionLog.entity,
      entity_type_desc: ActionLogEntityTypeReadable[actionLog.entity_type],
      created_at: actionLog.created_at,
      extra: actionLog.extra,
    });
  }

  // list all action logs by user
  async listActionLogs(
    listType: number,
    actorType: number,
    actor: string,
    entityType: number,
    entity: string,
    offset: number,
    limit: number,
    order: string,
  ): Promise<ActionLogDetails[]> {
    // get all action logs for user
    const actionLogs = await this.databaseService.listActionLogs(
      listType,
      actor,
      actorType,
      entity,
      entityType,
      offset,
      limit,
      order,
    );

    // transform action logs to action log details
    const actionLogDetails = actionLogs.map((actionLog) => {
      return newActionLogDetails(actionLog);
    });
    return actionLogDetails;
  }
}
