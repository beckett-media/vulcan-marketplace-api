import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AwsService } from '../aws/aws.service';
import { BravoService } from '../bravo/bravo.service';
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
  SubmissionUpdateType,
  SubmissionOrderStatus,
} from '../config/enum';
import {
  Item,
  Submission,
  SubmissionOrder,
  User,
} from '../database/database.entity';
import {
  DatabaseService,
  DEFAULT_USER_SOURCE,
} from '../database/database.service';
import { DetailedLogger } from '../logger/detailed.logger';
import {
  generateNFTDescription,
  getAttributes,
  newActionLogDetails,
  newListingDetails,
  newSubmissionDetails,
  newSubmissionOrderDetails,
  newVaultingDetails,
  trimRequestWithImage,
} from '../util/format';
import {
  ActionLogDetails,
  ActionLogRequest,
  ListingDetails,
  ListingRequest,
  ListingResponse,
  ListingUpdate,
  SubmissionDetails,
  SubmissionImage,
  SubmissionOrderDetails,
  SubmissionRequest,
  SubmissionResponse,
  SubmissionUpdate,
  VaultingDetails,
  VaultingRequest,
  VaultingResponse,
  VaultingUpdate,
} from './dtos/marketplace.dto';
import { Cache } from 'cache-manager';
import { onlyLetters } from '../util/assert';

const VAULTING_API_ACTOR = 'Vaulting API';
const FORBIDDEN_UPDATE_FIELDS = [
  'id',
  'uuid',
  'user',
  'order_id',
  'item_id',
  'created_at',
  'received_at',
  'rejected_at',
  'approved_at',
  'updated_at',
];
const IMAGE_FIELDS = [
  'image_base64',
  'image_rev_base64',
  'image_path',
  'image_rev_path',
];

@Injectable()
export class MarketplaceService {
  private readonly logger = new DetailedLogger('MarketplaceService', {
    timestamp: true,
  });

  constructor(
    private databaseService: DatabaseService,
    private awsService: AwsService,
    private bravoService: BravoService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getUserByUUID(userUUID: string): Promise<User> {
    const user = await this.databaseService.getUserByUUID(userUUID);
    return user;
  }

  async uploadImages(request: SubmissionImage): Promise<[string, string]> {
    var imagePath = '';
    var imagePathRev = '';
    if (!!request.image_base64) {
      if (!request.image_format) {
        throw new InternalServerErrorException('Image format not specified');
      }
      if (!onlyLetters(request.image_format)) {
        throw new InternalServerErrorException(
          `Image_format should only contain letters: ${request.image_format}`,
        );
      }
      const image_buffer = Buffer.from(request.image_base64, 'base64');
      imagePath = await this.awsService.uploadItemImage(
        image_buffer,
        'submission',
        request.image_format,
      );
    } else {
      imagePath = request.image_path || '';
    }

    if (!!request.image_rev_base64) {
      if (!request.image_rev_format) {
        throw new InternalServerErrorException(
          'Back image format not specified',
        );
      }
      if (!onlyLetters(request.image_format)) {
        throw new InternalServerErrorException(
          `Image_rev_format should only contain letters: ${request.image_format}`,
        );
      }
      const image_rev_buffer = Buffer.from(request.image_rev_base64, 'base64');
      imagePathRev = await this.awsService.uploadItemImage(
        image_rev_buffer,
        'submission',
        request.image_rev_format,
      );
    } else {
      imagePathRev = request.image_rev_path || '';
    }

    this.logger.log(`Uploaded images: [${imagePath}], [${imagePathRev}]`);
    return [imagePath, imagePathRev];
  }

  async submitItem(request: SubmissionRequest): Promise<SubmissionResponse> {
    // create user if not exist
    const user = await this.databaseService.maybeCreateNewUser(
      request.user,
      DEFAULT_USER_SOURCE,
    );
    // create submission order if not exist
    const submissionOrder =
      await this.databaseService.maybeCreateSubmissionOrder(
        user.id,
        request.order_uuid,
      );
    // if submission order is discarded, just return error
    if (submissionOrder.status === SubmissionOrderStatus.Discarded) {
      throw new InternalServerErrorException(
        'Submission order has been discarded due to previous failure',
      );
    }

    // if any error, discard submission order
    var result: any;
    try {
      const [imagePath, imagePathRev] = await this.uploadImages(request);

      if (!imagePath && !imagePathRev) {
        this.logger.log('No image specified');
      }
      result = await this.databaseService.createNewSubmission(
        request,
        user,
        submissionOrder,
        [imagePath, imagePathRev],
      );
      // record user action
      const trimmedRequest = trimRequestWithImage(request);
      const actionLogRequest = new ActionLogRequest({
        actor_type: ActionLogActorType.CognitoUser,
        actor: user.id.toString(),
        entity_type: ActionLogEntityType.Submission,
        entity: result.submission_id.toString(),
        type: ActionLogType.Submission,
        extra: JSON.stringify(trimmedRequest),
      });
      await this.newActionLog(actionLogRequest);
    } catch (error) {
      this.logger.error(error);
      await this.databaseService.discardSubmissionOrder(submissionOrder.id);
      throw new InternalServerErrorException(error);
    }

    return new SubmissionResponse({
      user: request.user,
      submission_id: result.submission_id,
      item_id: result.item_id,
      status: result.status,
      order_id: result.order_id,
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

  async actionLogForSubmisson(
    submission: Submission,
    submissionUpdate: SubmissionUpdate,
  ) {
    // record user action
    // TODO: actor should be the admin user id
    const actionLogRequest = new ActionLogRequest({
      actor_type: ActionLogActorType.CognitoAdmin,
      actor: submission.user.toString(),
      entity_type: ActionLogEntityType.Submission,
      entity: submission.id.toString(),
      type: ActionLogType.SubmissionUpdate,
      extra: JSON.stringify(submissionUpdate),
    });
    await this.newActionLog(actionLogRequest);
  }

  updateSubmissionStatus(
    submissionUpdate: SubmissionUpdate,
    submission: Submission,
  ): Submission {
    // sanity check for status
    switch (submissionUpdate.status) {
      case SubmissionStatus.Submitted:
        throw new InternalServerErrorException(
          `Cannot update status to ${
            SubmissionStatusReadable[submissionUpdate.status]
          }`,
        );
        break;
      case SubmissionStatus.Received:
        var fromStatus = [SubmissionStatus.Submitted];
        if (!fromStatus.includes(submission.status)) {
          throw new InternalServerErrorException(
            `Cannot update status from ${
              SubmissionStatusReadable[submission.status]
            } to ${SubmissionStatusReadable[submissionUpdate.status]}`,
          );
        }
        submission.status = SubmissionStatus.Received;
        submission.received_at = Math.round(Date.now() / 1000);
        break;
      case SubmissionStatus.Rejected:
        var fromStatus = [SubmissionStatus.Received];
        if (!fromStatus.includes(submission.status)) {
          throw new InternalServerErrorException(
            `Cannot update status from ${
              SubmissionStatusReadable[submission.status]
            } to ${SubmissionStatusReadable[submissionUpdate.status]}`,
          );
        }
        submission.status = SubmissionStatus.Rejected;
        submission.rejected_at = Math.round(Date.now() / 1000);
        break;
      case SubmissionStatus.Approved:
        fromStatus = [SubmissionStatus.Received];
        if (!fromStatus.includes(submission.status)) {
          throw new InternalServerErrorException(
            `Cannot update status from ${
              SubmissionStatusReadable[submission.status]
            } to ${SubmissionStatusReadable[submissionUpdate.status]}`,
          );
        }
        submission.status = SubmissionStatus.Approved;
        submission.approved_at = Math.round(Date.now() / 1000);
        break;
      case SubmissionStatus.Vaulted:
        fromStatus = [SubmissionStatus.Approved];
        if (!fromStatus.includes(submission.status)) {
          throw new InternalServerErrorException(
            `Cannot update status from ${
              SubmissionStatusReadable[submission.status]
            } to ${SubmissionStatusReadable[submissionUpdate.status]}`,
          );
        }
        submission.status = SubmissionStatus.Vaulted;
        break;
      default:
        throw new InternalServerErrorException(
          `Cannot update status to ${
            SubmissionStatusReadable[submissionUpdate.status]
          }`,
        );
    }

    return submission;
  }

  async updateSubmissionImage(
    submissionUpdate: SubmissionUpdate,
    submission: Submission,
  ): Promise<[string, string]> {
    var imagePath = '';
    var imagePathRev = '';
    // special case for image
    if (
      !!submissionUpdate.image_base64 ||
      !!submissionUpdate.image_rev_base64
    ) {
      [imagePath, imagePathRev] = await this.uploadImages(
        submissionUpdate as SubmissionImage,
      );
    }
    if (!!submissionUpdate.image_path || !!submissionUpdate.image_rev_path) {
      imagePath = submissionUpdate.image_path || '';
      imagePathRev = submissionUpdate.image_rev_path || '';
    }
    if (!!imagePath) {
      submission.image = imagePath;
    }
    if (!!imagePathRev) {
      submission.image_rev = imagePathRev;
    }

    return [imagePath, imagePathRev];
  }

  async updateSubmission(
    submission_id: number,
    submissionUpdate: SubmissionUpdate,
  ): Promise<SubmissionDetails> {
    // if submission exists
    var submission = await this.databaseService.getSubmission(submission_id);
    var item = await this.databaseService.getItem(submission.item_id);
    var imagePath, imagePathRev: string;
    if (!submission) {
      throw new NotFoundException(`Submission ${submission_id} not found`);
    } else {
      var submissionColumns = await this.databaseService.getColumnNames(
        'Submission',
      );
      // remove forbidden fields from submission columns
      submissionColumns = submissionColumns.filter(
        (column) => !FORBIDDEN_UPDATE_FIELDS.includes(column),
      );
      var itemColumns = await this.databaseService.getColumnNames('Item');
      // remove forbidden fields from item columns
      itemColumns = itemColumns.filter(
        (column) => !FORBIDDEN_UPDATE_FIELDS.includes(column),
      );

      var imageProcessed = false;
      // loop through fields in submissionUpdate and update submission or item
      for (const field in submissionUpdate) {
        // for submission fields
        if (submissionColumns.includes(field)) {
          switch (field) {
            case 'status':
              submission = this.updateSubmissionStatus(
                submissionUpdate,
                submission,
              );
              break;
            default:
              submission[field] = submissionUpdate[field];
          }
        } else if (itemColumns.includes(field)) {
          // for item fields
          item[field] = submissionUpdate[field];
        } else if (IMAGE_FIELDS.includes(field)) {
          if (!imageProcessed) {
            [imagePath, imagePathRev] = await this.updateSubmissionImage(
              submissionUpdate,
              submission,
            );
            imageProcessed = true;
          }
          break;
        } else {
          throw new InternalServerErrorException(
            `Field ${field} not supported in submissionUpdate`,
          );
        }
      }
    }

    // Save to db and log the action
    submission = await this.databaseService.updateSubmission(submission, item);
    const trimmedRequest = trimRequestWithImage(submissionUpdate);
    await this.actionLogForSubmisson(submission, trimmedRequest);

    if (!submission) {
      throw new InternalServerErrorException('Submission update failed');
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
      var item = await this.databaseService.getItem(submission.item_id);
      var user = await this.databaseService.getUser(submission.user);
      return newSubmissionDetails(submission, item, user);
    }
  }

  async getSubmissionOrder(
    submission_order_id: number,
  ): Promise<SubmissionOrderDetails> {
    const submissionOrder = await this.databaseService.getSubmissionOrder(
      submission_order_id,
    );
    // if submission order is discarded, then return as if it does not exist
    if (submissionOrder.status == SubmissionOrderStatus.Discarded) {
      throw new NotFoundException(
        `Submission order ${submission_order_id} not found`,
      );
    }

    const submissions = await this.databaseService.listSubmissionsForOrder(
      submission_order_id,
    );

    // get item ids from submissions
    const item_ids = submissions.map((submission) => submission.item_id);
    const items = await this.databaseService.listItems(item_ids);
    // build a map from item id to item
    const itemMap = new Map<number, Item>();
    items.forEach((item) => {
      itemMap.set(item.id, item);
    });
    // get user ids from submissions
    const user_ids = submissions.map((submission) => submission.user);
    const users = await this.databaseService.listUsers(user_ids);
    // build a map from user id to user
    const userMap = new Map<number, User>();
    users.forEach((user) => {
      userMap.set(user.id, user);
    });
    const orderUser = await this.databaseService.getUser(submissionOrder.user);

    // formt the result
    return newSubmissionOrderDetails(
      submissionOrder,
      orderUser,
      submissions,
      itemMap,
      userMap,
    );
  }

  async listSubmissionOrders(
    user: string,
    status: number,
    offset: number,
    limit: number,
    order: string,
  ): Promise<SubmissionOrderDetails[]> {
    const submissionOrderDetails =
      await this.databaseService.listSubmissionOrders(
        user,
        status,
        offset,
        limit,
        order,
      );

    return submissionOrderDetails;
  }

  async updateSubmissionOrder(
    order_id: number,
    status: number,
  ): Promise<SubmissionOrderDetails> {
    // get submission order by id
    const submissionOrder = await this.databaseService.getSubmissionOrder(
      order_id,
    );
    if (!submissionOrder) {
      throw new NotFoundException(`Submission order ${order_id} not found`);
    }
    // if submission order status is not the same as the new status, update it
    var updatedSubmissionOrder: SubmissionOrder;
    if (submissionOrder.status != status) {
      updatedSubmissionOrder = await this.databaseService.updateSubmissionOrder(
        order_id,
        status,
      );
    }

    // get submissions for the order
    const submissions = await this.databaseService.listSubmissionsForOrder(
      order_id,
    );
    // get item ids from submissions
    const item_ids = submissions.map((submission) => submission.item_id);
    const items = await this.databaseService.listItems(item_ids);
    // build a map from item id to item
    const itemMap = new Map<number, Item>();
    items.forEach((item) => {
      itemMap.set(item.id, item);
    });
    // get user ids from submissions
    const user_ids = submissions.map((submission) => submission.user);
    const users = await this.databaseService.listUsers(user_ids);
    // build a map from user id to user
    const userMap = new Map<number, User>();
    users.forEach((user) => {
      userMap.set(user.id, user);
    });
    // get order user
    const user = await this.databaseService.getUser(submissionOrder.user);

    // formt the result
    return newSubmissionOrderDetails(
      submissionOrder,
      user,
      submissions,
      itemMap,
      userMap,
    );
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
    const vaultingDetails = await Promise.all(
      vaultings.map(async (vaulting): Promise<VaultingDetails> => {
        const item = item_details.find((item) => item.id === vaulting.item_id);
        const user = user_details.find((user) => user.id === vaulting.user);
        const submission = await this.databaseService.getSubmissionByItem(
          item.id,
        );
        return newVaultingDetails(vaulting, submission, item, user);
      }),
    );

    return vaultingDetails;
  }

  // call by admin
  async newVaulting(request: VaultingRequest): Promise<VaultingResponse> {
    // TODO: don't allow multiple vaultings for the same item

    // check submission status
    var submission = await this.databaseService.getSubmission(
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

    // sanity check for image fields
    if (!!!request.image_base64) {
      throw new InternalServerErrorException('Image not found');
    }
    if (!!!request.image_format) {
      throw new InternalServerErrorException('Image format not found');
    }
    if (!onlyLetters(request.image_format)) {
      throw new InternalServerErrorException(
        `Image_format should only contain letters: ${request.image_format}`,
      );
    }

    // convert image from base64
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
    const description = generateNFTDescription(item);
    const mint_job_id = await this.bravoService.mintNFT(
      request.user,
      item.uuid,
      item.title,
      description,
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
    submission.status = SubmissionStatus.Vaulted;
    submission.updated_at = Math.round(Date.now() / 1000);
    await this.databaseService.updateSubmission(submission, null);

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
      item_uuid: item.uuid,
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
    const submission = await this.databaseService.getSubmissionByItem(
      vaulting.item_id,
    );
    const item = await this.databaseService.getItem(vaulting.item_id);
    const user = await this.databaseService.getUser(vaulting.user);
    return newVaultingDetails(vaulting, submission, item, user);
  }

  async getVaultingBySubmissionID(
    submission_id: number,
  ): Promise<VaultingDetails> {
    const vaulting = await this.databaseService.getVaultingBySubmissionID(
      submission_id,
    );
    const submission = await this.databaseService.getSubmission(submission_id);
    // if no vaulting found, return null
    if (!vaulting) {
      return null;
    }
    const item = await this.databaseService.getItem(vaulting.item_id);
    const user = await this.databaseService.getUser(vaulting.user);
    return newVaultingDetails(vaulting, submission, item, user);
  }

  async updateVaulting(
    vaultingUpdate: VaultingUpdate,
  ): Promise<VaultingDetails> {
    const vaulting = await this.databaseService.updateVaulting(vaultingUpdate);
    const submission = await this.databaseService.getSubmissionByItem(
      vaulting.item_id,
    );
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

    return newVaultingDetails(vaulting, submission, item, user);
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
